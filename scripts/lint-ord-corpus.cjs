#!/usr/bin/env node
/*
 * lint-ord-corpus.cjs — quality sweep over ord-database.csv.
 *
 * The LÄS counterpart is lint-las-corpus.cjs. This one exists for the same
 * reason: the ORD pool is about to grow from 340 curated words to ~1000, and a
 * defect class baked into 660 new rows is a content pass, not an afternoon.
 *
 * THE ODD-ONE-OUT RULE (settled 2026-07-24 from the corpus, not from taste)
 * ------------------------------------------------------------------------
 * The open question was whether the rule should be "all five options must match
 * in form" or "the correct answer must never be the odd one out". Measured
 * against the 537 real past-HP items in this very file:
 *
 *   • the correct answer is multi-word in       31.1%  of real items
 *   • but it is the ONLY multi-word option in    1.1%
 *   • and it is the ONLY single-word option in   0.0%   (0 of 537)
 *
 * So form-matching is plainly NOT what HP does — a third of real items pair a
 * multi-word answer with single-word distractors. What HP essentially never
 * does is leave the correct answer alone in its class. That is the rule:
 *
 *   at least one distractor must share the correct answer's word-count class.
 *
 * It also resolves the cases that made "match in form" unworkable: katharsis,
 * fontanell and unikum have no single-word synonym, and under this rule they
 * are fine as long as one distractor is also a phrase.
 *
 * Past-HP rows are verbatim reproductions of real exams and are NEVER flagged
 * for authoring rules — "fixing" them would falsify the source. They are only
 * checked for data integrity.
 *
 * Usage:
 *   node scripts/lint-ord-corpus.cjs [--csv ord-database.csv] [--quiet] [--strict]
 *
 * Exit code 1 means something must be fixed.
 */

const fs = require('fs');
const path = require('path');
const { parseCSV } = require('./las-checks.cjs');

const argv = process.argv.slice(2);
let csvPath = 'ord-database.csv';
let quiet = false;
let strict = false;
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === '--csv') csvPath = argv[++i];
  else if (a === '--quiet') quiet = true;
  else if (a === '--strict') strict = true;
}

const full = path.isAbsolute(csvPath) ? csvPath : path.join(process.cwd(), csvPath);
if (!fs.existsSync(full)) {
  console.error(`✗ Hittar inte ${csvPath}`);
  process.exit(1);
}

const rows = parseCSV(fs.readFileSync(full, 'utf8').replace(/^﻿/, ''));
const head = rows[0];
const col = (n) => head.indexOf(n);
const need = ['id', 'word', 'correct_synonym', 'distractor_1', 'distractor_2', 'distractor_3', 'distractor_4', 'example_sentence', 'past_exams', 'accepted_synonyms'];
const missingCols = need.filter((c) => col(c) === -1);
if (missingCols.length) {
  console.error('✗ CSV saknar kolumner: ' + missingCols.join(', '));
  process.exit(1);
}

const wordCount = (s) => String(s).trim().split(/\s+/).filter(Boolean).length;

// Folds å/ä/ö to a/a/o so stem-vowel alternation does not break prefix matching.
const fold = (s) => String(s).toLowerCase().replace(/[åä]/g, 'a').replace(/ö/g, 'o');

// True if the example sentence plausibly contains the headword in some form.
// Uses the longest word of a multi-word entry ("gå i bräschen" -> "bräschen"),
// because that is the part that stays put while the verb inflects.
function exampleContainsWord(word, example) {
  const parts = fold(word).split(/\s+/).filter(Boolean);
  const target = parts.sort((a, b) => b.length - a.length)[0] || '';
  if (!target) return true;
  const prefix = target.slice(0, target.length > 5 ? 4 : 3);
  return fold(example).includes(prefix);
}
const formClass = (s) => (wordCount(s) > 1 ? 'flerordig' : 'enordig');
const EM_DASH = '—';

const items = [];
for (const r of rows.slice(1)) {
  if (!r[col('word')]) continue;
  items.push({
    id: r[col('id')],
    word: r[col('word')].trim(),
    correct: (r[col('correct_synonym')] || '').trim(),
    distractors: [1, 2, 3, 4].map((n) => (r[col('distractor_' + n)] || '').trim()),
    example: (r[col('example_sentence')] || '').trim(),
    pastExams: (r[col('past_exams')] || '').trim(),
    accepted: (r[col('accepted_synonyms')] || '').trim(),
    notes: col('notes') !== -1 ? (r[col('notes')] || '').trim() : '',
  });
}

const curated = items.filter((i) => i.pastExams === 'curated');
const past = items.filter((i) => i.pastExams !== 'curated');

console.log(`\nORD-korpuslint — ${items.length} rader (${curated.length} curated, ${past.length} past-HP)`);
console.log('─'.repeat(72));

let errors = 0;
let warnings = 0;
const report = [];

function push(kind, item, msg) {
  if (kind === 'FEL') errors++; else warnings++;
  report.push(`${kind === 'FEL' ? '✗' : '⚠'} id ${item.id} "${item.word}"\n    ${kind}: ${msg}`);
}

