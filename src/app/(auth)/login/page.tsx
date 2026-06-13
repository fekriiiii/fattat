'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

type Mode = 'login' | 'signup'

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('signup')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || !password.trim()) return
    setLoading(true)
    setError('')
    setInfo('')
    const supabase = createClient()

    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password.trim(),
      })
      if (error) {
        setError(error.message)
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password.trim(),
        })
        if (signInError) {
          setInfo('Konto skapat — logga nu in.')
          setMode('login')
        } else {
          router.push('/dashboard')
          router.refresh()
        }
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      })
      if (error) {
        setError('Fel e-post eller lösenord.')
      } else {
        router.push('/dashboard')
        router.refresh()
      }
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-5 relative overflow-hidden">
      {/* Ambient brand wash */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(120%_100%_at_50%_-30%,rgba(15,118,110,0.09),transparent_70%)]"
      />
      <div className="w-full max-w-sm relative">
        {/* Logo / brand */}
        <div className="text-center mb-10 motion-safe:animate-fade-up">
          <div className="flex items-center justify-center mb-4">
            <Image src="/Fattat_Logo.png" alt="Fattat" width={140} height={93} priority />
          </div>
          <p className="text-[14px] text-dark/65">Din väg till ett högre HP.</p>
        </div>

        {/* Form card */}
        <div className="bg-white rounded-card shadow-raised border border-dark/[0.05] p-6 flex flex-col gap-4 motion-safe:animate-fade-up motion-safe:[animation-delay:100ms]">
          <h2 className="text-[16px] font-bold text-dark">
            {mode === 'signup' ? 'Skapa konto' : 'Logga in'}
          </h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-[13px] font-bold text-dark/60">
                E-postadress
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="du@example.com"
                className="w-full h-[52px] px-5 rounded-btn border-2 border-dark/[0.08] bg-white text-dark text-[15px] placeholder:text-dark/30 focus:outline-none focus:border-primary focus:shadow-[0_0_0_4px_rgba(15,118,110,0.10)] transition-all duration-200"
                required
                autoComplete="email"
                autoFocus
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-[13px] font-bold text-dark/60">
                Lösenord
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'signup' ? 'Minst 6 tecken' : 'Ditt lösenord'}
                className="w-full h-[52px] px-5 rounded-btn border-2 border-dark/[0.08] bg-white text-dark text-[15px] placeholder:text-dark/30 focus:outline-none focus:border-primary focus:shadow-[0_0_0_4px_rgba(15,118,110,0.10)] transition-all duration-200"
                required
                minLength={6}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              />
            </div>

            {error && <p className="text-[13px] text-red-600">{error}</p>}
            {info && <p className="text-[13px] text-primary font-medium">{info}</p>}

            <Button type="submit" fullWidth size="lg" loading={loading}>
              {mode === 'signup' ? 'Skapa konto och logga in' : 'Logga in'}
            </Button>
          </form>

          <button
            type="button"
            onClick={() => { setMode(mode === 'signup' ? 'login' : 'signup'); setError(''); setInfo('') }}
            className="text-center text-[12px] text-dark/65 hover:text-primary transition-colors"
          >
            {mode === 'signup' ? 'Har du redan ett konto? Logga in' : 'Inget konto? Skapa ett'}
          </button>
        </div>

      </div>
    </div>
  )
}
