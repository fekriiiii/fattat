import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerClient } from '@/lib/supabase/server'
import { RESCHEDULE_CAP, RESCHEDULE_PUSH_DAYS } from '@/lib/session/reschedule'

const schema = z.object({
  fromDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
})

export async function POST(req: Request) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const parsed = schema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  const { fromDate } = parsed.data

  const { data: plan, error: planError } = await supabase
    .from('study_plans')
    .select('id, exam_date, exam_schedule, exam_reschedules_used')
    .eq('user_id', user.id)
    .eq('active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (planError || !plan) {
    return NextResponse.json({ error: 'No active study plan' }, { status: 404 })
  }

  const used = plan.exam_reschedules_used ?? 0
  if (used >= RESCHEDULE_CAP) {
    return NextResponse.json({ error: 'Reschedule limit reached', remaining: 0 }, { status: 403 })
  }

  const schedule: string[] = Array.isArray(plan.exam_schedule) ? [...plan.exam_schedule] : []
  const idx = schedule.indexOf(fromDate)
  if (idx === -1) {
    return NextResponse.json({ error: 'Date not in schedule' }, { status: 404 })
  }

  // Compute the new date by pushing PUSH_DAYS forward, but never past the
  // exam itself — rescheduling onto/after exam day defeats the purpose.
  const examDate = new Date(plan.exam_date + 'T00:00:00')
  const original = new Date(fromDate + 'T00:00:00')
  const proposed = new Date(original.getTime() + RESCHEDULE_PUSH_DAYS * 86_400_000)

  if (proposed.getTime() >= examDate.getTime()) {
    return NextResponse.json(
      { error: 'Too close to exam — cannot push further' },
      { status: 400 }
    )
  }

  const newDate = isoDate(proposed)

  // Replace and re-sort so the schedule stays ascending. If the new date
  // collides with another scheduled date, nudge forward day-by-day until free.
  schedule.splice(idx, 1)
  let candidate = newDate
  while (schedule.includes(candidate)) {
    const d = new Date(candidate + 'T00:00:00')
    d.setDate(d.getDate() + 1)
    if (d.getTime() >= examDate.getTime()) {
      return NextResponse.json(
        { error: 'No free slot before exam — cannot reschedule' },
        { status: 400 }
      )
    }
    candidate = isoDate(d)
  }
  schedule.push(candidate)
  schedule.sort()

  const { error: updateError } = await supabase
    .from('study_plans')
    .update({
      exam_schedule: schedule,
      exam_reschedules_used: used + 1,
    })
    .eq('id', plan.id)

  if (updateError) {
    console.error('exam-schedule/reschedule update error:', updateError)
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({
    newDate: candidate,
    remaining: Math.max(0, RESCHEDULE_CAP - (used + 1)),
  })
}

function isoDate(d: Date): string {
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}
