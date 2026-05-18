// Sample 10 random rows from Phase 1 (past exams) and 10 from Phase 2 (curated)
// and display them side-by-side for qualitative comparison.

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
  d1: header.indexOf("distractor_1"),
  d2: header.indexOf("distractor_2"),
  d3: header.indexOf("distractor_3"),
  d4: header.indexOf("distractor_4"),
  def: header.indexOf("definition_sv"),
  ex: header.indexOf("example_sentence"),
  domain: header.indexOf("domain"),
  difficulty: header.indexOf("difficulty"),
  exam: header.indexOf("past_exams"),
  notes: header.indexOf("notes"),
};

const pastExams = data.filter(r => r[C.exam] !== "curated");
const curated = data.filter(r => r[C.exam] === "curated");

// Deterministic-ish but varied: seed by index
function pick(arr, n) {
  const idx = new Set();
  const result = [];
  while (idx.size < n && idx.size < arr.length) {
    const i = Math.floor(Math.random() * arr.length);
    if (!idx.has(i)) {
      idx.add(i);
      result.push(arr[i]);
    }
  }
  return result;
}

const pastSample = pick(pastExams, 10);
const curatedSample = pick(curated, 10);

const fmt = r => {
  const distractors = [r[C.d1], r[C.d2], r[C.d3], r[C.d4]].join(" / ");
  return `${r[C.id].padStart(3)}  ${r[C.word]} [${r[C.pos]}, ${r[C.domain]}, d${r[C.difficulty]}]
       → ${r[C.correct]}  (vs: ${distractors})
       def: ${r[C.def]}
       ex:  ${r[C.ex]}
       notes: ${r[C.notes] || "—"}`;
};

console.log("==== PHASE 1 — random sample of 10 past-exam words ====\n");
for (const r of pastSample) console.log(fmt(r) + "\n");

console.log("\n==== PHASE 2 — random sample of 10 curated words ====\n");
for (const r of curatedSample) console.log(fmt(r) + "\n");
