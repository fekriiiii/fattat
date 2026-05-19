import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Public routes — no auth required.
  // `/` is the public landing page (waitlist mode for Phase 1). Logged-in users
  // are still redirected away from it to /dashboard further down.
  const publicPaths = ['/login', '/auth/callback', '/partner/', '/privacy', '/terms']
  const isPublic = pathname === '/' || publicPaths.some((p) => pathname.startsWith(p))

  // API routes — handled by route handlers themselves
  if (pathname.startsWith('/api/')) return supabaseResponse

  if (!user && !isPublic) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user && pathname === '/login') {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  if (user && pathname === '/') {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // ─── Step-guards for logged-in users ────────────────────────────────────────
  if (user) {
    const needsOnboardingCheck = pathname.startsWith('/onboarding') || pathname.startsWith('/diagnostic') || pathname.startsWith('/session') || pathname.startsWith('/test')

    if (needsOnboardingCheck) {
      const [{ data: profile }, { data: diagnosticSession }] = await Promise.all([
        supabase.from('user_profiles').select('onboarded_at').eq('id', user.id).single(),
        supabase
          .from('study_sessions')
          .select('id')
          .eq('user_id', user.id)
          .eq('session_type', 'diagnostic')
          .not('completed_at', 'is', null)
          .limit(1)
          .maybeSingle(),
      ])

      const onboarded = !!profile?.onboarded_at
      const diagnosticDone = !!diagnosticSession
      const redirect = (path: string) => {
        const url = request.nextUrl.clone()
        url.pathname = path
        return NextResponse.redirect(url)
      }

      // Can't re-do onboarding once completed
      if (pathname.startsWith('/onboarding') && onboarded) return redirect('/dashboard')

      // Can't re-do diagnostic once completed
      if (pathname.startsWith('/diagnostic') && diagnosticDone) return redirect('/dashboard')

      // Can't access session or test without a completed diagnostic
      if ((pathname.startsWith('/session') || pathname.startsWith('/test')) && !diagnosticDone) return redirect('/dashboard')
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|fonts|icons|sw.js|manifest.json|Fattat_Logo.png).*)'],
}
