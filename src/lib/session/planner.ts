import { addDays } from 'date-fns'
import { formatInTimeZone } from 'date-fns-tz'
import { STOCKHOLM_TZ } from '@/lib/utils/date'
import { rawToHp } from './scoring'

// ─── Exam scheduling (Step 16b, v1: phase-based only) ──────────────────────
// Phase boundaries as fraction of total prep time.
const FOUNDATION_END_PCT = 0.40
const BUILD_END_PCT = 0.80
const TEST_DENSITY_END_PCT = 0.95
// Days between exams within each phase (mid of the recommended range).
const FOUNDATION_CADENCE_DAYS = 12  // recommended range 10–14
const BUILD_CADENCE_DAYS = 6        // recommended range 5–7
const TEST_DENSITY_CADENCE_DAYS = 3 // recommended range 2–3

/**
 * Compute the schedule of upcoming övningsprov dates for a study plan.
 * Phase-based pacing only (v1). Performance-adaptive rescheduling is v2.
 *
 * For a 150-day plan, this produces ~22 exams: ~5 in foundation,
 * ~10 in build, ~7 in test density, none in taper.
 *
 * Returns an array of YYYY-MM-DD date strings in Stockholm time, sorted
 * ascending. Deterministic for a given (daysTotal, planStartDate) pair.
 */
export function computeExamSchedule(
  daysTotal: number,
  planStartDate: Date,
): string[] {
  if (daysTotal <= 0) return []

  const dates: string[] = []
  const foundationEnd = Math.floor(daysTotal * FOUNDATION_END_PCT)
  const buildEnd = Math.floor(daysTotal * BUILD_END_PCT)
  const testDensityEnd = Math.floor(daysTotal * TEST_DENSITY_END_PCT)

  const pushDay = (dayOffset: number) => {
    const d = addDays(planStartDate, dayOffset)
    dates.push(formatInTimeZone(d, STOCKHOLM_TZ, 'yyyy-MM-dd'))
  }

  // Foundation phase: every FOUNDATION_CADENCE_DAYS up to foundationEnd
  let day = FOUNDATION_CADENCE_DAYS
  while (day <= foundationEnd) {
    pushDay(day)
    day += FOUNDATION_CADENCE_DAYS
  }

  // Build phase: continue from end of foundation, switch to BUILD_CADENCE_DAYS
  day = Math.max(day, foundationEnd + BUILD_CADENCE_DAYS)
  while (day <= buildEnd) {
    pushDay(day)
    day += BUILD_CADENCE_DAYS
  }

  // Test density phase: switch to TEST_DENSITY_CADENCE_DAYS
  day = Math.max(day, buildEnd + TEST_DENSITY_CADENCE_DAYS)
  while (day <= testDensityEnd) {
    pushDay(day)
    day += TEST_DENSITY_CADENCE_DAYS
  }

  // Taper phase: no exams.
  return dates
}

export interface GapResult {
  daysLeft: number
  targetOrdAcc: number            // 0-1, required ORD accuracy
  baselineOrdAcc: number          // 0-1, from diagnostic
  newWordsNeeded: number          // total new words to learn
  dailyNewWords: number           // new words per day (exact, no cap)
  dailyOrdQuota: number           // total words per session (new + reviews)
  estimatedMinutesPerDay: number  // how long a daily session takes
  achievableHp: number            // HP reachable at a lighter pace (10 new/day)
  isHeavy: boolean                // true when dailyNewWords > 10
  message: string
}

// "Lighter pace" reference point — what you can reach at a comfortable rate
const COMFORTABLE_NEW_PER_DAY = 10

// Fraction of a session that is new words (rest is FSRS review)
const NEW_WORD_FRACTION = 0.4

// Time estimate per ORD question (typing + reading feedback), seconds
const SECONDS_PER_ORD = 40

// Fixed LÄS time per session (reading + questions), minutes
const LAS_MINUTES = 18

