import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { calculateGap } from '@/lib/session/planner'
import { computeExamSchedule } from '@/lib/session/planner'
import { computeAvgRetention, computeLasAccuracy } from '@/lib/session/scoring'
import type { FsrsCard } from '@/types/database'

export async function POST() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [
    { data: profile },
    { data: activePlan },
    { data: fsrsCards },
    { data: recentResponses },
    { count: totalWords },
  ] = await Promise.all([
    supabase.from('user_profiles').select('exam_date, target_score, previous_hp_score').eq('id', user.id).single(),
    supabase.from('study_plans').select('*').eq('user_id', user.id).eq('active', true).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('fsrs_cards').select('stability, elapsed_days, reps, difficulty').eq('user_id', user.id).limit(1000),
    supabase.from('session_responses').select('is_correct, question_type').eq('user_id', user.id).order('answered_at', { ascending: false }).limit(200),
    supabase.from('words').select('*', { count: 'exact', head: true }),
  ])

  if (!profile?.exam_date || !profile?.target_score) {
    return NextResponse.json({ ok: true, skipped: true })
  }

  const cards = (fsrsCards ?? []) as FsrsCard[]
  const ordRetention = computeAvgRetention(cards)
  const lasAccuracy = computeLasAccuracy(recentResponses ?? [])
  const previousHpScore = profile.previous_hp_score ?? null

  const targetVerbalHp = previousHpScore !== null
    ? Math.min(2.0, Math.max(0, 2 * profile.target_score - previousHpScore))
    : profile.target_score

  const gap = calculateGap({
    baselineOrdAcc: ordRetention,
    baselineLasAcc: lasAccuracy,
    targetHp: targetVerbalHp,
    examDate: new Date(profile.exam_date),
    totalWords: totalWords ?? 0,
  })

  const examDate = new Date(profile.exam_date)
  const planStart = activePlan ? new Date(activePlan.created_at) : new Date()
  const daysTotal = Math.max(0, Math.ceil((examDate.getTime() - planStart.getTime()) / 86_400_000))
  const examSchedule = computeExamSchedule(daysTotal, planStart)

  if (activePlan) {
    await supabase
      .from('study_plans')
      .update({
        daily_ord_quota: gap.dailyOrdQuota,
        exam_schedule: examSchedule,
      })
      .eq('id', activePlan.id)
  } else {
    await supabase.from('study_plans').insert({
      user_id: user.id,
      exam_date: profile.exam_date,
      target_score: profile.target_score,
      baseline_score: null,
      daily_ord_quota: gap.dailyOrdQuota,
      weekly_goals: [],
      exam_schedule: examSchedule,
    })
  }

  return NextResponse.json({ ok: true })
}
