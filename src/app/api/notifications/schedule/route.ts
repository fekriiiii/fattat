import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendPushNotification } from '@/lib/notifications/push'

// Called by Vercel Cron every 5 minutes
export async function GET(req: Request) {
  // Verify cron secret to prevent unauthorized calls
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const nowUtc = new Date()
  const currentMinute = `${String(nowUtc.getUTCHours()).padStart(2, '0')}:${String(nowUtc.getUTCMinutes()).padStart(2, '0')}`

  // Fetch users whose notify time matches current UTC minute (simplified — Stockholm = UTC+1/+2)
  // A production implementation would convert per user timezone, but most users are Stockholm
  const { data: profiles } = await supabase
    .from('user_profiles')
    .select('id, preferred_notify_at, notification_state, study_cue')
    .filter('preferred_notify_at', 'like', `${currentMinute}%`)

  if (!profiles?.length) return NextResponse.json({ sent: 0 })

  const today = new Date().toISOString().slice(0, 10)
  let sent = 0

  for (const profile of profiles) {
    const state = (profile.notification_state ?? {}) as Record<string, unknown>
    const primarySentToday = state[`primary_${today}`]
    if (primarySentToday) continue

    // Check if user already studied today
    const { count } = await supabase
      .from('study_sessions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', profile.id)
      .not('completed_at', 'is', null)
      .gte('started_at', `${today}T00:00:00Z`)

    if (count && count > 0) continue

    // Get push subscriptions
    const { data: subs } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth_key')
      .eq('user_id', profile.id)

    if (!subs?.length) continue

    const time = profile.preferred_notify_at.slice(0, 5)
    const body = profile.study_cue
      ? `${profile.study_cue} — dags för din Fattat-session. 15 minuter.`
      : `Det är ${time} — dags för din Fattat-session. 15 minuter.`
    for (const sub of subs) {
      const ok = await sendPushNotification(
        { endpoint: sub.endpoint, p256dh: sub.p256dh, auth_key: sub.auth_key },
        {
          title: 'Fattat',
          body,
          url: '/session',
          tag: 'daily-reminder',
        }
      )
      if (ok) {
        sent++
        // Remove expired subscription
      } else {
        await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
      }
    }

    // Mark primary as sent
    await supabase
      .from('user_profiles')
      .update({ notification_state: { ...state, [`primary_${today}`]: true } })
      .eq('id', profile.id)
  }

  return NextResponse.json({ sent })
}
