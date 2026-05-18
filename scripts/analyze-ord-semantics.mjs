// Deeper semantic / formation / register analysis of the 540 past-exam ORD words.
//
// Heuristic detection for things we CAN compute mechanically:
//  - reflexive verbs (word ends with " sig")
//  - fixed phrases / multi-word entries
//  - loanword form patterns (-tion, -ation, -isk, -iv, -era, -ism, -us, etc.)
//  - native Swedish form patterns (compounds, -ning, -het, -skap, ä/å/ö in stem)
//  - one-word vs multi-word target word
//
// Output: STYLE_PROFILE_ORD_SEMANTICS.md at project root.

import fs from "node:fs";
import path from "node:path";

function parseCSV(text) {
  const rows = [];
  let row = [], field = "", inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else inQ = false; }
      else field += c;
    } else {
      if (c === '"') inQ = true;
      else if (c === ",") { row.push(field); field = ""; }
      else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
      else if (c === "\r") {}
      else field += c;
    }
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows;
}

const raw = fs.readFileSync(path.resolve("ord-database.csv"), "utf8");
const rows = parseCSV(raw).filter(r => r.length > 1);
const header = rows[0];
const data = rows.slice(1).filter(r => /^\d+$/.test(r[0]));

const C = {
  id: header.indexOf("id"),
  word: header.indexOf("word"),
  pos: header.indexOf("pos"),
  correct: header.indexOf("correct_synonym"),
  def: header.indexOf("definition_sv"),
  ex: header.indexOf("example_sentence"),
  domain: header.indexOf("domain"),
  difficulty: header.indexOf("difficulty"),
  exam: header.indexOf("past_exams"),
  notes: header.indexOf("notes"),
};

const past = data.filter(r => r[C.exam] !== "curated");
const curated = data.filter(r => r[C.exam] === "curated");

// --- heuristic taggers ---
function classify(word, pos, notes) {
  const w = word.toLowerCase().trim();
  const n = (notes || "").toLowerCase();
  const tags = new Set();

  // multi-word / fixed phrase
  const wordCount = w.split(/\s+/).filter(Boolean).length;
  if (wordCount >= 2) {
    if (pos === "vb" && (w.endsWith(" sig") || /\bsig\b/.test(w))) tags.add("reflexive_verb");
    else tags.add("fixed_phrase");
  }

  // reflexive verb (also single-word with " sig")
  if (/\bsig\b/.test(w) && pos === "vb") tags.add("reflexive_verb");

  // loanword form patterns
  if (/(tion|ation|sion)$/.test(w)) tags.add("loanword_form_tion");
  if (/(isk|iskt)$/.test(w)) tags.add("loanword_form_isk");
  if (/(iv|ivt|iva)$/.test(w)) tags.add("loanword_form_iv");
  if (/(era|erar|erade)$/.test(w) && pos === "vb") tags.add("loanword_form_era");
  if (/(ism)$/.test(w)) tags.add("loanword_form_ism");
  if (/(us|um)$/.test(w) && pos === "sb") tags.add("loanword_form_us_um");
  if (/(ent|ant)$/.test(w)) tags.add("loanword_form_ent_ant");

  // native Swedish form patterns
  if (/(ning)$/.test(w) && pos === "sb") tags.add("native_form_ning");
  if (/(het|skap|dom|else|nad)$/.test(w) && pos === "sb") tags.add("native_form_abstract_suffix");

  // contains explicit loanword note
  if (n.includes("lånord") || n.includes("uttryck") || n.includes("franskt") || n.includes("latinskt") || n.includes("grekiskt") || n.includes("italienskt") || n.includes("tyskt") || n.includes("engelskt")) tags.add("note_loanword");

  // contains register / archaic / idiom note
  if (n.includes("formellt") || n.includes("formell")) tags.add("note_formal");
  if (n.includes("ålderdom") || n.includes("arkais") || n.includes("högtidlig") || n.includes("litterär")) tags.add("note_archaic_literary");
  if (n.includes("vardagl")) tags.add("note_colloquial");
  if (n.includes("fast uttryck") || n.includes("idiom")) tags.add("note_idiom");
  if (n.includes("bildl") || n.includes("metafor")) tags.add("note_figurative");
  if (n.includes("reflexivt verb") || n.includes("reflexiv")) tags.add("note_reflexive");

  // contains stem variant pattern that suggests native Swedish (ä/å/ö in non-suffix position)
  if (/[åäö]/.test(w) && !/[a-z]+era$/.test(w) && !w.match(/(tion|ation|sion|isk|iv)$/)) tags.add("has_aao");

  // single word with no recognized loanword ending and contains å/ä/ö → likely native
  if (wordCount === 1 && !tags.has("loanword_form_tion") && !tags.has("loanword_form_isk") && !tags.has("loanword_form_iv") && !tags.has("loanword_form_era") && !tags.has("loanword_form_ism") && !tags.has("loanword_form_us_um") && !tags.has("loanword_form_ent_ant") && !tags.has("note_loanword") && /[åäö]/.test(w)) tags.add("likely_native_swedish");

  // compound noun heuristic: single-word noun >9 chars with no loanword ending
  if (pos === "sb" && wordCount === 1 && w.length >= 9 && !tags.has("loanword_form_tion") && !tags.has("loanword_form_isk") && !tags.has("loanword_form_iv") && !tags.has("loanword_form_us_um")) tags.add("likely_compound");

  return [...tags];
}

