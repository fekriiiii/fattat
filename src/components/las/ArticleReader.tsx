'use client'

import { useState, useMemo } from 'react'
import type { Article, VocabHighlight } from '@/types/database'
import { VocabTooltip } from './VocabTooltip'
import { ReadingTimer } from './ReadingTimer'
import { Button } from '@/components/ui/Button'

interface Props {
  article: Article
  onDoneReading: () => void
}

interface TextSegment {
  text: string
  highlight: VocabHighlight | null
}

function buildSegments(body: string, highlights: VocabHighlight[]): TextSegment[] {
  // Find each highlight word's first occurrence in the body text
  type IndexedHighlight = { start: number; end: number; h: VocabHighlight }
  const positioned: IndexedHighlight[] = []

  for (const h of highlights) {
    const idx = body.toLowerCase().indexOf(h.word.toLowerCase())
    if (idx >= 0) {
      positioned.push({ start: idx, end: idx + h.word.length, h })
    }
  }

  positioned.sort((a, b) => a.start - b.start)

  const segments: TextSegment[] = []
  let cursor = 0

  for (const p of positioned) {
    if (p.start < cursor) continue // overlapping — skip
    if (p.start > cursor) {
      segments.push({ text: body.slice(cursor, p.start), highlight: null })
    }
    segments.push({ text: body.slice(p.start, p.end), highlight: p.h })
    cursor = p.end
  }

  if (cursor < body.length) {
    segments.push({ text: body.slice(cursor), highlight: null })
  }

  return segments
}

// Splits segments into paragraphs on \n, renders each as its own <p>
function renderSegmentsAsParagraphs(
  segments: TextSegment[],
  onHighlight: (h: VocabHighlight) => void
) {
  // Flatten segments into tokens — either a highlight or a string chunk
  type Token = { type: 'highlight'; h: VocabHighlight; text: string } | { type: 'text'; text: string }
  const tokens: Token[] = segments.flatMap((seg) => {
    if (seg.highlight) return [{ type: 'highlight' as const, h: seg.highlight, text: seg.text }]
    // Split plain text on newlines
    return seg.text.split('\n').flatMap((part, i, arr) => {
      const items: Token[] = [{ type: 'text' as const, text: part }]
      if (i < arr.length - 1) items.push({ type: 'text' as const, text: '\n' })
      return items
    })
  })

  // Group tokens into paragraphs by splitting on '\n' tokens
  const paragraphs: Token[][] = [[]]
  for (const token of tokens) {
    if (token.type === 'text' && token.text === '\n') {
      paragraphs.push([])
    } else {
      paragraphs[paragraphs.length - 1].push(token)
    }
  }

  return paragraphs
    .filter((p) => p.some((t) => t.text.trim()))
    .map((para, pi) => (
      <p key={pi} className="text-[16px] text-dark/85 leading-[1.75]">
        {para.map((token, ti) =>
          token.type === 'highlight' ? (
            <button
              key={ti}
              onClick={() => onHighlight(token.h)}
              className="underline decoration-primary/40 decoration-dotted underline-offset-2 text-primary font-medium hover:decoration-primary transition-colors"
            >
              {token.text}
            </button>
          ) : (
            <span key={ti}>{token.text}</span>
          )
        )}
      </p>
    ))
}

export function ArticleReader({ article, onDoneReading }: Props) {
  const [timerRunning, setTimerRunning] = useState(true)
  const [done, setDone] = useState(false)
  const [activeHighlight, setActiveHighlight] = useState<VocabHighlight | null>(null)

  const segments = useMemo(
    () => buildSegments(article.body, article.vocab_highlights),
    [article]
  )

  function handleDone() {
    setTimerRunning(false)
    setDone(true)
    onDoneReading()
  }

  return (
    <div className="flex flex-col">
      {/* Article header */}
      <div className="px-5 pt-4 pb-4 border-b border-dark/[0.06]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary/60">
            {article.unit_position === 'kort' ? 'Kort text' : 'Lång text'}
          </span>
          <ReadingTimer
            wordCount={article.word_count}
            running={timerRunning && !done}
          />
        </div>
        <h2 className="text-[21px] font-bold text-dark leading-tight tracking-tight">{article.title}</h2>
        {article.source_name && (
          <p className="text-[11px] text-dark/55 mt-1.5">{article.source_name}</p>
        )}
      </div>

      {/* Article body */}
      <div className="px-5 py-5 flex flex-col gap-4">
        {renderSegmentsAsParagraphs(segments, (h) => setActiveHighlight(h))}

        <p className="text-[11px] text-dark/40 italic">
          Namn, personer, statistik och händelser i texten är påhittade och används enbart i övningssyfte.
        </p>

        {article.vocab_highlights.length > 0 && (
          <p className="text-[11px] text-dark/55 italic">
            Tryck på understrukna ord för definition
          </p>
        )}
      </div>

      {/* Done button */}
      {!done && (
        <div className="px-4 pb-2">
          <Button fullWidth onClick={handleDone}>
            Jag är klar — visa frågorna
          </Button>
        </div>
      )}

      {/* Vocab tooltip */}
      {activeHighlight && (
        <VocabTooltip
          highlight={activeHighlight}
          onClose={() => setActiveHighlight(null)}
        />
      )}
    </div>
  )
}
