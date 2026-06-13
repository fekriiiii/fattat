'use client'

import { cn } from '@/lib/utils/cn'
import type { Word } from '@/types/database'

export type OrdOption = { label: string; text: string; isCorrect: boolean }

interface Props {
  word: Word
  options: OrdOption[]
  selectedLabel: string | null
  onSelect: (label: string, isCorrect: boolean) => void
}

export function OrdQuestion({ word, options, selectedLabel, onSelect }: Props) {
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

      {/* Options */}
      <div className="flex flex-col gap-2.5">
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
