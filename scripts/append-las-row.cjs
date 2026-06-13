#!/usr/bin/env node
/*
 * append-las-row.cjs — Safely append ONE LÄS article to las-database.csv.
 *
 * Used by the LÄS content skills (write-las-article, format-las-article,
 * batch-las-articles) so the fiddly + dangerous final step — cramming an
 * article into RFC4180 CSV without breaking the seed pipeline — runs through
 * one tested encoder instead of being hand-built every session.
 *
 * It does the encoding; it cannot do the writing. The article body, questions
 * and ORD-word choices are still produced by the skill.
 *
 * Usage:
 *   node scripts/append-las-row.cjs <payload.json> [--dry-run] [--file <csv>]
 *
 *   --dry-run   Validate, build and verify the row, print a preview, write NOTHING.
 *   --file      Override target CSV (default: las-database.csv in cwd).
 *
 * payload.json shape (strings are plain — no CSV escaping, the script handles it):
 * {
 *   "title": "Rummet utan kassa",
 *   "domain": "samhälle",
 *   "genre": "reportage",
 *   "unit_position": "kort",            // "kort" | "lång"
 *   "difficulty": 2,                     // 1 | 2 | 3
 *   "body": "full text with\n\nreal newlines",
 *   "questions": [ { n, type, stem, options:{A,B,C,D}, correct, passage_anchor, explanation, distractor_types, notes } ],
 *   "vocab_highlights": [ { "word": "...", "definition": "..." } ],
 *   "featured_ord_words": ["egalitär","obemedlad"],   // array of strings -> {"egalitär","obemedlad"}
 *
 *   // optional — sensible defaults applied:
 *   "id": 8,                    // default: max existing id + 1
 *   "word_count": 287,          // default: counted from body
 *   "question_count": 2,        // default: questions.length
 *   "source_url": "",           // default: ""
 *   "source_name": "Fattat",    // default: "Fattat"
 *   "past_hp": "",              // default: ""
 *   "is_designed_content": true,// default: true  -> "TRUE"
 *   "notes": ""                 // default: ""
 * }
 */

const fs = require('fs');

// ---- args -----------------------------------------------------------------
const argv = process.argv.slice(2);
let payloadPath = null;
let csvPath = 'las-database.csv';
let dryRun = false;
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === '--dry-run') dryRun = true;
  else if (a === '--file') csvPath = argv[++i];
  else if (!payloadPath) payloadPath = a;
}
if (!payloadPath) fail('Usage: node scripts/append-las-row.cjs <payload.json> [--dry-run] [--file <csv>]');

let hadWarn = false;
function warn(m) { hadWarn = true; console.warn('⚠ VARNING: ' + m); }
function fail(m) { console.error('✗ FEL: ' + m); process.exit(1); }

