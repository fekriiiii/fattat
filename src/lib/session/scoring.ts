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
// Missing MEK falls back to an ORD-driven proxy. Missing ELF falls back to a
// neutral 1.0 HP — there's no honest proxy for English from Swedish reading.
function estimateVerbalHp(
  ordRetention: number,
  lasAccuracy: number,
  previousMekHp: number | null,
  previousElfHp: number | null,
): number {
  const ordHp = clampHp(ordRetention * 2.0)
  const lasHp = clampHp(lasAccuracy * 2.0)
  const mekHp = previousMekHp !== null ? previousMekHp : clampHp(mekProxyAcc(ordRetention) * 2.0)
  const elfHp = previousElfHp !== null ? previousElfHp : 1.0
  return clampHp((ordHp + mekHp + lasHp + elfHp) / 4)
}

function clampHp(n: number): number {
  return Math.min(2.0, Math.max(0, n))
}

// Predict total HP.
// Returns null when no previousHpScore is available — the caller should
// display verbal accuracy instead of a total-HP number.
// When previousHpScore is known we use it as the quant proxy:
//   HP = (verbalHp + quantHp) / 2,  quantHp ≈ previousHpScore
// The uncertainty band reflects three sources:
//   • how much trained data we have (sessionCount)
//   • whether the user gave us their previous MEK score
//   • whether the user gave us their previous ELF score
// Floor: ±0.05 (real-world test variance). Ceiling: ~±0.38 with no data at all.
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
  const verbalHp = estimateVerbalHp(ordRetention, lasAccuracy, previousMekScore, previousElfScore)
  const mid = (verbalHp + previousHpScore) / 2

  // Session-driven uncertainty: shrinks as we accumulate trained data.
  const sessionUnc = 0.05 + 0.15 * Math.exp(-sessionCount / 20)
  // Add honest uncertainty for the subsections we're guessing on.
  // MEK has a decent ORD-based proxy → small penalty.
  // ELF has no proxy at all → larger penalty.
  const mekUnc = previousMekScore !== null ? 0 : 0.05
  const elfUnc = previousElfScore !== null ? 0 : 0.08
  const uncertainty = sessionUnc + mekUnc + elfUnc

  return {
    low: Math.max(0, toHpStep(mid - uncertainty)),
    mid: Math.min(2.0, toHpStep(mid)),
    high: Math.min(2.0, toHpStep(mid + uncertainty)),
  }
}

// Compute verbal accuracy (ORD + LÄS combined) for display when no HP prediction.
export function computeVerbalAccuracy(ordRetention: number, lasAccuracy: number): number {
  return (ordRetention + lasAccuracy) / 2
}

export function computeAvgRetention(cards: FsrsCard[]): number {
  if (!cards.length) return 0.3
  const reviewed = cards.filter((c) => c.reps > 0)
  if (!reviewed.length) return 0.3
  const retentions = reviewed.map((c) =>
    Math.exp(-c.elapsed_days / Math.max(c.stability, 0.001))
  )
  return retentions.reduce((a, b) => a + b, 0) / retentions.length
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
    const verbalHp = estimateVerbalHp(ordProj, lasProj, previousMekScore, previousElfScore)
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
