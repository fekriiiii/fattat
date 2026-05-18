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
      <div className="bg-white shadow-card rounded-card px-4 py-4">
        <p className="text-xs font-bold uppercase tracking-widest text-dark/55 mb-2">
          LÄS-frågetyper
        </p>
        <p className="text-sm text-dark/65">Svara på fler LÄS-frågor för att se din profil.</p>
      </div>
    )
  }

  const sorted = [...qualified].sort((a, b) => {
    const accA = a.correct / a.total
    const accB = b.correct / b.total
    return accA - accB
  })

  return (
    <div className="bg-white shadow-card rounded-card px-4 py-4">
      <p className="text-xs font-bold uppercase tracking-widest text-dark/55 mb-3">
        LÄS-frågetyper
      </p>
      <div className="flex flex-col gap-2.5">
        {sorted.map((s) => {
          const pct = Math.round((s.correct / s.total) * 100)
          const isWeak = s.total >= 5 && pct < 50
          return (
            <div key={s.type}>
              <div className="flex items-center justify-between mb-1">
                <span className={cn(
                  'text-xs font-medium',
                  isWeak ? 'text-rose-600' : 'text-dark/70'
                )}>
                  {TYPE_LABELS[s.type] ?? s.type}
                </span>
                <span className="text-xs text-dark/65 tabular-nums">
                  {pct}% ({s.correct}/{s.total})
                </span>
              </div>
              <div className="w-full h-[5px] bg-dark/[0.06] rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-500',
                    isWeak
                      ? 'bg-rose-400'
                      : pct >= 75 ? 'bg-primary' : pct >= 50 ? 'bg-primary/55' : 'bg-primary/30'
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
