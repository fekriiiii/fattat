'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSessionStore } from '@/stores/sessionStore'
import { usePushNotifications } from '@/hooks/usePushNotifications'
import { Button } from '@/components/ui/Button'

export default function SessionCompletePage() {
  const router = useRouter()
  const { responses, reset } = useSessionStore()
  const [streak, setStreak] = useState<number | null>(null)
  const { permission, subscribed, subscribe, loading: pushLoading } = usePushNotifications()
  const [notifLoading, setNotifLoading] = useState(false)
  const [notifDone, setNotifDone] = useState(false)

  async function handleEnableNotifications() {
    setNotifLoading(true)
    const ok = await subscribe()
    setNotifLoading(false)
    if (ok) setNotifDone(true)
  }

  const ordResponses = responses.filter((r) => r.type === 'ord')
  const lasResponses = responses.filter((r) => r.type === 'las')
  const ordCorrect = ordResponses.filter((r) => r.isCorrect).length
  const lasCorrect = lasResponses.filter((r) => r.isCorrect).length
  const ordTotal = ordResponses.length
  const lasTotal = lasResponses.length
  const ordPct = ordTotal > 0 ? Math.round((ordCorrect / ordTotal) * 100) : 0
  const lasPct = lasTotal > 0 ? Math.round((lasCorrect / lasTotal) * 100) : 0

  useEffect(() => {
    fetch('/api/streak/update', { method: 'POST' })
      .then((r) => r.json())
      .then((d) => setStreak(d.currentStreak))
      .catch(() => {})
  }, [])

  function handleGoHome() {
    reset()
    router.push('/dashboard')
  }

  const avg = (ordPct + lasPct) / 2
  const bothHigh = ordPct >= 80 && lasPct >= 80
  const bothLow = ordPct < 60 && lasPct < 60

  const excellentMessages = [
    'Utmärkt session — du lär dig.',
    'Starkt! Den här sortens dag bygger minne.',
    'Skarpt. Hjärnan jobbar ordentligt idag.',
    'Imponerande — du är på god väg.',
  ]
  const goodMessages = [
    'Bra jobbat — varje session för dig framåt.',
    'Solid insats. Du rör dig i rätt riktning.',
    'Bra. Fortsätt så här.',
    'Konsekvent arbete ger resultat — du håller kursen.',
  ]
  const toughMessages = [
    'Svåra ord sitter bäst efteråt — det här var väl använd tid.',
    'Motstånd är en del av inlärningen — FSRS tar hand om resten.',
    'Tuffa sessioner bygger starka minnen. Kom igen imorgon.',
    'Det är precis de svåra orden du behöver träna. Bra att du körde.',
  ]

  const pool = bothHigh ? excellentMessages : (bothLow || avg < 50) ? toughMessages : goodMessages
  const motivational = pool[Math.floor(Math.random() * pool.length)]

  return (
    <div className="flex flex-col gap-6 px-6 py-8">
      {/* Success header */}
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-primary/[0.08] flex items-center justify-center mx-auto mb-4">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0F766E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
        <h1 className="text-[24px] font-bold text-dark">Session klar!</h1>
        {streak !== null && streak > 0 && (
          <p className="text-[14px] text-dark/65 mt-1.5">
            {streak === 1 ? 'Bra start — kom igen imorgon!' : `Du är inne på dag ${streak} i rad`}
          </p>
)}
      </div>

      {/* Streak celebration */}
      {streak !== null && streak > 1 && (
        <div className="flex items-center justify-center gap-2">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="#D4A017"><path d="M12 2c.5 3.5 4 6 4 10a4 4 0 11-8 0c0-4 3.5-6.5 4-10z"/></svg>
          <span className="text-[28px] font-bold text-gold">{streak}</span>
          <span className="text-[14px] text-dark/65">dagars streak</span>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-card shadow-card px-4 py-[18px] text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-dark/60 mb-1.5">ORD</p>
          <p className="text-[30px] font-bold text-dark leading-none mb-0.5">{ordPct}%</p>
          <p className="text-[12px] text-dark/60">{ordCorrect}/{ordTotal} rätt</p>
        </div>
        <div className="bg-white rounded-card shadow-card px-4 py-[18px] text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-dark/60 mb-1.5">LÄS</p>
          <p className="text-[30px] font-bold text-dark leading-none mb-0.5">{lasPct}%</p>
          <p className="text-[12px] text-dark/60">{lasCorrect}/{lasTotal} rätt</p>
        </div>
      </div>

      {/* Motivational */}
      <div className="bg-primary/[0.04] rounded-btn px-5 py-4 text-center">
        <p className="text-[14px] text-dark/65 leading-[1.55]">{motivational}</p>
      </div>

      {/* Push notification prompt */}
      {!pushLoading && !subscribed && permission !== 'denied' && !notifDone && (
        <div className="bg-white rounded-card shadow-card px-4 py-4 flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0F766E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/>
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-bold text-dark mb-0.5">Vill du ha en daglig påminnelse?</p>
            <p className="text-[11px] text-dark/65 leading-relaxed mb-3">
              Fattat skickar ett nudge vid din valda tid — bara om du inte redan studerat den dagen.
            </p>
            <button
              onClick={handleEnableNotifications}
              disabled={notifLoading}
              className="text-[13px] font-bold text-primary disabled:opacity-50"
            >
              {notifLoading ? 'Aktiverar…' : 'Aktivera påminnelser →'}
            </button>
          </div>
        </div>
      )}
      {notifDone && (
        <p className="text-[13px] text-center text-primary font-bold">✓ Påminnelser aktiverade</p>
      )}

      <Button fullWidth size="lg" onClick={handleGoHome}>
        Gå till startsidan
      </Button>
    </div>
  )
}