// ---- per-row checks --------------------------------------------------------
for (const it of items) {
  const isCurated = it.pastExams === 'curated';
  const opts = [it.correct, ...it.distractors];

  // Data integrity — applies to every row, past-HP included.
  if (opts.some((o) => o === '')) { push('FEL', it, 'saknar ett eller flera svarsalternativ'); continue; }
  const lowered = opts.map((o) => o.toLowerCase());
  const dupes = lowered.filter((o, i) => lowered.indexOf(o) !== i);
  if (dupes.length) push('FEL', it, `samma alternativ förekommer två gånger: ${[...new Set(dupes)].join(', ')}`);
  if (lowered.includes(it.word.toLowerCase())) push('FEL', it, 'uppslagsordet finns bland svarsalternativen');

  // Authoring rules — curated rows only. Past-HP rows reproduce real exams
  // verbatim; flagging them would invite "fixing" authentic material.
  if (!isCurated) continue;

  // The odd-one-out rule. See the header for the measurement behind it.
  const cls = formClass(it.correct);
  if (!it.distractors.some((d) => formClass(d) === cls)) {
    push('FEL', it,
      `rätt svar "${it.correct}" är den enda ${cls}a bland alternativen — formen avslöjar svaret. ` +
      `Gör minst en distraktor ${cls}. (Verklig HP gör detta i 1.1% av uppgifterna, aldrig åt andra hållet.)`);
  }

  // Length-tell: the same defect one level down. A correct answer far longer
  // than every distractor is guessable even when the word class matches.
  const cLen = it.correct.length;
  const maxD = Math.max(...it.distractors.map((d) => d.length));
  if (cLen > maxD + 6) {
    push('varning', it, `rätt svar är ${cLen} tecken mot längsta distraktor ${maxD} — längd-tell`);
  }

  // The example sentence has to actually contain the word being taught; a
  // sentence about something else teaches nothing about this headword.
  //
  // Matching has to survive Swedish inflection, which is why this is a short
  // prefix on a diacritic-folded form rather than a substring search. Strong
  // verbs change the stem vowel (utse -> utsåg, besjunga -> besjöng) and
  // ä/å/ö alternate with a/a/o (avsätta -> avsatte, sägen -> sägnen). A naive
  // check flagged twelve perfectly good rows.
  if (it.example) {
    if (!exampleContainsWord(it.word, it.example)) {
      push('varning', it, `exempelmeningen verkar inte innehålla ordet ("${it.example.slice(0, 60)}…")`);
    }
  } else {
    push('varning', it, 'saknar exempelmening');
  }

  // Non-Negotiable Rule #9 — ORD rows are Fattat's own voice, no exemption.
  for (const [field, val] of Object.entries({ correct: it.correct, example: it.example, accepted: it.accepted, notes: it.notes })) {
    if (val.includes(EM_DASH)) push('FEL', it, `em-dash (—) i ${field}`);
  }
  it.distractors.forEach((d, i) => {
    if (d.includes(EM_DASH)) push('FEL', it, `em-dash (—) i distractor_${i + 1}`);
  });

  // An accepted synonym that is also a distractor makes the item unanswerable.
  if (it.accepted) {
    const acc = it.accepted.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
    const clash = it.distractors.filter((d) => acc.includes(d.toLowerCase()));
    if (clash.length) push('FEL', it, `distraktorn "${clash.join(', ')}" står också som accepterad synonym`);
  }
}

// ---- corpus-wide -----------------------------------------------------------
const notes = [];

// A repeated headword means FSRS schedules two cards for the same word.
const byWord = new Map();
for (const it of items) {
  const k = it.word.toLowerCase();
  if (!byWord.has(k)) byWord.set(k, []);
  byWord.get(k).push(it.id);
}
const repeated = [...byWord.entries()].filter(([, ids]) => ids.length > 1);
for (const [w, ids] of repeated) {
  errors++;
  report.push(`✗ "${w}"\n    FEL: uppslagsordet finns på flera rader (id ${ids.join(', ')}) — FSRS skulle schemalägga två kort för samma ord`);
}

// Form mix, so a batch can be compared against the real-HP baseline (31%).
const multiCorrect = curated.filter((i) => formClass(i.correct) === 'flerordig').length;
notes.push(`flerordiga rätta svar (curated): ${multiCorrect}/${curated.length} (${((multiCorrect / curated.length) * 100).toFixed(1)}%) — verklig HP ligger på 31.1%`);

const pastMulti = past.filter((i) => formClass(i.correct) === 'flerordig').length;
notes.push(`flerordiga rätta svar (past-HP referens): ${pastMulti}/${past.length} (${((pastMulti / past.length) * 100).toFixed(1)}%)`);

// ---- output ----------------------------------------------------------------
if (report.length && !quiet) report.forEach((r) => console.log('\n' + r));
else if (report.length) report.filter((r) => r.startsWith('✗')).forEach((r) => console.log('\n' + r));

console.log('\n' + '─'.repeat(72));
console.log('Korpus');
notes.forEach((n) => console.log(`    ${n}`));

console.log('\n' + '─'.repeat(72));
console.log(`${items.length} rader · ${errors} fel · ${warnings} varningar`);

if (errors > 0) {
  console.log('\nFel måste åtgärdas innan seed.\n');
  process.exit(1);
}
if (strict && warnings > 0) {
  console.log('\n--strict: varningar räknas som fel.\n');
  process.exit(1);
}
console.log('\nORD-korpusen är klar för seed.\n');
