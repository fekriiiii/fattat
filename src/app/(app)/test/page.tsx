'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSessionStore } from '@/stores/sessionStore'
import { SessionProgress } from '@/components/session/SessionProgress'
import { ExamTimer } from '@/components/session/ExamTimer'
import { OrdQuestion } from '@/components/ord/OrdQuestion'
import { OrdFeedback } from '@/components/ord/OrdFeedback'
import { ArticleReader } from '@/components/las/ArticleReader'
import { LasQuestion } from '@/components/las/LasQuestion'
import { LasFeedback } from '@/components/las/LasFeedback'
import { shuffleOptions } from '@/lib/fsrs/engine'
import { useScrollToTop } from '@/hooks/useScrollToTop'
import { haptics } from '@/lib/utils/haptics'
import { Button } from '@/components/ui/Button'
import type { OrdOption } from '@/components/ord/OrdQuestion'
import type { LasOption } from '@/components/las/LasQuestion'

const ORD_LABELS = ['A', 'B', 'C', 'D', 'E'] as const
const LAS_LABELS = ['A', 'B', 'C', 'D'] as const

// Övningsprov totals — must match the build route's draw counts.
// Unanswered questions at time-up count as wrong, matching real HP.
const ORD_TOTAL = 10
const LAS_TOTAL = 10

