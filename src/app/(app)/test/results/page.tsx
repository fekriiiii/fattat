'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense } from 'react'
import { Button } from '@/components/ui/Button'
import { useSessionStore } from '@/stores/sessionStore'
import { rawToHp } from '@/lib/session/scoring'
import { CheckCircle2, XCircle } from 'lucide-react'

function TestResultsInner() {
  const params = useSearchParams()
  const router = useRouter()
  const reset = useSessionStore((s) => s.reset)

  const ordCorrect = parseInt(params.get('ordCorrect') ?? '0')
  const ordTotal = parseInt(params.get('ordTotal') ?? '0')
  const lasCorrect = parseInt(params.get('lasCorrect') ?? '0')
  const lasTotal = parseInt(params.get('lasTotal') ?? '0')
  const ordAnswered = parseInt(params.get('ordAnswered') ?? String(ordTotal))
  const lasAnswered = parseInt(params.get('lasAnswered') ?? String(lasTotal))
  const timeUp = params.get('timeUp') === '1'

  const ordPct = ordTotal > 0 ? Math.round((ordCorrect / ordTotal) * 100) : 0
  const lasPct = lasTotal > 0 ? Math.round((lasCorrect / lasTotal) * 100) : 0

  // HP score estimate from test performance
  const ordRaw = Math.round((ordCorrect / Math.max(ordTotal, 1)) * 40)
  const lasRaw = Math.round((lasCorrect / Math.max(lasTotal, 1)) * 40)
  const totalRaw = ordRaw + lasRaw + 30 // +30 = estimated quant national average
  const hpMid = rawToHp(totalRaw)
  const hpLow = rawToHp(Math.max(0, totalRaw - 15))
  const hpHigh = rawToHp(Math.min(120, totalRaw + 15))

  function handleDone() {
    reset()
    router.push('/dashboard')
  }

  return (
    <div className="flex flex-col gap-5 px-4 pt-6 pb-8 max-w-sm mx-auto">
      <div className="text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-primary/50 mb-2">
          Övningsprov
        </p>
        <h1 className="text-2xl font-bold text-dark">Resultat</h1>
      </div>

      {/* HP score estimate */}
      <div className="bg-primary text-cream rounded-card px-4 py-5 text-center">
        <p className="text-xs text-cream/60 uppercase tracking-widest mb-1">Beräknat HP-resultat</p>
        <p className="text-5xl font-bold leading-none">{hpMid.toFixed(2)}</p>
        <p className="text-sm text-cream/60 mt-1">{hpLow.toFixed(2)} – {hpHigh.toFixed(2)} HP</p>
      </div>

      {/* Time-up notice (real HP behavior: unanswered counts as wrong) */}
      {timeUp && (
        <div className="bg-red-500/[0.06] border border-red-500/25 rounded-card px-4 py-3">
          <p className="text-xs font-bold text-red-600 mb-1">Tiden tog slut</p>
          <p className="text-[11px] text-dark/65 leading-relaxed">
            Du svarade på {ordAnswered + lasAnswered} av {ordTotal + lasTotal} frågor.
            Obesvarade frågor räknas som fel — det är så provet fungerar i verkligheten.
          </p>
        </div>
      )}

      {/* Section breakdown */}
      <div className="flex flex-col gap-3">
        <SectionResult
          label="Ordförståelse"
          correct={ordCorrect}
          total={ordTotal}
          pct={ordPct}
        />
        <SectionResult
          label="Läsförståelse"
          correct={lasCorrect}
          total={lasTotal}
          pct={lasPct}
        />
      </div>

      <p className="text-xs text-dark/65 text-center leading-relaxed px-2">
        Provet täcker ORD + LÄS — halva verbala provpasset. MEK, ELF och kvantitativa delprov är uppskattade till genomsnittet. För fullständig provdagssimulering: använd gamla HP-prov från UHR med tidtagning.
      </p>

      <Button fullWidth onClick={handleDone}>
        Tillbaka till dashboard
      </Button>
    </div>
  )
}

function SectionResult({
  label, correct, total, pct,
}: {
  label: string
  correct: number
  total: number
  pct: number
}) {
  const good = pct >= 60
  return (
    <div className="bg-white border border-dark/8 rounded-card px-4 py-4 flex items-center gap-3">
      {good ? (
        <CheckCircle2 size={20} className="text-green-500 shrink-0" />
      ) : (
        <XCircle size={20} className="text-red-400 shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-dark">{label}</p>
        <div className="w-full h-1.5 bg-dark/8 rounded-full mt-1.5 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${good ? 'bg-green-500' : 'bg-red-400'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      <span className="text-sm font-bold text-dark/70 shrink-0">{correct}/{total}</span>
    </div>
  )
}

export default function TestResultsPage() {
  return (
    <Suspense>
      <TestResultsInner />
    </Suspense>
  )
}
