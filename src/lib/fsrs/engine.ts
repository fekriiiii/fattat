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

export function scheduleCard(card: Card, rating: Rating) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (f.repeat(card, new Date()) as any)[rating] as { card: Card; log: unknown }
}

export function ratingFromAnswer(isCorrect: boolean): Rating {
  return isCorrect ? Rating.Good : Rating.Again
}

export function ratingFromAnswerWithLatency(isCorrect: boolean, responseMs: number): Rating {
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
    .select('word_id, due')
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
      // Fallback for when migration 016 hasn't been applied yet.
      const { data: seenCards } = await supabase
        .from('fsrs_cards')
        .select('word_id')
        .eq('user_id', userId)
      const seenIds: string[] = (seenCards ?? []).map((r: { word_id: string }) => r.word_id)
      const allExcluded = [...new Set([...dueIds, ...seenIds])]
      let query = supabase.from('words').select('id').limit(slotCount)
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

// Get weakness word IDs (missed 3+ times, due for review)
export async function selectWeaknessWordIds(
  supabase: SupabaseClient,
  userId: string
): Promise<string[]> {
  const { data } = await supabase
    .from('fsrs_cards')
    .select('word_id')
    .eq('user_id', userId)
    .gte('miss_count', 3)
    .lte('due', new Date().toISOString())
    .order('miss_count', { ascending: false })
    .limit(5)

  return (data ?? []).map((r: { word_id: string }) => r.word_id)
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
