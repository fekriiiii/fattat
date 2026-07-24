/*
 * las-checks.cjs — the LÄS content-quality rules, in one place.
 *
 * Extracted from add-las-article.cjs on 2026-07-24 so that the authoring path
 * (one article at a time) and the corpus sweep (lint-las-corpus.cjs, all of
 * them at once) enforce EXACTLY the same rules. When the bank grows past a
 * couple of dozen articles, human review has to become sampling rather than
 * exhaustive, and that is only safe if the machine check is the same check on
 * both paths. Two copies of the rules would drift within a week.
 *
 * Nothing here exits or prints. Each function returns { errors, warnings } and
 * lets the caller decide what is fatal.
 */

const fs = require('fs');

// ---- shared helpers --------------------------------------------------------

const countWords = (s) =>
  String(s).trim().split(/\s+/).filter((t) => /[\p{L}\p{N}]/u.test(t)).length;

// RFC4180 parse — a naive split(',') misreads rows with quoted commas (e.g.
// definitions) and would falsely flag curated words as past-HP.
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

// word -> past_exams, for the curated guard. Returns null if the CSV is
// unreadable so callers can skip that check instead of failing the run.
function loadOrdIndex(csvPath = 'ord-database.csv') {
  try {
    const rows = parseCSV(fs.readFileSync(csvPath, 'utf8').replace(/^﻿/, ''));
    const head = rows[0];
    const wIdx = head.indexOf('word');
    const peIdx = head.indexOf('past_exams');
    if (wIdx === -1 || peIdx === -1) return null;
    const map = new Map();
    for (const r of rows.slice(1)) if (r[wIdx]) map.set(r[wIdx].toLowerCase(), r[peIdx]);
    return map;
  } catch {
    return null;
  }
}

// Whitespace in an authored anchor rarely matches the body byte for byte (line
// wraps, a doubled space). Compare on collapsed whitespace so the check catches
// real "this sentence is not in the text" cases and not formatting noise.
const normalize = (s) => String(s).replace(/\s+/g, ' ').trim();

// An anchor may quote two non-adjacent passages joined by an ellipsis:
//   "Att försvara systemet … […] Den som vill värna de svaga …"
// Each segment must be verbatim in the body, but the whole string never is.
// Splits on […] / ... / … and drops leading/trailing ellipsis marks.
function anchorSegments(s) {
  return String(s)
    .split(/\s*(?:\[\s*(?:\.{3}|…)\s*\]|\.{3}|…)\s*/)
    .map((seg) => normalize(seg))
    .filter((seg) => seg.length > 0);
}

const EM_DASH = '—';

// HP empirical length bands (analysis/_LAS_analys.md): långtext median ~1100,
// span 800–1300. The floor is enforced at 950 because the skills target
// 1000–1200; the ceiling exists because nothing previously stopped a runaway
// 1600-word body, which is outside anything HP has ever printed.
const LANG_MIN = 950;
const LANG_MAX = 1300;
const KORT_MIN = 250;
const KORT_MAX = 400;

// ---- per-article checks ----------------------------------------------------

/**
 * @param {object} a       article-shaped object (payload or stored las/*.json)
 * @param {object} ctx     { ordIndex?: Map, existing?: [{file,data}], selfId?: number|string }
 * @returns {{errors: string[], warnings: string[]}}
 */
