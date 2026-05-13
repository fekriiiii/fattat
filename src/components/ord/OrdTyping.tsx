'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
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
    const isCorrect = accepted.some(s => s.toLowerCase() === typed)
    onAnswer(trimmed, isCorrect)
  }

  return (
    <div className="flex flex-col gap-10 px-5 pt-10 pb-6">
      <div className="text-center">
        <h2 className="text-5xl font-bold text-dark tracking-tight leading-none mb-3">
          {word.word}
        </h2>
        <p className="text-sm text-dark/40">Skriv rätt synonym</p>
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
          className="w-full shadow-card rounded-card px-5 py-4 text-lg text-dark bg-white outline-none focus:shadow-card-hover transition-shadow"
        />
        <Button fullWidth onClick={handleSubmit} disabled={!input.trim()}>
          Skicka svar
        </Button>
      </div>
    </div>
  )
}
