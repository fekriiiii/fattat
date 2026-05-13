'use client'

import { cn } from '@/lib/utils/cn'
import { Button } from '@/components/ui/Button'
import type { Word } from '@/types/database'

interface Props {
  word: Word
  typedText: string
  isCorrect: boolean
  onNext: () => void
}

export function OrdFeedbackTyping({ word, typedText, isCorrect, onNext }: Props) {
  return (
    <div className="flex flex-col gap-7 px-5 pt-8 pb-6">
      {/* Word + result indicator */}
      <div className="text-center">
        <h2 className="text-5xl font-bold text-dark tracking-tight leading-none mb-4">
          {word.word}
        </h2>
        <span className={cn(
          'inline-block text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full',
          isCorrect
            ? 'bg-emerald-50 text-emerald-600'
            : 'bg-rose-50 text-rose-600'
        )}>
          {isCorrect ? `Rätt — ${word.correct_synonym}` : `Rätt svar: ${word.correct_synonym}`}
        </span>
        {!isCorrect && typedText && (
          <p className="text-sm text-dark/60 mt-2">
            Du svarade: <span className="italic">{typedText}</span>
          </p>
        )}
      </div>

      {/* Definition — the learning content */}
      <div className="bg-white shadow-card rounded-card px-5 py-5">
        <p className="text-base text-dark leading-relaxed">{word.definition_sv}</p>
        {word.example_sentence && (
          <p className="text-sm text-dark/65 mt-3 italic leading-relaxed border-t border-dark/6 pt-3">
            &ldquo;{word.example_sentence}&rdquo;
          </p>
        )}
      </div>

      <Button fullWidth onClick={onNext}>Nästa</Button>
    </div>
  )
}
