// ─── Generator: ORD prefix lexicon ───────────────────────────────────────────
//
// Produces src/lib/ord/prefix-lexicon.ts, the data behind the prefix layer of
// the morphology decoder (analysis/ORD_morfologi.md, v2).
//
// The problem it solves: ~183 strings in ord-database.csv start with "o", but
// only about half are the negating o- prefix (obefogad = o+befogad). The rest
// are opaque words that merely begin with the letter (observera, ornament,
// oboe, the whole om-/ord-/ors- cluster). Decoding those would produce an
// embarrassingly wrong split, so v1 skipped every leading-o word outright.
//
// The test that separates them: strip the prefix, and ask whether what remains
// is a real Swedish word of a compatible part of speech. That question is
// answered by SALDO, Språkbanken's morphological lexicon (128,036 entries,
// CC-BY-4.0), queried through the open Karp API.
//
// Why generate a table instead of calling the API at runtime: the decoder runs
// in the student's browser on every ORD feedback card. It must be instant and
// offline. The set of words it can ever see is fixed by ord-database.csv, so
// the whole lookup is resolvable at build time. Re-run this script whenever the
// ORD corpus grows:
//
//     node scripts/build-morph-prefixes.mjs
//
// Output is INTENTIONALLY hand-reviewable and hand-editable. Base-existence is
// necessary but not sufficient: "oförrätt" strips to "förrätt", a real noun
// meaning the first course of a meal, so the split is structurally valid and
// semantically nonsense. Those live in SEMANTIC_REJECTS below, with reasons.
// Attribution for SALDO is carried in the generated file's header.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CSV = path.join(ROOT, 'ord-database.csv');
const OUT = path.join(ROOT, 'src', 'lib', 'ord', 'prefix-lexicon.ts');
const KARP = 'https://spraakbanken4.it.gu.se/karp/v7/query/saldom';

// The prefixes worth teaching, per the corpus analysis. Negation/privative
// only: these flip a base the student may already know, which is the highest
// value decode. Directional prefixes (upp-, ut-, till-) are deliberately out;
// they modify rather than flip, and their gloss is far less reliable.
const PREFIXES = [
  { prefix: 'miss', gloss: 'fel eller dåligt' },
  { prefix: 'van', gloss: 'brist på' },
  { prefix: 'o', gloss: 'inte' },
];

// Part-of-speech tags a stripped base may carry for the split to make sense.
// av = adjective, nn = noun, ab = adverb. Verbs are excluded: "o" does not
// negate a Swedish verb, so a base that only resolves to a verb is a sign we
// have split something that is not really a prefix.
const BASE_POS = new Set(['av', 'nn', 'ab']);

// Structurally valid splits whose meaning is wrong or misleading anyway. Each
// one is a real word after stripping, so no automated rule catches them. These
// were found by reading the generated output; keep adding as the corpus grows.
const SEMANTIC_REJECTS = new Map([
  ['oförrätt', 'förrätt = första rätten i en måltid; oförrätt är inte dess negation'],
  ['olat', 'olat = ovana; ordet har inget med "lat" att göra'],
  ['olustig', 'olustig = obehaglig, inte "inte lustig"'],
  ['oförskämt', 'oförskämd kommer från skam, inte från förskämd (= skämd mat)'],
  ['otäck', 'basen "täck" är ålderdomlig och läses som täcka; ger "inte täckt"'],
  ['oljudande', 'här betyder o- dåligt, inte inte; oljud är ingen negation av ljud'],
  ['omedelbar', 'basen "medelbar" slutar på -bar och kedjas vidare till o+medel+bar, vilket blir nonsens'],
  ['oblat', 'basen "blat" är inget svenskt ord; träffen är brus'],
  ['ocker', 'opakt ord, inte o + cker'],
  ['okular', 'latinskt låneord, inte o + kular'],
  ['offert', 'opakt ord, inte o + ffert'],
  ['oligarki', 'grekiskt låneord (oligos = få), inte o + ligarki'],
  ['original', 'latinskt låneord, inte o + riginal'],
  ['ordinarie', 'latinskt låneord, inte o + rdinarie'],
  ['oxel', 'trädnamn, inte o + xel'],
]);

// ─── CSV ─────────────────────────────────────────────────────────────────────

function parseCsv(text) {
  const rows = [];
  let row = [], field = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else quoted = false;
      } else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (c !== '\r') field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows;
}

/** Every distinct single word a student can see on an ORD card: headwords and
 *  all five options. Phrases are skipped, they decode from context not parts. */
function corpusWords() {
  const rows = parseCsv(fs.readFileSync(CSV, 'utf8').replace(/^﻿/, ''));
  const head = rows[0];
  const cols = ['word', 'correct_synonym', 'distractor_1', 'distractor_2', 'distractor_3', 'distractor_4']
    .map((n) => head.indexOf(n));
  if (cols.some((c) => c < 0)) throw new Error('ord-database.csv saknar en förväntad kolumn');

  const out = new Set();
  for (const row of rows.slice(1)) {
    if (row.length < head.length) continue;
    for (const c of cols) {
      const v = (row[c] || '').trim().toLowerCase();
      if (v && !v.includes(' ') && !v.includes('-')) out.add(v);
    }
  }
  return [...out].sort();
}

