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
      {/* Ambient brand wash — gives the flat cream canvas a hint of depth */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 h-56 z-0 bg-[radial-gradient(120%_100%_at_50%_-30%,rgba(15,118,110,0.07),transparent_70%)]"
      />
      <ServiceWorkerRegistration />
      <main className="relative z-10 max-w-md mx-auto pb-20 min-h-screen">
        {children}
      </main>
      <BottomNav locked={!diagnosticCompleted} />
    </div>
  )
}
