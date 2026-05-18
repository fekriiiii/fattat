import type { FsrsCard } from '@/types/database'

export interface TrajectoryPoint {
  day: number
  score: number
}

interface ScoreInput {
  fsrsCards: FsrsCard[]
  lasAccuracy: number // 0-1 from recent sessions
}

interface ScoreRange {
  low: number
  high: number
  mid: number
}

// Convert raw score (0–120) to HP scale (0.00–2.00, rounded to nearest 0.05)
// Max raw is 120: ORD(40) + LÄS(40) + Quant(40)
export function rawToHp(raw: number): number {
  return Math.round((raw / 120) * 40) / 20
}

// Round to nearest valid HP step (0.05 increments)
function toHpStep(n: number): number {
  return Math.round(n / 0.05) * 0.05
}

// Proxy for MEK accuracy when the user hasn't given us their prior MEK score.
// MEK (meningskomplettering) is heavily vocabulary-driven, so ORD retention is
// a defensible signal — but we keep the slope conservative because they aren't
// the same skill. Range: 40% (no vocab) → 80% (full vocab mastery).
function mekProxyAcc(ordRetention: number): number {
  return 0.4 + Math.max(0, Math.min(1, ordRetention)) * 0.4
}

// Estimate verbal HP as the average of all four subsection HPs (ORD, MEK, LÄS, ELF).
// Each subsection is treated as accuracy × 2.0 (50% accuracy → 1.0 HP).
// Missing MEK falls back to an ORD-driven proxy.
// Missing ELF falls back to the user's previous HP score when we have one
// (English ability correlates with overall HP), and to a neutral 1.0 only
// when we know nothing. Previously this defaulted to 1.0 unconditionally,
// which pulled every prediction toward the middle.
function estimateVerbalHp(
  ordRetention: number,
  lasAccuracy: number,
  previousMekHp: number | null,
  previousElfHp: number | null,
  previousHpScore: number | null = null,
): number {
  const ordHp = clampHp(ordRetention * 2.0)
  const lasHp = clampHp(lasAccuracy * 2.0)
  const mekHp = previousMekHp !== null ? previousMekHp : clampHp(mekProxyAcc(ordRetention) * 2.0)
  const elfHp = previousElfHp !== null
    ? previousElfHp
    : previousHpScore !== null
      ? clampHp(previousHpScore)
      : 1.0
  return clampHp((ordHp + mekHp + lasHp + elfHp) / 4)
}

function clampHp(n: number): number {
  return Math.min(2.0, Math.max(0, n))
}

// Shared band-builder used by both predictScore (post-onboarding, FSRS-driven)
// and estimateDiagnosticBand (pre-onboarding, no FSRS yet). Centralizing this
// math means the dashboard and the diagnostic stay consistent — previously the
// diagnostic duplicated the formula inline and drifted (e.g. hardcoded unc).
//
// When previousHpScore is null we still produce a band using the verbal HP
// alone (which is what the diagnostic needs); predictScore guards against that
// case separately because the dashboard uses null as a signal to switch UI.
function buildScoreBand({
  ordRetention,
  lasAccuracy,
  previousHpScore,
  previousMekScore,
  previousElfScore,
  sessionCount,
}: {
  ordRetention: number
  lasAccuracy: number
  previousHpScore: number | null
  previousMekScore: number | null
  previousElfScore: number | null
  sessionCount: number
}): ScoreRange {
  const verbalHp = estimateVerbalHp(
    ordRetention,
    lasAccuracy,
    previousMekScore,
    previousElfScore,
    previousHpScore,
  )
  const quantHp = previousHpScore ?? 1.0
  const mid = (verbalHp + quantHp) / 2

  // Session-driven uncertainty: shrinks as we accumulate trained data.
  // At sessionCount=0 this is 0.20 (diagnostic state); at ~60 sessions it's ≈0.05.
  const sessionUnc = 0.05 + 0.15 * Math.exp(-sessionCount / 20)

  // Subsection uncertainty: penalize predictions whose ELF / MEK we had to guess.
  // MEK has a decent ORD-based proxy → small penalty (0.05).
  // ELF has only previousHpScore as a proxy → half the penalty when we have HP (0.04),
  // full penalty when we know nothing (0.08).
  const mekUnc = previousMekScore !== null ? 0 : 0.05
  const elfUnc = previousElfScore !== null
    ? 0
    : previousHpScore !== null
      ? 0.04
      : 0.08
  const uncertainty = sessionUnc + mekUnc + elfUnc

  return {
    low: Math.max(0, toHpStep(mid - uncertainty)),
    mid: Math.min(2.0, toHpStep(mid)),
    high: Math.min(2.0, toHpStep(mid + uncertainty)),
  }
}

