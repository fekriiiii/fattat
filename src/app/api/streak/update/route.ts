import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { updateStreak } from '@/lib/streak/manager'

export async function POST() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const result = await updateStreak(supabase, user.id)
    return NextResponse.json(result)
  } catch (err) {
    console.error('streak/update error:', err)
    return NextResponse.json({ error: 'Failed to update streak' }, { status: 500 })
  }
}
