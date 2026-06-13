'use client'

import { cn } from '@/lib/utils/cn'
import { Flame } from 'lucide-react'

interface Props {
  currentStreak: number
  totalDaysStudied: number
  // Array of YYYY-MM-DD strings for days studied this month
  studiedDates: string[]
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
  // Returns 0=Sun, but we want 0=Mon
  const day = new Date(year, month, 1).getDay()
  return (day + 6) % 7
}

export function StreakCalendar({ currentStreak, totalDaysStudied, studiedDates }: Props) {
  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth()
  const todayStr = today.toISOString().slice(0, 10)
  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)
  const studiedSet = new Set(studiedDates)

  const monthName = today.toLocaleString('sv-SE', { month: 'long' })
  const dayLabels = ['M', 'T', 'O', 'T', 'F', 'L', 'S']

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  return (
    <div className="bg-white shadow-card border border-dark/[0.05] rounded-card px-5 py-5">
      <div className="flex items-center justify-between mb-3">
        <p className="card-label">Streak</p>
        <div className="flex items-center gap-1.5 bg-gradient-to-b from-gold/[0.14] to-gold/[0.07] ring-1 ring-inset ring-gold/20 rounded-full px-2.5 py-1">
          <Flame size={14} className="text-gold" />
          <span className="text-xs font-bold text-dark tabular-nums">
            {currentStreak} dag{currentStreak !== 1 ? 'ar' : ''}
          </span>
        </div>
      </div>

      <p className="text-xs font-bold text-dark/60 capitalize mb-2">{monthName} {year}</p>

      {/* Day labels */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {dayLabels.map((d, i) => (
          <div key={i} className="text-center text-[10px] text-dark/40 font-bold">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (!day) return <div key={`empty-${i}`} />
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const isStudied = studiedSet.has(dateStr)
          const isToday = dateStr === todayStr
          const isFuture = dateStr > todayStr
          return (
            <div
              key={day}
              className={cn(
                'aspect-square rounded-lg flex items-center justify-center text-[11px] font-medium',
                isToday && !isStudied && 'ring-[1.5px] ring-primary/60 font-bold text-dark',
                isToday && isStudied && 'ring-[1.5px] ring-gold/70',
                isStudied && 'bg-gradient-to-b from-primary-600 to-primary-700 text-cream font-bold shadow-[0_2px_6px_-1px_rgba(15,118,110,0.35)]',
                !isStudied && !isFuture && !isToday && 'bg-dark/[0.04] text-dark/55',
                isFuture && 'text-dark/30'
              )}
            >
              {day}
            </div>
          )
        })}
      </div>

      <p className="text-xs text-dark/55 mt-3">
        {totalDaysStudied} dag{totalDaysStudied !== 1 ? 'ar' : ''} totalt
      </p>
    </div>
  )
}