function checkArticle(a, ctx = {}) {
  const errors = [];
  const warnings = [];
  const err = (m) => errors.push(m);
  const warn = (m) => warnings.push(m);

  // -- schema ---------------------------------------------------------------
  const required = ['title', 'domain', 'genre', 'unit_position', 'difficulty', 'body', 'questions', 'vocab_highlights', 'featured_ord_words'];
  const missing = required.filter((k) => a[k] === undefined || a[k] === null || a[k] === '');
  if (missing.length) {
    err('saknar fält: ' + missing.join(', '));
    return { errors, warnings };   // everything below assumes these exist
  }

  for (const k of ['questions', 'vocab_highlights', 'featured_ord_words']) {
    if (!Array.isArray(a[k]) || a[k].length === 0) {
      if (k === 'featured_ord_words' && typeof a[k] === 'string') continue; // literal string allowed
      err(`${k} måste vara en icke-tom array`);
    }
  }
  if (errors.length) return { errors, warnings };

  const questions = a.questions;
  const body = String(a.body);
  const bodyNorm = normalize(body);

  questions.forEach((q, idx) => {
    if (!q.options || typeof q.options !== 'object') err(`fråga ${idx + 1}: saknar options-objekt`);
    else if (!(q.correct in q.options)) err(`fråga ${idx + 1}: 'correct'=${q.correct} finns inte bland options-nycklarna`);
  });
  if (errors.length) return { errors, warnings };

  // -- length-tell: the correct answer must not be the longest option --------
  // The tell AI-written HP questions keep producing.
  questions.forEach((q, idx) => {
    const opts = q.options || {};
    const clen = String(opts[q.correct] || '').trim().length;
    const dlens = Object.keys(opts).filter((k) => k !== q.correct).map((k) => String(opts[k]).trim().length);
    const maxD = dlens.length ? Math.max(...dlens) : 0;
    if (dlens.length && clen > maxD) {
      warn(`fråga ${idx + 1}: rätt svar (${q.correct}) är längst (${clen} tecken mot ${maxD}) — längd-tell; gör minst en distraktor minst lika lång`);
    }
  });

  // -- position-tell within the article -------------------------------------
  // Options are rendered in authored order (the shuffle was removed 2026-07-24
  // because it silently invalidated every explanation naming a letter), so the
  // stored letter IS what the student sees.
  const letters = questions.map((q) => q.correct);
  if (letters.length >= 3) {
    const counts = letters.reduce((m, l) => ((m[l] = (m[l] || 0) + 1), m), {});
    const [top, n] = Object.entries(counts).sort((x, y) => y[1] - x[1])[0];
    if (n === letters.length) err(`alla ${letters.length} rätta svar ligger på ${top}. Alternativen shufflas inte längre — sprid ut de rätta svaren.`);
    else if (n >= letters.length - 1) warn(`${n} av ${letters.length} rätta svar ligger på ${top} — sprid gärna ut dem.`);
  }

  // -- letter references in explanations ------------------------------------
  // "alltså svar D" is wrong the moment anyone reorders options, and it teaches
  // nothing. Uppercase-only on the letter avoids false positives on ordinary
  // Swedish ("svaret där", "rubrik bär") where å/ä/ö reads as a word boundary.
  questions.forEach((q, idx) => {
    const m = String(q.explanation || '').match(/\b(?:[Ss]var(?:et)?|[Aa]lternativ(?:et)?|[Rr]ubrik(?:en)?|[Oo]ption)\s+[A-D]\b/);
    if (m) err(`fråga ${idx + 1}: förklaringen pekar på svaret med bokstav ("${m[0]}"). Beskriv vad som gör svaret rätt i stället.`);
  });

  // -- em-dash --------------------------------------------------------------
  // Non-Negotiable Rule #9. Tankstreck (–) is legitimate Swedish and is NOT
  // checked here; the em-dash (—) is an English mark.
  const emHits = [];
  if (body.includes(EM_DASH)) emHits.push('body');
  questions.forEach((q, idx) => {
    const fields = { stem: q.stem, explanation: q.explanation, ...(q.options || {}) };
    for (const [name, val] of Object.entries(fields)) {
      if (val != null && String(val).includes(EM_DASH)) emHits.push(`fråga ${idx + 1}.${name}`);
    }
  });
  if (emHits.length) err('em-dash (—) i: ' + emHits.join(', ') + '. Ersätt med punkt, komma eller kolon.');

  // -- passage_anchor must actually be in the passage ------------------------
  // New 2026-07-24. The anchor is what the feedback screen quotes back as
  // evidence; an anchor that is not verbatim in the body is a fabricated
  // citation, which is worse than no citation. This is also the exact failure
  // mode we watched HP-appen ship (their citatmarkör has no passage access).
  questions.forEach((q, idx) => {
    const raw = q.passage_anchor;
    if (raw == null || String(raw).trim() === '') {
      warn(`fråga ${idx + 1}: saknar passage_anchor — feedbacken kan inte peka på belägget i texten`);
      return;
    }
    const segments = anchorSegments(raw);
    const totalLen = segments.reduce((n, s) => n + s.length, 0);
    if (totalLen < 15) {
      warn(`fråga ${idx + 1}: passage_anchor är bara ${totalLen} tecken — för kort för att fungera som belägg`);
      return;
    }
    for (const seg of segments) {
      // A fragment this short is a connective, not a citation; skip it rather
      // than fail on punctuation noise around the ellipsis.
      if (seg.length < 12) continue;
      // A quote clipped mid-sentence gets a closing period the body does not
      // have ("…hålla begreppen isär." vs "…hålla begreppen isär snarare än").
      // That is legitimate quoting, so retry without trailing punctuation.
      const clipped = seg.replace(/[.,;:]+$/, '');
      if (!bodyNorm.includes(seg) && !bodyNorm.includes(clipped)) {
        err(`fråga ${idx + 1}: passage_anchor finns inte ordagrant i brödtexten ("${seg.slice(0, 60)}${seg.length > 60 ? '…' : ''}")`);
      }
    }
  });

  // -- distractor_types keys must match the options --------------------------
  // LasFeedback looks the chosen label up in this map. A key that is not an
  // option letter is dead weight; a missing key means a wrong answer gets no
  // explanation of its own wrongness, which is the single thing we do that
  // both competitors do not.
  questions.forEach((q, idx) => {
    const dt = q.distractor_types;
    if (dt == null) { warn(`fråga ${idx + 1}: saknar distractor_types`); return; }
    if (typeof dt !== 'object' || Array.isArray(dt)) { err(`fråga ${idx + 1}: distractor_types måste vara ett objekt`); return; }
    const optKeys = Object.keys(q.options || {});
    const wrong = optKeys.filter((k) => k !== q.correct);
    const stray = Object.keys(dt).filter((k) => !optKeys.includes(k));
    if (stray.length) err(`fråga ${idx + 1}: distractor_types har nycklar som inte är svarsalternativ: ${stray.join(', ')}`);
    if (dt[q.correct] !== undefined) warn(`fråga ${idx + 1}: distractor_types innehåller det rätta svaret (${q.correct})`);
    const absent = wrong.filter((k) => dt[k] === undefined || String(dt[k]).trim() === '');
    if (absent.length) warn(`fråga ${idx + 1}: distraktor ${absent.join(', ')} saknar förklaring — den som svarar fel där får ingen feedback`);
  });

  // -- vocab_highlights ------------------------------------------------------
  // Two seed-mapping bugs have shipped silently (featured_ord_words 2026-06-16,
  // definition_sv 2026-07-24). Both would have been caught here.
  (Array.isArray(a.vocab_highlights) ? a.vocab_highlights : []).forEach((vh, idx) => {
    const label = `vocab_highlight ${idx + 1}`;
    if (!vh || typeof vh !== 'object') { err(`${label}: måste vara ett objekt`); return; }
    if (!vh.word || String(vh.word).trim() === '') { err(`${label}: saknar word`); return; }
    if (vh.definition_sv !== undefined && vh.definition === undefined) {
      err(`${label} ("${vh.word}"): använder nyckeln definition_sv. Rätt nyckel är definition — definition_sv gjorde ~110 definitioner osynliga i produktion.`);
      return;
    }
    if (vh.definition === undefined || String(vh.definition).trim() === '') {
      err(`${label} ("${vh.word}"): saknar definition`);
      return;
    }
    // The seed resolves start/end indices by finding the word in the body; a
    // word that is not there gets index -1 and the tooltip silently dies.
    // This mirrors seed.ts findWordInText() EXACTLY (plain case-insensitive
    // indexOf, then a retry with trailing punctuation stripped) so the guard
    // predicts precisely what the seed will do. A looser or stricter matcher
    // here would either miss dead tooltips or invent failures that never happen.
    const w = String(vh.word).trim();
    const lowerBody = body.toLowerCase();
    const lower = w.toLowerCase();
    const found = lowerBody.includes(lower)
      || lowerBody.includes(lower.replace(/[.,;:!?]$/, '').trim());
    if (!found) {
      err(`${label}: ordet "${w}" finns inte i brödtexten — seed sätter index -1 och tooltipen blir tom`);
    }
  });

  // -- length bands ----------------------------------------------------------
  const wordCount = a.word_count != null ? Number(a.word_count) : countWords(body);
  const counted = countWords(body);
  if (a.word_count != null && Math.abs(counted - Number(a.word_count)) > 15) {
    warn(`word_count säger ${a.word_count} men brödtexten är ${counted} ord`);
  }
  if (a.unit_position === 'kort' && (wordCount < KORT_MIN || wordCount > KORT_MAX)) {
    warn(`kort-text på ${wordCount} ord (förväntat ${KORT_MIN}–${KORT_MAX})`);
  }
  if (a.unit_position === 'lång') {
    if (wordCount < LANG_MIN) warn(`lång-text på ${wordCount} ord (förväntat ≥${LANG_MIN}, HP-median ~1100)`);
    else if (wordCount > LANG_MAX) warn(`lång-text på ${wordCount} ord (över HP:s spann, tak ${LANG_MAX})`);
  }

  const questionCount = a.question_count != null ? Number(a.question_count) : questions.length;
  if (questionCount !== questions.length) warn(`question_count säger ${questionCount} men det finns ${questions.length} frågor`);
  const expectedQ = a.unit_position === 'kort' ? 2 : a.unit_position === 'lång' ? 4 : null;
  if (expectedQ && questions.length !== expectedQ) warn(`unit_position=${a.unit_position} förväntar ${expectedQ} frågor, men fick ${questions.length}`);

  // -- featured ORD words ----------------------------------------------------
  const feats = featuredWords(a.featured_ord_words);
  if (ctx.existing) {
    const byWord = new Map();
    for (const e of ctx.existing) {
      if (ctx.selfId != null && String(e.data.id) === String(ctx.selfId)) continue;
      for (const w of featuredWords(e.data.featured_ord_words)) {
        const key = w.toLowerCase();
        if (!byWord.has(key)) byWord.set(key, new Set());
        byWord.get(key).add(e.data.id);
      }
    }
    for (const w of feats) {
      const hits = byWord.get(w.toLowerCase());
      if (hits && hits.size) warn(`ordet "${w}" är redan featured i id ${[...hits].join(', ')}`);
    }
  }
  if (ctx.ordIndex) {
    for (const w of feats) {
      const pe = ctx.ordIndex.get(w.toLowerCase());
      if (pe === undefined) warn(`featured-ordet "${w}" finns inte i ord-database.csv`);
      else if (pe !== 'curated') warn(`featured-ordet "${w}" är past-HP (past_exams=${pe}) — tränas inte i daglig ORD, ger död ORD→LÄS-förstärkning`);
    }
  }

  return { errors, warnings };
}

