import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerClient } from '@/lib/supabase/server'
import { calculateGap, computeExamSchedule } from '@/lib/session/planner'
import { estimateDiagnosticBand, generateStudyPlan } from '@/lib/session/scoring'
import { createCard, scheduleCard, cardToDbUpdate, ratingFromAnswerWithLatency } from '@/lib/fsrs/engine'
import { logScorePrediction } from '@/lib/session/predictionLog'

const ordResponseSchema = z.object({
  wordId:       z.string().uuid(),
  isCorrect:    z.boolean(),
  responseMs:   z.number().int().min(0),
  chosenLabel:  z.string(),
  correctLabel: z.string(),
})

const schema = z.object({
  sessionId:    z.string().uuid(),
  ordCorrect:   z.number().int().min(0),
  ordTotal:     z.number().int().min(0),
  lasCorrect:   z.number().int().min(0),
  lasTotal:     z.number().int().min(0),
  ordResponses: z.array(ordResponseSchema).optional(),
})

export async function POST(req: Request) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  const { sessionId, ordCorrect, ordTotal, lasCorrect, lasTotal, ordResponses } = parsed.data

  // Mark the diagnostic session as completed
  await supabase
    .from('study_sessions')
    .update({
      completed_at: new Date().toISOString(),
      ord_count: ordTotal,
      ord_correct: ordCorrect,
      las_count: lasTotal,
      las_correct: lasCorrect,
    })
    .eq('id', sessionId)
    .eq('user_id', user.id)

  // Fetch profile, any existing plan, and total word count in parallel
  const [
    { data: profile },
    { data: activePlan },
    { count: totalWords },
  ] = await Promise.all([
    supabase.from('user_profiles').select('target_score, exam_date, previous_hp_score, previous_mek_score, previous_elf_score').eq('id', user.id).single(),
    supabase.from('study_plans').select('*').eq('user_id', user.id).eq('active', true).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('words').select('id', { count: 'exact', head: true }),
  ])

  const baselineOrdAcc = ordTotal > 0 ? ordCorrect / ordTotal : 0.5
  const baselineLasAcc = lasTotal > 0 ? lasCorrect / lasTotal : 0.5

  // Use the shared band helper so the diagnostic and dashboard agree on the
  // formula. Previously this route duplicated estimateVerbalHp() inline and
  // hardcoded the uncertainty at 0.20, which drifted from predictScore().
  const band = estimateDiagnosticBand({
    baselineOrdAcc,
    baselineLasAcc,
    previousHpScore: profile?.previous_hp_score ?? null,
    previousMekScore: profile?.previous_mek_score ?? null,
    previousElfScore: profile?.previous_elf_score ?? null,
  })
  const baselineHp = band.mid
  const hpLow = band.low
  const hpHigh = band.high

  // Log the prediction for later calibration (see migration 012). Both return
  // paths below show this same band to the user, so we log it here once.
  await logScorePrediction(supabase, user.id, {
    source: 'diagnostic_complete',
    predictedLow: hpLow,
    predictedMid: baselineHp,
    predictedHigh: hpHigh,
    verbalAccuracy: (baselineOrdAcc + baselineLasAcc) / 2,
    ordRetention: baselineOrdAcc,
    lasAccuracy: baselineLasAcc,
    sessionCount: 0,
    previousHpScore: profile?.previous_hp_score ?? null,
    previousMekScore: profile?.previous_mek_score ?? null,
    previousElfScore: profile?.previous_elf_score ?? null,
    sessionId,
    meta: { ordTotal, lasTotal },
  })

  // Can't calculate gap without an exam date and target score
  if (!profile?.exam_date || !profile?.target_score) {
    await seedFsrsFromDiagnostic(supabase, user.id, sessionId, ordResponses ?? [])
    return NextResponse.json({ gap: null, baselineHp, hpLow, hpHigh, noExamDate: !profile?.exam_date })
  }

  const gap = calculateGap({
    baselineOrdAcc,
    baselineLasAcc,
    targetHp: profile.target_score,
    examDate: new Date(profile.exam_date),
    totalWords: Math.max(totalWords ?? 500, 500),
  })

  const updatedGoals = generateStudyPlan(
    baselineHp,
    profile.target_score,
    new Date(profile.exam_date),
    gap.dailyOrdQuota
  )

  // Compute the exam schedule (Step 16b, v1: phase-based pacing).
  // Anchor to the original plan's created_at if one exists, so the schedule
  // stays stable across rediagnostics when the exam date is unchanged.
  const examDate = new Date(profile.exam_date)
  const planStart = activePlan ? new Date(activePlan.created_at) : new Date()
  const daysTotal = Math.max(
    0,
    Math.ceil((examDate.getTime() - planStart.getTime()) / 86_400_000)
  )
  const examSchedule = computeExamSchedule(daysTotal, planStart)

  // Update existing plan, or create one if the user skipped exam date during onboarding
  if (activePlan) {
    await supabase
      .from('study_plans')
      .update({
        baseline_score: baselineHp,
        daily_ord_quota: gap.dailyOrdQuota,
        weekly_goals: updatedGoals,
        exam_schedule: examSchedule,
      })
      .eq('id', activePlan.id)
  } else {
    await supabase.from('study_plans').insert({
      user_id: user.id,
      exam_date: profile.exam_date,
      target_score: profile.target_score,
      baseline_score: baselineHp,
      daily_ord_quota: gap.dailyOrdQuota,
      weekly_goals: updatedGoals,
      implementation_cue: null,
      exam_schedule: examSchedule,
    })
  }

  await seedFsrsFromDiagnostic(supabase, user.id, sessionId, ordResponses ?? [])

  return NextResponse.json({ gap, baselineHp, hpLow, hpHigh })
}

