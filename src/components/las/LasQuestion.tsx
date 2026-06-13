'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils/cn'
import type { LasQuestion as LasQuestionType } from '@/types/database'
import type { AnswerConfidence } from '@/types/session'

export type LasOption = { label: string; text: string; isCorrect: boolean }

interface Props {
  question: LasQuestionType
  options: LasOption[]
  questionNumber: number
  totalQuestions: number
  selectedLabel: string | null
  onSelect: (label: string, isCorrect: boolean, confidence?: AnswerConfidence) => void
  // Optional two-step flow: after picking an option, ask for a one-tap
  // confidence judgment before submitting (metacomprehension calibration).
  // Currently enabled NOWHERE — founder decision 2026-06-10: the extra tap
  // hurts UX more than the calibration data helps ("I might not know how
  // confident I was"). Kept behind this prop for a possible future experiment
  // (e.g. sampling a few questions per week instead of every question).
  askConfidence?: boolean
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

const CONFIDENCE_OPTIONS: { value: AnswerConfidence; label: string }[] = [
  { value: 'sure', label: 'Säker' },
  { value: 'unsure', label: 'Osäker' },
  { value: 'guess', label: 'Jag gissade' },
]

export function LasQuestion({
  question,
  options,
  questionNumber,
  totalQuestions,
  selectedLabel,
  onSelect,
  askConfidence = false,
}: Props) {
  // Pending pick while waiting for the confidence tap. The user can still
  // switch option until confidence is chosen — mirrors real exam deliberation.
  const [pending, setPending] = useState<LasOption | null>(null)

  // New question → clear the pending pick.
  useEffect(() => {
    setPending(null)
  }, [question])

  const locked = !!selectedLabel
  const highlightLabel = selectedLabel ?? pending?.label ?? null

  function handleOptionTap(opt: LasOption) {
    if (locked) return
    if (!askConfidence) {
      onSelect(opt.label, opt.isCorrect)
      return
    }
    setPending(opt)
  }

  return (
    <div className="flex flex-col gap-5 px-5 py-6">
      <div>
        <div className="flex items-center justify-between mb-3.5">
          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary/60">
            Fråga {questionNumber} / {totalQuestions}
          </span>
          <span className="text-[11px] bg-dark/[0.04] ring-1 ring-inset ring-dark/[0.06] text-dark/45 px-2.5 py-1 rounded-full font-bold">
            {TYPE_LABELS[question.type]}
          </span>
        </div>
        <p className="text-[16px] font-semibold text-dark leading-[1.45]">{question.stem}</p>
      </div>

      <div className="flex flex-col gap-2">
        {options.map((opt) => (
          <button
            key={opt.label}
            onClick={() => handleOptionTap(opt)}
            disabled={locked}
            className={cn(
              'w-full text-left px-4 py-4 rounded-btn transition-all duration-200 font-medium flex items-start gap-3',
              !highlightLabel && 'bg-white shadow-card border border-dark/[0.05] hover:shadow-card-hover hover:border-primary/20 active:scale-[0.98] cursor-pointer text-dark',
              highlightLabel === opt.label && 'bg-gradient-to-b from-[#11857C] to-primary text-cream shadow-btn border border-transparent scale-[1.01]',
              highlightLabel && highlightLabel !== opt.label && (locked
                ? 'bg-white/40 text-dark/20 border border-transparent shadow-none cursor-default'
                : 'bg-white/70 text-dark/40 border border-transparent shadow-none cursor-pointer hover:bg-white hover:text-dark')
            )}
          >
            <span className={cn(
              'w-6 h-6 rounded-full text-[11px] font-bold flex items-center justify-center shrink-0 transition-colors duration-200 mt-[-1px]',
              highlightLabel === opt.label
                ? 'bg-cream/20 text-cream'
                : highlightLabel
                  ? 'bg-dark/[0.04] text-dark/20'
                  : 'bg-dark/[0.05] text-dark/40'
            )}>
              {opt.label}
            </span>
            <span className="text-sm leading-snug">{opt.text}</span>
          </button>
        ))}
      </div>

      {/* Confidence step — appears once an option is pending */}
      {askConfidence && pending && !locked && (
        <div className="flex flex-col gap-2.5">
          <p className="text-[13px] font-semibold text-dark/60 text-center">Hur säker är du?</p>
          <div className="flex gap-2">
            {CONFIDENCE_OPTIONS.map((c) => (
              <button
                key={c.value}
                onClick={() => onSelect(pending.label, pending.isCorrect, c.value)}
                className="flex-1 px-2 py-3 rounded-btn bg-white shadow-card hover:shadow-card-hover active:scale-[0.98] transition-all duration-150 text-[13px] font-semibold text-dark"
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
