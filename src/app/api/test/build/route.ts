import { NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createServerClient } from '@/lib/supabase/server'
import { getOnboardingState } from '@/lib/onboarding/state'
import { isExamDue } from '@/lib/session/examSchedule'
import { getWeakLasQuestionTypes } from '@/lib/session/builder'
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
  const inProgress = await findInProgressExam(supabase, user.id, cutoff)

  if (inProgress) {
    return NextResponse.json(await resumeExam(supabase, user.id, inProgress))
  }

  // Hard-gate: no in-progress exam to resume, so this would start a brand new
  // one. The dashboard only shows the "Övningsprov" CTA when isExamDue() is
  // true — without this check, typing /test into the URL bar bypassed that
  // pacing entirely and started an exam any time, burning through the article
  // pool ahead of schedule.
  const due = await isExamDue(supabase, user.id)
  if (!due) {
    return NextResponse.json({ error: 'No exam scheduled yet' }, { status: 403 })
  }

  // ── Fresh test ─────────────────────────────────────────────────────────────
  // Migration 014 enforces "one in-progress exam_mode session per user" via a
  // partial unique index. Before inserting, close any stale in-progress
  // sessions (older than the 30-min exam window) so the index doesn't block
  // a legitimate new test. If a concurrent request also beats us to the
  // INSERT, the unique index raises 23505 — we recover by re-fetching and
  // resuming that session instead of silently creating a duplicate.
  await supabase
    .from('study_sessions')
    .update({ completed_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .eq('session_type', 'exam_mode')
    .is('completed_at', null)
    .lt('started_at', cutoff)

  const { data: session, error: sessionError } = await supabase
    .from('study_sessions')
    .insert({ user_id: user.id, session_type: 'exam_mode' })
    .select('id, started_at')
    .single()

  if (sessionError) {
    if (sessionError.code === '23505') {
      const concurrent = await findInProgressExam(supabase, user.id, cutoff)
      if (concurrent) {
        return NextResponse.json(await resumeExam(supabase, user.id, concurrent))
      }
    }
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
  }
  if (!session) {
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
  }

  const { wordIds, articleIds, ordWords, articles, novelWordIds } = await buildPool(supabase, user.id)

  // Persist the chosen pool so a refresh resumes the same test. Best-effort —
  // tolerate missing migration 010 so the test can still be played through.
  await supabase
    .from('study_sessions')
    .update({ payload: { ord_word_ids: wordIds, article_ids: articleIds, novel_word_ids: novelWordIds } })
    .eq('id', session.id)

  return NextResponse.json({
    sessionId: session.id,
    startedAt: session.started_at,
    ordWords,
    articles,
    novelWordIds,
    priorResponses: [],
    resumed: false,
  })
}

type InProgressRow = { id: string; started_at: string; payload: SessionPayload | null }

async function findInProgressExam(
  supabase: SupabaseClient,
  userId: string,
  cutoffIso: string
): Promise<InProgressRow | null> {
  const { data } = await supabase
    .from('study_sessions')
    .select('id, started_at, payload')
    .eq('user_id', userId)
    .eq('session_type', 'exam_mode')
    .is('completed_at', null)
    .gte('started_at', cutoffIso)
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  return (data as InProgressRow | null) ?? null
}

async function resumeExam(supabase: SupabaseClient, userId: string, inProgress: InProgressRow) {
  const payload = (inProgress.payload ?? {}) as SessionPayload
  let wordIds = payload.ord_word_ids ?? []
  let articleIds = payload.article_ids ?? []
  let novelWordIds = payload.novel_word_ids ?? []

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

    const pool = await buildPool(supabase, userId)

    const usedWordIds = new Set(answeredWordIds)
    const fillWords = pool.wordIds.filter((id) => !usedWordIds.has(id))
    wordIds = [...answeredWordIds, ...fillWords].slice(0, 10)
    // Novel set after reconstruction = whatever the rebuilt pool flagged as
    // novel, intersected with the final wordIds. Already-answered words came
    // from the user's reviewed deck (FSRS history) so they're never novel.
    const novelSet = new Set(pool.novelWordIds)
    novelWordIds = wordIds.filter((id) => novelSet.has(id))

    const usedArticleIds = new Set(answeredArticleIds)
    const fillArticles = pool.articleIds.filter((id) => !usedArticleIds.has(id))
    articleIds = [...answeredArticleIds, ...fillArticles].slice(0, 3)

    await supabase
      .from('study_sessions')
      .update({ payload: { ord_word_ids: wordIds, article_ids: articleIds, novel_word_ids: novelWordIds } })
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

  const validWordIds = new Set(orderedWords.map((w) => w.id))
  const validArticleIds = new Set(orderedArticles.map((a) => a.id))
  const validResponses = (priorResponses ?? []).filter((r) => {
    if (r.question_type === 'ord') return r.word_id && validWordIds.has(r.word_id)
    if (r.question_type === 'las') return r.article_id && validArticleIds.has(r.article_id)
    return false
  })

  return {
    sessionId: inProgress.id,
    startedAt: inProgress.started_at,
    ordWords: orderedWords,
    articles: orderedArticles,
    novelWordIds,
    priorResponses: validResponses,
    resumed: true,
  }
}

// Builds the question pool for a fresh övningsprov: 10 ORD + 1 kort + 2 långa
// articles, mirroring the verbal-provpass structure (LÄS = 2 + 4 + 4 = 10).
// Returns both the ID arrays (for payload persistence) and the materialized
// records (so the caller can return them without a second round-trip).
//
// ORD pool composition (2026-05-30, corpus split):
//   - Up to 5 ORD from the user's reviewed FSRS deck — words they've practiced
//     (curated, plus any past-HP cards seeded by the diagnostic).
//   - Remaining slots from novel past-HP material the user has never seen —
//     authentic exam-simulation feel.
// Without the 5-cap, a long-practicing user would face 10/10 reviewed words
// (no exam-feel), and a fresh-from-diagnostic user might face 10/10 novel
// past-HP (demoralizing — score reflects unprimed vocab, not effort). The
// mix gives both honest measurement and emotional manageability.
async function buildPool(
  supabase: SupabaseClient,
  userId: string
): Promise<{ wordIds: string[]; articleIds: string[]; ordWords: Word[]; articles: Article[]; novelWordIds: string[] }> {
  const REVIEWED_CAP = 5
  const TOTAL = 10

  // Deterministic ordering matters: this same function is called both on the
  // initial test build AND when reconstructing a payload-less resume. Without
  // .order(), the two calls can return different rows, causing the resume to
  // mis-match the user's already-answered word IDs.
  const { data: reviewedCards } = await supabase
    .from('fsrs_cards')
    .select('word_id')
    .eq('user_id', userId)
    .gt('reps', 0)
    .order('word_id', { ascending: true })
    .limit(REVIEWED_CAP)

  const wordIds: string[] = (reviewedCards ?? []).map((r: { word_id: string }) => r.word_id)
  const novelWordIds: string[] = []

  if (wordIds.length < TOTAL) {
    const excluded = wordIds.length > 0
      ? `(${wordIds.map((id) => `'${id}'`).join(',')})`
      : `('00000000-0000-0000-0000-000000000000')`

    // Fresh-fill draws from authentic past-HP material — not from the curated
    // pool. The corpus split (migration 022) routes curated words to daily FSRS
    // rotation and reserves past-HP words for the exam-simulation surface.
    // past_exams is TEXT[]; PostgREST 'cs' (contains) lets us NOT-filter array
    // containment. The 'eq' '{}' filter excludes empty arrays (which the seed
    // script writes for words missing past-exam metadata).
    const { data: newWords } = await supabase
      .from('words')
      .select('id')
      .not('past_exams', 'cs', '{curated}')
      .not('past_exams', 'eq', '{}')
      .not('id', 'in', excluded)
      .order('id', { ascending: true })
      .limit(TOTAL - wordIds.length)

    const novel = (newWords ?? []).map((r: { id: string }) => r.id)
    novelWordIds.push(...novel)
    wordIds.push(...novel)
  }

  const { data: wordsData } = await supabase
    .from('words')
    .select('*')
    .in('id', wordIds.length > 0 ? wordIds : ['00000000-0000-0000-0000-000000000000'])

  const ordWords = wordIds
    .map((id) => (wordsData ?? []).find((w: Word) => w.id === id))
    .filter((w): w is Word => !!w)

  const [{ data: completions }, weakTypes, { data: allKort }, { data: allLang }] = await Promise.all([
    supabase.from('article_completions').select('article_id').eq('user_id', userId),
    getWeakLasQuestionTypes(supabase, userId),
    supabase.from('articles').select('*').eq('unit_position', 'kort'),
    supabase.from('articles').select('*').eq('unit_position', 'lång'),
  ])
  const completedIds = new Set(
    (completions ?? []).map((c: { article_id: string }) => c.article_id)
  )

  const shuffle = <T,>(pool: T[]): T[] => [...pool].sort(() => Math.random() - 0.5)

  const pickKort = (all: Article[] | null): Article[] => {
    const pool = all ?? []
    const unseen = pool.filter((a) => !completedIds.has(a.id))
    const candidates = unseen.length >= 1 ? unseen : pool
    return shuffle(candidates).slice(0, 1)
  }

  // Score articles by how many questions match the user's weak question types
  const weakScore = (a: Article): number =>
    weakTypes.size > 0 ? a.questions.filter(q => weakTypes.has(q.type)).length : 0

  // Pick 2 lång articles: sort by weak-type score, then prefer domain diversity
  // and avoid repeating the same weak type in both articles (prevents blocked practice)
  const pickLang = (all: Article[] | null): Article[] => {
    const pool = all ?? []
    const unseen = pool.filter((a) => !completedIds.has(a.id))
    const candidates = shuffle(unseen.length >= 2 ? unseen : pool)
      .sort((a, b) => weakScore(b) - weakScore(a))
    if (candidates.length === 0) return []
    const first = candidates[0]
    const firstWeakTypes = new Set(first.questions.map(q => q.type).filter(t => weakTypes.has(t)))
    const second = candidates.slice(1).find((a) =>
      a.domain !== first.domain &&
      (firstWeakTypes.size === 0 || a.questions.some(q => weakTypes.has(q.type) && !firstWeakTypes.has(q.type)))
    ) ?? candidates.slice(1).find((a) => a.domain !== first.domain)
      ?? candidates[1]
    return second ? [first, second] : [first]
  }

  const articles = [
    ...pickKort(allKort as Article[] | null),
    ...pickLang(allLang as Article[] | null),
  ]

  return {
    wordIds,
    articleIds: articles.map((a) => a.id),
    ordWords,
    articles,
    novelWordIds,
  }
}
