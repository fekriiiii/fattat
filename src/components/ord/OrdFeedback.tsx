'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils/cn'
import { Button } from '@/components/ui/Button'
import { MorphemeHints } from './MorphemeBreakdown'
import type { Word } from '@/types/database'
import type { OrdOption } from './OrdQuestion'

interface Props {
  word: Word
  options: OrdOption[]
  chosenLabel: string
  isCorrect: boolean
  onNext: () => void
  // Forced absorption window before Next activates. Defaults to 4500ms for
  // learning contexts (daily session, diagnostic, onboarding). Set to 0 for
  // övningsprov where the feedback is simulating exam-mode review and the
  // extra friction would distort pacing.
  delayMs?: number
}

const DEFAULT_READ_DELAY_MS = 4500

export function OrdFeedback({ word, options, chosenLabel, isCorrect, onNext, delayMs = DEFAULT_READ_DELAY_MS }: Props) {
  const correctOption = options.find((o) => o.isCorrect)
  const correctLabel = correctOption?.label ?? ''
  const [progress, setProgress] = useState(delayMs > 0 ? 0 : 1)
  const canAdvance = progress >= 1

  // Forced read window. Multiple choice makes it trivial to tap past the
  // definition and example without reading either, which turns a lucky guess
  // into no learning at all. This pause is the only thing standing between the
  // two. (It originally also protected the typed-answer format from words that
  // had graduated on luck; typing is gone since 2026-07-24, the reason isn't.)
  useEffect(() => {
    if (delayMs <= 0) { setProgress(1); return }
    const start = Date.now()
    let raf = 0
    function tick() {
      const elapsed = Date.now() - start
      const p = Math.min(elapsed / delayMs, 1)
      setProgress(p)
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [delayMs])

  return (
    <div className="flex flex-col gap-5 px-5 pt-8 pb-6">
      {/* Word + result */}
      <div className="text-center">
        <h2 className="text-[40px] font-bold text-dark tracking-tight leading-none mb-3">
          {word.word}
        </h2>
        <span className={cn(
          'inline-block text-[11px] font-bold uppercase tracking-[0.08em] px-[14px] py-1.5 rounded-full ring-1 ring-inset motion-safe:animate-pop-in',
          isCorrect ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/15' : 'bg-rose-50 text-rose-600 ring-rose-600/15'
        )}>
          {isCorrect ? `Rätt: ${correctOption?.text}` : `Rätt svar: ${word.correct_synonym}`}
        </span>
        {!isCorrect && (
          <p className="text-[13px] text-dark/60 mt-2">
            Du svarade: <em>{options.find(o => o.label === chosenLabel)?.text}</em>
          </p>
        )}
      </div>

      {/* Definition card */}
      <div className="bg-white rounded-card shadow-card border border-dark/[0.05] px-5 py-5 relative overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary-400 to-primary" />
        <p className="text-[15px] text-dark leading-[1.65]">{word.definition_sv}</p>
        {word.example_sentence && (
          <div className="border-t border-dark/[0.06] mt-3.5 pt-3.5">
            <p className="text-[13px] text-dark/65 italic leading-relaxed">
              &ldquo;{word.example_sentence}&rdquo;
            </p>
          </div>
        )}
      </div>

      {/* Options — minimal color-coding */}
      <div className="flex flex-col gap-1.5">
        {options.map((opt) => {
          const isRight = opt.label === correctLabel
          const isWrong = opt.label === chosenLabel && !isCorrect
          return (
            <div
              key={opt.label}
              className={cn(
                'px-4 py-3 rounded-[12px] text-[13px] font-medium flex items-start gap-2',
                isRight && 'bg-emerald-50 text-emerald-800',
                isWrong && 'bg-rose-50 text-rose-700',
                !isRight && !isWrong && 'text-dark/20'
              )}
            >
              <span className={cn(
                'text-[10px] font-bold pt-0.5 shrink-0',
                isRight ? 'text-emerald-500' : isWrong ? 'text-rose-400' : 'text-dark/20'
              )}>
                {opt.label}
              </span>
              <span className="leading-snug">{opt.text}</span>
            </div>
          )
        })}
      </div>

      {/* Byggstenar — decode the word and options by their parts. On a correct
          answer keep it snappy (headword + correct synonym); on a wrong answer
          decode every option, since not knowing what the alternatives mean is
          the real bottleneck. Renders nothing when nothing is decodable. */}
      <MorphemeHints
        words={isCorrect
          ? [word.word, word.correct_synonym]
          : [word.word, ...options.map((o) => o.text)]}
      />

      <div className="relative">
        <Button fullWidth size="lg" onClick={onNext} disabled={!canAdvance}>
          {canAdvance ? 'Nästa' : 'Läs definitionen…'}
        </Button>
        {!canAdvance && (
          <div
            className="absolute -bottom-2 left-0 h-[3px] bg-gradient-to-r from-primary/40 to-primary rounded-full pointer-events-none"
            style={{ width: `${progress * 100}%` }}
          />
        )}
      </div>
    </div>
  )
}
