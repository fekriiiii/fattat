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

  if (existingCard) {
    await supabase
      .from('fsrs_cards')
      .update(dbUpdate)
      .eq('id', existingCard.id)
  } else {
    await supabase.from('fsrs_cards').insert(dbUpdate)
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
  })

  return NextResponse.json({ ok: true })
}
