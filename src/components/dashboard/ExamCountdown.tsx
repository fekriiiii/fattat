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
    <div className="bg-primary text-cream rounded-card px-5 py-[18px] flex items-center gap-4">
      <div className="text-center shrink-0">
        <p className="text-[32px] font-bold leading-none">{daysLeft}</p>
        <p className="text-[11px] text-cream/70 mt-1">dagar kvar</p>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold">Högskoleprov</p>
        <p className="text-xs text-cream/70 mt-0.5">
          {weeksLeft > 0 ? `${weeksLeft} veckor` : 'Denna vecka'}
          {targetScore ? ` · Mål ${targetScore.toFixed(2)} HP` : ''}
        </p>
      </div>
      <CalendarDays size={20} className="text-cream/40 shrink-0" />
    </div>
  )
}
