'use client'

import { cn } from '@/lib/utils/cn'

interface Props {
  percent: number
  phase: 'weakness' | 'ord' | 'las' | 'complete'
}

const PHASE_LABELS: Record<Props['phase'], string> = {
  weakness: 'Svaga ord',
  ord: 'Ordförståelse',
  las: 'Läsförståelse',
  complete: 'Klart',
}

export function SessionProgress({ percent, phase }: Props) {
  return (
    <div className="px-[18px] pt-3.5 pb-2.5">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-dark/35">
          {PHASE_LABELS[phase]}
        </span>
        <span className="text-[10px] text-dark/35 tabular-nums">{percent}%</span>
      </div>
      <div className="w-full h-1 bg-dark/[0.06] rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500',
            phase === 'weakness' ? 'bg-gold' : 'bg-primary'
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}
