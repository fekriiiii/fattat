import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getOnboardingState } from '@/lib/onboarding/state'
import { stockholmDayStartUtcIso } from '@/lib/utils/date'
import type { Word } from '@/types/database'

// Extra repetition mode: practice on recently-missed ORD words, no new
// introductions, no LÄS articles, no FSRS schedule writes. The release valve
// for users who finished their daily session and want more practice without
// us lying about "klar för idag" or polluting FSRS spacing.
//
// Source: last 15 distinct words the user missed (most recent first). This
// replaces the old "weakness" signal which was driven by a lifetime-cumulative
// miss_count and never rotated — same five words every day.

export async function POST() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { diagnosticCompleted } = await getOnboardingState(supabase, user.id)
  if (!diagnosticCompleted) return NextResponse.json({ error: 'Diagnostic required' }, { status: 403 })

  // Resume an incomplete extra session from today, mirroring the daily-resume
  // pattern in /api/session/build. Without this, abandoning mid-extra and
  // tapping Studera again would orphan the first row and start a fresh extra
  // (or worse — if the chooser routes here, restart from word 1).
  // Stockholm midnight, not server (UTC) midnight — see /api/session/build.
  const todayStartIso = stockholmDayStartUtcIso()

  const { data: existingExtra } = await supabase
    .from('study_sessions')
    .select('id, payload')
    .eq('user_id', user.id)
    .eq('session_type', 'extra')
    .is('completed_at', null)
    .gte('started_at', todayStartIso)
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const existingPayload = existingExtra?.payload as any
  const hasUsablePayload = existingPayload?.ordWords?.length > 0

  if (existingExtra && !hasUsablePayload) {
    // Orphan extra (row created, payload never persisted) — close it so we
    // don't have two open extras when the fresh one inserts.
    await supabase
      .from('study_sessions')
      .update({ completed_at: new Date().toISOString() })
      .eq('id', existingExtra.id)
      .eq('user_id', user.id)
  }

  if (existingExtra && hasUsablePayload) {
    const { data: priorResponses } = await supabase
      .from('session_responses')
      .select('question_type, word_id, article_id, question_id, chosen_label, correct_label, is_correct, response_ms, las_question_type')
      .eq('session_id', existingExtra.id)
      .order('answered_at', { ascending: true })

    return NextResponse.json({
      sessionId: existingExtra.id,
      ordWords: existingPayload.ordWords ?? [],
      articles: [],
      newWordIds: [],
      catchUpMode: false,
      catchUpMessage: null,
      focusDomain: null,
      focusMessage: 'Extra repetition — vi kör endast ord du redan stött på. Resultaten påverkar inte FSRS-schemat.',
      balance: 'balanced',
      balanceMessage: null,
      isExtra: true,
      priorResponses: (priorResponses ?? []).map((r) => ({
        question_type: r.question_type,
        word_id: r.word_id,
        article_id: r.article_id,
        question_id: r.question_id,
        chosen_label: r.chosen_label,
        correct_label: r.correct_label,
        is_correct: r.is_correct,
        response_ms: r.response_ms,
        las_question_type: r.las_question_type,
      })),
    })
  }

  // Pick the 15 most recent distinct missed ORD words. This rotates naturally
  // as the user accumulates new misses, unlike the old weakness selector which
  // sorted by lifetime miss_count and surfaced the same handful forever.
  const { data: missed } = await supabase
    .from('session_responses')
    .select('word_id')
    .eq('user_id', user.id)
    .eq('question_type', 'ord')
    .eq('is_correct', false)
    .not('word_id', 'is', null)
    .order('answered_at', { ascending: false })
    .limit(100)
  const wordIds = Array.from(new Set((missed ?? []).map((r) => r.word_id as string))).slice(0, 15)

  if (wordIds.length === 0) {
    return NextResponse.json({
      sessionId: null,
      ordWords: [],
      reason: 'no_material',
    })
  }

  const [{ data: session, error: sessionError }, { data: wordsData }] = await Promise.all([
    supabase
      .from('study_sessions')
      .insert({ user_id: user.id, session_type: 'extra' })
      .select('id')
      .single(),
    supabase.from('words').select('*').in('id', wordIds),
  ])

  if (sessionError || !session) {
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
  }

  const wordsById: Record<string, Word> = {}
  for (const w of wordsData ?? []) wordsById[w.id] = w as Word
  const ordWords = wordIds.map((id) => wordsById[id]).filter(Boolean) as Word[]

  // Persist payload so a reload mid-session can resume the same word list.
  await supabase
    .from('study_sessions')
    .update({
      payload: {
        ordWords,
        articles: [],
        newWordIds: [],
        catchUpMode: false,
        catchUpMessage: null,
        focusDomain: null,
        focusMessage: null,
        balance: 'balanced',
        balanceMessage: null,
        isExtra: true,
      },
    })
    .eq('id', session.id)
    .eq('user_id', user.id)

  return NextResponse.json({
    sessionId: session.id,
    ordWords,
    articles: [],
    newWordIds: [],
    catchUpMode: false,
    catchUpMessage: null,
    focusDomain: null,
    focusMessage: 'Extra repetition — vi kör endast ord du redan stött på. Resultaten påverkar inte FSRS-schemat.',
    balance: 'balanced',
    balanceMessage: null,
    isExtra: true,
  })
}
