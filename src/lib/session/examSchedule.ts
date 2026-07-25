import type { SupabaseClient } from '@supabase/supabase-js'
import { todayInStockholm } from '@/lib/utils/date'

// Shared by the dashboard (to show/hide the övningsprov CTA) and
// /api/test/build (to actually gate creating one). Prefers the algorithmic
// schedule from study_plans.exam_schedule; falls back to "every 7 days"
// when no schedule exists yet (pre-migration-008 users).
export async function isExamDue(supabase: SupabaseClient, userId: string): Promise<boolean> {
  const [{ data: activePlan }, { data: lastTestSession }] = await Promise.all([
    supabase
      .from('study_plans')
      .select('exam_schedule')
      .eq('user_id', userId)
      .eq('active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('study_sessions')
      .select('completed_at')
      .eq('user_id', userId)
      .eq('session_type', 'exam_mode')
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  const examSchedule: string[] = (activePlan?.exam_schedule as string[] | undefined) ?? []

  if (examSchedule.length > 0) {
    const ymdToMs = (s: string) =>
      Date.UTC(Number(s.slice(0, 4)), Number(s.slice(5, 7)) - 1, Number(s.slice(8, 10)))
    const todayMs = ymdToMs(todayInStockholm())
    return examSchedule.some((s) => ymdToMs(s) <= todayMs)
  }

  const daysSinceLastTest = lastTestSession?.completed_at
    ? Math.floor((Date.now() - new Date(lastTestSession.completed_at).getTime()) / 86400000)
    : 999
  return daysSinceLastTest >= 7
}
