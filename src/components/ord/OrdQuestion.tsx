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
        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-dark/30 mb-3">
          Välj rätt synonym
        </p>
        <h2 className="text-[44px] font-bold text-dark tracking-tight leading-[1.1]">
          {word.word}
        </h2>
      </div>

      {/* Options */}
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
