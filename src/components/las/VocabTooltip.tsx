'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import type { VocabHighlight } from '@/types/database'
import { X } from 'lucide-react'

interface Props {
  highlight: VocabHighlight
  onClose: () => void
}

export function VocabTooltip({ highlight, onClose }: Props) {
  // Rendered through a portal on <body> rather than inline in the article.
  // Inline, the sheet is trapped in whatever stacking context the page happens
  // to create, and it lost to the bottom nav: both were z-50, the nav is
  // rendered later in the layout, so the nav won the tie and covered the
  // definition on mobile. A portal plus a z-index above the nav makes the
  // stacking independent of where in the tree the sheet is used.
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  // Escape closes, and the page behind must not scroll while the sheet is open
  // (scrolling the article under a fixed sheet is what made it feel glitched).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
    }
  }, [onClose])

  if (!mounted) return null

  return createPortal(
    // z-[60] deliberately clears BottomNav's z-50.
    <div className="fixed inset-0 z-[60] flex items-end justify-center">
      {/* The backdrop covers the whole viewport, so a tap anywhere outside the
          sheet lands here. That replaces the old document-level mousedown
          listener, which double-fired on touch (touchstart -> mousedown ->
          click) and could close the sheet on the very tap that opened it. */}
      <div className="absolute inset-0 bg-dark/30" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Definition av ${highlight.word}`}
        className="relative w-full max-w-md bg-cream rounded-t-2xl shadow-2xl px-5 pt-5 pb-8 safe-bottom"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-dark/40 hover:text-dark"
          aria-label="Stäng"
        >
          <X size={20} />
        </button>
        <p className="text-xl font-bold text-dark mb-2 pr-8">{highlight.word}</p>
        <p className="text-base text-dark/70 leading-relaxed">
          {highlight.definition ?? highlight.definition_sv}
        </p>
      </div>
    </div>,
    document.body
  )
}
