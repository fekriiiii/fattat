import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { buildDailySession } from '@/lib/session/builder'
import { getOnboardingState } from '@/lib/onboarding/state'
import type { SessionResponse } from '@/types/session'

export async function POST(req: Request) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Soft-gate: daily sessions require a completed diagnostic so FSRS has a baseline.
  const { diagnosticCompleted } = await getOnboardingState(supabase, user.id)
  if (!diagnosticCompleted) {
    return NextResponse.json({ error: 'Diagnostic required' }, { status: 403 })
  }

  // Optional body: { focus?: string } — set when launched from the
  // Veckans fokus CTA on /plan. Bad bodies are tolerated as "no focus".
  const body = await req.json().catch(() => ({})) as { focus?: unknown }
  const preferredDomain = typeof body.focus === 'string' && body.focus.length > 0 && body.focus.length <= 50
    ? body.focus
    : undefined

  try {
    // Check for incomplete daily session from today
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayStartIso = todayStart.toISOString()

    const { data: existingSession } = await supabase
      .from('study_sessions')
      .select('id, payload')
      .eq('user_id', user.id)
      .eq('session_type', 'daily')
      .is('completed_at', null)
      .gte('started_at', todayStartIso)
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    // Resume existing session if found — but only when it has a valid payload.
    // A session with null/empty payload means a previous build crashed before
    // saving the plan; resuming it would serve empty words and show a white page.
    const existingPayload = existingSession?.payload as any
    const hasUsablePayload = existingPayload?.ordWords?.length > 0

    // If we have an orphan session (row created, payload never persisted),
    // mark it completed so it doesn't accumulate alongside the fresh row we're
    // about to insert. Orphans have no user-visible responses (the UI never
    // received the words to render), so closing them is safe.
    if (existingSession && !hasUsablePayload) {
      await supabase
        .from('study_sessions')
        .update({ completed_at: new Date().toISOString() })
        .eq('id', existingSession.id)
        .eq('user_id', user.id)
    }

    if (existingSession && hasUsablePayload) {
      const { data: priorResponses } = await supabase
        .from('session_responses')
        .select('question_type, word_id, article_id, question_id, chosen_label, correct_label, is_correct, response_ms, las_question_type')
        .eq('session_id', existingSession.id)
        .order('answered_at', { ascending: true })

      return NextResponse.json({
        sessionId: existingSession.id,
        weaknessWords: existingPayload.weaknessWords ?? [],
        ordWords: existingPayload.ordWords ?? [],
        articles: existingPayload.articles ?? [],
        newWordIds: existingPayload.newWordIds ?? [],
        catchUpMode: existingPayload.catchUpMode ?? false,
        catchUpMessage: existingPayload.catchUpMessage ?? null,
        focusDomain: existingPayload.focusDomain ?? null,
        focusMessage: existingPayload.focusMessage ?? null,
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

    // Build new session
    const session = await buildDailySession(supabase, user.id, { preferredDomain })

    // Store the plan in the payload for potential resume
    await supabase
      .from('study_sessions')
      .update({
        payload: {
          weaknessWords: session.weaknessWords,
          ordWords: session.ordWords,
          articles: session.articles,
          newWordIds: session.newWordIds,
          catchUpMode: session.catchUpMode,
          catchUpMessage: session.catchUpMessage,
          focusDomain: session.focusDomain,
          focusMessage: session.focusMessage,
        },
      })
      .eq('id', session.sessionId)
      .eq('user_id', user.id)

    return NextResponse.json(session)
  } catch (err) {
    console.error('session/build error:', err)
    return NextResponse.json({ error: 'Failed to build session' }, { status: 500 })
  }
}
