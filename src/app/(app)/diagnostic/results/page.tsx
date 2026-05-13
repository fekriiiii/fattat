'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useSessionStore } from '@/stores/sessionStore'
import { Button } from '@/components/ui/Button'
import { rawToHp } from '@/lib/session/scoring'
import type { GapResult } from '@/lib/session/planner'

interface CompleteResponse {
  baselineHp: number
  hpLow: number
  hpHigh: number
  gap: GapResult | null
  noExamDate?: boolean
}

function ResultsContent() {
  const params = useSearchParams()
  const router = useRouter()
  const { reset, responses } = useSessionStore()
  const called = useRef(false)

  const sessionId  = params.get('sessionId') ?? ''
  const ordCorrect = parseInt(params.get('ordCorrect') ?? '0')
  const ordTotal   = parseInt(params.get('ordTotal')   ?? '10')
  const lasCorrect = parseInt(params.get('lasCorrect') ?? '0')
  const lasTotal   = parseInt(params.get('lasTotal')   ?? '10')

  const [result, setResult] = useState<CompleteResponse | null>(null)

  useEffect(() => {
    if (!sessionId || called.current) return
    called.current = true

    const ordResponses = responses
      .filter((r) => r.type === 'ord' && r.wordId)
      .map((r) => ({
        wordId: r.wordId!,
        isCorrect: r.isCorrect,
        responseMs: r.responseMs,
        chosenLabel: r.chosenLabel,
        correctLabel: r.correctLabel,
      }))

    fetch('/api/diagnostic/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, ordCorrect, ordTotal, lasCorrect, lasTotal, ordResponses }),
    })
      .then((r) => r.json())
      .then(setResult)
      .catch(() => {
        // Non-fatal — show results without plan data
        const hp = rawToHp(
          Math.round((ordCorrect / ordTotal) * 40) +
          Math.round((lasCorrect / lasTotal) * 40) + 40
        )
        setResult({ baselineHp: hp, gap: null })
      })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const ordPct = ordTotal > 0 ? Math.round((ordCorrect / ordTotal) * 100) : 0
  const lasPct = lasTotal > 0 ? Math.round((lasCorrect / lasTotal) * 100) : 0

  // Fallback score shown briefly while API responds — uses rawToHp (no prior HP data available client-side)
  const fallbackHp = rawToHp(
    Math.round((ordCorrect / Math.max(ordTotal, 1)) * 40) +
    Math.round((lasCorrect / Math.max(lasTotal, 1)) * 40) + 40
  )
  const baselineHp = result?.baselineHp ?? fallbackHp
  // Band comes from the API once loaded (uses personalized prior scores); falls back to ±0.20 estimate
  const hpLow  = result?.hpLow  ?? Math.max(0,   fallbackHp - 0.20)
  const hpHigh = result?.hpHigh ?? Math.min(2.0, fallbackHp + 0.20)

  const gap = result?.gap

  function handleContinue() {
    reset()
    router.push('/dashboard')
  }

  return (
    <div className="flex flex-col gap-5 px-4 py-8 max-w-sm mx-auto">
      <div className="text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-primary/50 mb-2">
          Diagnosprov
        </p>
        <h1 className="text-2xl font-bold text-dark">Ditt startresultat</h1>
        <p className="text-sm text-dark/65 mt-1 leading-relaxed">
          Det här är din uppskattade startnivå — inte ett exakt HP-resultat.
        </p>
      </div>

      {/* Baseline HP score */}
      <div className="bg-primary text-cream rounded-card px-6 py-6 text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-cream/60 mb-1">
          Beräknat startresultat
        </p>
        <p className="text-5xl font-bold">{baselineHp.toFixed(2)}</p>
        <p className="text-sm text-cream/60 mt-1">{hpLow.toFixed(2)} – {hpHigh.toFixed(2)} HP</p>
      </div>

      {/* ORD / LÄS breakdown */}
      <div className="grid grid-cols-2 gap-3">
        <ModuleCard label="Ordförståelse" correct={ordCorrect} total={ordTotal} pct={ordPct} />
        <ModuleCard label="Läsförståelse" correct={lasCorrect} total={lasTotal} pct={lasPct} />
      </div>

      {/* Gap plan — shown once API responds */}
      {gap ? (
        <div className={`rounded-card px-4 py-4 border ${gap.isHeavy ? 'bg-amber-50 border-amber-200' : 'bg-white border-dark/8'}`}>
          <p className="text-sm font-bold text-dark mb-1">Din studieplan</p>
          <p className="text-sm text-dark/65 leading-relaxed">{gap.message}</p>
          {gap.daysLeft > 0 && (
            <div className="mt-3 flex gap-4">
              <Stat label="Min per dag"  value={`${gap.estimatedMinutesPerDay} min`} />
              <Stat label="Nya ord/dag"  value={String(gap.dailyNewWords)} />
              <Stat label="Dagar kvar"   value={String(gap.daysLeft)} />
            </div>
          )}
          {gap.isHeavy && (
            <p className="text-xs text-amber-700 mt-3 leading-relaxed">
              Vid ett lugnare tempo (10 ord/dag) kan du nå {gap.achievableHp.toFixed(2)} HP.
            </p>
          )}
        </div>
      ) : result?.noExamDate ? (
        <div className="bg-amber-50 border border-amber-200 rounded-card px-4 py-4">
          <p className="text-sm font-bold text-dark mb-1">Sätt ett provdatum för din plan</p>
          <p className="text-sm text-dark/65 leading-relaxed">
            Du har inget provdatum inställt, så vi kan inte beräkna hur mycket du behöver studera per dag.
            Lägg till ditt provdatum i profilen för att låsa upp din personliga studieplan.
          </p>
          <button
            onClick={() => router.push('/profile')}
            className="mt-3 text-sm font-bold text-primary underline underline-offset-2"
          >
            Gå till profilen →
          </button>
        </div>
      ) : (
        <div className="bg-white border border-dark/8 rounded-card px-4 py-4">
          <p className="text-sm font-bold text-dark mb-1">Vad händer nu?</p>
          <p className="text-sm text-dark/65 leading-relaxed">
            Fattat använder ditt startresultat för att anpassa din studieplan. Varje session
            uppdaterar din prognos automatiskt.
          </p>
        </div>
      )}

      <Button fullWidth size="lg" onClick={handleContinue}>
        Gå till studiedashboard
      </Button>
    </div>
  )
}

function ModuleCard({ label, correct, total, pct }: { label: string; correct: number; total: number; pct: number }) {
  return (
    <div className="bg-white border border-dark/8 rounded-card px-4 py-4 text-center">
      <p className="text-xs font-bold uppercase tracking-widest text-dark/65 mb-1">{label}</p>
      <p className="text-3xl font-bold text-dark">{pct}%</p>
      <p className="text-xs text-dark/65 mt-0.5">{correct}/{total} rätt</p>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <p className="text-base font-bold text-dark">{value}</p>
      <p className="text-xs text-dark/65 mt-0.5">{label}</p>
    </div>
  )
}

export default function DiagnosticResultsPage() {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
      <ResultsContent />
    </Suspense>
  )
}
