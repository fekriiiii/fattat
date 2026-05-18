import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerClient } from '@/lib/supabase/server'
import {
  dbRowToCard,
  cardToDbUpdate,
  scheduleCard,
  ratingFromAnswerWithLatency,
  createCard,
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
    .select('id')
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .maybeSingle()
  if (!ownedSession) return NextResponse.json({ error: 'Session not found' }, { status: 404 })

  // Fetch or create the FSRS card for this user+word
  const { data: existingCard } = await supabase
    .from('fsrs_cards')
    .select('*')
    .eq('user_id', user.id)
    .eq('word_id', wordId)
    .maybeSingle()

  const card = existingCard ? dbRowToCard(existingCard) : createCard()
  const rating = ratingFromAnswerWithLatency(isCorrect, responseMs)
  const recordLogItem = scheduleCard(card, rating)
  const updatedCard = recordLogItem.card

  const dbUpdate = {
    ...cardToDbUpdate(updatedCard),
    user_id: user.id,
    word_id: wordId,
    miss_count: isCorrect
      ? (existingCard?.miss_count ?? 0)
      : (existingCard?.miss_count ?? 0) + 1,
  }

  // Upsert on (user_id, word_id) — the unique constraint from migration 001.
  // Using upsert (Postgres ON CONFLICT) instead of read-then-insert/update
  // closes the race where two concurrent answers for the same word both find
  // no card and both INSERT, causing a 23505 on the loser.
  await supabase
    .from('fsrs_cards')
    .upsert(dbUpdate, { onConflict: 'user_id,word_id' })

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
  })

  return NextResponse.json({ ok: true })
}
