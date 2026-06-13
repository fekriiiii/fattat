'use client'

import { CalendarDays } from 'lucide-react'

interface Props {
  examDate: string | null // YYYY-MM-DD
  targetScore: number | null
}

export function ExamCountdown({ examDate, targetScore }: Props) {
  if (!examDate) {
    return (
      <div className="bg-primary/8 rounded-card px-4 py-3 flex items-center gap-3">
        <CalendarDays size={18} className="text-primary/50 shrink-0" />
        <p className="text-sm text-dark/60">
          Ange ditt provdatum i profilen för att se nedräkning.
        </p>
      </div>
    )
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const exam = new Date(examDate)
  exam.setHours(0, 0, 0, 0)
  const daysLeft = Math.ceil((exam.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  if (daysLeft < 0) {
    return (
      <div className="bg-primary/8 rounded-card px-4 py-3">
        <p className="text-sm text-dark/60">Provet har passerat — uppdatera ditt datum i profilen.</p>
      </div>
    )
  }

  const weeksLeft = Math.floor(daysLeft / 7)

  return (
    <div className="surface-hero text-cream rounded-card px-5 py-5 shadow-hero flex items-center gap-5">
      <div className="text-center shrink-0">
        <p className="text-[40px] font-bold leading-none tracking-tight tabular-nums">{daysLeft}</p>
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-cream/60 mt-1.5">dagar kvar</p>
      </div>
      <div className="w-px self-stretch bg-cream/15 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-bold">Högskoleprovet</p>
        <p className="text-xs text-cream/65 mt-1">
          {weeksLeft > 0 ? `${weeksLeft} veckor` : 'Denna vecka'}
          {targetScore ? ` · Mål ${targetScore.toFixed(2)} HP` : ''}
        </p>
      </div>
      <div className="w-10 h-10 rounded-full bg-cream/10 flex items-center justify-center shrink-0">
        <CalendarDays size={19} className="text-cream/70" />
      </div>
    </div>
  )
}
