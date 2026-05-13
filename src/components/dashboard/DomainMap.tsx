'use client'

import { cn } from '@/lib/utils/cn'

interface DomainStat {
  domain: string
  correct: number
  total: number
}

interface Props {
  stats: DomainStat[]
}

const DOMAIN_LABELS: Record<string, string> = {
  juridik: 'Juridik',
  medicin: 'Medicin',
  kultur: 'Kultur',
  vetenskap: 'Vetenskap',
  samhälle: 'Samhälle',
  ekonomi: 'Ekonomi',
  allmän: 'Allmänt',
}

export function DomainMap({ stats }: Props) {
  if (!stats.length) {
    return (
      <div className="bg-white shadow-card rounded-card px-4 py-4">
        <p className="text-xs font-bold uppercase tracking-widest text-dark/55 mb-2">
          Domäner
        </p>
        <p className="text-sm text-dark/65">Inga data ännu — börja med en session.</p>
      </div>
    )
  }

  const sorted = [...stats].sort((a, b) => {
    const accA = a.total > 0 ? a.correct / a.total : 1
    const accB = b.total > 0 ? b.correct / b.total : 1
    return accA - accB
  })

  return (
    <div className="bg-white shadow-card rounded-card px-4 py-4">
      <p className="text-xs font-bold uppercase tracking-widest text-dark/55 mb-3">
        Träffsäkerhet per domän
      </p>
      <div className="flex flex-col gap-2.5">
        {sorted.map((s) => {
          const pct = s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0
          return (
            <div key={s.domain}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-dark/70">
                  {DOMAIN_LABELS[s.domain] ?? s.domain}
                </span>
                <span className="text-xs text-dark/65 tabular-nums">
                  {pct}% ({s.correct}/{s.total})
                </span>
              </div>
              <div className="w-full h-[5px] bg-dark/[0.06] rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-500',
                    pct >= 75 ? 'bg-primary' : pct >= 50 ? 'bg-primary/55' : 'bg-primary/30'
                  )}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
