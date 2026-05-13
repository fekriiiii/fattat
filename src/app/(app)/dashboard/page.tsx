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
import { ScoreGauge } from '@/components/dashboard/ScoreGauge'
import { StreakCalendar } from '@/components/dashboard/StreakCalendar'
import { DomainMap } from '@/components/dashboard/DomainMap'
import { StudyPlanCard } from '@/components/dashboard/StudyPlanCard'
import { ExamCountdown } from '@/components/dashboard/ExamCountdown'
import { LockedDashboard } from '@/components/dashboard/LockedDashboard'
import { ResumeExamCard } from '@/components/dashboard/ResumeExamCard'
import { Button } from '@/components/ui/Button'
import { getOnboardingState } from '@/lib/onboarding/state'

const EXAM_DURATION_MS = 30 * 60 * 1000

export default async function DashboardPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch everything in parallel
  const examResumeCutoff = new Date(Date.now() - EXAM_DURATION_MS).toISOString()
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
    { count: completedSessionCount },
    { data: inProgressExam },
  ] = await Promise.all([
    supabase.from('user_profiles').select('*').eq('id', user.id).single(),
    supabase.from('user_streaks').select('*').eq('user_id', user.id).single(),
    supabase
      .from('fsrs_cards')
      .select('stability, elapsed_days, reps')
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
    supabase.from('study_sessions').select('*', { count: 'exact', head: true }).eq('user_id', user.id).not('completed_at', 'is', null),
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
  const examDate = profile?.exam_date ? new Date(profile.exam_date) : null
  const targetVerbalHp = previousHpScore !== null
    ? Math.min(2.0, Math.max(0, 2 * (profile?.target_score ?? 1.3) - previousHpScore))
    : (profile?.target_score ?? 1.3)
  const gap = examDate
    ? calculateGap({
        baselineOrdAcc: avgRetention,
        baselineLasAcc: lasAccuracy,
        targetHp: targetVerbalHp,
        examDate,
        totalWords: totalWords ?? 0,
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

  // Domain accuracy map
  const domainStats = computeDomainStats(recentResponses ?? [], wordDomains ?? [])

  // Study calendar dates (days this month with completed sessions)
  const studiedDatesThisMonth = Array.from(
    new Set(
      (sessionDates ?? []).map((s: { started_at: string }) => s.started_at.slice(0, 10))
    )
  ) as string[]


  return (
    <div className="flex flex-col gap-[14px] px-4 pt-5 pb-6">
      {/* Greeting + streak badge */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-dark leading-tight">
            {greeting()}{profile?.display_name ? `, ${profile.display_name.split(' ')[0]}` : ''}
          </h1>
          <p className="text-[13px] text-dark/65 mt-1">Redo för dagens session?</p>
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
      <Link href="/session">
        <Button fullWidth size="lg">
          Starta dagens session
        </Button>
      </Link>

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

      {/* Score gauge — only when previous HP is known */}
      {score ? (
        <div className="flex flex-col gap-2">
          <ScoreGauge
            low={score.low}
            high={score.high}
            mid={score.mid}
            target={profile?.target_score ?? null}
          />
          {subsectionsIncomplete && (
            <Link
              href="/profile"
              className="text-xs text-dark/55 px-3 py-2 bg-primary/[0.04] border border-primary/15 rounded-card leading-relaxed hover:bg-primary/[0.07] transition-colors"
            >
              Lägg till dina tidigare {previousMekScore === null && previousElfScore === null
                ? 'MEK- och ELF-resultat'
                : previousMekScore === null
                  ? 'MEK-resultat'
                  : 'ELF-resultat'}{' '}
              i profilen för att smalna av intervallet ovan →
            </Link>
          )}
        </div>
      ) : (
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
            Lägg till ditt tidigare HP-resultat i profilen för att se ett beräknat HP-betyg.
          </p>
        </div>
      )}

      {/* Study plan card */}
      <StudyPlanCard
        minutesPerDay={gap?.estimatedMinutesPerDay ?? 0}
        dailyNewWords={gap?.dailyNewWords ?? 0}
        wordsLearned={wordsLearned ?? 0}
        totalWords={totalWords ?? 0}
        isHeavy={gap?.isHeavy ?? false}
        noExamDate={!profile?.exam_date}
      />

      {/* Domain map */}
      <DomainMap stats={domainStats} />

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

type ResponseRow = { is_correct: boolean; question_type: string; word_id: string | null }

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