type OrdResponse = z.infer<typeof ordResponseSchema>

async function seedFsrsFromDiagnostic(
  supabase: Awaited<ReturnType<typeof createServerClient>>,
  userId: string,
  sessionId: string,
  ordResponses: OrdResponse[]
) {
  if (ordResponses.length === 0) return

  // Find which words already have FSRS cards so we don't overwrite real learning history
  const wordIds = ordResponses.map((r) => r.wordId)
  const { data: existing } = await supabase
    .from('fsrs_cards')
    .select('word_id')
    .eq('user_id', userId)
    .in('word_id', wordIds)

  const alreadySeeded = new Set((existing ?? []).map((r: { word_id: string }) => r.word_id))
  // FSRS cards: only seed for words without prior learning history (don't
  // overwrite real progress). Session responses: log ALL answers so
  // prediction_calibration (migration 015) and accuracy metrics see the full
  // diagnostic, not just the new-words slice.
  const toSeed = ordResponses.filter((r) => !alreadySeeded.has(r.wordId))

  const now = new Date()

  const sessionResponseRows = ordResponses.map((r) => ({
    session_id: sessionId,
    user_id: userId,
    question_type: 'ord' as const,
    word_id: r.wordId,
    chosen_label: r.chosenLabel,
    correct_label: r.correctLabel,
    is_correct: r.isCorrect,
    response_ms: r.responseMs,
    answered_at: now.toISOString(),
  }))

  if (toSeed.length === 0) {
    await supabase.from('session_responses').insert(sessionResponseRows)
    return
  }

  const fsrsRows = toSeed.map((r) => {
    const card = createCard()
    const rating = ratingFromAnswerWithLatency(r.isCorrect, r.responseMs)
    const scheduled = scheduleCard(card, rating)
    return {
      ...cardToDbUpdate(scheduled.card),
      user_id: userId,
      word_id: r.wordId,
      miss_count: r.isCorrect ? 0 : 1,
    }
  })

  await Promise.all([
    supabase.from('fsrs_cards').insert(fsrsRows),
    supabase.from('session_responses').insert(sessionResponseRows),
  ])
}
