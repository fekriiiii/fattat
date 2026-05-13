import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerClient } from '@/lib/supabase/server'

// Persists a single test (övningsprov) answer immediately so a browser refresh
// can replay the user's progress instead of restarting from question 1.
// No FSRS update — exam_mode never touches the spaced-repetition queue.

const schema = z.object({
  sessionId:    z.string().uuid(),
  questionType: z.enum(['ord', 'las']),
  wordId:       z.string().uuid().nullable().optional(),
  articleId:    z.string().uuid().nullable().optional(),
  questionId:   z.string().nullable().optional(),
  chosenLabel:  z.string(),
  correctLabel: z.string(),
  isCorrect:    z.boolean(),
  responseMs:   z.number().int().min(0),
})

export async function POST(req: Request) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const parsed = schema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  const a = parsed.data

  // Verify the session belongs to this user, is exam_mode, and is still open.
  const { data: session } = await supabase
    .from('study_sessions')
    .select('id, user_id, session_type, completed_at')
    .eq('id', a.sessionId)
    .maybeSingle()
  if (!session || session.user_id !== user.id || session.session_type !== 'exam_mode' || session.completed_at) {
    return NextResponse.json({ error: 'Invalid session' }, { status: 403 })
  }

  const { error: insertError } = await supabase.from('session_responses').insert({
    session_id:    a.sessionId,
    user_id:       user.id,
    question_type: a.questionType,
    word_id:       a.wordId ?? null,
    article_id:    a.articleId ?? null,
    question_id:   a.questionId ?? null,
    chosen_label:  a.chosenLabel,
    correct_label: a.correctLabel,
    is_correct:    a.isCorrect,
    response_ms:   a.responseMs,
  })

  if (insertError) {
    console.error('test/answer insert error:', insertError)
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
