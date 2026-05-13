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

// Select word IDs due for review, filling remaining slots with new unseen words
export async function selectDueWordIds(
  supabase: SupabaseClient,
  userId: string,
  limit: number
): Promise<string[]> {
  const now = new Date().toISOString()

  const { data: dueCards } = await supabase
    .from('fsrs_cards')
    .select('word_id, due')
    .eq('user_id', userId)
    .lte('due', now)
    .order('due', { ascending: true })
    .limit(limit)

  // Shuffle cards that share the same due date so order varies between sessions
  const dueRows = dueCards ?? []
  const shuffled = dueRows
    .slice()
    .sort((a, b) => {
      const diff = new Date(a.due).getTime() - new Date(b.due).getTime()
      return diff !== 0 ? diff : Math.random() - 0.5
    })
  const dueIds: string[] = shuffled.map((r: { word_id: string }) => r.word_id)

  if (dueIds.length < limit) {
    const { data: seenCards } = await supabase
      .from('fsrs_cards')
      .select('word_id')
      .eq('user_id', userId)

    const seenIds: string[] = (seenCards ?? []).map((r: { word_id: string }) => r.word_id)
    const allExcluded = [...new Set([...dueIds, ...seenIds])]

    let query = supabase
      .from('words')
      .select('id')
      .limit(limit - dueIds.length)

    if (allExcluded.length > 0) {
      query = query.not('id', 'in', `(${allExcluded.map((id) => `'${id}'`).join(',')})`)
    }

    const { data: newWords } = await query
    const shuffled = (newWords ?? []).map((r: { id: string }) => r.id).sort(() => Math.random() - 0.5)
    dueIds.push(...shuffled)
  }

  return dueIds
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

// Interleave words by domain (round-robin)
export function interleaveByDomain(words: Array<{ id: string; domain: string }>): typeof words {
  const byDomain: Record<string, typeof words> = {}
  for (const w of words) {
    if (!byDomain[w.domain]) byDomain[w.domain] = []
    byDomain[w.domain].push(w)
  }
  const queues = Object.values(byDomain)
  const result: typeof words = []
  let i = 0
  while (result.length < words.length) {
    const queue = queues[i % queues.length]
    if (queue && queue.length > 0) result.push(queue.shift()!)
    i++
    if (queues.every((q) => q.length === 0)) break
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
