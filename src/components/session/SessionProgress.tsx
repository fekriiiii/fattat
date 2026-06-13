'use client'

interface Props {
  percent: number
  phase: 'ord' | 'las' | 'complete'
}

const PHASE_LABELS: Record<Props['phase'], string> = {
  ord: 'Ordförståelse',
  las: 'Läsförståelse',
  complete: 'Klart',
}

export function SessionProgress({ percent, phase }: Props) {
  return (
    <div className="px-[18px] pt-3.5 pb-2.5">
      <div className="flex items-center justify-between mb-2">
        <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-dark/40">
          <span className={phase === 'complete' ? 'w-1.5 h-1.5 rounded-full bg-gold' : 'w-1.5 h-1.5 rounded-full bg-primary'} />
          {PHASE_LABELS[phase]}
        </span>
        <span className="text-[10px] font-bold text-dark/40 tabular-nums">{percent}%</span>
      </div>
      <div className="w-full h-1.5 bg-dark/[0.05] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary-600 to-primary transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}
