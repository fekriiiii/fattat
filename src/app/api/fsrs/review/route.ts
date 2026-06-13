import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerClient } from '@/lib/supabase/server'
import {
  dbRowToCard,
  cardToDbUpdate,
  scheduleCard,
  ratingFromAnswerWithLatency,
  createCard,
  pickNextExamDate,
  daysUntil,
  retentionForDaysToExam,
} from '@/lib/fsrs/engine'

const schema = z.object({
  sessionId: z.string().uuid(),
  wordId: z.string().uuid(),
  isCorrect: z.boolean(),
  responseMs: z.number().int().min(0),
})

export async function POST(req: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })

  const { sessionId, wordId, isCorrect, responseMs } = parsed.data

  // Verify the session belongs to this user before writing a response into it.
  // Without this, a client could poison another user's session_responses by
  // submitting a foreign sessionId. RLS still enforces user_id, but session_id
  // is client-supplied and previously trusted blindly.
  const { data: ownedSession } = await supabase
    .from('study_sessions')
    .select('id, session_type')
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .maybeSingle()
  if (!ownedSession) return NextResponse.json({ error: 'Session not found' }, { status: 404 })

  // Extra sessions are pure retrieval practice — no FSRS schedule writes,
  // no miss_count increments. We still log the session_response so the
  // user's accuracy stats reflect the practice, but the spacing algorithm
  // stays clean. Same principle as exam_mode (provtryck utan FSRS-uppdateringar).
  const isExtraSession = ownedSession.session_type === 'extra'

  // The FSRS rating actually applied (1–4) — logged on the session_responses
  // row so a per-user parameter optimizer has a faithful review log even if
  // the latency→rating mapping changes again. Null for extra sessions.
  let appliedRating: number | null = null

  if (!isExtraSession) {
    // Fetch the active plan's exam schedule alongside the card so the FSRS
    // request_retention can adapt to days-to-exam (tighter target as the
    // deadline approaches → shorter intervals → more new words fit in the
    // remaining runway). See retentionForDaysToExam in lib/fsrs/engine.ts.
    const [{ data: existingCard }, { data: activePlan }] = await Promise.all([
      supabase
        .from('fsrs_cards')
        .select('*')
        .eq('user_id', user.id)
        .eq('word_id', wordId)
        .maybeSingle(),
      supabase
        .from('study_plans')
        .select('exam_schedule')
        .eq('user_id', user.id)
        .eq('active', true)
        .maybeSingle(),
    ])

    const requestRetention = retentionForDaysToExam(
      daysUntil(pickNextExamDate(activePlan?.exam_schedule as string[] | null))
    )

    const card = existingCard ? dbRowToCard(existingCard) : createCard()
    // Infer the answer format server-side from the graduation gate: cards with
    // mcq_correct_streak < 2 (or no card yet) render as MCQ in the session UI,
    // graduated cards render as typing. Same predicate the client uses, so no
    // client-supplied mode field to trust.
    const wasTyping = ((existingCard?.mcq_correct_streak as number | undefined) ?? 0) >= 2
    const rating = ratingFromAnswerWithLatency(isCorrect, responseMs, wasTyping ? 'typing' : 'mcq')
    appliedRating = rating
    const recordLogItem = scheduleCard(card, rating, requestRetention)
    const updatedCard = recordLogItem.card

    // MCQ → typing graduation gate. While streak < 2 the user is in MCQ mode;
    // 2 consecutive correct MCQ answers graduate the word to typing, a wrong
    // answer resets the streak. Once graduated (streak >= 2) we freeze it —
    // typing answers don't affect the gate.
    const currentStreak = (existingCard?.mcq_correct_streak as number | undefined) ?? 0
    const newStreak = currentStreak >= 2
      ? currentStreak
      : isCorrect ? currentStreak + 1 : 0

    const dbUpdate = {
      ...cardToDbUpdate(updatedCard),
      user_id: user.id,
      word_id: wordId,
      miss_count: isCorrect
        ? (existingCard?.miss_count ?? 0)
        : (existingCard?.miss_count ?? 0) + 1,
      mcq_correct_streak: newStreak,
    }

    // Upsert on (user_id, word_id) — the unique constraint from migration 001.
    // Using upsert (Postgres ON CONFLICT) instead of read-then-insert/update
    // closes the race where two concurrent answers for the same word both find
    // no card and both INSERT, causing a 23505 on the loser.
    await supabase
      .from('fsrs_cards')
      .upsert(dbUpdate, { onConflict: 'user_id,word_id' })
  }

  // Record the response
  await supabase.from('session_responses').insert({
    session_id: sessionId,
    user_id: user.id,
    question_type: 'ord',
    word_id: wordId,
    chosen_label: isCorrect ? 'correct' : 'wrong',
    correct_label: 'correct',
    is_correct: isCorrect,
    response_ms: responseMs,
    fsrs_rating: appliedRating,
  })

  return NextResponse.json({ ok: true })
}
