'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { isAcceptedAnswer } from '@/lib/utils/levenshtein'
import type { Word } from '@/types/database'

interface Props {
  word: Word
  onAnswer: (typedText: string, isCorrect: boolean) => void
}

export function OrdTyping({ word, onAnswer }: Props) {
  const [input, setInput] = useState('')

  function handleSubmit() {
    const trimmed = input.trim()
    if (!trimmed) return
    const typed = trimmed.toLowerCase()
    const accepted = [
      word.correct_synonym,
      ...(word.accepted_synonyms ? word.accepted_synonyms.split(',').map(s => s.trim()) : []),
    ]
    const isCorrect = isAcceptedAnswer(typed, accepted)
    onAnswer(trimmed, isCorrect)
  }

  return (
    <div className="flex flex-col gap-10 px-5 pt-10 pb-6">
      <div className="text-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary/60 mb-3">
          Skriv rätt synonym
        </p>
        <h2 className="text-5xl font-bold text-dark tracking-tight leading-none">
          {word.word}
        </h2>
        <div className="w-10 h-1 rounded-full bg-gold/60 mx-auto mt-4" />
      </div>

      <div className="flex flex-col gap-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit() }}
          placeholder="Din synonym…"
          autoFocus
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          className="w-full shadow-card border-2 border-dark/[0.06] rounded-card px-5 py-4 text-lg text-center text-dark bg-white outline-none focus:border-primary/60 focus:shadow-[0_0_0_4px_rgba(15,118,110,0.08)] transition-all duration-200 placeholder:text-dark/30"
        />
        <Button fullWidth onClick={handleSubmit} disabled={!input.trim()}>
          Skicka svar
        </Button>
      </div>
    </div>
  )
}
