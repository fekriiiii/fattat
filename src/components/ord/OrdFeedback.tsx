'use client'

import { cn } from '@/lib/utils/cn'
import { Button } from '@/components/ui/Button'
import type { Word } from '@/types/database'
import type { OrdOption } from './OrdQuestion'

interface Props {
  word: Word
  options: OrdOption[]
  chosenLabel: string
  isCorrect: boolean
  onNext: () => void
}

export function OrdFeedback({ word, options, chosenLabel, isCorrect, onNext }: Props) {
  const correctOption = options.find((o) => o.isCorrect)
  const correctLabel = correctOption?.label ?? ''

  return (
    <div className="flex flex-col gap-5 px-5 pt-8 pb-6">
      {/* Word + result */}
      <div className="text-center">
        <h2 className="text-[40px] font-bold text-dark tracking-tight leading-none mb-3">
          {word.word}
        </h2>
        <span className={cn(
          'inline-block text-[11px] font-bold uppercase tracking-[0.08em] px-[14px] py-1.5 rounded-full',
          isCorrect ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
        )}>
          {isCorrect ? `Rätt — ${correctOption?.text}` : `Rätt svar: ${word.correct_synonym}`}
        </span>
        {!isCorrect && (
          <p className="text-[13px] text-dark/60 mt-2">
            Du svarade: <em>{options.find(o => o.label === chosenLabel)?.text}</em>
          </p>
        )}
      </div>

      {/* Definition card */}
      <div className="bg-white rounded-card shadow-card px-5 py-5">
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

      <Button fullWidth size="lg" onClick={onNext}>Nästa</Button>
    </div>
  )
}
