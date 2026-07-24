'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useSessionStore } from '@/stores/sessionStore'
import { Button } from '@/components/ui/Button'
import { useCountUp } from '@/hooks/useCountUp'
import { rawToHp } from '@/lib/session/scoring'
import { balanceLabel, balanceExplanation } from '@/lib/session/balance'
import type { GapResult } from '@/lib/session/planner'
import type { SessionBalance } from '@/types/database'

interface CompleteResponse {
  baselineHp: number
  hpLow: number
  hpHigh: number
  gap: GapResult | null
  noExamDate?: boolean
  sessionBalance?: SessionBalance
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
        // Non-fatal — show results without plan data. The API would otherwise
        // return a personalized band (using previous HP/MEK/ELF); here we fall
        // back to a generic ±0.20 band around the raw-score estimate.
        const hp = rawToHp(
          Math.round((ordCorrect / ordTotal) * 40) +
          Math.round((lasCorrect / lasTotal) * 40) + 40
        )
        setResult({
          baselineHp: hp,
          hpLow: Math.max(0, hp - 0.2),
          hpHigh: Math.min(2.0, hp + 0.2),
          gap: null,
        })
      })
      .finally(() => {
        // This POST is what writes completed_at, which is what getOnboardingState
        // reads to decide whether the app is still locked. The (app) layout is a
        // server component, so without an explicit refresh the client keeps the
        // RSC payload rendered back when the diagnostic was still incomplete —
        // Plan and the other gated tabs stayed padlocked until a hard reload.
        // Runs in .finally, not .then: a failed request can still have written
        // the row, and refreshing when nothing changed costs nothing.
        router.refresh()
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
  const sessionBalance = result?.sessionBalance

  function handleContinue() {
    reset()
    router.push('/session')
  }

  const verbalPct = ordTotal + lasTotal > 0
    ? Math.round(((ordCorrect + lasCorrect) / (ordTotal + lasTotal)) * 100)
    : 0
  const verbalPctAnimated = useCountUp(verbalPct, true, 900)

  return (
    <div className="flex flex-col gap-5 px-4 py-8 max-w-sm mx-auto">
      <div className="text-center motion-safe:animate-fade-up">
        <p className="text-xs font-bold uppercase tracking-widest text-primary/50 mb-2">
          Diagnosprov
        </p>
        <h1 className="text-2xl font-bold text-dark">Ditt startresultat</h1>
        <p className="text-sm text-dark/65 mt-1 leading-relaxed">
          Så här presterade du på diagnosprovet.
        </p>
      </div>

      {/* Primary: measured accuracy (what we actually know) */}
      <div className="surface-hero text-cream rounded-card px-6 py-7 text-center shadow-hero motion-safe:animate-fade-up" style={{ animationDelay: '120ms' }}>
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-cream/60 mb-2">
          Verbal träffprocent
        </p>
        <p className="text-[56px] leading-none font-bold tabular-nums tracking-tight">{verbalPctAnimated}%</p>
        <p className="text-sm text-cream/65 mt-2">{ordCorrect + lasCorrect} / {ordTotal + lasTotal} rätt totalt</p>
      </div>

      {/* ORD / LÄS breakdown */}
      <div className="grid grid-cols-2 gap-3 motion-safe:animate-fade-up" style={{ animationDelay: '260ms' }}>
        <ModuleCard label="Ordförståelse" correct={ordCorrect} total={ordTotal} pct={ordPct} />
        <ModuleCard label="Läsförståelse" correct={lasCorrect} total={lasTotal} pct={lasPct} />
      </div>

      {/* Secondary: HP estimate, demoted with a beta tag because the model
          hasn't been calibrated against real HP outcomes yet (see migration 015). */}
      <div className="bg-white border border-dark/8 rounded-card px-4 py-3 motion-safe:animate-fade-up" style={{ animationDelay: '380ms' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <p className="text-[11px] font-bold uppercase tracking-widest text-dark/45">
              Beräknat HP
            </p>
            <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-dark/8 text-dark/55">
              beta
            </span>
          </div>
          <p className="text-sm text-dark/65">
            <span className="font-bold text-dark">{baselineHp.toFixed(2)}</span>
            <span className="text-dark/45"> ({hpLow.toFixed(2)}–{hpHigh.toFixed(2)})</span>
          </p>
        </div>
        <p className="text-[11px] text-dark/45 mt-1.5 leading-relaxed">
          Grov uppskattning baserad på antal rätt. Exakt HP beror på provets svårighetsgrad och
          vi lär oss från verkliga HP-resultat och uppdaterar prognosen över tid.
        </p>
      </div>

      {/* Session balance — shown when diagnostic detects an ORD/LÄS imbalance.
          Auto-picked by the API; user can switch in profile. */}
      {sessionBalance && sessionBalance !== 'balanced' && (
        <div className="bg-primary/[0.06] border border-primary/20 rounded-card px-4 py-4">
          <p className="text-xs font-bold uppercase tracking-widest text-primary/70 mb-1">
            Din studieplan: {balanceLabel(sessionBalance)}
          </p>
          <p className="text-sm text-dark/75 leading-relaxed">
            {balanceExplanation(sessionBalance)}
          </p>
          <button
            onClick={() => router.push('/profile')}
            className="mt-2 text-xs font-bold text-primary underline underline-offset-2"
          >
            Byt till balanserad →
          </button>
        </div>
      )}

      {/* Gap plan — shown once API responds */}
      {gap ? (
        <div className={`rounded-card px-4 py-4 border ${gap.isHeavy ? 'bg-amber-50 border-amber-200' : 'bg-white border-dark/8'}`}>
          <p className="text-sm font-bold text-dark mb-1">Din studieplan</p>
          {gap.newWordsNeeded === 0 ? (
            <p className="text-sm text-dark/65 leading-relaxed">
              Du är redan på rätt nivå. Fortsätt med dagliga sessioner för att hålla dig i form.
            </p>
          ) : (
            <p className="text-sm text-dark/65 leading-relaxed">
              {gap.isHeavy
                ? `${gap.newWordsNeeded} ord att lära sig på ${gap.daysLeft} dagar, ett ambitiöst mål som kräver konsekvent daglig träning.`
                : `${gap.newWordsNeeded} ord att lära sig på ${gap.daysLeft} dagar. Studerar du varje dag når du målet med god marginal.`}
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

      <div className="motion-safe:animate-fade-up" style={{ animationDelay: '500ms' }}>
        <Button fullWidth size="lg" onClick={handleContinue}>
          Starta din första träningssession →
        </Button>
      </div>
    </div>
  )
}

function ModuleCard({ label, correct, total, pct }: { label: string; correct: number; total: number; pct: number }) {
  return (
    <div className="bg-white border border-dark/[0.05] shadow-card rounded-card px-4 py-4 text-center">
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-dark/45 mb-1.5">{label}</p>
      <p className="text-3xl font-bold text-dark tracking-tight tabular-nums">{pct}%</p>
      <p className="text-xs text-dark/55 mt-1">{correct}/{total} rätt</p>
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
