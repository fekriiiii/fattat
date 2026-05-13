'use client'

import { cn } from '@/lib/utils/cn'
import { Button } from '@/components/ui/Button'
import type { LasQuestion } from '@/types/database'
import type { LasOption } from './LasQuestion'

interface Props {
  question: LasQuestion
  options: LasOption[]
  chosenLabel: string
  isCorrect: boolean
  isLastQuestion: boolean
  onNext: () => void
  onReadAgain: () => void
}

const TYPE_LABELS: Record<string, string> = {
  huvudtanke: 'Huvudtanke',
  detalj: 'Detalj',
  syfte: 'Syfte',
  slutledning: 'Slutledning',
  jämförande: 'Jämförande',
  ståndpunkt: 'Ståndpunkt',
}

export function LasFeedback({ question, options, chosenLabel, isCorrect, isLastQuestion, onNext, onReadAgain }: Props) {
  const correctLabel = options.find((o) => o.isCorrect)?.label ?? ''

  return (
    <div className="flex flex-col gap-4 px-5 py-6">
      {/* Result indicator */}
      <div className="flex items-center justify-between">
        <span className={cn(
          'text-[11px] font-bold uppercase tracking-[0.08em] px-[14px] py-1.5 rounded-full',
          isCorrect ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
        )}>
          {isCorrect ? 'Rätt' : `Rätt svar: ${correctLabel}`}
        </span>
        {question.type && (
          <span className="text-[11px] text-dark/60 font-medium">{TYPE_LABELS[question.type]}</span>
        )}
      </div>

      {/* Explanation card */}
      {question.explanation && (
        <div className="bg-white rounded-card shadow-card px-5 py-5">
          <p className="text-[14px] text-dark leading-[1.65]">{question.explanation}</p>
          {question.passage_anchor && (
            <div className="border-t border-dark/[0.06] mt-3.5 pt-3.5">
              <p className="text-[13px] text-dark/65 italic leading-relaxed">
                &ldquo;{question.passage_anchor}&rdquo;
              </p>
            </div>
          )}
        </div>
      )}

      {/* Options — minimal color-coding */}
      <div className="flex flex-col gap-1.5">
        {options.map((opt) => {
          const isRight = opt.label === correctLabel
          const isWrong = opt.label === chosenLabel && !isCorrect
          return (
            <div
              key={opt.label}
              className={cn(
                'px-4 py-3 rounded-[12px] text-[13px] font-medium flex items-start gap-2 leading-snug',
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
              <span>{opt.text}</span>
            </div>
          )
        })}
      </div>

      <Button fullWidth size="lg" onClick={onNext}>
        {isLastQuestion ? 'Fortsätt' : 'Nästa fråga'}
      </Button>

      <button
        onClick={onReadAgain}
        className="flex items-center justify-center gap-1.5 text-[13px] text-dark/55 hover:text-dark/75 transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/>
          <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/>
        </svg>
        Läs om artikeln
      </button>
    </div>
  )
}
