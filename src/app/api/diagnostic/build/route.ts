import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { buildDiagnosticSession } from '@/lib/session/builder'

// How long an abandoned diagnostic stays resumable. Beyond this we build a
// fresh one — a baseline measured across several days isn't a baseline.
const RESUME_WINDOW_MS = 24 * 60 * 60 * 1000

export async function POST() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    // Resume: an incomplete diagnostic from the last 24h with a usable payload
    // continues where the user left off instead of restarting from scratch.
    // NOTE: unlike daily sessions we never mark abandoned diagnostics as
    // completed — getOnboardingState treats any completed diagnostic as "done"
    // and would unlock the app off a half-finished baseline. Stale rows just
    // stay open and inert.
    const resumeCutoff = new Date(Date.now() - RESUME_WINDOW_MS).toISOString()
    const { data: existing } = await supabase
      .from('study_sessions')
      .select('id, payload')
      .eq('user_id', user.id)
      .eq('session_type', 'diagnostic')
      .is('completed_at', null)
      .gte('started_at', resumeCutoff)
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existingPayload = existing?.payload as any
    if (existing && existingPayload?.ordWords?.length > 0) {
      const { data: priorResponses } = await supabase
        .from('session_responses')
        .select('question_type, word_id, article_id, question_id, chosen_label, correct_label, is_correct, response_ms, las_question_type')
        .eq('session_id', existing.id)
        .order('answered_at', { ascending: true })

      return NextResponse.json({
        sessionId: existing.id,
        ordWords: existingPayload.ordWords ?? [],
        articles: existingPayload.articles ?? [],
        priorResponses: priorResponses ?? [],
      })
    }

    const { ordWords, articles } = await buildDiagnosticSession(supabase)

    // Create a diagnostic session record. No FSRS writes happen here; the cards
    // are seeded once at /api/diagnostic/complete, and only for curated words.
    const { data: session, error } = await supabase
      .from('study_sessions')
      .insert({ user_id: user.id, session_type: 'diagnostic' })
      .select('id')
      .single()

    if (error || !session) throw new Error('Failed to create session')

    // Persist the pool so a refresh/abandon can resume the same diagnostic.
    await supabase
      .from('study_sessions')
      .update({ payload: { ordWords, articles } })
      .eq('id', session.id)
      .eq('user_id', user.id)

    return NextResponse.json({ sessionId: session.id, ordWords, articles, priorResponses: [] })
  } catch (err) {
    console.error('diagnostic/build error:', err)
    return NextResponse.json({ error: 'Failed to build diagnostic' }, { status: 500 })
  }
}
