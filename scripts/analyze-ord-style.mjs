// Analyze ord-database.csv to build a "style profile" — used as input
// for the upcoming /curate-ord-words skill.
//
// Output: STYLE_PROFILE_ORD.md at project root.

import fs from "node:fs";
import path from "node:path";

const CSV_PATH = path.resolve("ord-database.csv");
const OUT_PATH = path.resolve("STYLE_PROFILE_ORD.md");

// --- Minimal RFC-4180-ish CSV parser (handles quoted fields with commas + newlines) ---
function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else { inQuotes = false; }
      } else {
        field += c;
      }
    } else {
      if (c === '"') { inQuotes = true; }
      else if (c === ",") { row.push(field); field = ""; }
      else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
      else if (c === "\r") { /* skip */ }
      else { field += c; }
    }
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  return rows;
}

const raw = fs.readFileSync(CSV_PATH, "utf8");
const rows = parseCSV(raw).filter(r => r.length > 1);
const header = rows[0];
const dataRows = rows.slice(1).filter(r => /^\d+$/.test(r[0])); // numeric id only

console.log(`Parsed ${dataRows.length} word rows from ${CSV_PATH}`);

const col = name => header.indexOf(name);
const C = {
  id: col("id"),
  word: col("word"),
  pos: col("pos"),
  correct: col("correct_synonym"),
  d1: col("distractor_1"),
  d2: col("distractor_2"),
  d3: col("distractor_3"),
  d4: col("distractor_4"),
  def: col("definition_sv"),
  ex: col("example_sentence"),
  domain: col("domain"),
  difficulty: col("difficulty"),
  exam: col("past_exams"),
  accepted: col("accepted_synonyms"),
  notes: col("notes"),
};

