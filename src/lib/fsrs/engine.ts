import {
  FSRS,
  generatorParameters,
  createEmptyCard,
  Rating,
  type Card,
} from 'ts-fsrs'
import type { FsrsCard } from '@/types/database'
import type { SupabaseClient } from '@supabase/supabase-js'

const params = generatorParameters({ enable_fuzz: true, maximum_interval: 365 })
const f = new FSRS(params)

// Cache schedulers per retention target so we don't reconstruct on every review.
// Keyed by 2-decimal target (0.82 / 0.85 / 0.88 / 0.90) — at most a handful of entries.
const schedulers = new Map<number, FSRS>()
function getScheduler(requestRetention: number): FSRS {
  const key = Math.round(requestRetention * 100) / 100
  let s = schedulers.get(key)
  if (!s) {
    s = new FSRS(generatorParameters({
      enable_fuzz: true,
      maximum_interval: 365,
      request_retention: key,
    }))
    schedulers.set(key, s)
  }
  return s
}

// Picks FSRS request_retention based on days to the user's next exam.
// Default ts-fsrs target (0.9) is calibrated for lifelong learners with no deadline.
// HP candidates have a fixed exam date — as it approaches, lower targets stretch
// intervals less aggressively in exchange for fitting more new words into the
// remaining runway. Above 90 days out, behave like a normal Anki user (0.90).
// Inside 30 days, accept ~18% in-session forgetting to maximize coverage.
export function retentionForDaysToExam(daysToExam: number | null): number {
  if (daysToExam == null || daysToExam >= 90) return 0.90
  if (daysToExam >= 60) return 0.88
  if (daysToExam >= 30) return 0.85
  return 0.82
}

// Picks the next future exam date from a sorted ISO-date array. Returns null if
// the plan has no future exams (post-exam window) — caller falls back to default.
export function pickNextExamDate(examSchedule: string[] | null | undefined): Date | null {
  if (!examSchedule || examSchedule.length === 0) return null
  const now = Date.now()
  for (const iso of examSchedule) {
    const d = new Date(iso)
    if (d.getTime() >= now) return d
  }
  return null
}

export function daysUntil(date: Date | null): number | null {
  if (!date) return null
  return Math.ceil((date.getTime() - Date.now()) / 86400000)
}

export { Rating }

export function createCard(): Card {
  return createEmptyCard()
}

export function dbRowToCard(row: FsrsCard): Card {
  return {
    due: new Date(row.due),
    stability: row.stability,
    difficulty: row.difficulty,
    elapsed_days: row.elapsed_days,
    scheduled_days: row.scheduled_days,
    reps: row.reps,
    lapses: row.lapses,
    learning_steps: row.learning_steps ?? 0,
    state: row.state as 0 | 1 | 2 | 3,
    last_review: row.last_review ? new Date(row.last_review) : undefined,
  }
}

export function cardToDbUpdate(card: Card) {
  return {
    due: card.due.toISOString(),
    stability: card.stability,
    difficulty: card.difficulty,
    elapsed_days: card.elapsed_days,
    scheduled_days: card.scheduled_days,
    reps: card.reps,
    lapses: card.lapses,
    learning_steps: card.learning_steps ?? 0,
    state: card.state,
    last_review: card.last_review?.toISOString() ?? null,
    updated_at: new Date().toISOString(),
  }
}

export function scheduleCard(card: Card, rating: Rating, requestRetention?: number) {
  const sched = requestRetention != null ? getScheduler(requestRetention) : f
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (sched.repeat(card, new Date()) as any)[rating] as { card: Card; log: unknown }
}

export function ratingFromAnswer(isCorrect: boolean): Rating {
  return isCorrect ? Rating.Good : Rating.Again
}

// Latency→rating thresholds. Every ORD answer is now a single tap after reading
// ~5 options, so one set of thresholds covers everything.
//
// History worth keeping: there used to be a second, slower set for the typed
// answer format, because producing a whole Swedish synonym on a mobile keyboard
// costs ~3–5s of motor time alone and correct typed answers were landing in Hard
// almost every time — the "Hard misuse" pattern the FSRS authors warn the
// algorithm cannot adapt to (suppressed intervals, inflated review load). Typing
// was removed on 2026-07-24, so the second set went with it.
//
// The same trap is now guarded on the client instead: familiar words hold their
// options back for a recall pause, and the response timer starts when the options
// appear — never at mount. If that ever regresses, every paused word starts
// reading as Hard and the bug is back in a new costume.
export function ratingFromAnswerWithLatency(
  isCorrect: boolean,
  responseMs: number
): Rating {
  if (!isCorrect) return Rating.Again
  if (responseMs < 2000) return Rating.Easy
  if (responseMs > 7000) return Rating.Hard
  return Rating.Good
}

// Minimum new (unseen) words to introduce every session regardless of review backlog.
// Without this, early-learning FSRS cards fill the entire quota and new words never enter.
const MIN_NEW_WORDS_PER_SESSION = 5

