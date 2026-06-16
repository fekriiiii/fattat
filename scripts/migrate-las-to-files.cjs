#!/usr/bin/env node
/*
 * migrate-las-to-files.cjs — ONE-OFF: split las-database.csv into per-article
 * JSON files under las/.
 *
 * Why: a single growing CSV is fine for the *app* but painful for Claude Code to
 * EDIT at scale (fixing one article means reading/parsing a ~1MB file). One file
 * per article means an edit only ever touches that article's few KB.
 *
 * This reads the legacy CSV and writes las/<id>-<slug>.json for every row. It is
 * safe to re-run (overwrites the same filenames). After migration the CSV is no
 * longer the source of truth — new articles are written straight to las/ by
 * scripts/add-las-article.cjs, and the seed reads the folder.
 *
 * Usage:
 *   node scripts/migrate-las-to-files.cjs [--file <csv>] [--dir <out>] [--dry-run]
 */

const fs = require('fs');
const path = require('path');

const argv = process.argv.slice(2);
let csvPath = 'las-database.csv';
let outDir = 'las';
let dryRun = false;
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === '--dry-run') dryRun = true;
  else if (a === '--file') csvPath = argv[++i];
  else if (a === '--dir') outDir = argv[++i];
}

// ---- RFC4180 parse (same encoder family as add-las-article.cjs) -------------
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

// {"a","b"}  ->  ["a","b"]   (also tolerates a bare array if it ever appears)
function parseFeatured(raw) {
  if (!raw) return [];
  raw = String(raw).trim();
  return (raw.match(/"([^"]+)"/g) || []).map((s) => s.slice(1, -1));
}

// Title -> ascii-safe filename slug.
function slugify(title) {
  return String(title)
    .toLowerCase()
    .replace(/[åäæ]/g, 'a').replace(/[öøœ]/g, 'o').replace(/é/g, 'e').replace(/ü/g, 'u')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

const csv = fs.readFileSync(csvPath, 'utf8').replace(/^﻿/, '');
const rows = parseCSV(csv);
const header = rows[0];
const col = (n) => header.indexOf(n);

const num = (v, d = 0) => { const n = parseInt(v, 10); return isNaN(n) ? d : n; };
const jsonOrNull = (v, label, id) => {
  if (!v) return null;
  try { return JSON.parse(v); }
  catch (e) { console.error(`  ✗ id ${id}: kunde inte parsa ${label}: ${e.message}`); return null; }
};

if (!dryRun) fs.mkdirSync(outDir, { recursive: true });

let written = 0;
for (const r of rows.slice(1)) {
  if (!r[col('title')]) continue;
  const id = num(r[col('id')]);
  const rawSource = (r[col('source_name')] || '').trim();
  const article = {
    id,
    title: (r[col('title')] || '').trim(),
    source_url: (r[col('source_url')] || '').trim(),
    source_name: rawSource === '' ? 'Fattat' : rawSource,
    domain: (r[col('domain')] || '').trim(),
    genre: (r[col('genre')] || '').trim(),
    word_count: num(r[col('word_count')]),
    difficulty: num(r[col('difficulty')], 2),
    question_count: num(r[col('question_count')]),
    unit_position: (r[col('unit_position')] || '').trim(),
    past_hp: (r[col('past_hp')] || '').trim(),
    body: (r[col('body')] || '').trim(),
    questions: jsonOrNull(r[col('questions')], 'questions', id) || [],
    vocab_highlights: jsonOrNull(r[col('vocab_highlights')], 'vocab_highlights', id) || [],
    featured_ord_words: parseFeatured(r[col('featured_ord_words')]),
    is_designed_content:
      rawSource === '' ? true : String(r[col('is_designed_content')]).trim().toLowerCase() !== 'false',
    notes: (r[col('notes')] || '').trim(),
  };

  const fname = `${String(id).padStart(3, '0')}-${slugify(article.title)}.json`;
  const fpath = path.join(outDir, fname);
  console.log(`  ${dryRun ? '[dry]' : '✓'} ${fname}  (${article.unit_position}, ${article.question_count}q, ${article.featured_ord_words.length} featured)`);
  if (!dryRun) fs.writeFileSync(fpath, JSON.stringify(article, null, 2) + '\n', 'utf8');
  written++;
}

console.log(`\n${dryRun ? '[DRY RUN] ' : ''}${written} artiklar ${dryRun ? 'skulle skrivas' : 'skrivna'} till ${outDir}/`);
