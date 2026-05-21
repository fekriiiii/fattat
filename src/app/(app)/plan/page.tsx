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
    supabase.from('fsrs_cards').select('stability, elapsed_days, reps, difficulty, lapses, miss_count, word_id').eq('user_id', user.id).limit(2000),
    supabase
      .from('session_responses')
      .select('is_correct, question_type, word_id, answered_at, las_question_type')
      .eq('user_id', user.id)
      .gte('answered_at', fourteenDaysAgo)
      .order('answered_at', { ascending: false }),
    supabase.from('study_plans').select('*').eq('user_id', user.id).eq('active', true).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('words').select('*', { count: 'exact', head: true }),
    supabase.from('fsrs_cards').select('*', { count: 'exact', head: true }).eq('user_id', user.id).gt('reps', 0),
    supabase.from('fsrs_cards').select('word_id').eq('user_id', user.id),
    supabase
      .from('study_sessions')
      .select('id, session_type, completed_at')
      .eq('user_id', user.id)
      .not('completed_at', 'is', null)
      .gte('completed_at', sevenDaysAgo),
  ])

  // ORD domains for response window — used by domain map
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

  // Fragile words: cards with lapses, sorted worst first, fetch word text
  const cards = (fsrsCards ?? []) as FsrsCard[]
  const fragileCardIds = cards
    .filter((c) => c.lapses > 0)
    .sort((a, b) => b.lapses - a.lapses || a.stability - b.stability)
    .slice(0, 8)
    .map((c) => c.word_id)

  const { data: fragileWordsData } = fragileCardIds.length
    ? await supabase.from('words').select('id, word, domain').in('id', fragileCardIds)
    : { data: [] }

  if (!profile?.onboarded_at) redirect('/onboarding')

  const { diagnosticCompleted } = await getOnboardingState(supabase, user.id)
  if (!diagnosticCompleted) redirect('/dashboard')

  const seenWordIds = new Set((allUserWordIds ?? []).map((r: { word_id: string }) => r.word_id))
  const unseenWords = Math.max(0, (totalWords ?? 0) - seenWordIds.size)

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

  const trend = computeWeeklyTrend(recentResponses ?? [])
  const allDomains = computeAllDomains(recentResponses ?? [], wordDomains ?? [])

  const fragileWordsList = (fragileWordsData ?? [])
    .map((w) => {
      const card = cards.find((c) => c.word_id === w.id)
      return {
        word: w.word,
        domain: w.domain,
        lapses: card?.lapses ?? 0,
        stability: card?.stability ?? 0,
      }
    })
    .sort((a, b) => b.lapses - a.lapses || a.stability - b.stability)

  const lasSubtypes = computeLasSubtypes(recentResponses ?? [])
  const coachInsight = generateCoachInsight(allDomains, fragileWordsList, lasSubtypes)

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

  const hasCoachData = allDomains.length > 0 || fragileWordsList.length > 0 || lasSubtypes.length > 0

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

      {/* Weekly trend */}
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

      {/* Weekly rhythm */}
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

      {/* Exam schedule */}
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

      {/* ── Tränarens analys ──────────────────────────────────────────────────── */}
      <div className="pt-2">
        <h2 className="text-lg font-bold text-dark mb-3">Tränarens analys</h2>

        {!hasCoachData ? (
          <div className="bg-white border border-dark/8 rounded-card px-4 py-4">
            <p className="text-sm text-dark/65 leading-relaxed">
              Gör ditt första pass för att aktivera tränaranalysen.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">

            {/* Coach insight — the interpretation, not just the numbers */}
            {coachInsight && (
              <div className="border-l-4 border-primary bg-primary/[0.04] rounded-r-card px-4 py-4">
                <p className="text-sm leading-relaxed text-dark">{coachInsight}</p>
              </div>
            )}

            {/* Domain map */}
            {allDomains.length > 0 && (
              <div className="bg-white border border-dark/8 rounded-card px-4 py-4">
                <p className="text-xs font-bold uppercase tracking-widest text-dark/65 mb-3">
                  Domänkarta — ORD
                </p>
                <div className="flex flex-col gap-3">
                  {allDomains.map((d) => (
                    <div key={d.domain}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="capitalize text-dark">{d.domain}</span>
                        <span className={`font-bold ${d.accuracy < 0.6 ? 'text-red-500' : d.accuracy < 0.75 ? 'text-amber-500' : 'text-primary'}`}>
                          {Math.round(d.accuracy * 100)}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-dark/8 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${d.accuracy < 0.6 ? 'bg-red-400' : d.accuracy < 0.75 ? 'bg-amber-400' : 'bg-primary'}`}
                          style={{ width: `${Math.round(d.accuracy * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Fragile words */}
            {fragileWordsList.length > 0 && (
              <div className="bg-white border border-dark/8 rounded-card px-4 py-4">
                <p className="text-xs font-bold uppercase tracking-widest text-dark/65 mb-3">
                  Dina svagaste ord
                </p>
                <div className="flex flex-col divide-y divide-dark/6">
                  {fragileWordsList.map((w) => (
                    <div key={w.word} className="flex items-center justify-between py-2 first:pt-0 last:pb-0">
                      <div>
                        <span className="text-sm font-bold text-dark">{w.word}</span>
                        <span className="text-xs text-dark/45 ml-2 capitalize">{w.domain}</span>
                      </div>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${w.lapses >= 3 ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>
                        {w.lapses} {w.lapses === 1 ? 'laps' : 'lapsar'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* LÄS breakdown */}
            {lasSubtypes.length > 0 && (
              <div className="bg-white border border-dark/8 rounded-card px-4 py-4">
                <p className="text-xs font-bold uppercase tracking-widest text-dark/65 mb-3">
                  LÄS-analys
                </p>
                <div className="flex flex-col gap-3">
                  {lasSubtypes.map((s) => (
                    <div key={s.type}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-dark">{LAS_TYPE_LABELS[s.type] ?? s.type}</span>
                        <span className={`font-bold ${s.accuracy < 0.5 ? 'text-red-500' : s.accuracy < 0.7 ? 'text-amber-500' : 'text-primary'}`}>
                          {Math.round(s.accuracy * 100)}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-dark/8 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${s.accuracy < 0.5 ? 'bg-red-400' : s.accuracy < 0.7 ? 'bg-amber-400' : 'bg-primary'}`}
                          style={{ width: `${Math.round(s.accuracy * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}
      </div>

      {/* Disclaimer */}
      <p className="text-xs text-dark/60 text-center leading-relaxed px-2">
        Planen och tränaranalysen uppdateras automatiskt när du studerar.
      </p>

    </div>
  )
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const LAS_TYPE_LABELS: Record<string, string> = {
  huvudtanke: 'Huvudtanke',
  detalj_fakta: 'Detaljfrågor',
  detalj_kausal: 'Orsakssamband',
  syfte_funktion: 'Syfte & funktion',
  slutledning: 'Slutledning',
  jämförande: 'Jämförande',
  ståndpunkt: 'Ståndpunkt',
}

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

function computeAllDomains(
  responses: DomainResponse[],
  wordDomains: { id: string; domain: string }[]
): { domain: string; accuracy: number; total: number }[] {
  if (responses.length === 0 || wordDomains.length === 0) return []
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

  return Object.entries(stats)
    .filter(([, s]) => s.total >= 5)
    .map(([domain, s]) => ({ domain, accuracy: s.correct / s.total, total: s.total }))
    .sort((a, b) => a.accuracy - b.accuracy)
}

function generateCoachInsight(
  allDomains: { domain: string; accuracy: number; total: number }[],
  fragileWordsList: { word: string; domain: string; lapses: number; stability: number }[],
  lasSubtypes: { type: string; accuracy: number; total: number }[]
): string | null {
  const weakestDomain = allDomains[0]
  const topFragile = fragileWordsList.slice(0, 3)
  const weakestLas = lasSubtypes[0]

  const parts: string[] = []

  const joinWords = (words: string[]) =>
    words.length === 1
      ? words[0]
      : words.length === 2
      ? `${words[0]} och ${words[1]}`
      : `${words.slice(0, -1).join(', ')} och ${words[words.length - 1]}`

  if (topFragile.length > 0) {
    const wordStr = joinWords(topFragile.map((w) => w.word))
    if (weakestDomain && weakestDomain.accuracy < 0.75) {
      parts.push(
        `Du tappar mest på ${weakestDomain.domain}-ord — ${Math.round(weakestDomain.accuracy * 100)}% rätt. ` +
        `De ord som fastnat minst är ${wordStr}. FSRS schemalägger dem tätare tills de sitter.`
      )
    } else {
      parts.push(
        `${joinWords(topFragile.map((w) => w.word))} ${topFragile.length === 1 ? 'är det ord som' : 'är de ord som'} lappat flest gånger. ` +
        `De dyker upp igen snart — FSRS repeterar dem tills de fastnar.`
      )
    }
  } else if (weakestDomain && weakestDomain.accuracy < 0.7) {
    parts.push(
      `${weakestDomain.domain.charAt(0).toUpperCase() + weakestDomain.domain.slice(1)}-ord är ditt svagaste område just nu — ` +
      `${Math.round(weakestDomain.accuracy * 100)}% rätt på de senaste ${weakestDomain.total} orden. ` +
      `Fattat väljer fler ord och texter från det här området automatiskt.`
    )
  } else if (weakestDomain) {
    parts.push(
      `Du är i bra form — ${weakestDomain.domain} är fortfarande ditt svagaste område men du ligger på ${Math.round(weakestDomain.accuracy * 100)}%. ` +
      `Håll igång så sköter FSRS resten.`
    )
  }

  if (weakestLas && weakestLas.accuracy < 0.65) {
    const label = (LAS_TYPE_LABELS[weakestLas.type] ?? weakestLas.type).toLowerCase()
    if (weakestLas.type === 'slutledning') {
      parts.push(
        `I LÄS missar du mest ${label}sfrågor (${Math.round(weakestLas.accuracy * 100)}%) — de kräver att du läser mellan raderna, inte bara hittar rätt stycke.`
      )
    } else if (weakestLas.type === 'huvudtanke') {
      parts.push(
        `I LÄS är ${label} din svagaste frågetyp (${Math.round(weakestLas.accuracy * 100)}%) — fokusera på vad texten argumenterar för, inte bara vad den beskriver.`
      )
    } else {
      parts.push(
        `I LÄS är ${label} din svagaste frågetyp (${Math.round(weakestLas.accuracy * 100)}%).`
      )
    }
  }

  if (parts.length === 0) return null
  return parts.join(' ')
}

function computeLasSubtypes(
  responses: Array<{ is_correct: boolean; question_type: string; las_question_type?: string | null }>
): { type: string; accuracy: number; total: number }[] {
  const stats: Record<string, { correct: number; total: number }> = {}

  for (const r of responses) {
    if (r.question_type !== 'las' || !r.las_question_type) continue
    if (!stats[r.las_question_type]) stats[r.las_question_type] = { correct: 0, total: 0 }
    stats[r.las_question_type].total++
    if (r.is_correct) stats[r.las_question_type].correct++
  }

  return Object.entries(stats)
    .filter(([, s]) => s.total >= 3)
    .map(([type, s]) => ({ type, accuracy: s.correct / s.total, total: s.total }))
    .sort((a, b) => a.accuracy - b.accuracy)
}
