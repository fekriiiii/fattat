import { formatInTimeZone } from 'date-fns-tz'
import { format, differenceInDays, differenceInWeeks, subDays } from 'date-fns'

export const STOCKHOLM_TZ = 'Europe/Stockholm'

export function todayInStockholm(): string {
  return formatInTimeZone(new Date(), STOCKHOLM_TZ, 'yyyy-MM-dd')
}

export function yesterdayInStockholm(): string {
  return formatInTimeZone(subDays(new Date(), 1), STOCKHOLM_TZ, 'yyyy-MM-dd')
}

// The UTC instant of today's Stockholm midnight, as an ISO string. Use this
// for every "today" boundary in DB queries: the server runs UTC (Vercel), so
// `new Date().setHours(0,0,0,0)` there yields UTC midnight = 01:00/02:00 in
// Stockholm, shifting day rollover for every user and letting a session
// completed at 00:30 Stockholm count as "yesterday". (On the two DST-switch
// days per year the offset captured now can differ from midnight's by 1h —
// acceptable.)
export function stockholmDayStartUtcIso(): string {
  const offset = formatInTimeZone(new Date(), STOCKHOLM_TZ, 'XXX')
  return new Date(`${todayInStockholm()}T00:00:00${offset}`).toISOString()
}

// ISO weekday in Stockholm: 1 = Monday … 7 = Sunday. Replaces getDay() in
// server code, where the UTC weekday is yesterday's between 00:00 and ~02:00
// Stockholm time.
export function stockholmIsoWeekday(date: Date = new Date()): number {
  return Number(formatInTimeZone(date, STOCKHOLM_TZ, 'i'))
}

// Hour of day (0–23) in Stockholm — for greetings and other time-of-day copy
// rendered on the server.
export function stockholmHour(date: Date = new Date()): number {
  return Number(formatInTimeZone(date, STOCKHOLM_TZ, 'H'))
}

export function weeksUntil(date: Date): number {
  return Math.max(0, differenceInWeeks(date, new Date()))
}

export function daysUntil(date: Date): number {
  return Math.max(0, differenceInDays(date, new Date()))
}

export function formatDate(date: Date | string): string {
  return format(new Date(date), 'd MMMM yyyy')
}

export function currentWeekNumber(startDate: Date): number {
  const weeks = differenceInWeeks(new Date(), startDate)
  return Math.max(0, Math.min(weeks, 7))
}