export default function TestPage() {
  const router = useRouter()
  const initiated = useRef(false)
  const [readArticleIds, setReadArticleIds] = useState<Set<string>>(new Set())
  const [sessionIdForComplete, setSessionIdForComplete] = useState<string | null>(null)
  const [startedAt, setStartedAt] = useState<string | null>(null)
  const [currentOrdOptions, setCurrentOrdOptions] = useState<OrdOption[]>([])
  const [currentLasOptions, setCurrentLasOptions] = useState<LasOption[]>([])
  const [novelWordIds, setNovelWordIds] = useState<Set<string>>(new Set())
  // Explainer screen shown once per fresh test (suppressed on resume so users
  // mid-test aren't re-blocked). Marked seen as soon as the user dismisses it.
  const [showExplainer, setShowExplainer] = useState(false)
  const timeUpFired = useRef(false)

  const store = useSessionStore()
  const {
    sessionId,
    phase,
    responses,
    showingFeedback,
    selectedLabel,
    answerStartTime,
    currentLasQuestionIndex,
    initSession,
    selectAnswer,
    submitAnswer,
    advanceFromFeedback,
    restoreResponses,
    progressPercent,
  } = store

  const currentWord = store.currentOrdWord()
  const currentArticle = store.currentArticle()

  // Scroll to top on every step transition (phase, question swap, feedback toggle, article-read advance)
  useScrollToTop([phase, showingFeedback, currentWord?.id, currentArticle?.id, currentLasQuestionIndex, readArticleIds.size])

  useEffect(() => {
    if (initiated.current) return
    initiated.current = true
    async function start() {
      const res = await fetch('/api/test/build', { method: 'POST' })
      if (!res.ok) { router.push('/dashboard'); return }
      const data = await res.json()
      setSessionIdForComplete(data.sessionId)
      setStartedAt(data.startedAt ?? new Date().toISOString())
      setNovelWordIds(new Set<string>((data.novelWordIds ?? []) as string[]))
      // Show explainer only on a truly fresh start (no prior responses).
      // Resumed mid-test sessions land back into questions directly.
      if (!data.resumed && (data.priorResponses ?? []).length === 0) {
        setShowExplainer(true)
      }

      const prior = (data.priorResponses ?? []) as Array<{
        question_type: 'ord' | 'las'
        word_id: string | null
        article_id: string | null
        question_id: string | null
        chosen_label: string
        correct_label: string
        is_correct: boolean
        response_ms: number | null
      }>

      const mappedPrior = prior.map((r) => ({
        type:         r.question_type,
        wordId:       r.word_id ?? undefined,
        articleId:    r.article_id ?? undefined,
        questionId:   r.question_id ?? undefined,
        chosenLabel:  r.chosen_label,
        correctLabel: r.correct_label,
        isCorrect:    r.is_correct,
        responseMs:   r.response_ms ?? 0,
      }))

      // Init and restore in one store update — avoids a flash of question 1
      // between two separate set() calls when resuming mid-test.
      initSession({
        sessionId: data.sessionId,
        ordWords: data.ordWords,
        articles: data.articles,
        priorResponses: mappedPrior,
      })

      // Pre-populate readArticleIds so resumed LÄS phase skips the article
      // reader for articles already seen (any article with ≥1 answered question).
      const answeredArticleIds = new Set(
        prior.filter((r) => r.question_type === 'las' && r.article_id).map((r) => r.article_id as string)
      )
      if (answeredArticleIds.size > 0) setReadArticleIds(answeredArticleIds)
    }
    start()
  }, [initSession, restoreResponses, router])

  // Compute new ORD options whenever the current word changes
  useEffect(() => {
    if (!currentWord) return
    const raw = [
      { text: currentWord.correct_synonym, isCorrect: true },
      { text: currentWord.distractor_1, isCorrect: false },
      { text: currentWord.distractor_2, isCorrect: false },
      { text: currentWord.distractor_3, isCorrect: false },
      { text: currentWord.distractor_4, isCorrect: false },
    ]
    setCurrentOrdOptions(shuffleOptions(raw).map((o, i) => ({ ...o, label: ORD_LABELS[i] })))
  }, [currentWord?.id])

  // Compute new LAS options whenever the current question changes
  useEffect(() => {
    if (!currentArticle) return
    const question = currentArticle.questions[currentLasQuestionIndex]
    if (!question) return
    const raw = (['A', 'B', 'C', 'D'] as const).map((dbLabel) => ({
      text: question.options[dbLabel],
      isCorrect: dbLabel === question.correct,
    }))
    setCurrentLasOptions(shuffleOptions(raw).map((o, i) => ({ ...o, label: LAS_LABELS[i] })))
  }, [currentArticle?.id, currentLasQuestionIndex])

  // Forced finish (timer hit zero): submit whatever's been answered. Unanswered
  // questions count as wrong by being absent from `responses` — the results
  // page divides by ORD_TOTAL / LAS_TOTAL, not by answered count.
  const finishExam = useCallback((reason: 'completed' | 'time_up') => {
    if (!sessionIdForComplete) return
    const ord = responses.filter((r) => r.type === 'ord')
    const las = responses.filter((r) => r.type === 'las')

    // Split ORD into reviewed (words the user has FSRS history on) vs novel
    // (fresh-fill past-HP). Totals derived from the pool the server returned:
    // ordWords.length minus novelWordIds count gives the reviewed total. The
    // user may have answered fewer than the totals; unanswered count as wrong.
    const novelOrdAnswered = ord.filter((r) => r.wordId && novelWordIds.has(r.wordId))
    const reviewedOrdAnswered = ord.filter((r) => r.wordId && !novelWordIds.has(r.wordId))
    const novelTotal = novelWordIds.size
    const reviewedTotal = ORD_TOTAL - novelTotal
    const novelCorrect = novelOrdAnswered.filter((r) => r.isCorrect).length
    const reviewedCorrect = reviewedOrdAnswered.filter((r) => r.isCorrect).length

    fetch('/api/session/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: sessionIdForComplete,
        ordCount: ord.length,
        ordCorrect: ord.filter((r) => r.isCorrect).length,
        lasCount: las.length,
        lasCorrect: las.filter((r) => r.isCorrect).length,
      }),
    })

    const params = new URLSearchParams()
    params.set('ordCorrect', String(ord.filter((r) => r.isCorrect).length))
    params.set('ordTotal', String(ORD_TOTAL))
    params.set('lasCorrect', String(las.filter((r) => r.isCorrect).length))
    params.set('lasTotal', String(LAS_TOTAL))
    params.set('ordAnswered', String(ord.length))
    params.set('lasAnswered', String(las.length))
    params.set('ordReviewedCorrect', String(reviewedCorrect))
    params.set('ordReviewedTotal', String(reviewedTotal))
    params.set('ordNovelCorrect', String(novelCorrect))
    params.set('ordNovelTotal', String(novelTotal))
    if (reason === 'time_up') params.set('timeUp', '1')
    router.push(`/test/results?${params.toString()}`)
  }, [sessionIdForComplete, responses, router, novelWordIds])

  // On complete: route to results with full totals
  useEffect(() => {
    if (phase !== 'complete' || !sessionIdForComplete) return
    finishExam('completed')
  }, [phase]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleTimeUp = useCallback(() => {
    if (timeUpFired.current) return
    timeUpFired.current = true
    finishExam('time_up')
  }, [finishExam])

  function persistAnswer(payload: {
    questionType: 'ord' | 'las'
    wordId?: string | null
    articleId?: string | null
    questionId?: string | null
    lasQuestionType?: string | null
    chosenLabel: string
    correctLabel: string
    isCorrect: boolean
    responseMs: number
  }) {
    if (!sessionId) return
    fetch('/api/test/answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, ...payload }),
    })
      .then(async (res) => {
        if (!res.ok) {
          // Log to console so the issue is visible in dev tools instead of
          // disappearing silently — without this, a failing /api/test/answer
          // looks identical to a successful one and the user only notices
          // when resume returns no priorResponses.
          const text = await res.text().catch(() => '')
          console.error('Failed to persist övningsprov answer:', res.status, text)
        }
      })
      .catch((err) => {
        console.error('Network error persisting övningsprov answer:', err)
      })
  }

  function handleOrdAnswer(label: string, isCorrect: boolean) {
    const word = store.currentOrdWord()
    if (!word || !sessionId) return
    const responseMs = Date.now() - answerStartTime
    isCorrect ? haptics.correct() : haptics.wrong()
    selectAnswer(label)
    const correctLabel = currentOrdOptions.find((o) => o.isCorrect)?.label ?? 'A'
    // No FSRS update — this is a test, not a study session
    submitAnswer({ type: 'ord', wordId: word.id, chosenLabel: label, correctLabel, isCorrect, responseMs })
    persistAnswer({ questionType: 'ord', wordId: word.id, chosenLabel: label, correctLabel, isCorrect, responseMs })
  }

  function handleLasAnswer(label: string, isCorrect: boolean) {
    const article = store.currentArticle()
    if (!article) return
    const question = article.questions[currentLasQuestionIndex]
    if (!question) return
    const responseMs = Date.now() - answerStartTime
    isCorrect ? haptics.correct() : haptics.wrong()
    selectAnswer(label)
    const correctLabel = currentLasOptions.find((o) => o.isCorrect)?.label ?? 'A'
    submitAnswer({
      type: 'las',
      articleId: article.id,
      questionId: String(question.n),
      lasQuestionType: question.type,
      chosenLabel: label,
      correctLabel,
      isCorrect,
      responseMs,
    })
    persistAnswer({
      questionType: 'las',
      articleId: article.id,
      questionId: String(question.n),
      lasQuestionType: question.type,
      chosenLabel: label,
      correctLabel,
      isCorrect,
      responseMs,
    })
  }

  if (!sessionId) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-dark/50">Förbereder övningsprov…</p>
        </div>
      </div>
    )
  }

  // Defensive: if the build returned an empty pool we'd otherwise white-screen.
  // Show a clear error and a way back instead of a silent blank page.
  if (store.ordWords.length === 0 || store.articles.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center py-20 px-6">
        <div className="text-center max-w-sm">
          <p className="text-base font-bold text-dark mb-2">Övningsprovet kunde inte byggas</p>
          <p className="text-sm text-dark/65 mb-6">
            Det saknas tillräckligt med ord eller artiklar. Försök igen om en stund.
          </p>
          <button
            type="button"
            onClick={() => router.push('/dashboard')}
            className="text-sm font-bold text-primary"
          >
            Tillbaka till hemskärmen
          </button>
        </div>
      </div>
    )
  }

  // ─── EXPLAINER ───────────────────────────────────────────────────────────────
  // Shown once per fresh övningsprov to set expectations: the test mixes words
  // the user has practiced with novel past-HP material. Without this, a user
  // who has only been doing daily curated sessions sees ~5 unfamiliar past-HP
  // words and reads it as "Fattat is testing me on stuff it never taught me"
  // — even though the score itself is honest (it's measuring how well they
  // handle unprimed HP-level vocabulary, which is what the real exam does).
  if (showExplainer) {
    const novelCount = novelWordIds.size
    const reviewedCount = ORD_TOTAL - novelCount
    return (
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="max-w-sm w-full flex flex-col gap-5">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-primary/60 mb-2">
              Övningsprov
            </p>
            <h1 className="text-2xl font-bold text-dark leading-tight">
              Innan du börjar
            </h1>
          </div>

          <div className="bg-white shadow-card border border-dark/[0.05] rounded-card px-5 py-5 flex flex-col gap-3">
            <p className="text-[15px] text-dark leading-relaxed">
              Av <strong>{ORD_TOTAL} ord</strong> är ungefär{' '}
              <strong>{reviewedCount} sådana du tränat på</strong> och{' '}
              <strong>{novelCount} nya ord från äkta HP-prov</strong>.
            </p>
            <p className="text-[14px] text-dark/70 leading-relaxed">
              Det riktiga provet fungerar likadant. Du möter alltid okända ord.
              Det här mäter både ditt aktuella ordförråd <em>och</em> hur du tar
              dig an nya ord.
            </p>
            <p className="text-[13px] text-dark/55 leading-relaxed">
              På resultatsidan ser du båda delarna separat, så du vet vad som
              är repetition och vad som är HP-nivå just nu.
            </p>
          </div>

          <Button fullWidth size="lg" onClick={() => setShowExplainer(false)}>
            Förstått, kör
          </Button>
        </div>
      </div>
    )
  }

  const percent = progressPercent()

  // ─── ORD ─────────────────────────────────────────────────────────────────────
  if (phase === 'ord') {
    if (!currentWord) return null
    const lastOrdResponse = [...responses].reverse().find((r) => r.type === 'ord')

    return (
      <div className="flex flex-col">
        {startedAt && <ExamTimer startedAt={startedAt} onTimeUp={handleTimeUp} />}
        <SessionProgress percent={percent} phase="ord" />
        <div className="px-4 py-2">
          <p className="text-xs text-dark/40 text-center">Övningsprov · Ordförståelse</p>
        </div>
        {showingFeedback && lastOrdResponse ? (
          <OrdFeedback
            word={currentWord}
            options={currentOrdOptions}
            chosenLabel={lastOrdResponse.chosenLabel}
            isCorrect={lastOrdResponse.isCorrect}
            onNext={advanceFromFeedback}
            delayMs={0}
          />
        ) : (
          <OrdQuestion
            word={currentWord}
            options={currentOrdOptions}
            selectedLabel={selectedLabel}
            onSelect={handleOrdAnswer}
          />
        )}
      </div>
    )
  }

  // ─── LÄS ─────────────────────────────────────────────────────────────────────
  if (phase === 'las') {
    if (!currentArticle) return null
    const articleRead = readArticleIds.has(currentArticle.id)
    const question = currentArticle.questions[currentLasQuestionIndex]
    const totalQ = currentArticle.questions.length
    const lastLasResponse = [...responses].reverse().find((r) => r.type === 'las')

    return (
      <div className="flex flex-col">
        {startedAt && <ExamTimer startedAt={startedAt} onTimeUp={handleTimeUp} />}
        <SessionProgress percent={percent} phase="las" />
        <div className="px-4 py-2">
          <p className="text-xs text-dark/40 text-center">Övningsprov · Läsförståelse</p>
        </div>
        {!articleRead ? (
          <ArticleReader
            article={currentArticle}
            onDoneReading={() => setReadArticleIds((prev) => new Set([...prev, currentArticle.id]))}
          />
        ) : question && !showingFeedback ? (
          <LasQuestion
            question={question}
            options={currentLasOptions}
            questionNumber={currentLasQuestionIndex + 1}
            totalQuestions={totalQ}
            selectedLabel={selectedLabel}
            onSelect={handleLasAnswer}
          />
        ) : question && showingFeedback && lastLasResponse ? (
          <LasFeedback
            question={question}
            options={currentLasOptions}
            chosenLabel={lastLasResponse.chosenLabel}
            isCorrect={lastLasResponse.isCorrect}
            isLastQuestion={currentLasQuestionIndex === totalQ - 1}
            onNext={advanceFromFeedback}
            onReadAgain={() => setReadArticleIds((prev) => { const s = new Set(prev); s.delete(currentArticle.id); return s })}
          />
        ) : null}
      </div>
    )
  }

  return null
}
