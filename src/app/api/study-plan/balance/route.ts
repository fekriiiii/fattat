import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerClient } from '@/lib/supabase/server'

const schema = z.object({
  balance: z.enum(['balanced', 'ord_heavy', 'las_heavy']),
})

export async function POST(req: Request) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const parsed = schema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  const { data: activePlan } = await supabase
    .from('study_plans')
    .select('id')
    .eq('user_id', user.id)
    .eq('active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!activePlan) return NextResponse.json({ error: 'No active plan' }, { status: 404 })

  await supabase
    .from('study_plans')
    .update({ session_balance: parsed.data.balance })
    .eq('id', activePlan.id)

  return NextResponse.json({ ok: true })
}
