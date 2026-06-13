'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

const DURATION_SECONDS = 30 * 60

// Dashboard CTA shown when the user has an in-progress övningsprov — they
// closed the tab, navigated away, or got pulled into something else mid-test.
// Timer keeps ticking against the original server `started_at`, so the time
// shown here is honest. Tapping the card resumes the test on /test.
export function ResumeExamCard({ startedAt }: { startedAt: string }) {
  const [remaining, setRemaining] = useState(() => computeRemaining(startedAt))

  useEffect(() => {
    const tick = () => setRemaining(computeRemaining(startedAt))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [startedAt])

  if (remaining <= 0) return null

  const minutes = Math.max(0, Math.floor(remaining / 60))
  const seconds = Math.max(0, remaining % 60)
  const display = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  const inRed = remaining <= 60
  const inAmber = !inRed && remaining <= 5 * 60

  return (
    <Link href="/test">
      <div
        className={[
          'rounded-card border px-4 py-4 flex items-center gap-3 shadow-card transition-transform duration-200 active:scale-[0.99]',
          inRed
            ? 'bg-red-500/[0.08] border-red-500/30'
            : inAmber
              ? 'bg-gold/[0.08] border-gold/30'
              : 'bg-primary/[0.06] border-primary/25',
        ].join(' ')}
      >
        <div
          className={[
            'w-9 h-9 rounded-full flex items-center justify-center shrink-0',
            inRed ? 'bg-red-500/15' : inAmber ? 'bg-gold/15' : 'bg-primary/15',
          ].join(' ')}
        >
          <span
            className={[
              'font-bold text-sm',
              inRed ? 'text-red-600' : inAmber ? 'text-gold' : 'text-primary',
            ].join(' ')}
          >
            Ö
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-dark">Fortsätt pågående övningsprov</p>
          <p className="text-[11px] text-dark/65 mt-0.5 tabular-nums">
            Tid kvar: {display}
          </p>
        </div>
        <span className="text-dark/20 text-lg">›</span>
      </div>
    </Link>
  )
}

function computeRemaining(startedAt: string): number {
  const startMs = new Date(startedAt).getTime()
  const endMs = startMs + DURATION_SECONDS * 1000
  return Math.ceil((endMs - Date.now()) / 1000)
}
