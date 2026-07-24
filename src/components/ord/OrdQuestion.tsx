'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils/cn'
import type { Word } from '@/types/database'

export type OrdOption = { label: string; text: string; isCorrect: boolean }

interface Props {
  word: Word
  options: OrdOption[]
  selectedLabel: string | null
  onSelect: (label: string, isCorrect: boolean) => void
  // Recall pause: hold the options back this many ms so the word has to be
  // retrieved from memory before it can be recognised among the alternatives.
  // Replaces the typed-synonym format (removed 2026-07-24): HP only ever asks
  // for recognition, and typing produced false negatives whenever a correct
  // answer was missing from accepted_synonyms — which corrupted FSRS.
  // 0 disables the pause, which is what new words get: pausing on a word the
  // student cannot possibly know yet teaches nothing and only costs time.
  revealDelayMs?: number
  // Fired the instant the options become visible. The response timer must start
  // HERE, not at mount — counting the pause as thinking time would push every
  // paused word toward a Hard rating and recreate the exact FSRS "Hard misuse"
  // bug the typing-latency fix closed in June.
  onReveal?: () => void
}

export function OrdQuestion({ word, options, selectedLabel, onSelect, revealDelayMs = 0, onReveal }: Props) {
  const [progress, setProgress] = useState(revealDelayMs > 0 ? 0 : 1)
  const revealed = progress >= 1

  // Kept in a ref so a new inline callback from the parent can't restart the
  // countdown mid-pause.
  const onRevealRef = useRef(onReveal)
  useEffect(() => { onRevealRef.current = onReveal })

  useEffect(() => {
    if (revealDelayMs <= 0) {
      setProgress(1)
      onRevealRef.current?.()
      return
    }
    setProgress(0)
    const start = Date.now()
    let raf = 0
    function tick() {
      const p = Math.min((Date.now() - start) / revealDelayMs, 1)
      setProgress(p)
      if (p < 1) raf = requestAnimationFrame(tick)
      else onRevealRef.current?.()
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [word.id, revealDelayMs])

  return (
    <div className="flex flex-col gap-10 px-6 pt-10 pb-6">
      {/* Word display */}
      <div className="text-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary/60 mb-3">
          Välj rätt synonym
        </p>
        <h2 className="text-[44px] font-bold text-dark tracking-tight leading-[1.1]">
          {word.word}
        </h2>
        <div className="w-10 h-1 rounded-full bg-gold/60 mx-auto mt-4" />
      </div>

      {/* Recall pause. Deliberately shows no part of the answer — this is not a
          hint (Rule #2), it is dead air that forces a retrieval attempt. */}
      {!revealed && (
        <div className="flex flex-col items-center gap-3.5 py-8" aria-live="polite">
          <p className="text-[13px] text-dark/55">Tänk på svaret först</p>
          <div className="w-28 h-1.5 bg-dark/[0.06] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary-600 to-primary rounded-full"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Options */}
      <div className={cn('flex flex-col gap-2.5', !revealed && 'hidden', 'motion-safe:animate-fade-up')}>
        {options.map((opt) => (
          <button
            key={opt.label}
            onClick={() => !selectedLabel && onSelect(opt.label, opt.isCorrect)}
            disabled={!!selectedLabel}
            className={cn(
              'w-full text-left px-4 py-4 rounded-btn transition-all duration-200 font-medium flex items-center gap-3',
              !selectedLabel && 'bg-white shadow-card border border-dark/[0.05] hover:shadow-card-hover hover:border-primary/20 active:scale-[0.98] cursor-pointer text-dark',
              selectedLabel === opt.label && 'bg-gradient-to-b from-[#11857C] to-primary text-cream shadow-btn border border-transparent cursor-default scale-[1.01]',
              selectedLabel && selectedLabel !== opt.label && 'bg-white/40 text-dark/20 border border-transparent shadow-none cursor-default'
            )}
          >
            <span className={cn(
              'w-6 h-6 rounded-full text-[11px] font-bold flex items-center justify-center shrink-0 transition-colors duration-200',
              selectedLabel === opt.label
                ? 'bg-cream/20 text-cream'
                : selectedLabel
                  ? 'bg-dark/[0.04] text-dark/20'
                  : 'bg-dark/[0.05] text-dark/40'
            )}>
              {opt.label}
            </span>
            <span className="text-sm leading-snug">{opt.text}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
