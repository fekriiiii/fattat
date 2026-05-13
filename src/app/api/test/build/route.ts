import { NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createServerClient } from '@/lib/supabase/server'
import { getOnboardingState } from '@/lib/onboarding/state'
import type { Word, Article, SessionPayload } from '@/types/database'

const EXAM_DURATION_MS = 30 * 60 * 1000

export async function POST() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Soft-gate: övningsprov requires a completed diagnostic so the comparison is meaningful.
  const { diagnosticCompleted } = await getOnboardingState(supabase, user.id)
  if (!diagnosticCompleted) {
    return NextResponse.json({ error: 'Diagnostic required' }, { status: 403 })
  }

  // ── Resume an in-progress test if one exists ───────────────────────────────
  // The route is idempotent: as long as a started_at-< 30-min, completed_at-IS-NULL
  // exam_mode session exists for this user, we ALWAYS reuse it. We never close
  // an in-progress session here (closing only happens on real completion or
  // timeout from the test page). This is what stops "back to question 1"
  // glitches mid-test if the page remounts for any reason.
  const cutoff = new Date(Date.now() - EXAM_DURATION_MS).toISOString()
  const { data: inProgress, error: inProgressError } = await supabase
    .from('study_sessions')
    .select('id, started_at, payload')
    .eq('user_id', user.id)
    .eq('session_type', 'exam_mode')
    .is('completed_at', null)
    .gte('started_at', cutoff)
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!inProgressError && inProgress) {
    const payload = (inProgress.payload ?? {}) as SessionPayload
    let wordIds = payload.ord_word_ids ?? []
    let articleIds = payload.article_ids ?? []

    // If the session has no usable payload yet (created by an older code path,
    // or migration 010 hadn't run when it was created so the UPDATE silently
    // failed), reconstruct the pool. We FIRST look at session_responses for
    // this session and derive the pool from any answers already given —
    // otherwise the user's prior answers would reference word/article IDs
    // that aren't in the regenerated pool, the resume filter would drop them
    // all, and the test would silently restart at question 1.
    if (wordIds.length === 0 || articleIds.length === 0) {
      const { data: existingResponses } = await supabase
        .from('session_responses')
        .select('question_type, word_id, article_id')
        .eq('session_id', inProgress.id)
        .order('answered_at', { ascending: true })

      const answeredWordIds: string[] = []
      const answeredArticleIds: string[] = []
      for (const r of existingResponses ?? []) {
        if (r.question_type === 'ord' && r.word_id && !answeredWordIds.includes(r.word_id)) {
          answeredWordIds.push(r.word_id)
        }
        if (r.question_type === 'las' && r.article_id && !answeredArticleIds.includes(r.article_id)) {
          answeredArticleIds.push(r.article_id)
        }
      }

      // Pull a fresh pool, then use it to top up the answered IDs to the
      // required counts (10 ORD words, 3 articles = 1 kort + 2 långa).
      const pool = await buildPool(supabase, user.id)

      const usedWordIds = new Set(answeredWordIds)
      const fillWords = pool.wordIds.filter((id) => !usedWordIds.has(id))
      wordIds = [...answeredWordIds, ...fillWords].slice(0, 10)

      const usedArticleIds = new Set(answeredArticleIds)
      const fillArticles = pool.articleIds.filter((id) => !usedArticleIds.has(id))
      articleIds = [...answeredArticleIds, ...fillArticles].slice(0, 3)

      // Best-effort persist so future resumes don't have to redo this work.
      await supabase
        .from('study_sessions')
        .update({ payload: { ord_word_ids: wordIds, article_ids: articleIds } })
        .eq('id', inProgress.id)
    }

    const [{ data: wordsData }, { data: articlesData }, { data: priorResponses }] =
      await Promise.all([
        supabase.from('words').select('*').in('id', wordIds),
        supabase.from('articles').select('*').in('id', articleIds),
        supabase
          .from('session_responses')
          .select('question_type, word_id, article_id, question_id, chosen_label, correct_label, is_correct, response_ms')
          .eq('session_id', inProgress.id)
          .order('answered_at', { ascending: true }),
      ])

    const orderedWords = wordIds
      .map((id) => (wordsData ?? []).find((w: Word) => w.id === id))
      .filter((w): w is Word => !!w)
    const orderedArticles = articleIds
      .map((id) => (articlesData ?? []).find((a: Article) => a.id === id))
      .filter((a): a is Article => !!a)

    // Filter prior responses to ones that match the current pool. This matters
    // when the pool was just regenerated (rare): orphaned responses from a
    // previous pool would otherwise corrupt the replay.
    const validWordIds = new Set(orderedWords.map((w) => w.id))
    const validArticleIds = new Set(orderedArticles.map((a) => a.id))
    const validResponses = (priorResponses ?? []).filter((r) => {
      if (r.question_type === 'ord') return r.word_id && validWordIds.has(r.word_id)
      if (r.question_type === 'las') return r.article_id && validArticleIds.has(r.article_id)
      return false
    })

    return NextResponse.json({
      sessionId: inProgress.id,
      startedAt: inProgress.started_at,
      ordWords: orderedWords,
      articles: orderedArticles,
      priorResponses: validResponses,
      resumed: true,
    })
  }

  // ── Fresh test ─────────────────────────────────────────────────────────────
  const { data: session, error: sessionError } = await supabase
    .from('study_sessions')
    .insert({ user_id: user.id, session_type: 'exam_mode' })
    .select('id, started_at')
    .single()

  if (sessionError || !session) {
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
  }

  const { wordIds, articleIds, ordWords, articles } = await buildPool(supabase, user.id)

  // Persist the chosen pool so a refresh resumes the same test. Best-effort —
  // tolerate missing migration 010 so the test can still be played through.
  await supabase
    .from('study_sessions')
    .update({ payload: { ord_word_ids: wordIds, article_ids: articleIds } })
    .eq('id', session.id)

  return NextResponse.json({
    sessionId: session.id,
    startedAt: session.started_at,
    ordWords,
    articles,
    priorResponses: [],
    resumed: false,
  })
}

