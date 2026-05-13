import { formatInTimeZone } from 'date-fns-tz'
import { format, differenceInDays, differenceInWeeks, subDays } from 'date-fns'

export const STOCKHOLM_TZ = 'Europe/Stockholm'

export function todayInStockholm(): string {
  return formatInTimeZone(new Date(), STOCKHOLM_TZ, 'yyyy-MM-dd')
}

export function yesterdayInStockholm(): string {
  return formatInTimeZone(subDays(new Date(), 1), STOCKHOLM_TZ, 'yyyy-MM-dd')
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