export function calculateGap(params: {
  baselineOrdAcc: number
  baselineLasAcc: number
  targetHp: number
  examDate: Date
  totalWords: number
}): GapResult {
  const { baselineOrdAcc, baselineLasAcc, targetHp, examDate, totalWords } = params

  const daysLeft = Math.max(0, Math.floor((examDate.getTime() - Date.now()) / 86_400_000))

  // Convert target HP → required ORD accuracy
  // HP = (ordRaw + lasRaw + quantRaw) / 80, quantRaw ≈ 40 (national avg)
  // Assuming ORD and LÄS share verbal score equally:
  //   targetOrdAcc = (targetHp * 80 - 40) / 80
  const targetOrdAcc = Math.min(1, Math.max(0, (targetHp * 80 - 40) / 80))

  const ordGap = Math.max(0, targetOrdAcc - baselineOrdAcc)
  const newWordsNeeded = Math.ceil(ordGap * Math.max(totalWords, 1))

  // Exact daily new words — no artificial cap; we tell the user what it takes
  const dailyNewWords = daysLeft > 0 ? Math.ceil(newWordsNeeded / daysLeft) : newWordsNeeded

  // Total session size: new words are ~40% of session, reviews fill the rest
  const dailyOrdQuota = Math.max(10, Math.ceil(dailyNewWords / NEW_WORD_FRACTION))

  // How long will a session take?
  const estimatedMinutesPerDay = Math.round(dailyOrdQuota * (SECONDS_PER_ORD / 60) + LAS_MINUTES)

  // Flag sessions that require more than a comfortable pace
  const isHeavy = dailyNewWords > COMFORTABLE_NEW_PER_DAY

  // What could the user reach at a comfortable pace (for context)?
  const achievableNewWords = COMFORTABLE_NEW_PER_DAY * daysLeft
  const achievableOrdAcc = Math.min(1, baselineOrdAcc + achievableNewWords / Math.max(totalWords, 1))
  const achievableOrdRaw = achievableOrdAcc * 40
  const achievableLasAcc = Math.min(1, baselineLasAcc + (achievableOrdAcc - baselineOrdAcc) * 0.8)
  const achievableLasRaw = achievableLasAcc * 40
  const achievableHp = rawToHp(achievableOrdRaw + achievableLasRaw + 40)

  const message = buildMessage({
    isHeavy,
    daysLeft,
    newWordsNeeded,
    dailyNewWords,
    targetHp,
    achievableHp,
    estimatedMinutesPerDay,
    baselineOrdAcc,
    baselineLasAcc,
  })

  return {
    daysLeft,
    targetOrdAcc,
    baselineOrdAcc,
    newWordsNeeded,
    dailyNewWords,
    dailyOrdQuota,
    estimatedMinutesPerDay,
    achievableHp,
    isHeavy,
    message,
  }
}

function buildMessage(p: {
  isHeavy: boolean
  daysLeft: number
  newWordsNeeded: number
  dailyNewWords: number
  targetHp: number
  achievableHp: number
  estimatedMinutesPerDay: number
  baselineOrdAcc: number
  baselineLasAcc: number
}): string {
  const lasWarning = p.baselineLasAcc < p.baselineOrdAcc - 0.2
    ? ' Din läsförståelse är ditt svagaste område — prioritera att läsa alla artiklar i varje session.'
    : ''

  if (p.daysLeft <= 0) {
    return 'Ditt provdatum har passerat. Uppdatera det i profilen för att få en ny plan.'
  }

  if (p.newWordsNeeded === 0) {
    return `Du är redan på rätt nivå. ${p.estimatedMinutesPerDay} minuter om dagen håller dig i form.${lasWarning}`
  }

  if (!p.isHeavy) {
    return `Du behöver lära dig ${p.newWordsNeeded} nya ord — ${p.dailyNewWords} ord per dag. Det tar ungefär ${p.estimatedMinutesPerDay} minuter i Fattat per dag.${lasWarning}`
  }

  return `Att nå ${p.targetHp.toFixed(2)} HP kräver ${p.dailyNewWords} nya ord per dag (${p.estimatedMinutesPerDay} min/dag). Vid ett lugnare tempo på 10 ord per dag kan du nå ${p.achievableHp.toFixed(2)} HP.${lasWarning}`
}
