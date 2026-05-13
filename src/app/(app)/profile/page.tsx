import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { ProfileForm } from './ProfileForm'

export default async function ProfilePage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: streak }] = await Promise.all([
    supabase.from('user_profiles').select('*').eq('id', user.id).single(),
    supabase.from('user_streaks').select('*').eq('user_id', user.id).single(),
  ])

  const initials = profile?.display_name
    ? profile.display_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : user.email?.slice(0, 2).toUpperCase() ?? '?'

  return (
    <div className="px-4 pt-5 pb-6 flex flex-col gap-5">
      {/* Avatar + name */}
      <div className="flex items-center gap-3.5">
        <div className="w-[52px] h-[52px] rounded-full bg-primary flex items-center justify-center shrink-0">
          <span className="text-[20px] font-bold text-cream">{initials}</span>
        </div>
        <div>
          <h1 className="text-[20px] font-bold text-dark leading-tight">
            {profile?.display_name ?? user.email?.split('@')[0] ?? 'Profil'}
          </h1>
          <p className="text-[12px] text-dark/65 mt-0.5">{user.email}</p>
        </div>
      </div>

      {/* Stats row */}
      {streak && (
        <div className="grid grid-cols-3 gap-2.5">
          {[
            { n: streak.current_streak, l: 'Streak' },
            { n: streak.total_days_studied, l: 'Dagar' },
            { n: streak.longest_streak ?? 0, l: 'Rekord' },
          ].map((s) => (
            <div key={s.l} className="bg-white rounded-card shadow-card px-3 py-3.5 text-center">
              <p className="text-[22px] font-bold text-dark leading-none mb-1">{s.n}</p>
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-dark/60">{s.l}</p>
            </div>
          ))}
        </div>
      )}

      <ProfileForm profile={profile} email={user.email ?? ''} streak={streak} />
    </div>
  )
}
