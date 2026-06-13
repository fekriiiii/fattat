import type { SessionBalance } from '@/types/database'
import { stockholmIsoWeekday } from '@/lib/utils/date'

// LÄS days for ord_heavy users: Mon (1), Wed (3), Fri (5).
// ORD days for las_heavy users: Tue (2), Thu (4), Sat (6).
// Fixed weekdays so the user can predict their week ("LÄS on Wednesday")
// rather than guessing from a rolling rotation.
// Weekday is computed in Stockholm time — these run on a UTC server, where
// getDay() would give yesterday's weekday between 00:00 and ~02:00 Stockholm.

export function shouldRunLasToday(balance: SessionBalance, date: Date = new Date()): boolean {
  if (balance === 'balanced') return true
  if (balance === 'las_heavy') return true
  // ord_heavy
  const d = stockholmIsoWeekday(date)
  return d === 1 || d === 3 || d === 5
}

export function shouldRunOrdToday(balance: SessionBalance, date: Date = new Date()): boolean {
  if (balance === 'balanced') return true
  if (balance === 'ord_heavy') return true
  // las_heavy
  const d = stockholmIsoWeekday(date)
  return d === 2 || d === 4 || d === 6
}

// Pick the initial balance from diagnostic accuracy. Threshold is 20pp — below
// that the gap is inside diagnostic noise (20 ORD + ~6 LÄS = ~10pp std error)
// and balanced wins on interleaving grounds.
export function pickBalanceFromDiagnostic(ordAcc: number, lasAcc: number): SessionBalance {
  const gap = lasAcc - ordAcc
  if (gap >= 0.20) return 'ord_heavy'
  if (gap <= -0.20) return 'las_heavy'
  return 'balanced'
}

export function balanceLabel(b: SessionBalance): string {
  if (b === 'ord_heavy') return 'ORD-tung'
  if (b === 'las_heavy') return 'LÄS-tung'
  return 'Balanserad'
}

export function balanceExplanation(b: SessionBalance): string {
  if (b === 'ord_heavy')
    return 'Din LÄS är starkare än ditt ordförråd — vi kör ORD varje dag och LÄS måndag, onsdag och fredag så du bygger ordförrådet utan att tappa läsförmågan.'
  if (b === 'las_heavy')
    return 'Ditt ordförråd är starkare än din LÄS — vi kör LÄS varje dag och ORD tisdag, torsdag och lördag så du tränar läsförståelse utan att tappa orden.'
  return 'Du är jämn på ORD och LÄS — vi kör båda i varje session så ordförrådet förstärker läsningen och tvärtom.'
}
