import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BottomNav } from '@/components/layout/BottomNav'
import { ServiceWorkerRegistration } from '@/components/layout/ServiceWorkerRegistration'
import { getOnboardingState } from '@/lib/onboarding/state'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { diagnosticCompleted } = await getOnboardingState(supabase, user.id)

  return (
    <div className="min-h-screen bg-cream">
      <ServiceWorkerRegistration />
      <main className="max-w-md mx-auto pb-20 min-h-screen">
        {children}
      </main>
      <BottomNav locked={!diagnosticCompleted} />
    </div>
  )
}
