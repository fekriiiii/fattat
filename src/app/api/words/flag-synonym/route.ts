import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { wordId, typedAnswer } = await req.json()
  if (!wordId || !typedAnswer) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  await supabase.from('flagged_synonyms').insert({
    word_id: wordId,
    user_id: user.id,
    typed_answer: typedAnswer.trim(),
  })

  return NextResponse.json({ ok: true })
}
