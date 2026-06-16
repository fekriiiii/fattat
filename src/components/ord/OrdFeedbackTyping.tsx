'use client'

import { useMemo, useState } from 'react'
import { cn } from '@/lib/utils/cn'
import { Button } from '@/components/ui/Button'
import { MorphemeHints } from './MorphemeBreakdown'
import { isAcceptedAnswer } from '@/lib/utils/levenshtein'
import type { Word } from '@/types/database'

interface Props {
  word: Word
  typedText: string
  isCorrect: boolean
  onNext: () => void
}

type WrongPhase = 'study' | 'retrieve' | 'fallback'

// Blanks the headword (and simple suffixed forms — Swedish inflections like
// -et / -en / -ar) in the example sentence, so the example can be shown as
// a retrieval cue without leaking the word itself.
function blankHeadwordInExample(example: string, headword: string): string {
  if (!example || !headword) return example
  const escaped = headword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const re = new RegExp(`\\b${escaped}\\w*`, 'gi')
  return example.replace(re, '_____')
}

export function OrdFeedbackTyping({ word, typedText, isCorrect, onNext }: Props) {
  const [flagged, setFlagged] = useState(false)
  const [phase, setPhase] = useState<WrongPhase>('study')
  const [retrieveInput, setRetrieveInput] = useState('')
  const [fallbackInput, setFallbackInput] = useState('')
  const [retrieveError, setRetrieveError] = useState(false)

  const blankedExample = useMemo(
    () => blankHeadwordInExample(word.example_sentence ?? '', word.word),
    [word.example_sentence, word.word]
  )
  const acceptedAnswers = useMemo(() => {
    return [
      word.correct_synonym,
      ...(word.accepted_synonyms ? word.accepted_synonyms.split(',').map(s => s.trim()).filter(Boolean) : []),
    ]
  }, [word.correct_synonym, word.accepted_synonyms])

  function handleFlag() {
    setFlagged(true)
    fetch('/api/words/flag-synonym', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wordId: word.id, typedAnswer: typedText }),
    }).catch(() => {})
  }

  function handleRetrieveSubmit() {
    const trimmed = retrieveInput.trim()
    if (!trimmed) return
    if (isAcceptedAnswer(trimmed.toLowerCase(), acceptedAnswers)) {
      onNext()
    } else {
      setRetrieveError(true)
      setPhase('fallback')
    }
  }

  function handleFallbackSubmit() {
    const trimmed = fallbackInput.trim()
    if (!trimmed) return
    if (isAcceptedAnswer(trimmed.toLowerCase(), acceptedAnswers)) {
      onNext()
    }
  }

  // ─── Correct answer: instant Next, no study-test ─────────────────────────────
  if (isCorrect) {
    return (
      <div className="flex flex-col gap-7 px-5 pt-8 pb-6">
        <div className="text-center">
          <h2 className="text-5xl font-bold text-dark tracking-tight leading-none mb-4">
            {word.word}
          </h2>
          <span className="inline-block text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/15 motion-safe:animate-pop-in">
            Rätt — {word.correct_synonym}
          </span>
        </div>

        <div className="bg-white shadow-card border border-dark/[0.05] rounded-card px-5 py-5">
          <p className="text-base text-dark leading-relaxed">{word.definition_sv}</p>
          {word.example_sentence && (
            <p className="text-sm text-dark/65 mt-3 italic leading-relaxed border-t border-dark/6 pt-3">
              &ldquo;{word.example_sentence}&rdquo;
            </p>
          )}
        </div>

        <MorphemeHints words={[word.word, word.correct_synonym]} />

        <Button fullWidth onClick={onNext}>Nästa</Button>
      </div>
    )
  }

  // ─── Wrong answer — Phase 1: STUDY ───────────────────────────────────────────
  if (phase === 'study') {
    return (
      <div className="flex flex-col gap-7 px-5 pt-8 pb-6">
        <div className="text-center">
          <h2 className="text-5xl font-bold text-dark tracking-tight leading-none mb-4">
            {word.word}
          </h2>
          <span className="inline-block text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full bg-rose-50 text-rose-600 ring-1 ring-inset ring-rose-600/15 motion-safe:animate-pop-in">
            Rätt svar: {word.correct_synonym}
          </span>
          {typedText && (
            <p className="text-sm text-dark/60 mt-2">
              Du svarade: <span className="italic">{typedText}</span>
            </p>
          )}
        </div>

        <div className="bg-white shadow-card border border-dark/[0.05] rounded-card px-5 py-5">
          <p className="text-base text-dark leading-relaxed">{word.definition_sv}</p>
          {word.example_sentence && (
            <p className="text-sm text-dark/65 mt-3 italic leading-relaxed border-t border-dark/6 pt-3">
              &ldquo;{word.example_sentence}&rdquo;
            </p>
          )}
        </div>

        <MorphemeHints words={[word.word, word.correct_synonym]} />

        <div className="text-center">
          {flagged ? (
            <p className="text-xs text-dark/40">Tack — vi kollar på det.</p>
          ) : (
            <button
              onClick={handleFlag}
              className="text-xs text-dark/40 hover:text-dark/60 transition-colors underline underline-offset-2"
            >
              Synonymen saknades?
            </button>
          )}
        </div>

        <Button fullWidth onClick={() => setPhase('retrieve')}>Fortsätt</Button>
      </div>
    )
  }

  // ─── Wrong answer — Phase 2: RETRIEVE (word hidden, type from memory) ────────
  if (phase === 'retrieve') {
    return (
      <div className="flex flex-col gap-7 px-5 pt-8 pb-6">
        <div className="text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-dark/40 mb-2">
            Skriv synonymen — från minnet
          </p>
          <h2 className="text-3xl font-bold text-dark/25 tracking-tight leading-none">
            _ _ _ _ _
          </h2>
        </div>

        <div className="bg-white shadow-card border border-dark/[0.05] rounded-card px-5 py-5">
          <p className="text-base text-dark leading-relaxed">{word.definition_sv}</p>
          {blankedExample && (
            <p className="text-sm text-dark/65 mt-3 italic leading-relaxed border-t border-dark/6 pt-3">
              &ldquo;{blankedExample}&rdquo;
            </p>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <input
            type="text"
            value={retrieveInput}
            onChange={(e) => setRetrieveInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleRetrieveSubmit() }}
            placeholder="Synonymen…"
            autoFocus
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            className={cn(
              'w-full shadow-card border-2 border-dark/[0.06] rounded-card px-5 py-4 text-lg text-center text-dark bg-white outline-none transition-all duration-200 placeholder:text-dark/30',
              'focus:border-primary/60 focus:shadow-[0_0_0_4px_rgba(15,118,110,0.08)]'
            )}
          />
          <Button fullWidth onClick={handleRetrieveSubmit} disabled={!retrieveInput.trim()}>
            Skicka
          </Button>
        </div>
      </div>
    )
  }

  // ─── Wrong answer — Phase 3: FALLBACK (second miss — word visible) ───────────
  return (
    <div className="flex flex-col gap-7 px-5 pt-8 pb-6">
      <div className="text-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-dark/40 mb-2">
          Skriv av synonymen för att gå vidare
        </p>
        <h2 className="text-5xl font-bold text-dark tracking-tight leading-none mb-3">
          {word.word}
        </h2>
        <span className="inline-block text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full bg-rose-50 text-rose-600 ring-1 ring-inset ring-rose-600/15 motion-safe:animate-pop-in">
          Rätt svar: {word.correct_synonym}
        </span>
        {retrieveError && (
          <p className="text-[11px] text-dark/45 mt-2">Vi tar det igen — du minns nästa gång.</p>
        )}
      </div>

      <div className="bg-white shadow-card border border-dark/[0.05] rounded-card px-5 py-5">
        <p className="text-base text-dark leading-relaxed">{word.definition_sv}</p>
        {word.example_sentence && (
          <p className="text-sm text-dark/65 mt-3 italic leading-relaxed border-t border-dark/6 pt-3">
            &ldquo;{word.example_sentence}&rdquo;
          </p>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <input
          type="text"
          value={fallbackInput}
          onChange={(e) => setFallbackInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleFallbackSubmit() }}
          placeholder={word.correct_synonym}
          autoFocus
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          className="w-full shadow-card border-2 border-dark/[0.06] rounded-card px-5 py-4 text-lg text-center text-dark bg-white outline-none focus:border-primary/60 focus:shadow-[0_0_0_4px_rgba(15,118,110,0.08)] transition-all duration-200 placeholder:text-dark/30"
        />
        <Button fullWidth onClick={handleFallbackSubmit} disabled={!fallbackInput.trim()}>
          Skicka
        </Button>
      </div>
    </div>
  )
}
