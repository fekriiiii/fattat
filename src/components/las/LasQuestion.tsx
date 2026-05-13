'use client'

import { cn } from '@/lib/utils/cn'
import type { LasQuestion as LasQuestionType } from '@/types/database'

export type LasOption = { label: string; text: string; isCorrect: boolean }

interface Props {
  question: LasQuestionType
  options: LasOption[]
  questionNumber: number
  totalQuestions: number
  selectedLabel: string | null
  onSelect: (label: string, isCorrect: boolean) => void
}

const TYPE_LABELS: Record<LasQuestionType['type'], string> = {
  huvudtanke: 'Huvudtanke',
  detalj_fakta: 'Detalj',
  detalj_kausal: 'Detalj',
  syfte_funktion: 'Syfte',
  slutledning: 'Slutledning',
  jämförande: 'Jämförande',
  ståndpunkt: 'Ståndpunkt',
}

export function LasQuestion({
  question,
  options,
  questionNumber,
  totalQuestions,
  selectedLabel,
  onSelect,
}: Props) {
  return (
    <div className="flex flex-col gap-5 px-5 py-6">
      <div>
        <div className="flex items-center justify-between mb-3.5">
          <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-dark/30">
            Fråga {questionNumber} / {totalQuestions}
          </span>
          <span className="text-[11px] bg-dark/[0.04] text-dark/40 px-2.5 py-1 rounded-full font-medium">
            {TYPE_LABELS[question.type]}
          </span>
        </div>
        <p className="text-[16px] font-semibold text-dark leading-[1.45]">{question.stem}</p>
      </div>

      <div className="flex flex-col gap-2">
        {options.map((opt) => (
          <button
            key={opt.label}
            onClick={() => !selectedLabel && onSelect(opt.label, opt.isCorrect)}
            disabled={!!selectedLabel}
            className={cn(
              'w-full text-left px-[18px] py-4 rounded-btn transition-all duration-150 font-medium flex items-start gap-2.5',
              !selectedLabel && 'bg-white shadow-card hover:shadow-card-hover active:scale-[0.99] cursor-pointer text-dark',
              selectedLabel === opt.label && 'bg-primary text-cream shadow-sm cursor-default scale-[1.01]',
              selectedLabel && selectedLabel !== opt.label && 'bg-white/50 text-dark/20 shadow-none cursor-default'
            )}
          >
            <span className={cn(
              'text-[11px] font-bold pt-0.5 shrink-0',
              selectedLabel === opt.label ? 'text-cream/50' : 'text-dark/30'
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
