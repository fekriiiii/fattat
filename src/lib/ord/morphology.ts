// ─── ORD morphology decoder ──────────────────────────────────────────────────
//
// Turns a Swedish word into a "byggstenar" breakdown the student can use to
// attack a word they've never studied — the transferable skill behind the
// övningsprov "du möter alltid okända ord" promise. Used in the ORD feedback
// card (post-answer only — never during the question; that would be a hint,
// Non-Negotiable Rule #2).
//
// Design rule: CONSERVATIVE. Return a breakdown only when confident; return
// null otherwise. A wrong split on an opaque word erodes trust faster than
// silence (see analysis/ORD_morfologi.md). Precision over recall.
//
// v1 covered the meaning-bearing suffixes only (-lös/-full/-bar/-fri/-aktig/
// -värd) — the highest-confidence, lowest-false-positive pattern, and the
// single most common decodable shape in the answer-option vocabulary.
//
// v2 adds the negating/privative prefixes (o-, miss-, van-). These are the
// highest-value decode in the corpus because they FLIP a base the student may
// already know, but they were also the riskiest: of the 183 corpus strings
// starting with "o", only about half are the prefix, and the rest are opaque
// words that merely begin with that letter (observera, ornament, område). A
// missed negation inverts the meaning, which is why v1 refused to touch any
// leading-o word at all.
//
// The separation is data, not guesswork: strip the prefix and ask SALDO
// (Språkbanken's morphological lexicon) whether the remainder is a real Swedish
// word of a compatible part of speech. That resolution happens at build time in
// scripts/build-morph-prefixes.mjs and lands in prefix-lexicon.ts, so nothing
// here does I/O. Structurally-valid-but-wrong splits (oförskämd is from *skam*,
// not from *förskämd*) are hand-rejected in that script, with reasons.
//
// Compound-splitting and a curated cognate table are staged next, on these
// same rails.

import { PREFIX_LEXICON } from './prefix-lexicon'

export interface MorphemePart {
  /** The surface text of this morpheme, e.g. "grund" or "lös". */
  text: string
  /** For an affix: its plain-language meaning, e.g. "utan". Bases have none. */
  gloss?: string
}

export type DecodeKind = 'suffix' | 'prefix'

export interface Decomposition {
  /** The original word, unchanged. */
  word: string
  /** Morphemes in surface order, e.g. [{text:'grund'}, {text:'lös', gloss:'utan'}]. */
  parts: MorphemePart[]
  /** A clean rephrasing where one reads well, e.g. "utan grund". Optional. */
  paraphrase?: string
  kind: DecodeKind
}

interface SuffixRule {
  suffix: string
  /** Plain-language meaning of the suffix, shown to the student. */
  gloss: string
  /** Builds a natural-Swedish paraphrase from the base, when one reads cleanly. */
  paraphrase?: (base: string) => string
}

// Ordered longest-first so e.g. "-aktig" is tried before any shorter ending.
const SUFFIX_RULES: SuffixRule[] = [
  { suffix: 'aktig', gloss: 'som liknar', paraphrase: (b) => `som liknar ${b}` },
  { suffix: 'värd', gloss: 'värd att' },
  { suffix: 'värt', gloss: 'värd att' },   // neuter form, e.g. klandervärt
  { suffix: 'full', gloss: 'full av', paraphrase: (b) => `full av ${b}` },
  { suffix: 'lös', gloss: 'utan', paraphrase: (b) => `utan ${b}` },
  { suffix: 'bar', gloss: 'går att' },
  { suffix: 'fri', gloss: 'utan', paraphrase: (b) => `fri från ${b}` },
]
// Deliberately NOT in v1: -sam. Its meaning is too varied for one honest gloss
// (hjälpsam ≈ "tending to", långsam ≈ "-ly", smittsam ≈ "-ous"); a wrong-feeling
// gloss on ~20 words costs more trust than dropping it. Revisit with smarter
// (possibly per-word) glossing.

