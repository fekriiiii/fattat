import { cn } from '@/lib/utils/cn'

export interface LasTypeStat {
  type: string
  correct: number
  total: number
}

interface Props {
  stats: LasTypeStat[]
}

const TYPE_LABELS: Record<string, string> = {
  huvudtanke:    'Huvudtanke',
  detalj_fakta:  'Detaljfrågor',
  detalj_kausal: 'Orsak & verkan',
  syfte_funktion:'Syfte & funktion',
  slutledning:   'Tolkningsfrågor',
  jämförande:    'Jämförande',
  ståndpunkt:    'Ståndpunkt',
}

export function LasTypeBreakdown({ stats }: Props) {
  const qualified = stats.filter((s) => s.total >= 3)

  if (qualified.length === 0) {
    return (
      <div className="bg-white shadow-card border border-dark/[0.05] rounded-card px-5 py-5">
        <p className="card-label mb-2">
          LÄS-frågetyper
        </p>
        <p className="text-sm text-dark/55">Svara på fler LÄS-frågor för att se din profil.</p>
      </div>
    )
  }

  const sorted = [...qualified].sort((a, b) => {
    const accA = a.correct / a.total
    const accB = b.correct / b.total
    return accA - accB
  })

  return (
    <div className="bg-white shadow-card border border-dark/[0.05] rounded-card px-5 py-5">
      <p className="card-label mb-3.5">
        LÄS-frågetyper
      </p>
      <div className="flex flex-col gap-3">
        {sorted.map((s) => {
          const pct = Math.round((s.correct / s.total) * 100)
          const isWeak = s.total >= 5 && pct < 50
          return (
            <div key={s.type}>
              <div className="flex items-center justify-between mb-1.5">
                <span className={cn(
                  'text-[13px] font-bold',
                  isWeak ? 'text-rose-600' : 'text-dark/75'
                )}>
                  {TYPE_LABELS[s.type] ?? s.type}
                </span>
                <span className="text-xs text-dark/55 tabular-nums">
                  <span className={cn('font-bold', isWeak ? 'text-rose-600' : 'text-dark/75')}>{pct}%</span> ({s.correct}/{s.total})
                </span>
              </div>
              <div className="w-full h-2 bg-dark/[0.05] rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-700 ease-out',
                    isWeak
                      ? 'bg-gradient-to-r from-rose-400 to-rose-500'
                      : pct >= 75
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
