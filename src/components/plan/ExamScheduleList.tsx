'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Props = {
  // Full upcoming schedule (ascending ISO date strings, today or later).
  upcoming: string[]
  // How many reschedules the user has remaining within this study plan.
  rescheduleRemaining: number
}

// Shows the user's next övningsprov dates with a "Boka om" button on each
// future entry. Today's date can't be pushed (you should just take it or
// skip it). The first reschedule pushes 3 days; subsequent ones do the same.
// A counter shows how many requests remain — kept tight on purpose so the
// feature can't slide into open-ended procrastination.
export function ExamScheduleList({ upcoming, rescheduleRemaining }: Props) {
  const router = useRouter()
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [remaining, setRemaining] = useState(rescheduleRemaining)
  const [items, setItems] = useState(upcoming)

  const today = startOfToday()

  async function reschedule(fromDate: string) {
    if (remaining <= 0) return
    setBusy(fromDate)
    setError(null)
    try {
      const res = await fetch('/api/exam-schedule/reschedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromDate }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        const msg = errorMessage(res.status, body?.error)
        setError(msg)
        return
      }
      const body = (await res.json()) as { newDate: string; remaining: number }
      setItems((prev) => {
        const next = prev.filter((d) => d !== fromDate)
        if (!next.includes(body.newDate)) next.push(body.newDate)
        next.sort()
        return next
      })
      setRemaining(body.remaining)
      // Refresh server data so dashboard CTA + plan upcoming stay consistent.
      router.refresh()
    } finally {
      setBusy(null)
    }
  }

  if (items.length === 0) return null

  return (
    <div className="bg-white border border-dark/8 rounded-card px-4 py-4">
      <div className="flex items-baseline justify-between mb-3">
        <p className="text-xs font-bold uppercase tracking-widest text-dark/65">
          Inplanerade övningsprov
        </p>
        <p className="text-[11px] text-dark/55">
          {remaining > 0
            ? `${remaining} ombokning${remaining === 1 ? '' : 'ar'} kvar`
            : 'Inga ombokningar kvar'}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {items.slice(0, 6).map((iso, i) => {
          const d = new Date(iso + 'T00:00:00')
          const days = Math.round((d.getTime() - today.getTime()) / 86400000)
          const isPast = days < 0
          if (isPast) return null
          const dayLabel = days === 0 ? 'Idag' : days === 1 ? 'Imorgon' : `Om ${days} dagar`
          const dateLabel = d.toLocaleDateString('sv-SE', { day: 'numeric', month: 'long' })
          const canReschedule = days >= 1 && remaining > 0

          return (
            <div key={iso} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-6 h-6 rounded-full bg-gold/[0.15] flex items-center justify-center shrink-0">
                  <span className="text-[10px] font-bold text-gold">Ö</span>
                </div>
                <div className="min-w-0">
                  <p className={`text-sm ${i === 0 ? 'font-bold text-dark' : 'text-dark/80'}`}>
                    {dateLabel}
                  </p>
                  <p className="text-[11px] text-dark/55">{dayLabel}</p>
                </div>
              </div>
              {canReschedule ? (
                <button
                  type="button"
                  onClick={() => reschedule(iso)}
                  disabled={busy !== null}
                  className="text-[12px] font-bold text-primary hover:text-primary-600 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                >
                  {busy === iso ? 'Bokar om…' : 'Boka om'}
                </button>
              ) : null}
            </div>
          )
        })}
      </div>

      {error && (
        <p className="text-[11px] text-red-600 mt-3 leading-relaxed">{error}</p>
      )}

      <p className="text-[11px] text-dark/55 mt-3 leading-relaxed">
        Ombokning skjuter ett prov 3 dagar framåt. Antalet är begränsat för att hålla cadensen.
      </p>
    </div>
  )
}

function startOfToday(): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

function errorMessage(status: number, raw?: string): string {
  if (status === 403) return 'Du har inga ombokningar kvar i denna provplan.'
  if (status === 400 && raw === 'Too close to exam: cannot push further')
    return 'För nära provdagen. Kan inte skjuta detta övningsprov längre fram.'
  if (status === 400 && raw === 'No free slot before exam: cannot reschedule')
    return 'Ingen ledig dag före provet. Kan inte boka om.'
  if (status === 404 && raw === 'Date not in schedule') return 'Datumet finns inte i planen.'
  return 'Något gick fel. Försök igen.'
}
