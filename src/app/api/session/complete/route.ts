import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerClient } from '@/lib/supabase/server'

const schema = z.object({
  sessionId: z.string().uuid(),
  ordCount: z.number().int().min(0),
  ordCorrect: z.number().int().min(0),
  lasCount: z.number().int().min(0),
  lasCorrect: z.number().int().min(0),
})

export async function POST(req: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })

  const { sessionId, ordCount, ordCorrect, lasCount, lasCorrect } = parsed.data

  await supabase
    .from('study_sessions')
    .update({
      completed_at: new Date().toISOString(),
      ord_count: ordCount,
      ord_correct: ordCorrect,
      las_count: lasCount,
      las_correct: lasCorrect,
    })
    .eq('id', sessionId)
    .eq('user_id', user.id)

  // Increment sessions_completed — best-effort, no RPC needed
  try {
    const { data: prof } = await supabase
      .from('user_profiles')
      .select('sessions_completed')
      .eq('id', user.id)
      .single()
    if (prof) {
      await supabase
        .from('user_profiles')
        .update({ sessions_completed: (prof.sessions_completed ?? 0) + 1 })
        .eq('id', user.id)
    }
  } catch {}

  return NextResponse.json({ ok: true })
}