// Select word IDs due for review, filling remaining slots with new unseen words
export async function selectDueWordIds(
  supabase: SupabaseClient,
  userId: string,
  limit: number
): Promise<{ ids: string[]; newIds: Set<string> }> {
  const now = new Date().toISOString()

  // Cap reviews to leave room for new words every session.
  // Scale the reservation with the quota so small custom quotas don't end up
  // with reviewLimit ≤ 0 (which makes the .limit(0) review query return
  // nothing and silently breaks the session).
  const newWordsTarget = Math.max(1, Math.min(MIN_NEW_WORDS_PER_SESSION, Math.floor(limit / 4)))
  const reviewLimit = Math.max(0, limit - newWordsTarget)

  const { data: dueCards } = await supabase
    .from('fsrs_cards')
    .select('word_id, due, mcq_correct_streak')
    .eq('user_id', userId)
    .lte('due', now)
    .order('due', { ascending: true })
    .limit(reviewLimit)

  // Shuffle cards that share the same due date so order varies between sessions
  const dueRows = dueCards ?? []
  const shuffled = dueRows
    .slice()
    .sort((a, b) => {
      const diff = new Date(a.due).getTime() - new Date(b.due).getTime()
      return diff !== 0 ? diff : Math.random() - 0.5
    })
  const dueIds: string[] = shuffled.map((r: { word_id: string }) => r.word_id)
  const newIds = new Set<string>()

  // Due cards that haven't yet graduated to typing (mcq_correct_streak < 2)
  // are flagged for MCQ display alongside truly-new words. The session page
  // uses `newWordIds.has(id)` to pick MCQ vs typing — same predicate works
  // for both classes.
  for (const row of shuffled) {
    const streak = (row as { mcq_correct_streak?: number }).mcq_correct_streak ?? 0
    if (streak < 2) newIds.add(row.word_id)
  }

  if (dueIds.length < limit) {
    const slotCount = limit - dueIds.length
    // Prefer the DB function (migration 016) — avoids URL length limits that arise
    // when excluding hundreds of seen UUIDs as query parameters.
    const { data: rpcData, error: rpcError } = await supabase.rpc('select_new_word_ids', {
      p_user_id: userId,
      p_limit: slotCount,
    })
    let freshIds: string[]
    if (!rpcError && rpcData) {
      freshIds = (rpcData as { id: string }[]).map((r) => r.id)
    } else {
      // Fallback for when migration 016 hasn't been applied yet. Mirror the
      // RPC's curated-only filter (migration 022) — past-HP words have 0%
      // exam-day appearance odds and should never be introduced as new daily
      // FSRS cards.
      const { data: seenCards } = await supabase
        .from('fsrs_cards')
        .select('word_id')
        .eq('user_id', userId)
      const seenIds: string[] = (seenCards ?? []).map((r: { word_id: string }) => r.word_id)
      const allExcluded = [...new Set([...dueIds, ...seenIds])]
      // past_exams is TEXT[]; .contains checks array containment.
      let query = supabase.from('words').select('id').contains('past_exams', ['curated']).limit(slotCount)
      if (allExcluded.length > 0) {
        query = query.not('id', 'in', `(${allExcluded.map((id) => `'${id}'`).join(',')})`)
      }
      const { data: fallbackData } = await query
      freshIds = (fallbackData ?? []).map((r: { id: string }) => r.id)
    }
    freshIds = freshIds.sort(() => Math.random() - 0.5)
    for (const id of freshIds) newIds.add(id)
    dueIds.push(...freshIds)
  }

  return { ids: dueIds, newIds }
}

// Interleave words by domain (round-robin).
// When preferredDomain is given, front-load up to ~60% of the output from that
// domain (preserving FSRS due order within it), then round-robin the remaining
// queues for the rest. Without preferredDomain, behaves as a pure round-robin.
export function interleaveByDomain<T extends { id: string; domain: string }>(
  words: T[],
  preferredDomain?: string,
): T[] {
  const byDomain: Record<string, T[]> = {}
  for (const w of words) {
    if (!byDomain[w.domain]) byDomain[w.domain] = []
    byDomain[w.domain].push(w)
  }

  const result: T[] = []
  const preferredQueue = preferredDomain ? (byDomain[preferredDomain] ?? []) : []
  const otherQueues: T[][] = preferredDomain
    ? Object.entries(byDomain).filter(([d]) => d !== preferredDomain).map(([, q]) => q)
    : Object.values(byDomain)

  // Phase 1: drain preferred domain up to ~60% of total. Leftovers go back
  // into the round-robin pool so we don't waste them.
  if (preferredQueue.length > 0) {
    const preferredCap = Math.min(preferredQueue.length, Math.ceil(words.length * 0.6))
    for (let i = 0; i < preferredCap; i++) result.push(preferredQueue[i])
    if (preferredQueue.length > preferredCap) {
      otherQueues.push(preferredQueue.slice(preferredCap))
    }
  }

  // Phase 2: round-robin the remaining queues.
  let i = 0
  while (result.length < words.length) {
    if (otherQueues.every((q) => q.length === 0)) break
    const queue = otherQueues[i % otherQueues.length]
    if (queue && queue.length > 0) result.push(queue.shift()!)
    i++
  }

  return result
}

export function shuffleOptions<T>(items: T[]): T[] {
  const arr = [...items]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}