// --- helpers ---
const countBy = (arr, fn) => {
  const m = new Map();
  for (const x of arr) {
    const k = fn(x);
    if (k === undefined || k === null || k === "") continue;
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
};

const wordCount = s => (s || "").trim().split(/\s+/).filter(Boolean).length;
const stats = nums => {
  const a = [...nums].sort((x, y) => x - y);
  const n = a.length;
  if (n === 0) return { n: 0 };
  const sum = a.reduce((s, x) => s + x, 0);
  const mean = sum / n;
  const median = n % 2 ? a[(n - 1) / 2] : (a[n / 2 - 1] + a[n / 2]) / 2;
  return { n, min: a[0], max: a[n - 1], mean: +mean.toFixed(2), median, p10: a[Math.floor(0.1 * n)], p90: a[Math.floor(0.9 * n)] };
};

// --- POS ---
const posCounts = countBy(dataRows, r => r[C.pos]);

// --- Difficulty ---
const diffCounts = countBy(dataRows, r => r[C.difficulty]);

// --- Domain ---
const domainCounts = countBy(dataRows, r => r[C.domain]);

// --- Past exam coverage ---
const examCounts = countBy(dataRows, r => r[C.exam]);

// --- Definition length (words) ---
const defLens = dataRows.map(r => wordCount(r[C.def]));
const defStats = stats(defLens);

// --- Example sentence length (words) ---
const exLens = dataRows.map(r => wordCount(r[C.ex]));
const exStats = stats(exLens);

// --- Accepted synonyms: how many words have them, avg count ---
const acceptedCounts = dataRows.map(r => (r[C.accepted] || "").split(",").map(s => s.trim()).filter(Boolean).length);
const withAccepted = acceptedCounts.filter(n => n > 0).length;
const acceptedStats = stats(acceptedCounts.filter(n => n > 0));

// --- Notes: how many have notes, and what categories appear ---
const notesPresent = dataRows.filter(r => (r[C.notes] || "").trim().length > 0).length;
const noteSamples = dataRows.map(r => (r[C.notes] || "").trim()).filter(Boolean);
// Try to bucket notes by recurring tokens
const noteBuckets = countBy(noteSamples, s => {
  const lower = s.toLowerCase();
  if (lower.includes("lånord")) return "lånord-tag";
  if (lower.includes("formell") || lower.includes("formellt")) return "formell-register";
  if (lower.includes("vardagl")) return "vardagligt";
  if (lower.includes("ålderdoml") || lower.includes("arkais")) return "ålderdomligt/arkaiskt";
  if (lower.includes("litterär") || lower.includes("högtidlig")) return "litterärt/högtidligt";
  if (lower.includes("fackterm") || lower.includes("medicin") || lower.includes("juridi")) return "fackterm";
  if (lower.includes("metafor") || lower.includes("bildl")) return "bildligt/metafor";
  if (lower.includes("synonym") || lower.includes("även")) return "synonym-info";
  return "övrigt";
});

// --- Word length characteristics ---
const wordLens = dataRows.map(r => (r[C.word] || "").length);
const wordLenStats = stats(wordLens);

// --- Correct synonym word count (single-word vs multi-word) ---
const correctIsMulti = dataRows.filter(r => (r[C.correct] || "").trim().split(/\s+/).length > 1).length;

// --- Distractor characteristics ---
// Compute: avg distractor length, how often distractors are single-word
const allDistractors = dataRows.flatMap(r => [r[C.d1], r[C.d2], r[C.d3], r[C.d4]].filter(Boolean));
const distractorLens = allDistractors.map(s => s.trim().split(/\s+/).length);
const distractorLenStats = stats(distractorLens);
const multiWordDistractors = distractorLens.filter(n => n > 1).length;

// --- POS × difficulty crosstab ---
const posDiff = new Map();
for (const r of dataRows) {
  const k = `${r[C.pos]}|${r[C.difficulty]}`;
  posDiff.set(k, (posDiff.get(k) ?? 0) + 1);
}

// --- Domain × difficulty crosstab ---
const domainDiff = new Map();
for (const r of dataRows) {
  const k = `${r[C.domain]}|${r[C.difficulty]}`;
  domainDiff.set(k, (domainDiff.get(k) ?? 0) + 1);
}

// --- Build the report ---
const fmtRows = pairs => pairs.map(([k, v]) => `- ${k}: ${v} (${((v / dataRows.length) * 100).toFixed(1)}%)`).join("\n");

const report = `# ORD Database Style Profile

> Auto-generated from \`ord-database.csv\` by \`scripts/analyze-ord-style.mjs\`.
> Total entries analyzed: **${dataRows.length}**.

This document captures the empirical "fingerprint" of the past-exam ORD words.
Use it as the style reference when generating curated (non-past-exam) words in Phase 2.

---

## 1. Part of speech (POS) distribution

${fmtRows(posCounts)}

**Interpretation:** Use these proportions as the target mix when curating new words.

---

## 2. Difficulty distribution

${fmtRows(diffCounts)}

**Interpretation:** Phase 2 should match this curve — most curated words land at difficulty 2, with a smaller tail at 1 and 3.

---

## 3. Domain distribution

${fmtRows(domainCounts)}

**Interpretation:** Domains with fewer entries are the gap-fill targets for Phase 2.

---

## 4. Past exam coverage (Phase 1 source spread)

${fmtRows(examCounts.slice(0, 40))}

---

## 5. Definition (Swedish) length — words

- Range: ${defStats.min}–${defStats.max}
- Mean: ${defStats.mean}, median: ${defStats.median}
- 10th–90th percentile: ${defStats.p10}–${defStats.p90}

**Style rule for Phase 2:** Aim for definitions in the **${defStats.p10}–${defStats.p90} word** range. Avoid dictionary-bloat (≥30 words).

---

## 6. Example sentence length — words

- Range: ${exStats.min}–${exStats.max}
- Mean: ${exStats.mean}, median: ${exStats.median}
- 10th–90th percentile: ${exStats.p10}–${exStats.p90}

**Style rule for Phase 2:** Example sentences should sit in the **${exStats.p10}–${exStats.p90} word** range. Single, complete, contextual sentences — not lists.

---

## 7. Accepted synonyms

- Words with accepted_synonyms set: **${withAccepted} / ${dataRows.length}** (${((withAccepted / dataRows.length) * 100).toFixed(1)}%)
- Among those, mean alternative count: ${acceptedStats.mean ?? "n/a"}
- Range: ${acceptedStats.min ?? "n/a"}–${acceptedStats.max ?? "n/a"}

**Style rule for Phase 2:** Most words have 1–${acceptedStats.max ?? 2} accepted alternative spellings for the typing variant. Match this density.

---

## 8. Notes field — register / etymology tags

- Words with non-empty notes: **${notesPresent} / ${dataRows.length}** (${((notesPresent / dataRows.length) * 100).toFixed(1)}%)
- Bucketed:
${noteBuckets.map(([k, v]) => `  - ${k}: ${v}`).join("\n")}

**Style rule for Phase 2:** Add a short register/etymology note when the word is a loanword, formal register, archaic, or metaphorical. Skip notes for plain everyday words.

---

## 9. Word length (characters)

- Range: ${wordLenStats.min}–${wordLenStats.max}
- Mean: ${wordLenStats.mean}, median: ${wordLenStats.median}
- 10th–90th percentile: ${wordLenStats.p10}–${wordLenStats.p90}

---

## 10. Correct synonym — single-word vs multi-word

- Multi-word correct synonyms: ${correctIsMulti} / ${dataRows.length} (${((correctIsMulti / dataRows.length) * 100).toFixed(1)}%)

**Style rule for Phase 2:** Most correct synonyms are single-word. Use multi-word forms (e.g. "upphöjd plattform") only when no single Swedish word captures the meaning.

---

## 11. Distractor word count

- Range: ${distractorLenStats.min}–${distractorLenStats.max} words
- Multi-word distractors: ${multiWordDistractors} / ${allDistractors.length} (${((multiWordDistractors / allDistractors.length) * 100).toFixed(1)}%)

**Style rule for Phase 2:** Distractors should match the correct synonym's length profile — if the correct is single-word, distractors should be too.

---

## 12. POS × difficulty crosstab

| POS | diff 1 | diff 2 | diff 3 | total |
|---|---|---|---|---|
${[...new Set(dataRows.map(r => r[C.pos]))].sort().map(p => {
  const d1 = posDiff.get(`${p}|1`) ?? 0;
  const d2 = posDiff.get(`${p}|2`) ?? 0;
  const d3 = posDiff.get(`${p}|3`) ?? 0;
  return `| ${p} | ${d1} | ${d2} | ${d3} | ${d1 + d2 + d3} |`;
}).join("\n")}

---

## 13. Domain × difficulty crosstab

| Domain | diff 1 | diff 2 | diff 3 | total |
|---|---|---|---|---|
${[...new Set(dataRows.map(r => r[C.domain]))].sort().map(d => {
  const d1 = domainDiff.get(`${d}|1`) ?? 0;
  const d2 = domainDiff.get(`${d}|2`) ?? 0;
  const d3 = domainDiff.get(`${d}|3`) ?? 0;
  return `| ${d} | ${d1} | ${d2} | ${d3} | ${d1 + d2 + d3} |`;
}).join("\n")}

---

## How to use this profile

When generating Phase 2 (curated) words via the upcoming \`/curate-ord-words\` skill, the new entries should — **as a batch** — converge on the same distributions and length profiles documented above.

For each individual word, follow the style rules called out in each section.
`;

fs.writeFileSync(OUT_PATH, report, "utf8");
console.log(`Wrote ${OUT_PATH}`);
