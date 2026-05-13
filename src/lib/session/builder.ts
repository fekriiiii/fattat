import type { SupabaseClient } from '@supabase/supabase-js'
import type { Word, Article } from '@/types/database'
import { selectDueWordIds, selectWeaknessWordIds, interleaveByDomain } from '@/lib/fsrs/engine'

export interface SessionPlan {
  sessionId: string
  weaknessWords: Word[]
  ordWords: Word[]
  articles: Article[]
  catchUpMode: boolean
  catchUpMessage: string | null
}

export async function buildDailySession(
  supabase: SupabaseClient,
  userId: string
): Promise<SessionPlan> {
  const now = new Date().toISOString()

  // ─── Round 1: everything that only needs userId, all in parallel ─────────────
  const [
    sessionResult,
    { data: activePlan },
    weaknessIds,
    catchUpResult,
    completedArticleIds,
    recentOrdWordIds,
  ] = await Promise.all([
    supabase
      .from('study_sessions')
      .insert({ user_id: userId, session_type: 'daily' })
      .select('id')
      .single(),
    supabase
      .from('study_plans')
      .select('daily_ord_quota')
      .eq('user_id', userId)
      .eq('active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    selectWeaknessWordIds(supabase, userId),
    detectCatchUp(supabase, userId, now),
    getCompletedArticleIds(supabase, userId),
    getRecentOrdWordIds(supabase, userId),
  ])

  const { data: session, error: sessionError } = sessionResult
  if (sessionError || !session) throw new Error('Failed to create session')

  const ordLimit = activePlan?.daily_ord_quota ?? 20

  // ─── Round 2: ORD IDs (needs weakness + catchup) + articles (needs completions) ─
  const [mainOrdIds, articles] = await Promise.all([
    (async () => {
      if (catchUpResult.catchUpMode) {
        const { data: priorityCards } = await supabase
          .from('fsrs_cards')
          .select('word_id')
          .eq('user_id', userId)
          .lte('due', now)
          .not('word_id', 'in', `(${weaknessIds.length > 0 ? weaknessIds.map((id) => `'${id}'`).join(',') : "'00000000-0000-0000-0000-000000000000'"})`)
          .order('lapses', { ascending: false })
          .order('stability', { ascending: true })
          .limit(ordLimit)
        return (priorityCards ?? []).map((r: { word_id: string }) => r.word_id)
      }
      const rawIds = await selectDueWordIds(supabase, userId, ordLimit)
      return rawIds.filter((id) => !weaknessIds.includes(id))
    })(),
    fetchArticles(supabase, completedArticleIds, recentOrdWordIds),
  ])

  // ─── Round 3: full word data (needs final word ID list) ──────────────────────
  const allWordIds = [...new Set([...weaknessIds, ...mainOrdIds])]
  const { data: wordsData } = await supabase
    .from('words')
    .select('*')
    .in('id', allWordIds.length > 0 ? allWordIds : ['00000000-0000-0000-0000-000000000000'])

  const wordsById: Record<string, Word> = {}
  for (const w of wordsData ?? []) {
    wordsById[w.id] = w as Word
  }

  const weaknessWords = weaknessIds.map((id) => wordsById[id]).filter(Boolean) as Word[]
  const rawOrdWords  = mainOrdIds.map((id) => wordsById[id]).filter(Boolean) as Word[]
  const ordWords     = interleaveByDomain(rawOrdWords) as Word[]

  return {
    sessionId: session.id,
    weaknessWords,
    ordWords,
    articles,
    catchUpMode: catchUpResult.catchUpMode,
    catchUpMessage: catchUpResult.catchUpMessage,
  }
}

async function detectCatchUp(
  supabase: SupabaseClient,
  userId: string,
  now: string
): Promise<{ catchUpMode: boolean; catchUpMessage: string | null }> {
  const [{ data: lastSession }, { count: totalDue }] = await Promise.all([
    supabase
      .from('study_sessions')
      .select('completed_at')
      .eq('user_id', userId)
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('fsrs_cards')
      .select('word_id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .lte('due', now),
  ])

  const daysSinceLast = lastSession?.completed_at
    ? Math.floor((Date.now() - new Date(lastSession.completed_at).getTime()) / 86400000)
    : 999

  const dueCount = totalDue ?? 0
  if (daysSinceLast > 2 && dueCount > 30) {
    return {
      catchUpMode: true,
      catchUpMessage: `Jag ser att du har varit borta ${daysSinceLast} dagar. Vi tar de 20 viktigaste orden först för att värma upp — ${dueCount} ord väntar totalt.`,
    }
  }
  return { catchUpMode: false, catchUpMessage: null }
}

async function getCompletedArticleIds(supabase: SupabaseClient, userId: string): Promise<string[]> {
  const { data } = await supabase
    .from('article_completions')
    .select('article_id')
    .eq('user_id', userId)
  return (data ?? []).map((r: { article_id: string }) => r.article_id)
}

async function getRecentOrdWordIds(supabase: SupabaseClient, userId: string): Promise<Set<string>> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString()
  const { data } = await supabase
    .from('session_responses')
    .select('word_id')
    .eq('user_id', userId)
    .eq('question_type', 'ord')
    .gte('answered_at', sevenDaysAgo)
    .not('word_id', 'is', null)
  return new Set((data ?? []).map((r: { word_id: string }) => r.word_id))
}

async function fetchArticles(
  supabase: SupabaseClient,
  doneIds: string[],
  recentWordIds: Set<string>
): Promise<Article[]> {
  const buildQuery = (position: string) => {
    let q = supabase.from('articles').select('*').eq('unit_position', position)
    if (doneIds.length > 0) {
      q = q.not('id', 'in', `(${doneIds.map((id) => `'${id}'`).join(',')})`)
    }
    return q
  }

  const [[{ data: kortData }, { data: langData }], recentWordStrings] = await Promise.all([
    Promise.all([buildQuery('kort'), buildQuery('lång')]),
    (async () => {
      if (recentWordIds.size === 0) return new Set<string>()
      const { data } = await supabase
        .from('words')
        .select('word')
        .in('id', [...recentWordIds])
      return new Set((data ?? []).map((w: { word: string }) => w.word.toLowerCase()))
    })(),
  ])

  const score = (article: Article): number => {
    if (!article.featured_ord_words?.length || recentWordStrings.size === 0) return 0
    return article.featured_ord_words.filter(w => recentWordStrings.has(w.toLowerCase())).length
  }

  const kortSorted = ([...(kortData ?? [])] as Article[]).sort((a, b) => score(b) - score(a))
  const langSorted = ([...(langData ?? [])] as Article[]).sort((a, b) => score(b) - score(a))

  const results: Article[] = []
  if (kortSorted[0]) results.push(kortSorted[0])
  results.push(...langSorted.slice(0, 2))
  return results
}

// Build diagnostic session (no FSRS, random sampling)
// 20 ORD words: 8 easy + 8 medium + 4 hard — matches HP's difficulty skew.
// Fetches a large pool per difficulty and shuffles, so different users get different words.
export async function buildDiagnosticSession(supabase: SupabaseClient): Promise<{
  ordWords: Word[]
  articles: Article[]
}> {
  function shuffle<T>(arr: T[]): T[] {
    const a = [...arr]
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[a[i], a[j]] = [a[j], a[i]]
    }
    return a
  }

  const DIFFICULTY_COUNTS = [
    { diff: 1, n: 8 },
    { diff: 2, n: 8 },
    { diff: 3, n: 4 },
  ]

  const [ordByDiff, [{ data: kortData }, { data: langData }]] = await Promise.all([
    Promise.all(
      DIFFICULTY_COUNTS.map(async ({ diff, n }) => {
        const { data } = await supabase.from('words').select('*').eq('difficulty', diff).limit(60)
        return shuffle((data ?? []) as Word[]).slice(0, n)
      })
    ),
    Promise.all([
      supabase.from('articles').select('*').eq('unit_position', 'kort').limit(20),
      supabase.from('articles').select('*').eq('unit_position', 'lång').limit(20),
    ]),
  ])

  const kortArticles = shuffle([...(kortData ?? [])] as Article[])
  const langArticles = shuffle([...(langData ?? [])] as Article[])

  return {
    ordWords: ordByDiff.flat(),
    articles: [...kortArticles.slice(0, 1), ...langArticles.slice(0, 1)],
  }
}
