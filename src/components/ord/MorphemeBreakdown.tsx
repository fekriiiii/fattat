'use client'

import { decodeWord } from '@/lib/ord/morphology'
import { cn } from '@/lib/utils/cn'

/**
 * One inline "byggstenar" line for a single word, or null when the word isn't
 * confidently decodable. Renders the word with its meaning-bearing ending
 * highlighted, then a plain-language meaning. Post-answer use only — showing
 * this during a question would be a hint (Non-Negotiable Rule #2).
 */
export function MorphemeBreakdown({ word, className }: { word: string; className?: string }) {
  const d = decodeWord(word)
  if (!d) return null

  const affix = d.parts.find((p) => p.gloss)

  return (
    <span className={cn('inline-flex flex-wrap items-baseline gap-x-1.5 text-[11px] leading-tight', className)}>
      <span className="font-medium text-dark/55">
        {d.parts.map((p, i) => (
          <span key={i} className={p.gloss ? 'text-primary font-semibold' : undefined}>
            {p.text}
          </span>
        ))}
      </span>
      <span className="text-dark/25" aria-hidden>→</span>
      <span className="italic text-dark/55">
        {d.paraphrase ?? <>‑{affix?.text} = {affix?.gloss}</>}
      </span>
    </span>
  )
}

/**
 * "Byggstenar" block for the definition-card area: shows a breakdown for each
 * decodable word in `words` (deduped), or renders nothing if none decode.
 */
export function MorphemeHints({ words, className }: { words: string[]; className?: string }) {
  const decodable = [...new Set(words.map((w) => w?.trim()).filter(Boolean))].filter((w) => decodeWord(w))
  if (decodable.length === 0) return null

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-primary/55">Byggstenar</p>
      {decodable.map((w) => (
        <MorphemeBreakdown key={w} word={w} />
      ))}
    </div>
  )
}