// Predict total HP. Returns null when no previousHpScore is available — the
// caller should display verbal accuracy instead of a total-HP number.
// When previousHpScore is known we use it as the quant proxy:
//   HP = (verbalHp + quantHp) / 2,  quantHp ≈ previousHpScore
// Uncertainty band logic lives in buildScoreBand.
export function predictScore({
  fsrsCards,
  lasAccuracy,
  previousHpScore,
  previousMekScore = null,
  previousElfScore = null,
  sessionCount = 0,
}: ScoreInput & {
  previousHpScore: number | null
  previousMekScore?: number | null
  previousElfScore?: number | null
  sessionCount?: number
}): ScoreRange | null {
  if (previousHpScore === null) return null
  const ordRetention = computeAvgRetention(fsrsCards)
  return buildScoreBand({
    ordRetention,
    lasAccuracy,
    previousHpScore,
    previousMekScore,
    previousElfScore,
    sessionCount,
  })
}

// Diagnostic variant: takes raw accuracies directly (no FSRS cards exist yet)
// and always returns a band, even when previousHpScore is null. The diagnostic
// always owes the user a number after they finish the 20 ORD + LÄS questions.
export function estimateDiagnosticBand({
  baselineOrdAcc,
  baselineLasAcc,
  previousHpScore,
  previousMekScore = null,
  previousElfScore = null,
}: {
  baselineOrdAcc: number
  baselineLasAcc: number
  previousHpScore: number | null
  previousMekScore?: number | null
  previousElfScore?: number | null
}): ScoreRange {
  return buildScoreBand({
    ordRetention: baselineOrdAcc,
    lasAccuracy: baselineLasAcc,
    previousHpScore,
    previousMekScore,
    previousElfScore,
    sessionCount: 0,
  })
}

// Compute verbal accuracy (ORD + LÄS combined) for display when no HP prediction.
export function computeVerbalAccuracy(ordRetention: number, lasAccuracy: number): number {
  return (ordRetention + lasAccuracy) / 2
}

export function computeAvgRetention(cards: Pick<FsrsCard, 'stability' | 'elapsed_days' | 'reps' | 'difficulty'>[]): number {
  if (!cards.length) return 0.3
  // Only count cards that have aged since their last review (elapsed_days > 0).
  // Cards with elapsed_days = 0 were just answered and give exp(0) = 1.0, which
  // makes the plan think the user already knows everything right after the diagnostic.
  const aged = cards.filter((c) => c.reps > 0 && c.elapsed_days > 0)
  if (!aged.length) return 0.3
  // Weight by FSRS difficulty so harder cards count more toward the average.
  // ts-fsrs difficulty ranges roughly 1–10. We use `0.5 + difficulty / 10` to
  // produce a modest re-weighting (0.6×–1.5× of equal weighting). Defaults to
  // 1.0 when difficulty isn't set, which keeps existing rows behaving sanely.
  // Rationale: HP-grade items skew medium-hard, so retention on hard cards is
  // a better predictor of exam performance than retention on easy ones.
  let weightedSum = 0
  let totalWeight = 0
  for (const c of aged) {
    const retention = Math.exp(-c.elapsed_days / Math.max(c.stability, 0.001))
    const difficulty = typeof c.difficulty === 'number' && c.difficulty > 0 ? c.difficulty : 5
    const weight = 0.5 + difficulty / 10
    weightedSum += retention * weight
    totalWeight += weight
  }
  return totalWeight > 0 ? weightedSum / totalWeight : 0.3
}