// Builds the question pool for a fresh övningsprov: 10 ORD + 1 kort + 2 långa
// articles, mirroring the verbal-provpass structure (LÄS = 2 + 4 + 4 = 10).
// Returns both the ID arrays (for payload persistence) and the materialized
// records (so the caller can return them without a second round-trip).
async function buildPool(
  supabase: SupabaseClient,
  userId: string
): Promise<{ wordIds: string[]; articleIds: string[]; ordWords: Word[]; articles: Article[] }> {
  const { data: reviewedCards } = await supabase
    .from('fsrs_cards')
    .select('word_id')
    .eq('user_id', userId)
    .gt('reps', 0)
    .limit(10)

  const wordIds: string[] = (reviewedCards ?? []).map((r: { word_id: string }) => r.word_id)

  if (wordIds.length < 10) {
    const excluded = wordIds.length > 0
      ? `(${wordIds.map((id) => `'${id}'`).join(',')})`
      : `('00000000-0000-0000-0000-000000000000')`

    const { data: newWords } = await supabase
      .from('words')
      .select('id')
      .not('id', 'in', excluded)
      .limit(10 - wordIds.length)

    wordIds.push(...(newWords ?? []).map((r: { id: string }) => r.id))
  }

  const { data: wordsData } = await supabase
    .from('words')
    .select('*')
    .in('id', wordIds.length > 0 ? wordIds : ['00000000-0000-0000-0000-000000000000'])

  const ordWords = wordIds
    .map((id) => (wordsData ?? []).find((w: Word) => w.id === id))
    .filter((w): w is Word => !!w)

  const { data: completions } = await supabase
    .from('article_completions')
    .select('article_id')
    .eq('user_id', userId)
  const completedIds = new Set(
    (completions ?? []).map((c: { article_id: string }) => c.article_id)
  )

  const [{ data: allKort }, { data: allLang }] = await Promise.all([
    supabase.from('articles').select('*').eq('unit_position', 'kort'),
    supabase.from('articles').select('*').eq('unit_position', 'lång'),
  ])

  const pickRandom = <T,>(pool: T[], n: number): T[] => {
    const shuffled = [...pool].sort(() => Math.random() - 0.5)
    return shuffled.slice(0, n)
  }

  const pickArticles = (all: Article[] | null, count: number): Article[] => {
    const pool = all ?? []
    const unseen = pool.filter((a) => !completedIds.has(a.id))
    return pickRandom(unseen.length >= count ? unseen : pool, count)
  }

  const articles = [
    ...pickArticles(allKort as Article[] | null, 1),
    ...pickArticles(allLang as Article[] | null, 2),
  ]

  return {
    wordIds,
    articleIds: articles.map((a) => a.id),
    ordWords,
    articles,
  }
}