// Words that LOOK suffixed but aren't — the ending is part of a single opaque
// root, or an unhandled prefix would invert the meaning. Each would otherwise
// produce an embarrassingly wrong split.
const FALSE_POSITIVES = new Set<string>([
  'underbar',   // = wonderful, not under+bar(able)
  'uppenbar',   // = obvious, not uppen+bar
  'barbar',     // = barbarian, not bar+bar
  'överfull',   // över- is a prefix → "full av över" is nonsense
  'varaktig',   // = durable; "var" is not a clean base
])

const MIN_BASE_LEN = 3

/**
 * Decode a single Swedish word into its building blocks, or return null when
 * the word is opaque / not confidently decodable. Phrases (anything with a
 * space) are skipped in v1 — they decode from context, not parts.
 */
export function decodeWord(raw: string): Decomposition | null {
  if (!raw) return null
  const word = raw.trim()
  if (!word || word.includes(' ') || word.includes('-')) return null

  const lower = word.toLowerCase()
  if (FALSE_POSITIVES.has(lower)) return null

  // Prefixes are tried first. A negating o- left unhandled would invert the
  // meaning a suffix implies (oanvändbar is not "går att använda"), so a word
  // that is in the prefix lexicon must never fall through to the suffix rules.
  const prefixed = decodePrefix(word, lower)
  if (prefixed) return prefixed

  // Any other leading-o word stays undecoded. Absence from the lexicon means
  // the build-time check could not confirm a real base, so we cannot tell a
  // negation from an opaque word (ornament, observera) and stay silent.
  if (lower.startsWith('o')) return null

  const suffixed = decodeSuffix(word)
  return suffixed ? { word, ...suffixed, kind: 'suffix' } : null
}

/** Prefix decode, backed by the build-time verified lexicon. When the base is
 *  itself suffix-decodable the two layers chain, so oanvändbar renders as
 *  o + använd + bar. */
function decodePrefix(word: string, lower: string): Decomposition | null {
  const entry = PREFIX_LEXICON[lower]
  if (!entry) return null

  const base = word.slice(entry.prefix.length)
  const inner = decodeSuffix(base)
  const parts: MorphemePart[] = [
    { text: word.slice(0, entry.prefix.length), gloss: entry.gloss },
    ...(inner ? inner.parts : [{ text: base }]),
  ]

  // "inte X" only reads as Swedish when X is an adjective. On a noun it breaks
  // ("inte hälsa"), and on a chained decode it competes with the suffix gloss,
  // so both fall back to the split, which teaches the same thing.
  const paraphrase =
    entry.prefix === 'o' && entry.basePos === 'av' && !inner
      ? `inte ${base.toLowerCase()}`
      : undefined

  return { word, parts, paraphrase, kind: 'prefix' }
}

/** Suffix decode. Returns the parts and paraphrase only, so the prefix layer
 *  can reuse it on a stripped base. */
function decodeSuffix(word: string): Pick<Decomposition, 'parts' | 'paraphrase'> | null {
  const lower = word.toLowerCase()

  for (const rule of SUFFIX_RULES) {
    if (!lower.endsWith(rule.suffix)) continue
    const baseLen = word.length - rule.suffix.length
    if (baseLen < MIN_BASE_LEN) continue

    const base = word.slice(0, baseLen)
    const suffix = word.slice(baseLen)
    // Only paraphrase from an unambiguous base. A trailing -s may be a linking
    // morpheme (anspråk·s·lös) or part of the stem (gräns); a trailing -o is a
    // linking vowel (känslo from känsla). Synthesising a base in those cases
    // either reads stilted or corrupts a real word — so we skip the paraphrase
    // and let the split + gloss carry it.
    const ambiguousBase = /[so]$/i.test(base)
    return {
      parts: [{ text: base }, { text: suffix, gloss: rule.gloss }],
      paraphrase: ambiguousBase ? undefined : rule.paraphrase?.(base.toLowerCase()),
    }
  }

  return null
}
