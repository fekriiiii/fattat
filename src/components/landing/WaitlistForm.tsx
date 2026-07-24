'use client'

import { useState, FormEvent } from 'react'
import { Button } from '@/components/ui/Button'

const SOURCES = [
  { value: 'tiktok', label: 'TikTok' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'friend_school', label: 'Vän eller skola' },
  { value: 'other', label: 'Annat' },
] as const

type State =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | { kind: 'success' }
  | { kind: 'error'; message: string }

export function WaitlistForm() {
  const [email, setEmail] = useState('')
  const [source, setSource] = useState<string>('')
  const [state, setState] = useState<State>({ kind: 'idle' })

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (state.kind === 'submitting') return
    if (!email.trim()) {
      setState({ kind: 'error', message: 'Skriv din e-postadress.' })
      return
    }
    setState({ kind: 'submitting' })
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: source || undefined }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setState({ kind: 'error', message: data?.error ?? 'Något gick fel.' })
        return
      }
      setState({ kind: 'success' })
    } catch {
      setState({ kind: 'error', message: 'Nätverksfel. Försök igen.' })
    }
  }

  if (state.kind === 'success') {
    return (
      <div className="bg-primary/8 border border-primary/20 rounded-card px-5 py-6">
        <p className="font-bold text-dark mb-1">Tack! Du står på listan.</p>
        <p className="text-sm text-dark/65 leading-relaxed">
          Du hör av oss när Fattat öppnar. Ses i flödet under tiden.
        </p>
      </div>
    )
  }

  const submitting = state.kind === 'submitting'

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4 max-w-md">
      <div>
        <label htmlFor="email" className="text-sm font-medium text-dark/70 block mb-1.5">
          E-postadress
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="din@email.se"
          disabled={submitting}
          className="w-full px-4 py-3 rounded-btn border border-dark/15 bg-white text-base focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary disabled:opacity-50"
        />
      </div>

      <div>
        <label htmlFor="source" className="text-sm font-medium text-dark/70 block mb-1.5">
          Var hörde du talas om Fattat?
        </label>
        <select
          id="source"
          value={source}
          onChange={(e) => setSource(e.target.value)}
          disabled={submitting}
          className="w-full px-4 py-3 rounded-btn border border-dark/15 bg-white text-base focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary disabled:opacity-50"
        >
          <option value="">Välj…</option>
          {SOURCES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      {state.kind === 'error' && (
        <p className="text-sm text-red-600">{state.message}</p>
      )}

      <Button type="submit" size="lg" fullWidth loading={submitting}>
        Sätt mig på listan
      </Button>

      <p className="text-xs text-dark/45 leading-relaxed">
        Vi använder din e-post för att meddela när Fattat öppnar. Aldrig spam,
        aldrig vidare till tredje part. Se{' '}
        <a href="/privacy" className="underline hover:text-dark/70">integritetspolicy</a>.
      </p>
    </form>
  )
}
