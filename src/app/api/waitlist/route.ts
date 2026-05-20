import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'
import { createHash } from 'crypto'
import { Resend } from 'resend'

const VALID_SOURCES = ['tiktok', 'instagram', 'youtube', 'friend_school', 'other'] as const

const schema = z.object({
  email: z.string().email().max(254).transform((s) => s.trim().toLowerCase()),
  source: z.enum(VALID_SOURCES).optional(),
})

// In-memory rate limit: 1 request per IP per minute. Resets on cold start,
// which is fine for Phase 1 — the goal is to stop drive-by spam, not a DDoS.
const recentByIp = new Map<string, number>()
const RATE_WINDOW_MS = 60_000

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const now = Date.now()
  const last = recentByIp.get(ip)
  if (last && now - last < RATE_WINDOW_MS) {
    return NextResponse.json({ error: 'För många försök, vänta en stund.' }, { status: 429 })
  }
  recentByIp.set(ip, now)

  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Ogiltig e-postadress.' }, { status: 400 })
  }

  // Use the service role to bypass RLS for the insert — the policy only
  // allows insert, and we want to keep the email list unreadable from the
  // client even if someone tampers with the anon key.
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const ipHash = createHash('sha256').update(ip).digest('hex').slice(0, 16)
  const userAgent = req.headers.get('user-agent')?.slice(0, 500) ?? null

  const { count } = await supabase
    .from('waitlist_signups')
    .select('*', { count: 'exact', head: true })
    .eq('ip_hash', ipHash)
  if ((count ?? 0) >= 3) {
    return NextResponse.json({ ok: true })
  }

  const { error } = await supabase.from('waitlist_signups').insert({
    email: parsed.data.email,
    source: parsed.data.source ?? null,
    user_agent: userAgent,
    ip_hash: ipHash,
  })

  // Treat unique-violation (re-signup) as success so a returning visitor
  // doesn't see an error for being already on the list.
  if (error && error.code !== '23505') {
    console.error('waitlist insert failed:', error)
    return NextResponse.json({ error: 'Något gick fel, försök igen.' }, { status: 500 })
  }

  // Notify founder on new signup (not on duplicates)
  if (!error) {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const sourceLabel: Record<string, string> = {
      tiktok: 'TikTok', instagram: 'Instagram', youtube: 'YouTube',
      friend_school: 'Vän/skola', other: 'Annat',
    }
    resend.emails.send({
      from: 'Fattat <onboarding@resend.dev>',
      to: 'thelittelstars7@gmail.com',
      subject: 'Ny anmälan till väntelistan',
      text: `${parsed.data.email} har anmält sig.\n\nKälla: ${sourceLabel[parsed.data.source ?? ''] ?? 'okänd'}`,
    }).catch(() => {})
  }

  return NextResponse.json({ ok: true })
}
