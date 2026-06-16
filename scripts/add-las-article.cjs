#!/usr/bin/env node
/*
 * add-las-article.cjs — Safely add ONE LÄS article as a per-article JSON file
 * under las/.
 *
 * Replaces the old append-las-row.cjs (which crammed an article into one shared
 * CSV). The source of truth is now one file per article: editing article #43
 * only ever touches las/043-*.json, so the corpus can grow to hundreds without
 * a giant CSV that's slow and fragile to edit. The seed reads the whole folder.
 *
 * It does the validation + encoding; it cannot do the writing. The article body,
 * questions and ORD-word choices are still produced by the skill.
 *
 * Usage:
 *   node scripts/add-las-article.cjs <payload.json> [--dry-run] [--dir <folder>]
 *
 *   --dry-run   Validate, build and verify the record, print a preview, write NOTHING.
 *   --dir       Override target folder (default: las/ in cwd).
 *
 * payload.json shape (plain values — no CSV escaping anywhere):
 * {
 *   "title": "Rummet utan kassa",
 *   "domain": "samhälle",
 *   "genre": "reportage",
 *   "unit_position": "kort",            // "kort" | "lång"
 *   "difficulty": 2,                     // 1 | 2 | 3
 *   "body": "full text with\n\nreal newlines",
 *   "questions": [ { n, type, stem, options:{A,B,C,D}, correct, passage_anchor, explanation, distractor_types, notes } ],
 *   "vocab_highlights": [ { "word": "...", "definition": "..." } ],
 *   "featured_ord_words": ["egalitär","obemedlad"],   // array of strings
 *
 *   // optional — sensible defaults applied:
 *   "id": 11,                   // default: max existing id in las/ + 1
 *   "word_count": 287,          // default: counted from body
 *   "question_count": 2,        // default: questions.length
 *   "source_url": "",           // default: ""
 *   "source_name": "Fattat",    // default: "Fattat"
 *   "past_hp": "",              // default: ""
 *   "is_designed_content": true,// default: true
 *   "notes": ""                 // default: ""
 * }
 */

const fs = require('fs');
const path = require('path');

// ---- args -----------------------------------------------------------------
const argv = process.argv.slice(2);
let payloadPath = null;
let outDir = 'las';
let dryRun = false;
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === '--dry-run') dryRun = true;
  else if (a === '--dir') outDir = argv[++i];
  else if (!payloadPath) payloadPath = a;
}
if (!payloadPath) fail('Usage: node scripts/add-las-article.cjs <payload.json> [--dry-run] [--dir <folder>]');

let hadWarn = false;
function warn(m) { hadWarn = true; console.warn('⚠ VARNING: ' + m); }
function fail(m) { console.error('✗ FEL: ' + m); process.exit(1); }

// ---- helpers --------------------------------------------------------------
const countWords = (s) =>
  String(s).trim().split(/\s+/).filter((t) => /[\p{L}\p{N}]/u.test(t)).length;

// RFC4180 parse — needed for the curated guard, since a naive split(',') misreads
// columns on rows with quoted commas (e.g. definitions) and falsely flags curated
// words as past-HP.
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

// Accepts ["a","b"] or the {"a","b"} literal -> ["a","b"]
function featuredWords(f) {
  if (Array.isArray(f)) return f.map((w) => String(w).trim()).filter(Boolean);
  if (typeof f === 'string') return (f.match(/"([^"]+)"/g) || []).map((s) => s.slice(1, -1));
  return [];
}

