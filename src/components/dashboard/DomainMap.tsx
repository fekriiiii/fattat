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
      <div className="bg-white shadow-card border border-dark/[0.05] rounded-card px-5 py-5">
        <p className="card-label mb-2">
          Domäner
        </p>
        <p className="text-sm text-dark/55">Inga data ännu. Börja med en session.</p>
      </div>
    )
  }

  const sorted = [...stats].sort((a, b) => {
    const accA = a.total > 0 ? a.correct / a.total : 1
    const accB = b.total > 0 ? b.correct / b.total : 1
    return accA - accB
  })

  return (
    <div className="bg-white shadow-card border border-dark/[0.05] rounded-card px-5 py-5">
      <p className="card-label mb-3.5">
        Träffsäkerhet per domän
      </p>
      <div className="flex flex-col gap-3">
        {sorted.map((s) => {
          const pct = s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0
          return (
            <div key={s.domain}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[13px] font-bold text-dark/75">
                  {DOMAIN_LABELS[s.domain] ?? s.domain}
                </span>
                <span className="text-xs text-dark/55 tabular-nums">
                  <span className="font-bold text-dark/75">{pct}%</span> ({s.correct}/{s.total})
                </span>
              </div>
              <div className="w-full h-2 bg-dark/[0.05] rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-700 ease-out',
                    pct >= 75
                      ? 'bg-gradient-to-r from-primary-600 to-primary'
                      : pct >= 50
                        ? 'bg-gradient-to-r from-primary-500/60 to-primary/55'
                        : 'bg-primary/30'
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
