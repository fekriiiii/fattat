import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerClient } from '@/lib/supabase/server'
import { updateStreak } from '@/lib/streak/manager'

const LAS_QUESTION_TYPES = [
  'huvudtanke', 'detalj_fakta', 'detalj_kausal',
  'syfte_funktion', 'slutledning', 'jämförande', 'ståndpunkt',
] as const

const lasResponseSchema = z.object({
  articleId: z.string().uuid().nullable().optional(),
  questionId: z.string().nullable().optional(),
  lasQuestionType: z.enum(LAS_QUESTION_TYPES).nullable().optional(),
  chosenLabel: z.string(),
  correctLabel: z.string(),
  isCorrect: z.boolean(),
  responseMs: z.number().int().min(0),
  confidence: z.enum(['sure', 'unsure', 'guess']).nullable().optional(),
})

const schema = z.object({
  sessionId: z.string().uuid(),
  ordCount: z.number().int().min(0),
  ordCorrect: z.number().int().min(0),
  lasCount: z.number().int().min(0),
  lasCorrect: z.number().int().min(0),
  lasResponses: z.array(lasResponseSchema).optional(),
})

export async function POST(req: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })

  const { sessionId, ordCount, ordCorrect, lasCount, lasCorrect, lasResponses } = parsed.data

  // Update + return the session row so we can decide whether to advance the
  // streak. Filtering on user_id keeps RLS happy and guards against
  // cross-user session updates.
  const { data: updatedSession } = await supabase
    .from('study_sessions')
    .update({
      completed_at: new Date().toISOString(),
      ord_count: ordCount,
      ord_correct: ordCorrect,
      las_count: lasCount,
      las_correct: lasCorrect,
    })
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .select('session_type')
    .single()

  if (lasResponses && lasResponses.length > 0) {
    await supabase.from('session_responses').insert(
      lasResponses.map((r) => ({
        session_id: sessionId,
        user_id: user.id,
        question_type: 'las' as const,
        article_id: r.articleId ?? null,
        question_id: r.questionId ?? null,
        las_question_type: r.lasQuestionType ?? null,
        chosen_label: r.chosenLabel,
        correct_label: r.correctLabel,
        is_correct: r.isCorrect,
        response_ms: r.responseMs,
        confidence: r.confidence ?? null,
      }))
    )
  }

  // Increment sessions_completed — best-effort, no RPC needed
  try {
    const { data: prof } = await supabase
      .from('user_profiles')
      .select('sessions_completed')
      .eq('id', user.id)
      .single()
    if (prof) {
      await supabase
        .from('user_profiles')
        .update({ sessions_completed: (prof.sessions_completed ?? 0) + 1 })
        .eq('id', user.id)
    }
  } catch {}

  // Advance the streak for real study sessions only (skip diagnostic, which
  // is a one-time onboarding step and shouldn't count toward day-streak).
  // Best-effort: a streak-write failure must never fail the session complete.
  if (updatedSession?.session_type === 'daily' || updatedSession?.session_type === 'exam_mode') {
    try {
      await updateStreak(supabase, user.id)
    } catch (err) {
      console.error('updateStreak failed', err)
    }
  }

  return NextResponse.json({ ok: true })
}
