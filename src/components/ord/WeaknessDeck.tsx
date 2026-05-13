'use client'

import { AlertTriangle } from 'lucide-react'

interface Props {
  count: number
}

export function WeaknessBadge({ count }: Props) {
  if (count === 0) return null
  return (
    <div className="mx-4 mb-2 flex items-center gap-2 bg-gold/15 border border-gold/30 rounded-card px-3 py-2">
      <AlertTriangle size={15} className="text-gold shrink-0" />
      <p className="text-xs font-bold text-dark/70">
        {count === 1
          ? 'Svagt ord — du har missat det här förut'
          : `${count} svaga ord — du har missat dessa förut`}
      </p>
    </div>
  )
}