function slugify(title) {
  return String(title)
    .toLowerCase()
    .replace(/[åäæ]/g, 'a').replace(/[öøœ]/g, 'o').replace(/é/g, 'e').replace(/ü/g, 'u')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

// Read every existing article in the folder (for id / dup / overlap checks).
function loadExisting(dir) {
  const full = path.isAbsolute(dir) ? dir : path.join(process.cwd(), dir);
  if (!fs.existsSync(full)) return [];
  return fs.readdirSync(full)
    .filter((f) => f.endsWith('.json'))
    .map((f) => {
      try { return { file: f, data: JSON.parse(fs.readFileSync(path.join(full, f), 'utf8')) }; }
      catch (e) { warn(`kunde inte parsa befintlig fil ${f}: ${e.message}`); return null; }
    })
    .filter(Boolean);
}

// ---- load -----------------------------------------------------------------
let payload;
try { payload = JSON.parse(fs.readFileSync(payloadPath, 'utf8')); }
catch (e) { fail('Kunde inte läsa/parsa payload-JSON: ' + e.message); }

const existing = loadExisting(outDir);

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

// Question-quality guard — the tell AI HP-questions keep producing: the correct
// answer is the longest option. Option POSITION is deliberately NOT checked: the
// session/test/diagnostic pages shuffle options and relabel A–D at render, so the
// stored correct letter never reaches the user — only option *lengths* survive.
payload.questions.forEach((q, idx) => {
  const opts = q.options || {};
  const clen = String(opts[q.correct] || '').trim().length;
  const dlens = Object.keys(opts).filter((k) => k !== q.correct).map((k) => String(opts[k]).trim().length);
  const maxD = dlens.length ? Math.max(...dlens) : 0;
  if (dlens.length && clen > maxD) warn(`Fråga ${idx + 1}: rätt svar (${q.correct}) är längst (${clen} tecken mot ${maxD}) — längd-tell; gör minst en distraktor minst lika lång`);
});

// Em-dash-spärr (founder-regel): em-dash (—, U+2014) i genererad text är den
// tydligaste AI-signaturen. Gäller brödtext + frågetext. Hård spärr.
const EM_DASH = '—';
const emDashHits = [];
if (String(payload.body).includes(EM_DASH)) emDashHits.push('body');
payload.questions.forEach((q, idx) => {
  const fields = { stem: q.stem, explanation: q.explanation, ...(q.options || {}) };
  for (const [name, val] of Object.entries(fields)) {
    if (val != null && String(val).includes(EM_DASH)) emDashHits.push(`fråga ${idx + 1}.${name}`);
  }
});
if (emDashHits.length) fail('em-dash (—) hittades i: ' + emDashHits.join(', ') + '. Em-dash är förbjuden i genererad text (AI-tell). Ersätt med punkt, komma eller kolon.');

// ---- derive ---------------------------------------------------------------
const existingIds = existing.map((e) => parseInt(e.data.id, 10)).filter((n) => !isNaN(n));
const nextId = payload.id != null ? payload.id : (existingIds.length ? Math.max(...existingIds) + 1 : 1);
const wordCount = payload.word_count != null ? payload.word_count : countWords(payload.body);
const questionCount = payload.question_count != null ? payload.question_count : payload.questions.length;

// soft guards
const expectedQ = payload.unit_position === 'kort' ? 2 : payload.unit_position === 'lång' ? 4 : null;
if (expectedQ && questionCount !== expectedQ) warn(`unit_position=${payload.unit_position} förväntar ${expectedQ} frågor, men fick ${questionCount}`);
if (payload.unit_position === 'kort' && (wordCount < 250 || wordCount > 400)) warn(`kort-text på ${wordCount} ord (förväntat 250–400)`);
if (payload.unit_position === 'lång' && wordCount < 950) warn(`lång-text på ${wordCount} ord (förväntat ≥950)`);
if (existingIds.includes(nextId)) warn(`id ${nextId} finns redan i ${outDir}/`);
if (existing.some((e) => e.data.title === payload.title)) warn(`En artikel med titeln "${payload.title}" finns redan — dubblett?`);

// ORD-överlapp: varna om ett featured-ord redan är featured i en annan artikel.
const featuredById = new Map(); // headord (gemener) -> Set(id)
for (const e of existing) {
  for (const w of featuredWords(e.data.featured_ord_words)) {
    const key = w.toLowerCase();
    if (!featuredById.has(key)) featuredById.set(key, new Set());
    featuredById.get(key).add(e.data.id);
  }
}
for (const w of featuredWords(payload.featured_ord_words)) {
  const hits = featuredById.get(w.toLowerCase());
  if (hits && hits.size) warn(`ordet "${w}" är redan featured i id ${[...hits].join(', ')}`);
}

// Curated-guard: featured-ord ska vara curated (migration 022). Past-HP-ord
// tränas aldrig dagligen, så att featurea dem ger död ORD→LÄS-förstärkning.
try {
  const ordRows = parseCSV(fs.readFileSync('ord-database.csv', 'utf8').replace(/^﻿/, ''));
  const oHead = ordRows[0];
  const wIdx = oHead.indexOf('word');
  const peIdx = oHead.indexOf('past_exams');
  if (wIdx !== -1 && peIdx !== -1) {
    const peByWord = new Map();
    for (const r of ordRows.slice(1)) if (r[wIdx]) peByWord.set(r[wIdx].toLowerCase(), r[peIdx]);
    for (const w of featuredWords(payload.featured_ord_words)) {
      const pe = peByWord.get(w.toLowerCase());
      if (pe === undefined) warn(`featured-ordet "${w}" finns inte i ord-database.csv`);
      else if (pe !== 'curated') warn(`featured-ordet "${w}" är past-HP (past_exams=${pe}) — tränas inte i daglig ORD, ger död ORD→LÄS-förstärkning`);
    }
  }
} catch (e) {
  console.log('  (curated-koll hoppades över: kunde inte läsa ord-database.csv)');
}

// ---- build the full article record ----------------------------------------
const article = {
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
  questions: payload.questions,
  vocab_highlights: payload.vocab_highlights,
  featured_ord_words: featuredWords(payload.featured_ord_words),
  is_designed_content: payload.is_designed_content === false ? false : true,
  notes: payload.notes != null ? payload.notes : '',
};

// ---- verify by serializing + reparsing ------------------------------------
let serialized;
try {
  serialized = JSON.stringify(article, null, 2) + '\n';
  const back = JSON.parse(serialized);
  if (String(back.id) !== String(nextId)) fail(`Verifiering misslyckades: id blev "${back.id}", förväntat "${nextId}"`);
  if (!Array.isArray(back.questions) || back.questions.length !== questionCount) fail('Verifiering misslyckades: questions överlevde inte serialiseringen');
} catch (e) {
  fail('Verifiering misslyckades: ' + e.message);
}

const fname = `${String(nextId).padStart(3, '0')}-${slugify(article.title)}.json`;
const fullDir = path.isAbsolute(outDir) ? outDir : path.join(process.cwd(), outDir);
const fpath = path.join(fullDir, fname);
if (fs.existsSync(fpath)) warn(`filen ${fname} finns redan och skrivs över`);

// ---- summary --------------------------------------------------------------
function printSummary() {
  console.log('  id=' + nextId + ' | "' + payload.title + '"  ->  ' + outDir + '/' + fname);
  console.log('  ' + payload.domain + ' / ' + payload.genre + ' / ' + payload.unit_position +
    ' | ' + wordCount + ' ord | difficulty ' + payload.difficulty + ' | ' + questionCount + ' frågor');
  console.log('  frågor: ' + payload.questions.map((q) => q.type + '→' + q.correct).join(', '));
  console.log('  featured: ' + JSON.stringify(article.featured_ord_words));
}

if (dryRun) {
  console.log('[DRY RUN] Inget skrevs. Filen skulle bli:');
  printSummary();
  console.log(hadWarn ? '\n(varningar ovan — kontrollera innan riktig körning)' : '\n✓ Verifierad, redo att skrivas.');
} else {
  fs.mkdirSync(fullDir, { recursive: true });
  fs.writeFileSync(fpath, serialized, 'utf8');
  console.log('✓ Skrev artikel till ' + outDir + '/' + fname + ':');
  printSummary();
  if (hadWarn) console.log('\n(observera varningarna ovan)');
}
