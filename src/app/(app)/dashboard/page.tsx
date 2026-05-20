export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'
import {
  predictScore,
  computeLasAccuracy,
  computeVerbalAccuracy,
  computeAvgRetention,
} from '@/lib/session/scoring'
import { calculateGap } from '@/lib/session/planner'
import { logScorePrediction } from '@/lib/session/predictionLog'
import { StreakCalendar } from '@/components/dashboard/StreakCalendar'
import { DomainMap } from '@/components/dashboard/DomainMap'
import { StudyPlanCard } from '@/components/dashboard/StudyPlanCard'
import { ExamCountdown } from '@/components/dashboard/ExamCountdown'
import { LockedDashboard } from '@/components/dashboard/LockedDashboard'
import { ResumeExamCard } from '@/components/dashboard/ResumeExamCard'
import { LasTypeBreakdown } from '@/components/dashboard/LasTypeBreakdown'
import type { LasTypeStat } from '@/components/dashboard/LasTypeBreakdown'
import { Button } from '@/components/ui/Button'
import { getOnboardingState } from '@/lib/onboarding/state'

const EXAM_DURATION_MS = 30 * 60 * 1000

export default async function DashboardPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch everything in parallel
  const examResumeCutoff = new Date(Date.now() - EXAM_DURATION_MS).toISOString()
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)
  const todayStartIso = todayStart.toISOString()
  const [
    { data: profile },
    { data: streak },
    { data: fsrsCards },
    { data: recentResponses },
    { data: sessionDates },
    { data: lastTestSession },
    { data: activePlan },
    { count: totalWords },
    { count: wordsLearned },
    { data: allUserWordIds },
    { count: completedSessionCount },
    { count: completedDailyCount },
    { data: sessionDoneToday },
    { data: inProgressExam },
    { data: inProgressDaily },
    { data: lasTypeResponses },
  ] = await Promise.all([
    supabase.from('user_profiles').select('*').eq('id', user.id).single(),
    supabase.from('user_streaks').select('*').eq('user_id', user.id).single(),
    supabase
      .from('fsrs_cards')
      .select('stability, elapsed_days, reps, difficulty')
      .eq('user_id', user.id)
      .gt('reps', 0)
      .limit(500),
    supabase
      .from('session_responses')
      .select('is_correct, question_type, word_id, article_id')
      .eq('user_id', user.id)
      .order('answered_at', { ascending: false })
      .limit(200),
    // Get study session dates for calendar
    supabase
      .from('study_sessions')
      .select('started_at')
      .eq('user_id', user.id)
      .not('completed_at', 'is', null)
      .gte('started_at', firstDayOfMonth())
      .order('started_at', { ascending: true }),
    // Get last completed exam_mode session (used as fallback when no exam_schedule)
    supabase
      .from('study_sessions')
      .select('completed_at')
      .eq('user_id', user.id)
      .eq('session_type', 'exam_mode')
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    // Active study plan — for exam_schedule (Step 16b)
    supabase
      .from('study_plans')
      .select('exam_schedule')
      .eq('user_id', user.id)
      .eq('active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from('words').select('*', { count: 'exact', head: true }),
    supabase.from('fsrs_cards').select('*', { count: 'exact', head: true }).eq('user_id', user.id).gt('reps', 0),
    supabase.from('fsrs_cards').select('word_id').eq('user_id', user.id),
    supabase.from('study_sessions').select('*', { count: 'exact', head: true }).eq('user_id', user.id).not('completed_at', 'is', null),
    supabase.from('study_sessions').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('session_type', 'daily').not('completed_at', 'is', null),
    supabase.from('study_sessions').select('id').eq('user_id', user.id).eq('session_type', 'daily').not('completed_at', 'is', null).gte('completed_at', todayMidnightUTC()).limit(1).maybeSingle(),
    // In-progress övningsprov for the resume CTA: started within the last 30 min,
    // not yet completed. Timer keeps running against `started_at` regardless of
    // whether the user is on /test or somewhere else.
    supabase
      .from('study_sessions')
      .select('id, started_at')
      .eq('user_id', user.id)
      .eq('session_type', 'exam_mode')
      .is('completed_at', null)
      .gte('started_at', examResumeCutoff)
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    // In-progress daily session from today
    supabase
      .from('study_sessions')
      .select('id')
      .eq('user_id', user.id)
      .eq('session_type', 'daily')
      .is('completed_at', null)
      .gte('started_at', todayStartIso)
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('session_responses')
      .select('las_question_type, is_correct')
      .eq('user_id', user.id)
      .eq('question_type', 'las')
      .not('las_question_type', 'is', null),
  ])

  // Fetch domains for all word_ids in recentResponses
  const wordIds = Array.from(
    new Set(
      (recentResponses ?? [])
        .filter((r) => r.question_type === 'ord' && r.word_id)
        .map((r) => r.word_id as string)
    )
  )
  const { data: wordDomains } = wordIds.length
    ? await supabase.from('words').select('id, domain').in('id', wordIds)
    : { data: [] }

  // Redirect to onboarding if not yet onboarded
  if (!profile?.onboarded_at) {
    redirect('/onboarding')
  }

  // Soft-gate: until the diagnostic is done, the dashboard shows only the
  // diagnostic CTA. Studera + Plan tabs are locked in the bottom nav.
  const { diagnosticCompleted } = await getOnboardingState(supabase, user.id)
  if (!diagnosticCompleted) {
    return <LockedDashboard displayName={profile?.display_name ?? null} />
  }

  // Övningsprov scheduling (Step 16b)
  // Prefer the algorithmic schedule from study_plans.exam_schedule.
  // Fall back to the legacy "every 7 days" rule when no schedule exists yet
  // (e.g. for users created before migration 008 ran).
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const examSchedule: string[] = (activePlan?.exam_schedule as string[] | undefined) ?? []

  let nextExamDaysAway: number | null = null
  let nextExamLabel: string | null = null
  if (examSchedule.length > 0) {
    // Find the first scheduled date that is today or in the future
    const upcoming = examSchedule
      .map((s) => {
        const d = new Date(s + 'T00:00:00'); d.setHours(0, 0, 0, 0); return d
      })
      .filter((d) => d.getTime() >= today.getTime())
      .sort((a, b) => a.getTime() - b.getTime())
    if (upcoming.length > 0) {
      const first = upcoming[0]
      nextExamDaysAway = Math.round((first.getTime() - today.getTime()) / 86400000)
      nextExamLabel = nextExamDaysAway === 0
        ? 'Övningsprov idag'
        : nextExamDaysAway === 1
          ? 'Övningsprov imorgon'
          : `Nästa övningsprov om ${nextExamDaysAway} dagar`
    }
  }

  const daysSinceLastTest = lastTestSession?.completed_at
    ? Math.floor((Date.now() - new Date(lastTestSession.completed_at).getTime()) / 86400000)
    : 999
  // Show CTA when an algorithmic exam is due today/overdue, or (legacy fallback) every 7 days.
  const testAvailable = examSchedule.length > 0
    ? nextExamDaysAway !== null && nextExamDaysAway <= 0
    : daysSinceLastTest >= 7

  // Score prediction
  const lasAccuracy = computeLasAccuracy(recentResponses ?? [])
  type FsrsRow = Parameters<typeof predictScore>[0]['fsrsCards'][number]
  const cards = (fsrsCards ?? []) as FsrsRow[]
  const previousHpScore = profile?.previous_hp_score ?? null
  const previousMekScore = profile?.previous_mek_score ?? null
  const previousElfScore = profile?.previous_elf_score ?? null

  // Study plan gap analysis
  const avgRetention = computeAvgRetention(cards)
  const seenWordIds = new Set((allUserWordIds ?? []).map((r: { word_id: string }) => r.word_id))
  const unseenWords = Math.max(0, (totalWords ?? 0) - seenWordIds.size)
  const examDate = profile?.exam_date ? new Date(profile.exam_date) : null
  const targetVerbalHp = profile?.target_score ?? 1.3
  const gap = examDate
    ? calculateGap({
        baselineOrdAcc: avgRetention,
        baselineLasAcc: lasAccuracy,
        targetHp: targetVerbalHp,
        examDate,
        totalWords: unseenWords,
      })
    : null

  // predictScore returns null when user has no previous HP — show verbal % instead
  const score = predictScore({
    fsrsCards: cards,
    lasAccuracy,
    previousHpScore,
    previousMekScore,
    previousElfScore,
    sessionCount: completedSessionCount ?? 0,
  })
  const subsectionsIncomplete = previousHpScore !== null && (previousMekScore === null || previousElfScore === null)
  const verbalAccuracy = computeVerbalAccuracy(avgRetention, lasAccuracy)

  // Log this prediction snapshot for calibration (see migration 012).
  // Both paths — HP band and verbal-accuracy fallback — are recorded.
  await logScorePrediction(supabase, user.id, {
    source: 'dashboard',
    predictedLow: score?.low ?? null,
    predictedMid: score?.mid ?? null,
    predictedHigh: score?.high ?? null,
    verbalAccuracy,
    ordRetention: avgRetention,
    lasAccuracy,
    sessionCount: completedSessionCount ?? 0,
    previousHpScore,
    previousMekScore,
    previousElfScore,
  })

  const isFirstTimer = (completedDailyCount ?? 0) === 0
  const isDoneToday = !!sessionDoneToday

  // Domain accuracy map
  const domainStats = computeDomainStats(recentResponses ?? [], wordDomains ?? [])

  // LÄS question-type breakdown
  const lasTypeStats = computeLasTypeStats(lasTypeResponses ?? [])

  // Study calendar dates (days this month with completed sessions)
  const studiedDatesThisMonth = Array.from(
    new Set(
      (sessionDates ?? []).map((s: { started_at: string }) => s.started_at.slice(0, 10))
    )
  ) as string[]


  if (isFirstTimer) {
    return (
      <div className="flex flex-col gap-4 px-4 pt-5 pb-6">
        <div>
          <h1 className="text-[22px] font-bold text-dark leading-tight">
            Bra jobbat{profile?.display_name ? `, ${profile.display_name.split(' ')[0]}` : ''}!
          </h1>
          <p className="text-[13px] text-dark/65 mt-1">Nu börjar den riktiga träningen.</p>
        </div>

        <div className="bg-white shadow-card rounded-card p-5 flex flex-col gap-3">
          <p className="text-[13px] font-bold text-dark">Så här funkar en session</p>
          <div className="flex flex-col gap-2 text-[13px] text-dark/65 leading-relaxed">
            <div className="flex gap-2"><span className="text-primary">•</span><span>FSRS väljer rätt ord baserat på din nivå</span></div>
            <div className="flex gap-2"><span className="text-primary">•</span><span>ORD-frågor först, sedan en läsförståelsetext</span></div>
            <div className="flex gap-2"><span className="text-primary">•</span><span>Direkt feedback efter varje fråga</span></div>
            <div className="flex gap-2"><span className="text-primary">•</span><span>Ca 10–15 minuter per dag räcker</span></div>
          </div>
        </div>

        {gap && (
          <div className={`rounded-card px-4 py-4 border ${gap.isHeavy ? 'bg-amber-50 border-amber-200' : 'bg-white border-dark/8'}`}>
            <p className="text-sm font-bold text-dark mb-1">Din studieplan</p>
            <p className="text-sm text-dark/65 leading-relaxed">
              {gap.newWordsNeeded === 0
                ? 'Du är redan på rätt nivå. Fortsätt med dagliga sessioner för att hålla dig i form.'
                : gap.isHeavy
                  ? `${gap.newWordsNeeded} ord att lära sig på ${gap.daysLeft} dagar — ett ambitiöst mål som kräver konsekvent daglig träning.`
                  : `${gap.newWordsNeeded} ord att lära sig på ${gap.daysLeft} dagar. Studerar du varje dag når du målet med god marginal.`}
            </p>
          </div>
        )}

        <Link href="/session">
          <Button fullWidth size="lg">Starta dagens session</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-[14px] px-4 pt-5 pb-6">
      {/* Greeting + streak badge */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-dark leading-tight">
            {greeting()}{profile?.display_name ? `, ${profile.display_name.split(' ')[0]}` : ''}
          </h1>
          <p className="text-[13px] text-dark/65 mt-1">
            {isDoneToday ? 'Du har studerat idag. Bra jobbat!' : inProgressDaily ? 'Du har en session på gång' : 'Redo för dagens session?'}
          </p>
        </div>
        {streak?.current_streak ? (
          <div className="flex items-center gap-1.5 bg-gold/10 rounded-full px-3 py-1.5 shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#D4A017"><path d="M12 2c.5 3.5 4 6 4 10a4 4 0 11-8 0c0-4 3.5-6.5 4-10z"/></svg>
            <span className="text-[14px] font-bold text-gold">{streak.current_streak}</span>
          </div>
        ) : null}
      </div>

      {/* Resume in-progress övningsprov — takes priority over the daily CTA
          because the timer is still ticking and the user has limited time. */}
      {inProgressExam && <ResumeExamCard startedAt={inProgressExam.started_at} />}

      {/* CTA — primary action */}
      {isDoneToday ? (
        <div className="bg-primary/[0.06] border border-primary/20 rounded-card px-4 py-[14px] flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0F766E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-dark">Dagens session klar</p>
            <p className="text-[11px] text-dark/65 mt-0.5">Kom tillbaka imorgon för nästa session.</p>
          </div>
        </div>
      ) : (
        <Link href="/session">
          <Button fullWidth size="lg">
            {inProgressDaily ? 'Fortsätt dagens session' : 'Starta dagens session'}
          </Button>
        </Link>
      )}

      {/* Övningsprov CTA — visible only when an exam is due (today or overdue, or legacy 7-day rule) */}
      {testAvailable && (
        <Link href="/test">
          <div className="bg-gold/[0.08] border border-gold/20 rounded-card px-4 py-[14px] flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gold/[0.15] flex items-center justify-center shrink-0">
              <span className="text-gold font-bold text-sm">Ö</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-dark">
                {nextExamLabel ?? 'Övningsprov tillgängligt'}
              </p>
              <p className="text-[11px] text-dark/65 mt-0.5">
                ORD + LÄS · 30 min · provtryck utan FSRS-uppdateringar
              </p>
            </div>
            <span className="text-dark/20 text-lg">›</span>
          </div>
        </Link>
      )}

      {/* Upcoming-exam hint — when next exam is scheduled but not yet due */}
      {!testAvailable && nextExamDaysAway !== null && nextExamDaysAway > 0 && (
        <div className="bg-primary/[0.04] border border-primary/15 rounded-card px-4 py-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <span className="text-primary font-bold text-sm">Ö</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-dark">{nextExamLabel}</p>
            <p className="text-[11px] text-dark/55 mt-0.5">
              Inplanerat enligt din provplan
            </p>
          </div>
        </div>
      )}

      {/* Exam countdown */}
      <ExamCountdown
        examDate={profile?.exam_date ?? null}
        targetScore={profile?.target_score ?? null}
      />

      {/* Verbal accuracy — primary, measurable signal. The HP prediction below
          is shown as a small "beta" line because it's unvalidated against real
          HP outcomes (see audit in CLAUDE.md / migration 015). Lead with what
          we actually measure, not what we estimate. */}
      <div className="bg-white shadow-card rounded-card px-4 py-4">
        <p className="text-xs font-bold uppercase tracking-widest text-dark/65 mb-3">
          Verbal träffprocent
        </p>
        <div className="flex items-baseline gap-1.5 mb-1">
          <span className="text-4xl font-bold text-dark">
            {Math.round(verbalAccuracy * 100)}
          </span>
          <span className="text-sm text-dark/65">% ORD + LÄS</span>
        </div>
        <p className="text-xs text-dark/65 leading-relaxed">
          Andel rätt på dina senaste ord- och läsförståelsefrågor.
        </p>

        {score ? (
          <div className="mt-4 pt-3 border-t border-dark/8">
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
                <span className="font-bold text-dark">{score.mid.toFixed(2)}</span>
                <span className="text-dark/45"> ({score.low.toFixed(2)}–{score.high.toFixed(2)})</span>
              </p>
            </div>
            <p className="text-[11px] text-dark/45 mt-1 leading-relaxed">
              Grov uppskattning — kalibreras mot verkliga HP-resultat när tillräckligt med data finns.
            </p>
            {subsectionsIncomplete && (
              <Link
                href="/profile"
                className="mt-2 block text-[11px] text-primary/80 hover:text-primary transition-colors"
              >
                Lägg till {previousMekScore === null && previousElfScore === null
                  ? 'MEK- och ELF-resultat'
                  : previousMekScore === null
                    ? 'MEK-resultat'
                    : 'ELF-resultat'} i profilen för att smalna av intervallet →
              </Link>
            )}
          </div>
        ) : null}
      </div>

      {/* Study plan card */}
      <StudyPlanCard
        newWordsNeeded={gap?.newWordsNeeded ?? 0}
        daysLeft={gap?.daysLeft ?? 0}
        wordsLearned={wordsLearned ?? 0}
        totalWords={unseenWords}
        isHeavy={gap?.isHeavy ?? false}
        noExamDate={!profile?.exam_date}
        goalWords={gap?.newWordsNeeded}
      />

      {/* Domain map */}
      <DomainMap stats={domainStats} />

      {/* LÄS question-type breakdown */}
      <LasTypeBreakdown stats={lasTypeStats} />

      {/* Streak calendar */}
      <StreakCalendar
        currentStreak={streak?.current_streak ?? 0}
        totalDaysStudied={streak?.total_days_studied ?? 0}
        studiedDates={studiedDatesThisMonth}
      />
    </div>
  )
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function greeting() {
  const h = new Date().getHours()
  if (h < 10) return 'God morgon'
  if (h < 13) return 'God förmiddag'
  if (h < 18) return 'God eftermiddag'
  return 'God kväll'
}

function firstDayOfMonth(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

function todayMidnightUTC(): string {
  const d = new Date()
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}T00:00:00Z`
}

type ResponseRow = { is_correct: boolean; question_type: string; word_id: string | null }

function computeLasTypeStats(
  responses: { las_question_type: string | null; is_correct: boolean }[]
): LasTypeStat[] {
  const stats: Record<string, { correct: number; total: number }> = {}
  for (const r of responses) {
    if (!r.las_question_type) continue
    if (!stats[r.las_question_type]) stats[r.las_question_type] = { correct: 0, total: 0 }
    stats[r.las_question_type].total++
    if (r.is_correct) stats[r.las_question_type].correct++
  }
  return Object.entries(stats).map(([type, s]) => ({ type, ...s }))
}

function computeDomainStats(
  responses: ResponseRow[],
  wordDomains: { id: string; domain: string }[]
) {
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

  return Object.entries(stats).map(([domain, s]) => ({ domain, ...s }))
}

