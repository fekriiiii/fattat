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
    <div className="bg-white shadow-card rounded-card px-4 py-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold uppercase tracking-widest text-dark/55">Streak</p>
        <div className="flex items-center gap-1 text-primary">
          <Flame size={16} />
          <span className="text-sm font-bold text-dark">
            {currentStreak} dag{currentStreak !== 1 ? 'ar' : ''}
          </span>
        </div>
      </div>

      <p className="text-xs text-dark/65 capitalize mb-2">{monthName} {year}</p>

      {/* Day labels */}
      <div className="grid grid-cols-7 gap-0.5 mb-0.5">
        {dayLabels.map((d, i) => (
          <div key={i} className="text-center text-[10px] text-dark/55 font-bold">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-0.5">
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
                'aspect-square rounded-sm flex items-center justify-center text-[11px] font-medium',
                isToday && 'ring-1 ring-primary/60',
                isStudied && 'bg-primary text-cream',
                !isStudied && !isFuture && 'bg-dark/5 text-dark/60',
                isFuture && 'text-dark/35'
              )}
            >
              {day}
            </div>
          )
        })}
      </div>

      <p className="text-xs text-dark/60 mt-3">
        {totalDaysStudied} dag{totalDaysStudied !== 1 ? 'ar' : ''} totalt
      </p>
    </div>
  )
}
