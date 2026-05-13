import type { SupabaseClient } from '@supabase/supabase-js'

export type OnboardingState = {
  onboardedAt: string | null
  diagnosticCompleted: boolean
}

export async function getOnboardingState(
  supabase: SupabaseClient,
  userId: string
): Promise<OnboardingState> {
  const [{ data: profile }, { data: diagnosticSession }] = await Promise.all([
    supabase.from('user_profiles').select('onboarded_at').eq('id', userId).single(),
    supabase
      .from('study_sessions')
      .select('id')
      .eq('user_id', userId)
      .eq('session_type', 'diagnostic')
      .not('completed_at', 'is', null)
      .limit(1)
      .maybeSingle(),
  ])

  return {
    onboardedAt: profile?.onboarded_at ?? null,
    diagnosticCompleted: !!diagnosticSession,
  }
}
