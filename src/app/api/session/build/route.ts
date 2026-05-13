import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { buildDailySession } from '@/lib/session/builder'
import { getOnboardingState } from '@/lib/onboarding/state'

export async function POST() {
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

  try {
    const session = await buildDailySession(supabase, user.id)
    return NextResponse.json(session)
  } catch (err) {
    console.error('session/build error:', err)
    return NextResponse.json({ error: 'Failed to build session' }, { status: 500 })
  }
}
