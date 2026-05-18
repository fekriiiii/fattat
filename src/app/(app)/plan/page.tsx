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

  // Cutoff for the 14-day trend window. We pull all responses since then so we
  // can split into "this week" vs "prior week" client-side without a second query.
  const fourteenDaysAgo = new Date(Date.now() - 14 * 86_400_000).toISOString()
  const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000).toISOString()

  const [
    { data: profile },
    { data: fsrsCards },
    { data: recentResponses },
    { data: studyPlan },
    { count: totalWords },
    { count: wordsLearned },
    { data: allUserWordIds },
    { data: sessionsThisWeek },
  ] = await Promise.all([
    supabase.from('user_profiles').select('*').eq('id', user.id).single(),
    supabase.from('fsrs_cards').select('stability, elapsed_days, reps, difficulty').eq('user_id', user.id).limit(1000),
    // Pull last 14 days of responses (no count limit) for trend + domain stats.
    supabase
      .from('session_responses')
      .select('is_correct, question_type, word_id, answered_at')
      .eq('user_id', user.id)
      .gte('answered_at', fourteenDaysAgo)
      .order('answered_at', { ascending: false }),
    supabase.from('study_plans').select('*').eq('user_id', user.id).eq('active', true).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('words').select('*', { count: 'exact', head: true }),
    supabase.from('fsrs_cards').select('*', { count: 'exact', head: true }).eq('user_id', user.id).gt('reps', 0),
    supabase.from('fsrs_cards').select('word_id').eq('user_id', user.id),
    // Sessions completed in the last 7 days — drives the "veckans plan" card.
    supabase
      .from('study_sessions')
      .select('id, session_type, completed_at')
      .eq('user_id', user.id)
      .not('completed_at', 'is', null)
      .gte('completed_at', sevenDaysAgo),
  ])

  // Fetch domains for ORD word_ids seen in the response window, for the
  // weakest-domain focus card.
  const ordWordIds = Array.from(
    new Set(
      (recentResponses ?? [])
        .filter((r) => r.question_type === 'ord' && r.word_id)
        .map((r) => r.word_id as string)
    )
  )
  const { data: wordDomains } = ordWordIds.length
    ? await supabase.from('words').select('id, domain').in('id', ordWordIds)
    : { data: [] }

  if (!profile?.onboarded_at) redirect('/onboarding')

  // Soft-gate: Plan is meaningless without a baseline — bounce to /dashboard,
  // which renders the diagnostic CTA when the diagnostic isn't done yet.
  const { diagnosticCompleted } = await getOnboardingState(supabase, user.id)
  if (!diagnosticCompleted) redirect('/dashboard')

  const seenWordIds = new Set((allUserWordIds ?? []).map((r: { word_id: string }) => r.word_id))
  const unseenWords = Math.max(0, (totalWords ?? 0) - seenWordIds.size)

  const cards = (fsrsCards ?? []) as FsrsCard[]
  const ordRetention = computeAvgRetention(cards)
  const lasAccuracy = computeLasAccuracy(recentResponses ?? [])
  const previousHpScore = profile?.previous_hp_score ?? null
  const targetHp = profile?.target_score ?? 1.3
  const examDate = profile?.exam_date ? new Date(profile.exam_date) : null

  const gap = examDate
    ? calculateGap({
        baselineOrdAcc: ordRetention,
        baselineLasAcc: lasAccuracy,
        targetHp: targetHp,
        examDate,
        totalWords: unseenWords,
      })
    : null

  const examLabel = examDate
    ? examDate.toLocaleDateString('sv-SE', { day: 'numeric', month: 'long', year: 'numeric' })
    : null

  // Weekly trend — accuracy this week vs prior week (both windows from the
  // same 14-day fetch). We require ≥5 responses in the current week before
  // showing anything; below that, the number swings too much to be useful.
  const trend = computeWeeklyTrend(recentResponses ?? [])

  // Weakest ORD domain over the last 14 days, ignoring domains with too few
  // samples to be honest (<5 responses).
  const weakestDomain = computeWeakestDomain(recentResponses ?? [], wordDomains ?? [])

  // Weekly rhythm — how many sessions are done, how many remain, and what
  // övningsprov fall inside the next 7 days.
  const sessionsDoneThisWeek = (sessionsThisWeek ?? []).filter((s) => s.session_type === 'daily').length
  const examsDoneThisWeek = (sessionsThisWeek ?? []).filter((s) => s.session_type === 'exam_mode').length
  const dailyQuota = studyPlan?.daily_ord_quota ?? null
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const inSevenDays = new Date(today.getTime() + 7 * 86_400_000)
  const upcomingExamsThisWeek = (Array.isArray(studyPlan?.exam_schedule) ? studyPlan.exam_schedule as string[] : [])
    .map((s) => {
      const d = new Date(s + 'T00:00:00'); d.setHours(0, 0, 0, 0); return d
    })
    .filter((d) => d.getTime() >= today.getTime() && d.getTime() < inSevenDays.getTime())
    .sort((a, b) => a.getTime() - b.getTime())

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

      {/* Weekly trend — measured progress, not predicted */}
      {trend && (
        <div className="bg-white border border-dark/8 rounded-card px-4 py-4">
          <p className="text-xs font-bold uppercase tracking-widest text-dark/65 mb-2">
            Veckans utveckling
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-dark">{Math.round(trend.thisWeek * 100)}%</span>
            <span className="text-sm text-dark/65">rätt senaste 7 dagarna</span>
          </div>
          {trend.priorWeek !== null ? (
            <p className={`text-sm mt-1 leading-relaxed ${trend.delta >= 0 ? 'text-primary' : 'text-dark/65'}`}>
              {trend.delta > 0 && '↑ '}
              {trend.delta < 0 && '↓ '}
              {trend.delta === 0
                ? 'Samma som veckan innan'
                : `${trend.delta > 0 ? '+' : ''}${Math.round(trend.delta * 100)} jämfört med veckan innan (${Math.round(trend.priorWeek * 100)}%)`}
            </p>
          ) : (
            <p className="text-sm text-dark/55 mt-1 leading-relaxed">
              Studera några dagar till så visar vi din veckoutveckling.
            </p>
          )}
          <p className="text-[11px] text-dark/45 mt-2">
            Baserat på {trend.thisWeekCount} svar denna vecka.
          </p>
        </div>
      )}

      {/* Weekly focus — names the weakest domain so the silent intelligence
          (FSRS + domain-aware article selection) becomes visible to the user.
          CTA below launches a session weighted toward this domain. */}
      {weakestDomain && (
        <div className="bg-primary/[0.06] border border-primary/15 rounded-card px-4 py-4">
          <p className="text-xs font-bold uppercase tracking-widest text-primary/70 mb-1">
            Veckans fokus
          </p>
          <p className="text-base font-bold text-dark capitalize">
            {weakestDomain.domain}
          </p>
          <p className="text-sm text-dark/65 mt-1 leading-relaxed">
            Din svagaste domän just nu — {Math.round(weakestDomain.accuracy * 100)}% rätt
            på senaste {weakestDomain.total} ord. Fattat visar fler ord och texter från
            det här området så att du tränar där det behövs mest.
          </p>
          <Link
            href={`/session?focus=${encodeURIComponent(weakestDomain.domain)}`}
            className="mt-3 inline-block text-sm font-bold text-primary hover:text-primary/80 transition-colors"
          >
            Träna {weakestDomain.domain} nu →
          </Link>
        </div>
      )}

      {/* Weekly rhythm — concrete shape of the next 7 days. Replaces abstract
          "X words in Y days" framing with something a student can hold onto. */}
      {studyPlan && (
        <div className="bg-white border border-dark/8 rounded-card px-4 py-4">
          <p className="text-xs font-bold uppercase tracking-widest text-dark/65 mb-3">
            Den här veckan
          </p>
          <div className="flex flex-col gap-2 text-sm text-dark leading-relaxed">
            <div className="flex justify-between">
              <span>Sessioner gjorda</span>
              <span className="font-bold">{sessionsDoneThisWeek} av 7</span>
            </div>
            {dailyQuota !== null && (
              <div className="flex justify-between">
                <span>Ord per session</span>
                <span className="font-bold">~{dailyQuota}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Övningsprov</span>
              <span className="font-bold">
                {upcomingExamsThisWeek.length === 0 && examsDoneThisWeek === 0
                  ? 'Inga denna vecka'
                  : upcomingExamsThisWeek.length > 0
                    ? upcomingExamsThisWeek
                        .map((d) => d.toLocaleDateString('sv-SE', { weekday: 'short', day: 'numeric', month: 'short' }))
                        .join(', ')
                    : `${examsDoneThisWeek} klart`}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Gap summary */}
      {gap && gap.daysLeft > 0 && (
        <div className={`rounded-card px-4 py-4 border ${gap.isHeavy ? 'bg-amber-50 border-amber-200' : 'bg-white border-dark/8'}`}>
          {gap.newWordsNeeded === 0 ? (
            <>
              <p className="text-sm font-bold text-dark mb-1">Du är på rätt nivå</p>
              <p className="text-sm text-dark/65 leading-relaxed">
                Fortsätt med dagliga sessioner för att hålla dig i form inför provet.
              </p>
            </>
          ) : (
            <>
              <p className="text-sm font-bold text-dark mb-1">
                {gap.newWordsNeeded} ord att lära sig på {gap.daysLeft} dagar
              </p>
              <p className="text-sm text-dark/65 leading-relaxed">
                {gap.isHeavy
                  ? `Det är ett ambitiöst mål. Studerar du varje dag utan avbrott kan du nå det — men det krävs konsekvent träning hela vägen.`
                  : `Det är ungefär ${gap.dailyNewWords} nya ord per session. Studerar du varje dag når du målet med marginal.`}
              </p>
            </>
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
            <span className="text-dark/65">av {gap?.newWordsNeeded ?? unseenWords + (wordsLearned ?? 0)} {gap?.newWordsNeeded ? 'målet' : 'totalt'}</span>
          </div>
          <div className="w-full h-2 bg-dark/8 rounded-full overflow-hidden mb-2">
            <div
              className="h-full bg-primary rounded-full"
              style={{ width: `${Math.round(((wordsLearned ?? 0) / Math.max(gap?.newWordsNeeded ?? 1, 1)) * 100)}%` }}
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

      {/* Disclaimer */}
      <p className="text-xs text-dark/60 text-center leading-relaxed px-2">
        Planen uppdateras automatiskt när du studerar. Veckans utveckling och fokus
        bygger på dina senaste svar.
      </p>

    </div>
  )
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

type TrendResponse = { is_correct: boolean; answered_at: string; question_type: string }

function computeWeeklyTrend(
  responses: TrendResponse[]
): { thisWeek: number; priorWeek: number | null; delta: number; thisWeekCount: number } | null {
  const now = Date.now()
  const day = 86_400_000

  const thisWeek: TrendResponse[] = []
  const priorWeek: TrendResponse[] = []
  for (const r of responses) {
    const age = now - new Date(r.answered_at).getTime()
    if (age < 7 * day) thisWeek.push(r)
    else if (age < 14 * day) priorWeek.push(r)
  }

  // Need at least 5 responses this week before showing — below that the
  // percentage swings too wildly to be honest.
  if (thisWeek.length < 5) return null

  const thisAcc = thisWeek.filter((r) => r.is_correct).length / thisWeek.length
  const priorAcc = priorWeek.length >= 5
    ? priorWeek.filter((r) => r.is_correct).length / priorWeek.length
    : null

  return {
    thisWeek: thisAcc,
    priorWeek: priorAcc,
    delta: priorAcc !== null ? thisAcc - priorAcc : 0,
    thisWeekCount: thisWeek.length,
  }
}

type DomainResponse = { is_correct: boolean; question_type: string; word_id: string | null }

function computeWeakestDomain(
  responses: DomainResponse[],
  wordDomains: { id: string; domain: string }[]
): { domain: string; accuracy: number; total: number } | null {
  if (responses.length === 0 || wordDomains.length === 0) return null
  const domainOf = new Map(wordDomains.map((w) => [w.id, w.domain]))
  const stats: Record<string, { correct: number; total: number }> = {}

  for (const r of responses) {
    if (r.question_type !== 'ord' || !r.word_id) continue
    const domain = domainOf.get(r.word_id)
    if (!domain) continue
    if (!stats[domain]) stats[domain] = { correct: 0, total: 0 }
    stats[domain].total++
    if (r.is_correct) stats[domain].correct++
  }

  // Ignore domains with <5 responses (too noisy). Pick the one with lowest
  // accuracy among the rest. If nothing qualifies, return null.
  const eligible = Object.entries(stats)
    .filter(([, s]) => s.total >= 5)
    .map(([domain, s]) => ({ domain, accuracy: s.correct / s.total, total: s.total }))

  if (eligible.length === 0) return null
  eligible.sort((a, b) => a.accuracy - b.accuracy)
  return eligible[0]
}