// ---- RFC4180 helpers ------------------------------------------------------
const esc = (f) => {
  f = String(f);
  return /[",\n\r]/.test(f) ? '"' + f.replace(/"/g, '""') + '"' : f;
};

function parseCSV(s) {
  const rows = [];
  let row = [], field = '', i = 0, inQ = false;
  while (i < s.length) {
    const c = s[i];
    if (inQ) {
      if (c === '"') {
        if (s[i + 1] === '"') { field += '"'; i += 2; continue; }
        inQ = false; i++; continue;
      }
      field += c; i++; continue;
    }
    if (c === '"') { inQ = true; i++; continue; }
    if (c === ',') { row.push(field); field = ''; i++; continue; }
    if (c === '\r') { i++; continue; }
    if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; i++; continue; }
    field += c; i++;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows;
}

const countWords = (s) =>
  String(s).trim().split(/\s+/).filter((t) => /[\p{L}\p{N}]/u.test(t)).length;

function featuredLiteral(f) {
  if (typeof f === 'string') return f.trim().startsWith('{') ? f.trim() : '{' + f + '}';
  if (Array.isArray(f)) return '{' + f.map((w) => '"' + String(w) + '"').join(',') + '}';
  fail('featured_ord_words måste vara en array av ord eller en {"..."}-literal');
}

// ---- load -----------------------------------------------------------------
let payload;
try { payload = JSON.parse(fs.readFileSync(payloadPath, 'utf8')); }
catch (e) { fail('Kunde inte läsa/parsa payload-JSON: ' + e.message); }

let csv;
try { csv = fs.readFileSync(csvPath, 'utf8'); }
catch (e) { fail('Kunde inte läsa CSV (' + csvPath + '): ' + e.message); }
csv = csv.replace(/^﻿/, ''); // strip UTF-8 BOM so header[0] reads "id", not "﻿id"

const rows = parseCSV(csv);
const header = rows[0];
const dataRows = rows.slice(1);
const colIdx = (name) => header.indexOf(name);

// ---- validate -------------------------------------------------------------
const required = ['title', 'domain', 'genre', 'unit_position', 'difficulty', 'body', 'questions', 'vocab_highlights', 'featured_ord_words'];
const missing = required.filter((k) => payload[k] === undefined || payload[k] === null || payload[k] === '');
if (missing.length) fail('Saknar fält i payload: ' + missing.join(', '));

for (const k of ['questions', 'vocab_highlights', 'featured_ord_words']) {
  if (!Array.isArray(payload[k]) || payload[k].length === 0) {
    if (k === 'featured_ord_words' && typeof payload[k] === 'string') continue; // literal string allowed
    fail(`${k} måste vara en icke-tom array`);
  }
}

payload.questions.forEach((q, idx) => {
  if (!q.options || typeof q.options !== 'object') fail(`Fråga ${idx + 1}: saknar options-objekt`);
  if (!(q.correct in q.options)) fail(`Fråga ${idx + 1}: 'correct'=${q.correct} finns inte bland options-nycklarna`);
});

// ---- derive ---------------------------------------------------------------
const existingIds = dataRows.map((r) => parseInt(r[0], 10)).filter((n) => !isNaN(n));
const nextId = payload.id != null ? payload.id : (existingIds.length ? Math.max(...existingIds) + 1 : 1);
const wordCount = payload.word_count != null ? payload.word_count : countWords(payload.body);
const questionCount = payload.question_count != null ? payload.question_count : payload.questions.length;

// soft guards
const expectedQ = payload.unit_position === 'kort' ? 2 : payload.unit_position === 'lång' ? 4 : null;
if (expectedQ && questionCount !== expectedQ) warn(`unit_position=${payload.unit_position} förväntar ${expectedQ} frågor, men fick ${questionCount}`);
if (payload.unit_position === 'kort' && (wordCount < 250 || wordCount > 400)) warn(`kort-text på ${wordCount} ord (förväntat 250–400)`);
if (payload.unit_position === 'lång' && wordCount < 950) warn(`lång-text på ${wordCount} ord (förväntat ≥950)`);
if (existingIds.includes(nextId)) warn(`id ${nextId} finns redan i filen`);
const titleIdx = colIdx('title');
if (titleIdx !== -1 && dataRows.some((r) => r[titleIdx] === payload.title)) warn(`En artikel med titeln "${payload.title}" finns redan — dubblett?`);

// ---- build row in header order -------------------------------------------
const valueByCol = {
  id: nextId,
  title: payload.title,
  source_url: payload.source_url != null ? payload.source_url : '',
  source_name: payload.source_name != null ? payload.source_name : 'Fattat',
  domain: payload.domain,
  genre: payload.genre,
  word_count: wordCount,
  difficulty: payload.difficulty,
  question_count: questionCount,
  unit_position: payload.unit_position,
  past_hp: payload.past_hp != null ? payload.past_hp : '',
  body: payload.body,
  questions: JSON.stringify(payload.questions),
  vocab_highlights: JSON.stringify(payload.vocab_highlights),
  featured_ord_words: featuredLiteral(payload.featured_ord_words),
  is_designed_content: payload.is_designed_content === false ? 'FALSE' : 'TRUE',
  notes: payload.notes != null ? payload.notes : '',
};
for (const col of header) {
  if (!(col in valueByCol)) warn(`Okänd kolumn i header lämnas tom: "${col}"`);
}

const eol = csv.includes('\r\n') ? '\r\n' : '\n';
const rowStr = header.map((col) => esc(col in valueByCol ? valueByCol[col] : '')).join(',').replace(/\r?\n/g, eol);

// ---- verify by re-parsing in context -------------------------------------
const needsNL = csv.length > 0 && !csv.endsWith('\n');
const delta = (needsNL ? eol : '') + rowStr + eol;
const verifyRows = parseCSV(csv + delta);
const added = verifyRows[verifyRows.length - 1];
if (added.length !== header.length) fail(`Verifiering misslyckades: nya raden fick ${added.length} fält, förväntat ${header.length}`);
if (String(added[colIdx('id')]) !== String(nextId)) fail(`Verifiering misslyckades: id-fältet blev "${added[colIdx('id')]}", förväntat "${nextId}"`);
try {
  JSON.parse(added[colIdx('questions')]);
  JSON.parse(added[colIdx('vocab_highlights')]);
} catch (e) {
  fail('Verifiering misslyckades: questions/vocab_highlights parsar inte tillbaka som JSON: ' + e.message);
}

// ---- summary --------------------------------------------------------------
function printSummary() {
  console.log('  id=' + nextId + ' | "' + payload.title + '"');
  console.log('  ' + payload.domain + ' / ' + payload.genre + ' / ' + payload.unit_position +
    ' | ' + wordCount + ' ord | difficulty ' + payload.difficulty + ' | ' + questionCount + ' frågor');
  console.log('  frågor: ' + payload.questions.map((q) => q.type + '→' + q.correct).join(', '));
  console.log('  featured: ' + valueByCol.featured_ord_words);
}

if (dryRun) {
  console.log('[DRY RUN] Inget skrevs. Raden skulle bli:');
  printSummary();
  console.log(hadWarn ? '\n(varningar ovan — kontrollera innan riktig körning)' : '\n✓ Verifierad, redo att läggas till.');
} else {
  fs.appendFileSync(csvPath, delta, 'utf8');
  console.log('✓ La till artikel i ' + csvPath + ':');
  printSummary();
  if (hadWarn) console.log('\n(observera varningarna ovan)');
}
