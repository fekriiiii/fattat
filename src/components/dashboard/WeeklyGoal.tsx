'use client'

import { cn } from '@/lib/utils/cn'
import { Target } from 'lucide-react'

interface Props {
  weekNumber: number
  focus: string
  ordTarget: number
  lasTarget: number
  ordDone: number
  lasDone: number
}

export function WeeklyGoal({ weekNumber, focus, ordTarget, lasTarget, ordDone, lasDone }: Props) {
  const ordPct = Math.min(100, ordTarget > 0 ? Math.round((ordDone / ordTarget) * 100) : 0)
  const lasPct = Math.min(100, lasTarget > 0 ? Math.round((lasDone / lasTarget) * 100) : 0)

  return (
    <div className="bg-white border border-dark/8 rounded-card px-4 py-4">
      <div className="flex items-start justify-between mb-1">
        <p className="text-xs font-bold uppercase tracking-widest text-dark/65">
          Vecka {weekNumber}
        </p>
        <Target size={15} className="text-primary/40 mt-0.5" />
      </div>
      <p className="text-sm font-medium text-dark mb-3">{focus}</p>

      <div className="flex flex-col gap-2">
        <GoalBar label="Ord" done={ordDone} target={ordTarget} pct={ordPct} />
        <GoalBar label="Texter" done={lasDone} target={lasTarget} pct={lasPct} />
      </div>
    </div>
  )
}

function GoalBar({
  label,
  done,
  target,
  pct,
}: {
  label: string
  done: number
  target: number
  pct: number
}) {
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-xs text-dark/60">{label}</span>
        <span className="text-xs text-dark/65 tabular-nums">
          {done}/{target}
        </span>
      </div>
      <div className="w-full h-1.5 bg-dark/8 rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500',
            pct >= 100 ? 'bg-green-500' : 'bg-primary'
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
