import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { buildDiagnosticSession } from '@/lib/session/builder'

export async function POST() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { ordWords, articles } = await buildDiagnosticSession(supabase)

    // Create a diagnostic session record (no FSRS writes during diagnostic)
    const { data: session, error } = await supabase
      .from('study_sessions')
      .insert({ user_id: user.id, session_type: 'diagnostic' })
      .select('id')
      .single()

    if (error || !session) throw new Error('Failed to create session')

    return NextResponse.json({ sessionId: session.id, ordWords, articles })
  } catch (err) {
    console.error('diagnostic/build error:', err)
    return NextResponse.json({ error: 'Failed to build diagnostic' }, { status: 500 })
  }
}
