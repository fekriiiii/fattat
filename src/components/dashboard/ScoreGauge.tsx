'use client'

interface Props {
  low: number   // HP scale 0.0–2.0
  high: number  // HP scale 0.0–2.0
  mid: number   // HP scale 0.0–2.0
  target: number | null // HP scale 0.0–2.0
}

export function ScoreGauge({ low, high, mid, target }: Props) {
  const maxScore = 2.0
  const midPct = (mid / maxScore) * 100
  const targetPct = target ? (target / maxScore) * 100 : null

  return (
    <div className="bg-white shadow-card rounded-card px-4 py-4">
      <p className="text-xs font-bold uppercase tracking-widest text-dark/55 mb-3">
        Beräknat resultat
      </p>

      {/* Score display */}
      <div className="flex items-baseline gap-1.5 mb-4">
        <span className="text-4xl font-bold text-dark">{mid.toFixed(2)}</span>
        <span className="text-sm text-dark/65">/ 2.00 HP</span>
        <span className="text-sm text-dark/65 ml-1">({low.toFixed(2)}–{high.toFixed(2)})</span>
      </div>

      {/* Bar */}
      <div className="relative w-full h-2 bg-dark/[0.12] rounded-full overflow-hidden mb-2">
        {/* Range band */}
        <div
          className="absolute top-0 h-full bg-primary/35 rounded-full"
          style={{
            left: `${(low / maxScore) * 100}%`,
            width: `${((high - low) / maxScore) * 100}%`,
          }}
        />
        {/* Mid marker */}
        <div
          className="absolute top-0 w-2 h-full bg-primary rounded-full -translate-x-1/2"
          style={{ left: `${midPct}%` }}
        />
        {/* Target marker */}
        {targetPct !== null && (
          <div
            className="absolute top-0 w-1 h-full bg-gold -translate-x-1/2"
            style={{ left: `${targetPct}%` }}
          />
        )}
      </div>

      {/* Labels */}
      <div className="flex justify-between text-xs text-dark/65">
        <span>0.00</span>
        {target && (
          <span className="text-gold font-medium">Mål: {target.toFixed(2)}</span>
        )}
        <span>2.00</span>
      </div>

      <p className="text-xs text-dark/65 mt-3 leading-relaxed">
        Uppskattning baserad på din verbala träning och tidigare HP-resultat.
        Exakt poäng beror på provets svårighetsgrad.
      </p>
    </div>
  )
}
