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
// The content-quality rules live in las-checks.cjs so that this script and the
// corpus sweep (lint-las-corpus.cjs) enforce the identical set. See that file.
const { checkArticle, countWords, featuredWords, loadOrdIndex } = require('./las-checks.cjs');

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
// countWords / featuredWords / parseCSV now live in las-checks.cjs.

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
// Every content rule (length-tell, position-tell, letter references, em-dash,
// passage_anchor verbatim, vocab_highlights, distractor_types, length bands,
// featured-word overlap + curated) lives in las-checks.cjs. The corpus sweep
// runs the identical function, so an article that passes here passes there.
const ordIndex = loadOrdIndex();
if (!ordIndex) console.log('  (curated-koll hoppades över: kunde inte läsa ord-database.csv)');

const { errors, warnings } = checkArticle(payload, { ordIndex, existing });
warnings.forEach(warn);
if (errors.length) {
  errors.forEach((m) => console.error('✗ FEL: ' + m));
  process.exit(1);
}

// ---- derive ---------------------------------------------------------------
const existingIds = existing.map((e) => parseInt(e.data.id, 10)).filter((n) => !isNaN(n));
const nextId = payload.id != null ? payload.id : (existingIds.length ? Math.max(...existingIds) + 1 : 1);
const wordCount = payload.word_count != null ? payload.word_count : countWords(payload.body);
const questionCount = payload.question_count != null ? payload.question_count : payload.questions.length;

// Identity guards — these concern the id/title this run is about to claim, so
// they stay here rather than in the shared per-article checker.
if (existingIds.includes(nextId)) warn(`id ${nextId} finns redan i ${outDir}/`);
if (existing.some((e) => e.data.title === payload.title)) warn(`En artikel med titeln "${payload.title}" finns redan — dubblett?`);

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
