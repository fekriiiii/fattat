// Officially announced HP exam dates from UHR.
// When a new sitting is announced, append it here. Past sittings can stay —
// `getUpcomingHpExams()` filters out anything earlier than today.
//
// Source: https://www.studera.nu/hogskoleprov/

export type HpExamSitting = {
  // Internal id, e.g. "host-2026" — used as a stable React key
  id: string
  // ISO date of the exam (YYYY-MM-DD), used everywhere downstream
  date: string
  // Swedish season label, e.g. "Hösten 2026"
  seasonLabel: string
  // Human-readable date label, e.g. "18 oktober 2026"
  dateLabel: string
  // Registration window — shown as a hint on the picker
  registrationWindow: string
}

export const HP_EXAMS: HpExamSitting[] = [
  {
    id: 'host-2026',
    date: '2026-10-18',
    seasonLabel: 'Hösten 2026',
    dateLabel: '18 oktober 2026',
    registrationWindow: 'Anmälan: 11–18 augusti 2026',
  },
  {
    id: 'var-2027',
    date: '2027-04-10',
    seasonLabel: 'Våren 2027',
    dateLabel: '10 april 2027',
    registrationWindow: 'Anmälan: 7–14 januari 2027',
  },
  {
    id: 'host-2027',
    date: '2027-10-24',
    seasonLabel: 'Hösten 2027',
    dateLabel: '24 oktober 2027',
    registrationWindow: 'Anmälan: 17–24 augusti 2027',
  },
]

// Returns sittings whose date is today or later, ascending.
export function getUpcomingHpExams(now: Date = new Date()): HpExamSitting[] {
  const today = new Date(now)
  today.setHours(0, 0, 0, 0)
  return HP_EXAMS
    .filter((e) => {
      const d = new Date(e.date + 'T00:00:00')
      return d.getTime() >= today.getTime()
    })
    .sort((a, b) => a.date.localeCompare(b.date))
}

// Returns the matching sitting for an ISO date, or null if none matches
// (e.g. user picked a date manually before this config existed).
export function findHpExamByDate(isoDate: string | null | undefined): HpExamSitting | null {
  if (!isoDate) return null
  return HP_EXAMS.find((e) => e.date === isoDate) ?? null
}
