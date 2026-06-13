import type { SupabaseClient } from '@supabase/supabase-js'
import type { Word, Article, SessionBalance } from '@/types/database'
import { selectDueWordIds, interleaveByDomain } from '@/lib/fsrs/engine'
import { shouldRunLasToday, shouldRunOrdToday } from '@/lib/session/balance'

export interface SessionPlan {
  sessionId: string
  ordWords: Word[]
  articles: Article[]
  catchUpMode: boolean
  catchUpMessage: string | null
  // Focus state — set when the session was launched with a preferred domain
  // from the Veckans fokus card. focusDomain is non-null only when the bias
  // was actually applied (i.e. there were due words in that domain). The
  // message is set whenever a focus was *requested*, even when we fell back.
  focusDomain: string | null
  focusMessage: string | null
  newWordIds: string[]
  // Balance state — set when the user's plan is ord_heavy/las_heavy and
  // today is an off-day for one of the modules. The UI uses this to explain
  // why a session is ORD-only or LÄS-only.
  balance: SessionBalance
  balanceMessage: string | null
}

export interface BuildOptions {
  preferredDomain?: string
}

export async function buildDailySession(
  supabase: SupabaseClient,
  userId: string,
  opts: BuildOptions = {}
): Promise<SessionPlan> {
  const { preferredDomain } = opts
  const now = new Date().toISOString()

  // ─── Round 1: everything that only needs userId, all in parallel ─────────────
  const [
    sessionResult,
    { data: activePlan },
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
      .select('daily_ord_quota, session_balance')
      .eq('user_id', userId)
      .eq('active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    detectCatchUp(supabase, userId, now),
    getCompletedArticleIds(supabase, userId),
    getRecentOrdWordIds(supabase, userId),
  ])

  const { data: session, error: sessionError } = sessionResult
  if (sessionError || !session) throw new Error('Failed to create session')

  const balance: SessionBalance = (activePlan?.session_balance as SessionBalance | undefined) ?? 'balanced'
  const runOrdToday = shouldRunOrdToday(balance)
  const runLasToday = shouldRunLasToday(balance)
  // Catch-up overrides balance — being away >2 days with >30 overdue is a
  // bigger signal than the plan's normal cadence, and skipping ORD in that
  // state would let the backlog grow.
  const ordLimit = runOrdToday || catchUpResult.catchUpMode ? (activePlan?.daily_ord_quota ?? 20) : 0

  // On ORD off-days (las_heavy plan, Sun/Mon/Wed/Fri), skip ORD entirely —
  // catch-up still overrides this. Similarly skip LÄS on its off-days.
  const skipOrd = !runOrdToday && !catchUpResult.catchUpMode
  const skipLas = !runLasToday && !catchUpResult.catchUpMode

  // ─── Round 2: ORD IDs (catch-up path or normal due-words) + articles ─────────
  let sessionNewIds = new Set<string>()
  const [mainOrdIds, articles] = await Promise.all([
    (async () => {
      if (skipOrd) return [] as string[]
      if (catchUpResult.catchUpMode) {
        // Catch-up surfaces fragile words (high lapses, low stability) — this
        // is the FSRS-native version of "weakness", recomputed every time and
        // not biased by lifetime miss_count.
        const { data: priorityCards } = await supabase
          .from('fsrs_cards')
          .select('word_id')
          .eq('user_id', userId)
          .lte('due', now)
          .order('lapses', { ascending: false })
          .order('stability', { ascending: true })
          .limit(ordLimit)
        return (priorityCards ?? []).map((r: { word_id: string }) => r.word_id)
      }
      const { ids, newIds } = await selectDueWordIds(supabase, userId, ordLimit)
      sessionNewIds = newIds
      return ids
    })(),
    (async () => {
      if (skipLas) return [] as Article[]
      const weakTypes = await getWeakLasQuestionTypes(supabase, userId)
      // Skip domain bias for articles when we're in catch-up mode — catch-up
      // already overrides ORD selection and doubling up dilutes both signals.
      const articleFocus = catchUpResult.catchUpMode ? undefined : preferredDomain
      return fetchArticles(supabase, completedArticleIds, recentOrdWordIds, weakTypes, articleFocus)
    })(),
  ])

  // ─── Round 3: full word data (needs final word ID list) ──────────────────────
  const { data: wordsData } = await supabase
    .from('words')
    .select('*')
    .in('id', mainOrdIds.length > 0 ? mainOrdIds : ['00000000-0000-0000-0000-000000000000'])

  const wordsById: Record<string, Word> = {}
  for (const w of wordsData ?? []) {
    wordsById[w.id] = w as Word
  }

  const rawOrdWords = mainOrdIds.map((id) => wordsById[id]).filter(Boolean) as Word[]

  // Focus is suppressed in catch-up mode; otherwise check that the requested
  // domain actually appears in this session's word pool. If it doesn't, we
  // fall back to a normal interleave and acknowledge the click with a message.
  const focusRequested = !catchUpResult.catchUpMode && !!preferredDomain
  const focusApplied = focusRequested && rawOrdWords.some((w) => w.domain === preferredDomain)
  const effectiveFocus = focusApplied ? preferredDomain : undefined
  const ordWords = interleaveByDomain(rawOrdWords, effectiveFocus) as Word[]

  let focusMessage: string | null = null
  if (focusApplied) {
    focusMessage = `Fokus: ${capitalize(preferredDomain!)} — ord från det här området kommer först.`
  } else if (focusRequested) {
    focusMessage = `Inga ${preferredDomain}-ord väntar idag — kör vanlig session.`
  }

  let balanceMessage: string | null = null
  if (skipLas) {
    balanceMessage = 'Idag är en ORD-dag — vi kör endast ord. LÄS-artiklar dyker upp måndag, onsdag och fredag.'
  } else if (skipOrd) {
    balanceMessage = 'Idag är en LÄS-dag — vi kör endast artiklar. ORD-ord dyker upp tisdag, torsdag och lördag.'
  }

  return {
    sessionId: session.id,
    ordWords,
    articles,
    catchUpMode: catchUpResult.catchUpMode,
    catchUpMessage: catchUpResult.catchUpMessage,
    focusDomain: focusApplied ? preferredDomain! : null,
    focusMessage,
    newWordIds: [...sessionNewIds],
    balance,
    balanceMessage,
  }
}