// ─── SALDO lookup ────────────────────────────────────────────────────────────

const cache = new Map();

async function karp(query) {
  const url = new URL(KARP);
  url.searchParams.set('q', query);
  url.searchParams.set('size', '10');
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url);
      if (res.ok) return await res.json();
    } catch { /* retry */ }
    await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
  }
  throw new Error(`Karp svarade inte för: ${query}`);
}

/** Resolve a surface form to its lemma(s) in SALDO, trying the baseform index
 *  first and falling back to inflected forms (oavbrutet -> avbrutet -> avbruten). */
async function lookup(form) {
  if (cache.has(form)) return cache.get(form);

  let hits = (await karp(`equals|baseform|${form}`)).hits ?? [];
  if (hits.length === 0) {
    hits = (await karp(`equals|inflectionTable.writtenForm|${form}`)).hits ?? [];
  }
  const lemmas = hits.map((h) => ({
    baseform: h.entry.baseform,
    pos: h.entry.partOfSpeech,
  }));
  cache.set(form, lemmas);
  return lemmas;
}

// ─── Main ────────────────────────────────────────────────────────────────────

const MIN_BASE_LEN = 3;

async function main() {
  const words = corpusWords();
  const accepted = [];
  const rejected = [];

  for (const word of words) {
    const rule = PREFIXES.find(
      (p) => word.startsWith(p.prefix) && word.length - p.prefix.length >= MIN_BASE_LEN,
    );
    if (!rule) continue;

    const base = word.slice(rule.prefix.length);

    const semantic = SEMANTIC_REJECTS.get(word);
    if (semantic) { rejected.push({ word, base, reason: semantic }); continue; }

    const lemmas = await lookup(base);
    if (lemmas.length === 0) {
      rejected.push({ word, base, reason: `"${base}" finns inte i SALDO` });
      continue;
    }
    const usable = lemmas.filter((l) => BASE_POS.has(l.pos));
    if (usable.length === 0) {
      rejected.push({ word, base, reason: `"${base}" finns bara som ${lemmas.map((l) => l.pos).join('/')}` });
      continue;
    }
    accepted.push({ word, prefix: rule.prefix, base, gloss: rule.gloss, lemma: usable[0].baseform, pos: usable[0].pos });
  }

  const generated = [
    '// GENERERAD FIL, redigera inte för hand.',
    '// Kör: node scripts/build-morph-prefixes.mjs',
    '//',
    '// Prefixlagret i ORD-morfologiavkodaren. Varje post är handverifierad mot',
    '// SALDO (Språkbanken Text, CC-BY-4.0, https://spraakbanken.gu.se/resurser/saldom):',
    '// basen efter avskalat prefix finns som riktigt svenskt ord med rimlig ordklass.',
    '//',
    `// ${accepted.length} godkända av ${accepted.length + rejected.length} kandidater.`,
    '',
    'export interface PrefixEntry {',
    '  /** The prefix, e.g. "o". */',
    '  prefix: string',
    '  /** The base left after stripping it, e.g. "befogad". */',
    '  base: string',
    '  /** Plain-language meaning of the prefix, shown to the student. */',
    '  gloss: string',
    '  /** SALDO part of speech of the base: av = adjective, nn = noun, ab = adverb.',
    '   *  Only adjectives get a synthesised "inte X" paraphrase; on a noun that',
    '   *  reads as broken Swedish ("inte hälsa"). */',
    '  basePos: string',
    '}',
    '',
    'export const PREFIX_LEXICON: Record<string, PrefixEntry> = {',
    ...accepted.map(
      (a) => `  ${JSON.stringify(a.word)}: { prefix: ${JSON.stringify(a.prefix)}, base: ${JSON.stringify(a.base)}, gloss: ${JSON.stringify(a.gloss)}, basePos: ${JSON.stringify(a.pos)} },`,
    ),
    '}',
    '',
  ].join('\n');

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, generated, 'utf8');

  const report = path.join(ROOT, 'scripts', '.morph-prefixes-report.txt');
  fs.writeFileSync(
    report,
    [
      `GODKÄNDA (${accepted.length})`,
      ...accepted.map((a) => `  ${a.word.padEnd(22)} = ${a.prefix} + ${a.base}   [${a.lemma}/${a.pos}]`),
      '',
      `AVVISADE (${rejected.length})`,
      ...rejected.map((r) => `  ${r.word.padEnd(22)} ${r.reason}`),
    ].join('\n'),
    'utf8',
  );

  console.log(`Skrev ${accepted.length} poster till ${path.relative(ROOT, OUT)}`);
  console.log(`Avvisade ${rejected.length}. Full rapport: ${path.relative(ROOT, report)}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
