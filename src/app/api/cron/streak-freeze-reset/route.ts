import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Called by Vercel Cron every Monday at 00:05 UTC. Resets the per-week freeze
// state on every user_streaks row so the "one missed day per week is auto-
// forgiven" rule actually rolls over each week. The reset_weekly_streak_freeze
// SQL function is defined in migration 001.
export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { error } = await supabase.rpc('reset_weekly_streak_freeze')
  if (error) {
    console.error('reset_weekly_streak_freeze failed', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
