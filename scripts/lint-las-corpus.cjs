#!/usr/bin/env node
/*
 * lint-las-corpus.cjs — run every LÄS content rule over the whole bank at once.
 *
 * Why this exists: at 18 articles a human can read all of them. At 100+ that
 * stops being true, and the failure mode is not "an article is bad" but "a
 * defect class got baked into forty articles before anyone looked". This gives
 * one report instead of a hundred scrolling dry-run outputs, so review can be
 * sampling plus a clean lint rather than exhaustive reading.
 *
 * It runs the SAME checkArticle() that add-las-article.cjs runs at authoring
 * time, plus corpus-wide checks that no single-article run can see (answer
 * letter spread across the bank, kort/lång pool balance, duplicate ids and
 * titles, domain concentration, featured-word reuse).
 *
 * Usage:
 *   node scripts/lint-las-corpus.cjs [--dir las] [--quiet] [--strict]
 *
 *   --quiet    Only print articles that have something to report.
 *   --strict   Exit non-zero on warnings too (default: only errors fail).
 *
 * Exit code 1 means something must be fixed before seeding.
 */

const fs = require('fs');
const path = require('path');
const { checkArticle, checkCorpus, loadOrdIndex } = require('./las-checks.cjs');

const argv = process.argv.slice(2);
let dir = 'las';
let quiet = false;
let strict = false;
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === '--dir') dir = argv[++i];
  else if (a === '--quiet') quiet = true;
  else if (a === '--strict') strict = true;
}

const full = path.isAbsolute(dir) ? dir : path.join(process.cwd(), dir);
if (!fs.existsSync(full)) {
  console.error(`✗ Mappen ${dir}/ finns inte.`);
  process.exit(1);
}

const files = fs.readdirSync(full).filter((f) => f.endsWith('.json')).sort();
if (files.length === 0) {
  console.error(`✗ Inga .json-artiklar i ${dir}/.`);
  process.exit(1);
}

const articles = [];
let parseErrors = 0;
for (const f of files) {
  try {
    articles.push({ file: f, data: JSON.parse(fs.readFileSync(path.join(full, f), 'utf8')) });
  } catch (e) {
    console.error(`✗ ${f}: kunde inte parsas — ${e.message}`);
    parseErrors++;
  }
}

const ordIndex = loadOrdIndex();

console.log(`\nLÄS-korpuslint — ${articles.length} artiklar i ${dir}/`);
if (!ordIndex) console.log('  (curated-koll hoppades över: kunde inte läsa ord-database.csv)');
console.log('─'.repeat(72));

let totalErrors = parseErrors;
let totalWarnings = 0;
let cleanFiles = 0;

for (const { file, data } of articles) {
  const { errors, warnings } = checkArticle(data, {
    ordIndex,
    existing: articles,
    selfId: data.id,      // don't flag an article for overlapping with itself
  });
  totalErrors += errors.length;
  totalWarnings += warnings.length;

  if (errors.length === 0 && warnings.length === 0) {
    cleanFiles++;
    if (!quiet) console.log(`✓ ${file}`);
    continue;
  }

  console.log(`\n${errors.length ? '✗' : '⚠'} ${file}  (id ${data.id}, ${data.unit_position})`);
  errors.forEach((m) => console.log(`    FEL:     ${m}`));
  warnings.forEach((m) => console.log(`    varning: ${m}`));
}

// ---- corpus-wide -----------------------------------------------------------
const corpus = checkCorpus(articles);
totalErrors += corpus.errors.length;
totalWarnings += corpus.warnings.length;

console.log('\n' + '─'.repeat(72));
console.log('Korpus');
corpus.notes.forEach((m) => console.log(`    ${m}`));
corpus.errors.forEach((m) => console.log(`    FEL:     ${m}`));
corpus.warnings.forEach((m) => console.log(`    varning: ${m}`));

// ---- summary ---------------------------------------------------------------
console.log('\n' + '─'.repeat(72));
console.log(`${cleanFiles}/${articles.length} artiklar helt rena · ${totalErrors} fel · ${totalWarnings} varningar`);

if (totalErrors > 0) {
  console.log('\nFel måste åtgärdas innan seed. Kör om linten efteråt.');
  process.exit(1);
}
if (strict && totalWarnings > 0) {
  console.log('\n--strict: varningar räknas som fel.');
  process.exit(1);
}
console.log('\nKorpusen är klar för seed.\n');
