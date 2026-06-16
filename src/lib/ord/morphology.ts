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
// v1 covers the meaning-bearing suffixes only (-lös/-full/-bar/-fri/-aktig/
// -sam/-värd) — the highest-confidence, lowest-false-positive pattern, and the
// single most common decodable shape in the answer-option vocabulary. Prefixes
// (negation o-), compound-splitting, and a curated cognate table are staged
// next, on these same rails.

export interface MorphemePart {
  /** The surface text of this morpheme, e.g. "grund" or "lös". */
  text: string
  /** For an affix: its plain-language meaning, e.g. "utan". Bases have none. */
  gloss?: string
}

export type DecodeKind = 'suffix'

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

  // v1 does not handle prefixes. A negating o- (oanvändbar, ohållbar) left
  // unhandled would invert the meaning the suffix implies — worse than silence.
  // Defer every leading-o word to the (future) prefix layer.
  if (lower.startsWith('o')) return null

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
      word,
      parts: [{ text: base }, { text: suffix, gloss: rule.gloss }],
      paraphrase: ambiguousBase ? undefined : rule.paraphrase?.(base.toLowerCase()),
      kind: 'suffix',
    }
  }

  return null
}