export function computeLasAccuracy(
  recentResponses: Array<{ is_correct: boolean; question_type: string }>
): number {
  const lasResponses = recentResponses.filter((r) => r.question_type === 'las')
  if (!lasResponses.length) return 0.3
  return lasResponses.filter((r) => r.is_correct).length / lasResponses.length
}

export function generateStudyPlan(
  baseline: number,
  target: number,
  examDate: Date,
  dailyOrdQuota = 15,
  startDate = new Date()
): Array<{ week: number; focus: string; ord_target: number; las_target: number }> {
  const msPerWeek = 7 * 24 * 60 * 60 * 1000
  const weeksLeft = Math.floor((examDate.getTime() - startDate.getTime()) / msPerWeek)
  const weeks = Math.max(1, Math.min(weeksLeft, 8))
  const weeklyOrd = dailyOrdQuota * 7

  return Array.from({ length: weeks }, (_, i) => {
    const isEarlyPhase = i < Math.ceil(weeks / 2)
    return {
      week: i + 1,
      focus: isEarlyPhase
        ? 'Ordförråd & grundläggande LÄS'
        : 'LÄS djupdykning & ordrepetition',
      ord_target: weeklyOrd,
      las_target: isEarlyPhase ? 10 : 20,
    }
  })
}

// Fraction of the last 30 days on which the user completed a session (0–1)
export function computeStudyConsistency(sessionDates: string[]): number {
  const cutoff = Date.now() - 30 * 86400000
  const distinctDays = new Set(
    sessionDates
      .filter((d) => new Date(d).getTime() >= cutoff)
      .map((d) => d.slice(0, 10))
  ).size
  return Math.min(1, distinctDays / 30)
}

// Project score curve from today to exam day based on current pace.
// Returns empty array when previousHpScore is null (no HP prediction possible).
export function projectScoreTrajectory({
  fsrsCards,
  lasAccuracy,
  daysToExam,
  studyConsistency,
  previousHpScore,
  previousMekScore = null,
  previousElfScore = null,
}: {
  fsrsCards: FsrsCard[]
  lasAccuracy: number
  daysToExam: number
  studyConsistency: number
  previousHpScore: number | null
  previousMekScore?: number | null
  previousElfScore?: number | null
}): TrajectoryPoint[] {
  if (previousHpScore === null) return []
  const quantHp = previousHpScore

  const avgRetention = computeAvgRetention(fsrsCards)
  const STEPS = 20
  const stepSize = daysToExam / STEPS
  const points: TrajectoryPoint[] = []

  function scoreAtDay(d: number): number {
    const ordProj = 1 - (1 - avgRetention) * Math.exp(-studyConsistency * d / 25)
    const lasProj = 1 - (1 - lasAccuracy) * Math.exp(-studyConsistency * d / 50)
    const verbalHp = estimateVerbalHp(ordProj, lasProj, previousMekScore, previousElfScore, previousHpScore)
    return Math.min(2.0, toHpStep((verbalHp + quantHp) / 2))
  }

  for (let i = 0; i <= STEPS; i++) {
    const d = Math.round(i * stepSize)
    points.push({ day: d, score: scoreAtDay(d) })
  }

  const lastDay = points[points.length - 1].day
  if (lastDay !== daysToExam) {
    points.push({ day: daysToExam, score: scoreAtDay(daysToExam) })
  }

  return points
}

export function estimateDiagnosticScore(
  ordCorrect: number,
  ordTotal: number,
  lasCorrect: number,
  lasTotal: number
): ScoreRange {
  const ordAcc = ordTotal > 0 ? ordCorrect / ordTotal : 0.5
  const lasAcc = lasTotal > 0 ? lasCorrect / lasTotal : 0.5
  const ordScore = Math.round(ordAcc * 40)
  const lasScore = Math.round(lasAcc * 40)
  const total = ordScore + lasScore + 30
  return {
    low: Math.max(0, total - 15),
    high: Math.min(120, total + 15),
    mid: Math.min(120, total),
  }
}