function capitalize(s: string): string {
  return s.length === 0 ? s : s[0].toUpperCase() + s.slice(1)
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
  recentWordIds: Set<string>,
  weakQuestionTypes: Set<string> = new Set(),
  preferredDomain?: string,
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
    const ordScore = article.featured_ord_words?.length && recentWordStrings.size > 0
      ? article.featured_ord_words.filter(w => recentWordStrings.has(w.toLowerCase())).length
      : 0
    const weakTypeScore = weakQuestionTypes.size > 0
      ? article.questions.filter(q => weakQuestionTypes.has(q.type)).length
      : 0
    // Small boost when the article domain matches the user's weekly focus.
    // Kept at +1 so it acts as a tiebreaker rather than overpowering the
    // featured-words and weak-types signals.
    const domainScore = preferredDomain && article.domain === preferredDomain ? 1 : 0
    return ordScore + weakTypeScore + domainScore
  }

  const kortSorted = ([...(kortData ?? [])] as Article[]).sort((a, b) => score(b) - score(a))
  const langSorted = ([...(langData ?? [])] as Article[]).sort((a, b) => score(b) - score(a))

  const results: Article[] = []
  if (kortSorted[0]) results.push(kortSorted[0])

  // Pick lång articles preferring both domain diversity and weak-type interleaving.
  // Second article avoids the same domain AND avoids repeating weak types already in the first.
  if (langSorted.length > 0) {
    results.push(langSorted[0])
    if (langSorted.length > 1) {
      const firstDomain = langSorted[0].domain
      const firstWeakTypes = new Set(langSorted[0].questions.map(q => q.type).filter(t => weakQuestionTypes.has(t)))
      const second = langSorted.slice(1).find(a =>
        a.domain !== firstDomain &&
        (firstWeakTypes.size === 0 || a.questions.some(q => weakQuestionTypes.has(q.type) && !firstWeakTypes.has(q.type)))
      ) ?? langSorted.slice(1).find(a => a.domain !== firstDomain)
        ?? langSorted[1]
      results.push(second)
    }
  }

  return results
}

// Returns question types where the user's accuracy is below 50% (min 3 attempts).
export async function getWeakLasQuestionTypes(
  supabase: SupabaseClient,
  userId: string
): Promise<Set<string>> {
  const { data } = await supabase
    .from('session_responses')
    .select('las_question_type, is_correct')
    .eq('user_id', userId)
    .eq('question_type', 'las')
    .not('las_question_type', 'is', null)

  const counts: Record<string, { correct: number; total: number }> = {}
  for (const row of data ?? []) {
    const t = row.las_question_type as string
    if (!counts[t]) counts[t] = { correct: 0, total: 0 }
    counts[t].total++
    if (row.is_correct) counts[t].correct++
  }

  const weak = new Set<string>()
  for (const [type, { correct, total }] of Object.entries(counts)) {
    if (total >= 5 && correct / total < 0.5) weak.add(type)
  }
  return weak
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
