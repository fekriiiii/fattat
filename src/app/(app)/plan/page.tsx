export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'
import { computeAvgRetention, computeLasAccuracy } from '@/lib/session/scoring'
import { calculateGap } from '@/lib/session/planner'
import { getOnboardingState } from '@/lib/onboarding/state'
import { ExamScheduleList } from '@/components/plan/ExamScheduleList'
import { RESCHEDULE_CAP } from '@/lib/session/reschedule'
import type { FsrsCard } from '@/types/database'

export default async function PlanPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { data: profile },
    { data: fsrsCards },
    { data: recentResponses },
    { data: studyPlan },
    { count: totalWords },
    { count: wordsLearned },
  ] = await Promise.all([
    supabase.from('user_profiles').select('*').eq('id', user.id).single(),
    supabase.from('fsrs_cards').select('stability, elapsed_days, reps').eq('user_id', user.id).limit(1000),
    supabase.from('session_responses').select('is_correct, question_type').eq('user_id', user.id).order('answered_at', { ascending: false }).limit(200),
    supabase.from('study_plans').select('*').eq('user_id', user.id).eq('active', true).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('words').select('*', { count: 'exact', head: true }),
    supabase.from('fsrs_cards').select('*', { count: 'exact', head: true }).eq('user_id', user.id).gt('reps', 0),
  ])

  if (!profile?.onboarded_at) redirect('/onboarding')

  // Soft-gate: Plan is meaningless without a baseline — bounce to /dashboard,
  // which renders the diagnostic CTA when the diagnostic isn't done yet.
  const { diagnosticCompleted } = await getOnboardingState(supabase, user.id)
  if (!diagnosticCompleted) redirect('/dashboard')

  const cards = (fsrsCards ?? []) as FsrsCard[]
  const ordRetention = computeAvgRetention(cards)
  const lasAccuracy = computeLasAccuracy(recentResponses ?? [])
  const targetHp = profile?.target_score ?? 1.0
  const previousHpScore = profile?.previous_hp_score ?? null
  const examDate = profile?.exam_date ? new Date(profile.exam_date) : null

  // Adjust target to verbal HP when we know the quant component
  const targetVerbalHp = previousHpScore !== null
    ? Math.min(2.0, Math.max(0, 2 * targetHp - previousHpScore))
    : targetHp

  const gap = examDate
    ? calculateGap({
        baselineOrdAcc: ordRetention,
        baselineLasAcc: lasAccuracy,
        targetHp: targetVerbalHp,
        examDate,
        totalWords: totalWords ?? 0,
      })
    : null

  const examLabel = examDate
    ? examDate.toLocaleDateString('sv-SE', { day: 'numeric', month: 'long', year: 'numeric' })
    : null

  const weeklyGoals = studyPlan?.weekly_goals ?? []

  return (
    <div className="flex flex-col gap-4 px-4 pt-4 pb-8 max-w-sm mx-auto">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-dark">Din studieplan</h1>
        {examLabel && (
          <p className="text-sm text-dark/65 mt-0.5">
            HP {examLabel} · {gap?.daysLeft ?? 0} dagar kvar
          </p>
        )}
      </div>

      {/* Goal */}
      <div className="bg-primary rounded-card px-4 py-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-cream/60 mb-1">Mål</p>
          <p className="text-3xl font-bold text-cream">{targetHp.toFixed(2)} HP</p>
        </div>
        {previousHpScore !== null && (
          <div className="text-right">
            <p className="text-xs text-cream/60 mb-1">Tidigare HP</p>
            <p className="text-xl font-bold text-cream">{previousHpScore.toFixed(2)}</p>
          </div>
        )}
      </div>

      {/* No exam date */}
      {!examDate && (
        <div className="bg-amber-50 border border-amber-200 rounded-card px-4 py-4">
          <p className="text-sm font-bold text-dark mb-1">Inget provdatum inställt</p>
          <p className="text-sm text-dark/65 leading-relaxed">
            Lägg till ditt provdatum i profilen för att se din personliga studieplan.
          </p>
          <Link href="/profile" className="text-sm font-bold text-primary mt-2 block">
            Gå till profilen →
          </Link>
        </div>
      )}

      {/* Daily commitment */}
      {gap && gap.daysLeft > 0 && (
        <div className={`rounded-card px-4 py-4 border ${gap.isHeavy ? 'bg-amber-50 border-amber-200' : 'bg-white border-dark/8'}`}>
          <p className="text-xs font-bold uppercase tracking-widest text-dark/65 mb-3">
            Din dagliga insats
          </p>

          <div className="flex gap-6 mb-4">
            <Stat value={`${gap.estimatedMinutesPerDay}`} unit="min/dag" />
            <Stat value={`${gap.dailyNewWords}`} unit="nya ord/dag" />
            <Stat value={`${gap.dailyOrdQuota}`} unit="ORD totalt/dag" />
          </div>

          <p className="text-sm text-dark/65 leading-relaxed">{gap.message}</p>

          {gap.isHeavy && (
            <div className="mt-3 pt-3 border-t border-amber-200">
              <p className="text-xs font-bold text-amber-800 mb-1">Alternativt tempo</p>
              <p className="text-xs text-amber-700 leading-relaxed">
                Vid 10 nya ord per dag kan du nå{' '}
                <strong>{gap.achievableHp.toFixed(2)} HP</strong> — ett lugnare men
                fortfarande starkt resultat.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Word progress */}
      {(totalWords ?? 0) > 0 && (
        <div className="bg-white border border-dark/8 rounded-card px-4 py-4">
          <p className="text-xs font-bold uppercase tracking-widest text-dark/65 mb-3">
            Ordförrådet
          </p>
          <div className="flex justify-between text-sm mb-2">
            <span className="font-bold text-dark">{wordsLearned ?? 0} ord påbörjade</span>
            <span className="text-dark/65">av {totalWords} totalt</span>
          </div>
          <div className="w-full h-2 bg-dark/8 rounded-full overflow-hidden mb-2">
            <div
              className="h-full bg-primary rounded-full"
              style={{ width: `${Math.round(((wordsLearned ?? 0) / (totalWords ?? 1)) * 100)}%` }}
            />
          </div>
          {gap && gap.newWordsNeeded > 0 && (
            <p className="text-xs text-dark/65">
              {gap.newWordsNeeded} ord kvar att lära sig för att nå målet
            </p>
          )}
        </div>
      )}

      {/* Inplanerade övningsprov (Step 16b) — with reschedule buttons */}
      {Array.isArray(studyPlan?.exam_schedule) && studyPlan.exam_schedule.length > 0 && (() => {
        const today = new Date(); today.setHours(0, 0, 0, 0)
        const upcoming = (studyPlan.exam_schedule as string[])
          .filter((s) => new Date(s + 'T00:00:00').getTime() >= today.getTime())
          .sort()
        if (upcoming.length === 0) return null
        const used = studyPlan?.exam_reschedules_used ?? 0
        const remaining = Math.max(0, RESCHEDULE_CAP - used)
        return <ExamScheduleList upcoming={upcoming} rescheduleRemaining={remaining} />
      })()}

      {/* Week-by-week plan */}
      {weeklyGoals.length > 0 && (
        <div className="bg-white border border-dark/8 rounded-card px-4 py-4">
          <p className="text-xs font-bold uppercase tracking-widest text-dark/65 mb-3">
            Veckoplan
          </p>
          <div className="flex flex-col gap-3">
            {weeklyGoals.map((week: { week: number; focus: string; ord_target: number; las_target: number }) => (
              <div key={week.week} className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-primary">{week.week}</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-dark">{week.focus}</p>
                  <p className="text-xs text-dark/65 mt-0.5">
                    {week.ord_target} ord · {week.las_target} artiklar
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <p className="text-xs text-dark/60 text-center leading-relaxed px-2">
        Planen uppdateras automatiskt när du studerar. HP-uppskattningen bygger på din
        verbala träning — exakt resultat beror på provets svårighetsgrad.
      </p>

    </div>
  )
}

function Stat({ value, unit }: { value: string; unit: string }) {
  return (
    <div>
      <p className="text-2xl font-bold text-dark leading-none">{value}</p>
      <p className="text-xs text-dark/65 mt-1">{unit}</p>
    </div>
  )
}
