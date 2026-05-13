'use client'

import { useEffect, useRef, useState } from 'react'

const DEFAULT_DURATION_SECONDS = 30 * 60  // 30 minutes
const AMBER_THRESHOLD_SECONDS = 5 * 60    // last 5 min: amber
const RED_THRESHOLD_SECONDS = 60          // last 1 min: red + pulse

/**
 * Övningsprov countdown timer.
 *
 * Anchored to a server timestamp (`startedAt`) so reloading the page does
 * NOT reset the clock — the user genuinely has the full duration measured
 * from when the session was created on the server.
 *
 * Calls `onTimeUp` exactly once when remaining seconds reaches zero.
 * Unanswered questions count as wrong, matching real HP behavior.
 */
export function ExamTimer({
  startedAt,
  durationSeconds = DEFAULT_DURATION_SECONDS,
  onTimeUp,
}: {
  startedAt: string  // ISO timestamp from the server
  durationSeconds?: number
  onTimeUp: () => void
}) {
  const [remaining, setRemaining] = useState(() =>
    computeRemaining(startedAt, durationSeconds)
  )
  const firedTimeUp = useRef(false)

  useEffect(() => {
    const tick = () => {
      const r = computeRemaining(startedAt, durationSeconds)
      setRemaining(r)
      if (r <= 0 && !firedTimeUp.current) {
        firedTimeUp.current = true
        onTimeUp()
      }
    }
    // Tick immediately on mount in case startedAt was already in the past
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [startedAt, durationSeconds, onTimeUp])

  const minutes = Math.max(0, Math.floor(remaining / 60))
  const seconds = Math.max(0, remaining % 60)
  const display = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`

  const inRed = remaining <= RED_THRESHOLD_SECONDS
  const inAmber = !inRed && remaining <= AMBER_THRESHOLD_SECONDS

  // Color classes
  const containerClass = inRed
    ? 'bg-red-500/10 border-red-500/30 text-red-600'
    : inAmber
      ? 'bg-gold/10 border-gold/30 text-gold'
      : 'bg-dark/[0.04] border-dark/10 text-dark/75'
  const pulseClass = inRed ? 'animate-pulse' : ''

  return (
    <div
      className={`sticky top-0 z-20 px-4 py-2 border-b ${containerClass} ${pulseClass}`}
      role="timer"
      aria-live="off"
    >
      <div className="flex items-center justify-between max-w-sm mx-auto">
        <span className="text-[11px] font-bold uppercase tracking-widest opacity-70">
          Tid kvar
        </span>
        <span className="text-base font-bold tabular-nums">{display}</span>
      </div>
    </div>
  )
}

function computeRemaining(startedAt: string, durationSeconds: number): number {
  const startMs = new Date(startedAt).getTime()
  const endMs = startMs + durationSeconds * 1000
  return Math.ceil((endMs - Date.now()) / 1000)
}
