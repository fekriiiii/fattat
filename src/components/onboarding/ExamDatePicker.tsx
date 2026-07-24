'use client'

import { cn } from '@/lib/utils/cn'
import { getUpcomingHpExams, type HpExamSitting } from '@/lib/hp/exam-dates'

type Props = {
  // ISO date string ("YYYY-MM-DD") or empty string for "not chosen"
  value: string
  onChange: (isoDate: string) => void
  // When true, also offers an "Inte bestämt än" card that clears the date
  allowSkip?: boolean
}

// Card-based picker for upcoming HP sittings. Replaces the manual <input type="date">
// that nobody could fill in correctly because exam dates aren't memorable.
export function ExamDatePicker({ value, onChange, allowSkip = true }: Props) {
  const exams = getUpcomingHpExams()

  // If the user previously stored a custom date that doesn't match a known sitting,
  // surface it as a passive note so we don't silently lose it.
  const customDate = value && !exams.some((e) => e.date === value) ? value : null

  return (
    <div className="flex flex-col gap-2">
      {exams.map((exam) => (
        <ExamCard
          key={exam.id}
          exam={exam}
          selected={value === exam.date}
          onSelect={() => onChange(exam.date)}
        />
      ))}

      {allowSkip && (
        <button
          type="button"
          onClick={() => onChange('')}
          className={cn(
            'w-full text-left rounded-card px-4 py-3 border transition-colors',
            value === ''
              ? 'border-primary bg-primary/[0.04]'
              : 'border-dark/10 bg-white hover:border-dark/20'
          )}
        >
          <p className="text-sm font-bold text-dark">Inte bestämt än</p>
          <p className="text-[12px] text-dark/55 mt-0.5">
            Du kan välja datum senare i profilen.
          </p>
        </button>
      )}

      {customDate && (
        <p className="text-[11px] text-dark/40 text-center pt-1">
          Tidigare valt datum: {formatCustom(customDate)}. Välj ett av alternativen ovan för att uppdatera.
        </p>
      )}
    </div>
  )
}

function ExamCard({
  exam,
  selected,
  onSelect,
}: {
  exam: HpExamSitting
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'w-full text-left rounded-card px-4 py-3 border transition-colors',
        selected
          ? 'border-primary bg-primary/[0.06]'
          : 'border-dark/10 bg-white hover:border-dark/20'
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <p className="text-sm font-bold text-dark">{exam.seasonLabel}</p>
          <p className="text-[13px] text-dark/65 mt-0.5">{exam.dateLabel}</p>
        </div>
        <div
          className={cn(
            'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors',
            selected ? 'border-primary' : 'border-dark/20'
          )}
        >
          {selected && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
        </div>
      </div>
      <p className="text-[11px] text-dark/45 mt-1.5">{exam.registrationWindow}</p>
    </button>
  )
}

function formatCustom(iso: string): string {
  try {
    const d = new Date(iso + 'T00:00:00')
    return d.toLocaleDateString('sv-SE', { day: 'numeric', month: 'long', year: 'numeric' })
  } catch {
    return iso
  }
}
