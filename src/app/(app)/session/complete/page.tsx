'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSessionStore } from '@/stores/sessionStore'
import { usePushNotifications } from '@/hooks/usePushNotifications'
import { Button } from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'
import { useCountUp } from '@/hooks/useCountUp'

// Milestone copy shown under the streak flame. Day-streak milestones are the
// habit loop's biggest reward moments — name them.
function streakMilestone(streak: number): string | null {
  if (streak === 7) return 'En hel vecka i rad — nu är det en rutin.'
  if (streak === 14) return 'Två veckor utan att missa en dag.'
  if (streak === 30) return 'En månad. Det här är disciplin på riktigt.'
  if (streak === 50) return '50 dagar. Få kommer hit.'
  if (streak === 100) return '100 dagar i rad. Exceptionellt.'
  return null
}

export default function SessionCompletePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { responses, newWordIds, reset } = useSessionStore()
  const [streak, setStreak] = useState<number | null>(null)
  const { permission, subscribed, subscribe, loading: pushLoading } = usePushNotifications()
  const [notifLoading, setNotifLoading] = useState(false)
  const [notifDone, setNotifDone] = useState(false)

  const [ordCorrect, setOrdCorrect] = useState(0)
  const [ordTotal, setOrdTotal] = useState(0)
  const [lasCorrect, setLasCorrect] = useState(0)
  const [lasTotal, setLasTotal] = useState(0)
  const [isExtra, setIsExtra] = useState(false)
  const [loaded, setLoaded] = useState(false)

  // New words started this session — only derivable while the store is intact
  // (newWordIds isn't recoverable from session_responses after a tab switch).
  const newWordsStarted = useMemo(
    () => responses.filter((r) => r.type === 'ord' && r.wordId && newWordIds.has(r.wordId)).length,
    [responses, newWordIds]
  )

  async function handleEnableNotifications() {
    setNotifLoading(true)
    const ok = await subscribe()
    setNotifLoading(false)
    if (ok) setNotifDone(true)
  }

  useEffect(() => {
    const sid = searchParams.get('sid')
    const supabase = createClient()

    // Always look up session_type from the DB — inferring "extra" from
    // lasTotal === 0 misfires on ord_heavy plans' LÄS-off days.
    const typePromise = sid
      ? supabase.from('study_sessions').select('session_type').eq('id', sid).single()
          .then(({ data }) => { if (data?.session_type === 'extra') setIsExtra(true) })
      : Promise.resolve()

    if (responses.length > 0) {
      const ord = responses.filter((r) => r.type === 'ord')
      const las = responses.filter((r) => r.type === 'las')
      setOrdCorrect(ord.filter((r) => r.isCorrect).length)
      setOrdTotal(ord.length)
      setLasCorrect(las.filter((r) => r.isCorrect).length)
      setLasTotal(las.length)
      typePromise.then(() => setLoaded(true))
      return
    }

    // Store was cleared (tab switch on mobile) — fetch from DB using session ID in URL
    if (!sid) { setLoaded(true); return }

    Promise.all([
      typePromise,
      supabase
        .from('session_responses')
        .select('question_type, is_correct')
        .eq('session_id', sid)
        .then(({ data }) => {
          if (data) {
            const ord = data.filter((r) => r.question_type === 'ord')
            const las = data.filter((r) => r.question_type === 'las')
            setOrdCorrect(ord.filter((r) => r.is_correct).length)
            setOrdTotal(ord.length)
            setLasCorrect(las.filter((r) => r.is_correct).length)
            setLasTotal(las.length)
          }
        }),
    ]).then(() => setLoaded(true))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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

  const ordPct = ordTotal > 0 ? Math.round((ordCorrect / ordTotal) * 100) : 0
  const lasPct = lasTotal > 0 ? Math.round((lasCorrect / lasTotal) * 100) : 0
  const avg = (ordPct + lasPct) / 2
  const bothHigh = ordPct >= 80 && lasPct >= 80
  const bothLow = ordPct < 60 && lasPct < 60

  const ordPctAnimated = useCountUp(ordPct, loaded)
  const lasPctAnimated = useCountUp(lasPct, loaded)

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

  // Lock the motivational message once `loaded` flips true. Previously this
  // was computed on every render, so the streak-fetch re-render rolled a new
  // line and the user briefly saw a different message before it "settled".
  const motivational = useMemo(() => {
    if (!loaded) return ''
    const pool = bothHigh ? excellentMessages : (bothLow || avg < 50) ? toughMessages : goodMessages
    return pool[Math.floor(Math.random() * pool.length)]
  }, [loaded]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!loaded) return null

  const milestone = !isExtra && streak !== null ? streakMilestone(streak) : null

  return (
    <div className="flex flex-col gap-6 px-6 py-8">
      {/* Success header */}
      <div className="text-center">
        <div className="w-[72px] h-[72px] rounded-full bg-gradient-to-b from-[#11857C] to-primary-700 shadow-hero flex items-center justify-center mx-auto mb-4 motion-safe:animate-pop-in">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#FBFAF7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
        <div className="motion-safe:animate-fade-up" style={{ animationDelay: '120ms' }}>
          <h1 className="text-[24px] font-bold text-dark">
            {isExtra ? 'Extra repetition klar!' : 'Session klar!'}
          </h1>
          {!isExtra && streak !== null && streak > 0 && (
            <p className="text-[14px] text-dark/65 mt-1.5">
              {streak === 1 ? 'Bra start — kom igen imorgon!' : `Du är inne på dag ${streak} i rad`}
            </p>
          )}
          {isExtra && (
            <p className="text-[14px] text-dark/65 mt-1.5">
              Bra jobbat — påverkar inte FSRS-schemat.
            </p>
          )}
        </div>
      </div>

      {/* Streak celebration */}
      {!isExtra && streak !== null && streak > 1 && (
        <div className="motion-safe:animate-fade-up" style={{ animationDelay: '220ms' }}>
          <div className="flex items-center justify-center gap-2">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="#D4A017"><path d="M12 2c.5 3.5 4 6 4 10a4 4 0 11-8 0c0-4 3.5-6.5 4-10z"/></svg>
            <span className="text-[28px] font-bold text-gold">{streak}</span>
            <span className="text-[14px] text-dark/65">dagars streak</span>
          </div>
          {milestone && (
            <p className="text-[13px] font-bold text-gold text-center mt-1.5">{milestone}</p>
          )}
        </div>
      )}

      {/* Stat cards — collapse to a single ORD card when LÄS wasn't part of
          the session (extra mode, or LÄS-skip days on weighted plans). */}
      <div
        className={`motion-safe:animate-fade-up ${lasTotal === 0 ? '' : 'grid grid-cols-2 gap-3'}`}
        style={{ animationDelay: '320ms' }}
      >
        <div className="bg-white rounded-card shadow-card border border-dark/[0.05] px-4 pt-5 pb-[18px] text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-400 to-primary" />
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-dark/45 mb-2">ORD</p>
          <p className="text-[34px] font-bold text-dark leading-none mb-1 tracking-tight tabular-nums">{ordPctAnimated}%</p>
          <p className="text-[12px] text-dark/55">{ordCorrect}/{ordTotal} rätt</p>
        </div>
        {lasTotal > 0 && (
          <div className="bg-white rounded-card shadow-card border border-dark/[0.05] px-4 pt-5 pb-[18px] text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-gold/70 to-gold" />
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-dark/45 mb-2">LÄS</p>
            <p className="text-[34px] font-bold text-dark leading-none mb-1 tracking-tight tabular-nums">{lasPctAnimated}%</p>
            <p className="text-[12px] text-dark/55">{lasCorrect}/{lasTotal} rätt</p>
          </div>
        )}
      </div>

      {/* New words started today — visible growth, not just accuracy. Only
          shown when the store survived to the complete page. */}
      {!isExtra && newWordsStarted > 0 && (
        <div
          className="flex items-center justify-center gap-2 -mt-2 motion-safe:animate-fade-up"
          style={{ animationDelay: '400ms' }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
          <p className="text-[13px] text-dark/65">
            {newWordsStarted === 1 ? '1 nytt ord påbörjat' : `${newWordsStarted} nya ord påbörjade`} — FSRS tar dem vidare imorgon
          </p>
        </div>
      )}

      {/* Motivational */}
      <div className="bg-primary/[0.05] ring-1 ring-inset ring-primary/10 rounded-card px-5 py-4 text-center motion-safe:animate-fade-up" style={{ animationDelay: '460ms' }}>
        <p className="text-[14px] text-dark/65 leading-[1.55]">{motivational}</p>
      </div>

      {/* Push notification prompt */}
      {!pushLoading && !subscribed && permission !== 'denied' && !notifDone && (
        <div className="bg-white rounded-card shadow-card border border-dark/[0.05] px-4 py-4 flex items-start gap-3 motion-safe:animate-fade-up" style={{ animationDelay: '540ms' }}>
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
