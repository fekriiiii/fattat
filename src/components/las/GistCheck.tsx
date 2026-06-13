'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'

interface Props {
  onSubmit: (text: string) => void
}

// Gist-retrieval gate — shown after reading a lång article in daily sessions,
// before the questions. Writing one sentence of huvudtanke *from memory* is
// retrieval practice on the situation model: self-explanation has strong
// meta-analytic support (g ≈ .55), and generating a summary after the text is
// closed is what makes metacomprehension judgments accurate. Never graded —
// the act of generating is the intervention. The text is shown back on
// huvudtanke questions for self-comparison.
export function GistCheck({ onSubmit }: Props) {
  const [text, setText] = useState('')
  const trimmed = text.trim()
  const ready = trimmed.length >= 10

  return (
    <div className="flex flex-col gap-4 px-5 py-6">
      <div>
        <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-primary/50">
          Innan frågorna
        </span>
        <h2 className="text-[19px] font-bold text-dark leading-tight mt-1.5">
          Vad är textens huvudtanke?
        </h2>
        <p className="text-[13px] text-dark/55 leading-snug mt-2">
          Skriv en mening ur minnet — utan att titta tillbaka. Att formulera kärnan själv är det som gör att texten fastnar.
        </p>
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        placeholder={'T.ex. "Texten argumenterar för att …"'}
        className="w-full px-4 py-3.5 rounded-[14px] bg-white shadow-card border-2 border-dark/[0.06] text-[15px] text-dark leading-relaxed placeholder:text-dark/30 focus:outline-none focus:border-primary/60 focus:shadow-[0_0_0_4px_rgba(15,118,110,0.08)] transition-all duration-200 resize-none"
        autoFocus
      />

      <Button fullWidth size="lg" disabled={!ready} onClick={() => ready && onSubmit(trimmed)}>
        {ready ? 'Visa frågorna' : 'Skriv en mening först'}
      </Button>
    </div>
  )
}