const tagsByRow = data.map(r => ({
  row: r,
  isPast: r[C.exam] !== "curated",
  tags: classify(r[C.word], r[C.pos], r[C.notes]),
}));

function tagCounts(filter) {
  const counts = new Map();
  let total = 0;
  for (const t of tagsByRow) {
    if (!filter(t)) continue;
    total++;
    for (const tag of t.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  }
  return { total, counts: [...counts.entries()].sort((a, b) => b[1] - a[1]) };
}

const pastTagged = tagCounts(t => t.isPast);
const curatedTagged = tagCounts(t => !t.isPast);

function compareTable(pastT, currT) {
  const tags = new Set([...pastT.counts, ...currT.counts].map(([k]) => k));
  const out = [];
  for (const tag of tags) {
    const p = pastT.counts.find(([k]) => k === tag)?.[1] ?? 0;
    const c = currT.counts.find(([k]) => k === tag)?.[1] ?? 0;
    const pPct = (p / pastT.total) * 100;
    const cPct = (c / currT.total) * 100;
    const delta = cPct - pPct;
    out.push({ tag, p, pPct, c, cPct, delta });
  }
  return out.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
}

const cmp = compareTable(pastTagged, curatedTagged);

const report = `# Semantic / formation profile — Phase 1 vs Phase 2

> Auto-generated by \`scripts/analyze-ord-semantics.mjs\`.
> Phase 1 (past exams): **${pastTagged.total}** entries.
> Phase 2 (curated):    **${curatedTagged.total}** entries.

## Tag distributions — Phase 1 vs Phase 2 (sorted by delta)

| Tag | Phase 1 count | Phase 1 % | Phase 2 count | Phase 2 % | Δ (P2 − P1) |
|---|---|---|---|---|---|
${cmp.map(r => `| ${r.tag} | ${r.p} | ${r.pPct.toFixed(1)}% | ${r.c} | ${r.cPct.toFixed(1)}% | ${r.delta >= 0 ? "+" : ""}${r.delta.toFixed(1)}pp |`).join("\n")}

## Tag legend

- **loanword_form_tion/isk/iv/era/ism/us_um/ent_ant** — word ends with a Romance/Greek loanword suffix
- **native_form_ning** — Swedish action-noun suffix (-ning)
- **native_form_abstract_suffix** — Swedish abstract-noun suffix (-het, -skap, -dom, -else, -nad)
- **has_aao** — contains å/ä/ö in stem (Swedish-native indicator)
- **likely_native_swedish** — single word, no loanword ending, contains å/ä/ö
- **likely_compound** — long single-word noun with no loanword ending (likely Swedish compound)
- **reflexive_verb** — verb with "sig" (e.g. "freda sig")
- **fixed_phrase** — multi-word non-verb entry (e.g. "i sin linda")
- **note_loanword** — has loanword-origin tag in notes
- **note_formal** — has formal-register tag in notes
- **note_archaic_literary** — has archaic/literary tag in notes
- **note_idiom** — has idiom tag in notes
- **note_figurative** — has figurative/metaphor tag in notes

## How to read the deltas

A positive Δ means Phase 2 over-produces that tag relative to Phase 1.
A negative Δ means Phase 2 under-produces it.

Large negative deltas on **likely_native_swedish, native_form_ning, has_aao, fixed_phrase, note_archaic_literary, note_figurative, note_idiom** would confirm that the Phase 2 batches feel too "academic-loanword-heavy" compared to past HP.
`;

fs.writeFileSync(path.resolve("STYLE_PROFILE_ORD_SEMANTICS.md"), report, "utf8");
console.log("Wrote STYLE_PROFILE_ORD_SEMANTICS.md");

// Also print the most-skewed rows for inspection
console.log("\nTop 15 deltas:");
for (const r of cmp.slice(0, 15)) {
  console.log(`  ${r.tag.padEnd(35)} P1: ${r.pPct.toFixed(1)}%  P2: ${r.cPct.toFixed(1)}%  Δ: ${r.delta >= 0 ? "+" : ""}${r.delta.toFixed(1)}pp`);
}