// ---- corpus-wide checks ----------------------------------------------------

/**
 * Checks that only make sense across the whole bank. These matter more as the
 * corpus grows: a per-article answer spread can look fine while the corpus as a
 * whole leans on one letter, and the session builder starves whichever format
 * pool runs dry first.
 *
 * @param {Array<{file: string, data: object}>} articles
 */
function checkCorpus(articles) {
  const errors = [];
  const warnings = [];
  const notes = [];

  if (articles.length === 0) return { errors, warnings, notes };

  // -- answer-letter distribution across every question ----------------------
  const counts = {};
  let total = 0;
  for (const { data } of articles) {
    for (const q of data.questions || []) {
      if (!q || !q.correct) continue;
      counts[q.correct] = (counts[q.correct] || 0) + 1;
      total++;
    }
  }
  const spread = Object.entries(counts).sort();
  notes.push('svarsfördelning: ' + spread.map(([l, n]) => `${l} ${n} (${Math.round((n / total) * 100)}%)`).join(', '));
  // Real HP spreads the answer letter close to evenly (ANALYS_INDEX: 17.6% to
  // 22.4% across A–E for ORD; with four LÄS options, even is 25%). Anything
  // outside roughly 18–32% is a pattern a student can learn to exploit, which
  // means our items would be measuring the wrong thing.
  if (total >= 40) {
    const under = [];
    for (const [letter, n] of spread) {
      const pct = (n / total) * 100;
      if (pct > 32) warnings.push(`${Math.round(pct)}% av alla rätta svar ligger på ${letter} (${n}/${total}) — snedfördelat, gissningsbart över tid`);
      if (pct < 18) {
        warnings.push(`bara ${Math.round(pct)}% av de rätta svaren ligger på ${letter} (${n}/${total}) — snedfördelat`);
        under.push(letter);
      }
    }
    // Actionable, so the next batch corrects the imbalance instead of repeating it.
    if (under.length) notes.push(`nästa batch: lägg fler rätta svar på ${under.join(' och ')}`);
  }

  // -- format pool balance ---------------------------------------------------
  // The session builder picks the FORMAT first, weighted by how many unseen
  // articles each pool holds, then the best article in that pool. If one pool
  // is thin the student stops practising that format entirely.
  const kort = articles.filter((a) => a.data.unit_position === 'kort').length;
  const lang = articles.filter((a) => a.data.unit_position === 'lång').length;
  notes.push(`format: ${kort} kort, ${lang} lång`);
  if (kort > 0 && lang > 0) {
    const ratio = Math.max(kort, lang) / Math.min(kort, lang);
    if (ratio > 3) warnings.push(`formatobalans ${kort} kort mot ${lang} lång — den mindre poolen tar slut först och det formatet försvinner ur sessionerna`);
  } else if (articles.length >= 6) {
    warnings.push(`bara ett format i banken (${kort} kort, ${lang} lång)`);
  }

  // -- duplicate ids and titles ---------------------------------------------
  const seenId = new Map();
  const seenTitle = new Map();
  for (const { file, data } of articles) {
    const id = String(data.id);
    if (seenId.has(id)) errors.push(`id ${id} används av både ${seenId.get(id)} och ${file}`);
    else seenId.set(id, file);
    const t = String(data.title || '').trim().toLowerCase();
    if (t && seenTitle.has(t)) errors.push(`titeln "${data.title}" finns i både ${seenTitle.get(t)} och ${file} (seed matchar på titel och skriver över)`);
    else if (t) seenTitle.set(t, file);
  }

  // -- domain / genre concentration -----------------------------------------
  const domains = {};
  for (const { data } of articles) domains[data.domain] = (domains[data.domain] || 0) + 1;
  const domTop = Object.entries(domains).sort((a, b) => b[1] - a[1])[0];
  notes.push('domäner: ' + Object.entries(domains).sort((a, b) => b[1] - a[1]).map(([d, n]) => `${d} ${n}`).join(', '));
  if (articles.length >= 10 && domTop && domTop[1] / articles.length > 0.4) {
    warnings.push(`${Math.round((domTop[1] / articles.length) * 100)}% av artiklarna ligger i domänen "${domTop[0]}" — HP blandar bredare`);
  }

  // -- featured-word reuse across the corpus --------------------------------
  const featCount = new Map();
  for (const { data } of articles) {
    for (const w of featuredWords(data.featured_ord_words)) {
      const k = w.toLowerCase();
      featCount.set(k, (featCount.get(k) || 0) + 1);
    }
  }
  const overused = [...featCount.entries()].filter(([, n]) => n >= 3);
  if (overused.length) {
    warnings.push(`ord featured i 3+ artiklar: ${overused.map(([w, n]) => `${w} (${n})`).join(', ')}`);
  }

  return { errors, warnings, notes };
}

module.exports = {
  checkArticle,
  checkCorpus,
  countWords,
  featuredWords,
  parseCSV,
  loadOrdIndex,
  LANG_MIN,
  LANG_MAX,
  KORT_MIN,
  KORT_MAX,
};
