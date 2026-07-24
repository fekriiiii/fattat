'use client'

import { useEffect, useRef } from 'react'
import type { VocabHighlight } from '@/types/database'
import { X } from 'lucide-react'

interface Props {
  highlight: VocabHighlight
  onClose: () => void
}

export function VocabTooltip({ highlight, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-dark/30" onClick={onClose} />
      <div
        ref={ref}
        className="relative w-full max-w-md bg-cream rounded-t-2xl shadow-2xl px-5 pt-5 pb-8 safe-bottom"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-dark/40 hover:text-dark"
          aria-label="Stäng"
        >
          <X size={20} />
        </button>
        <p className="text-xl font-bold text-dark mb-2">{highlight.word}</p>
        <p className="text-base text-dark/70 leading-relaxed">
          {highlight.definition ?? highlight.definition_sv}
        </p>
      </div>
    </div>
  )
}
