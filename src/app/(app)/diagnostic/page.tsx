'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSessionStore } from '@/stores/sessionStore'
import { SessionProgress } from '@/components/session/SessionProgress'
import { OrdQuestion } from '@/components/ord/OrdQuestion'
import { OrdFeedback } from '@/components/ord/OrdFeedback'
import { ArticleReader } from '@/components/las/ArticleReader'
import { LasQuestion } from '@/components/las/LasQuestion'
import { LasFeedback } from '@/components/las/LasFeedback'
import { shuffleOptions } from '@/lib/fsrs/engine'
import { useScrollToTop } from '@/hooks/useScrollToTop'
import { haptics } from '@/lib/utils/haptics'
import type { OrdOption } from '@/components/ord/OrdQuestion'
import type { LasOption } from '@/components/las/LasQuestion'

const ORD_LABELS = ['A', 'B', 'C', 'D', 'E'] as const
const LAS_LABELS = ['A', 'B', 'C', 'D'] as const

export default function DiagnosticPage() {
  const router = useRouter()
  const initiated = useRef(false)
  const [readArticleIds, setReadArticleIds] = useState<Set<string>>(new Set())
  const [currentOrdOptions, setCurrentOrdOptions] = useState<OrdOption[]>([])
  const [currentLasOptions, setCurrentLasOptions] = useState<LasOption[]>([])

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
      const res = await fetch('/api/diagnostic/build', { method: 'POST' })
      if (!res.ok) { router.push('/dashboard'); return }
      const data = await res.json()
      initSession({
        sessionId: data.sessionId,
        weaknessWords: [],
        ordWords: data.ordWords,
        articles: data.articles,
        isDiagnostic: true,
      })
    }
    start()
  }, [initSession, router])

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

  useEffect(() => {
    if (phase === 'complete' && sessionId) {
      const params = new URLSearchParams()
      const ord = responses.filter((r) => r.type === 'ord')
      const las = responses.filter((r) => r.type === 'las')
      params.set('sessionId', sessionId)
      params.set('ordCorrect', String(ord.filter((r) => r.isCorrect).length))
      params.set('ordTotal', String(ord.length))
      params.set('lasCorrect', String(las.filter((r) => r.isCorrect).length))
      params.set('lasTotal', String(las.length))
      router.push(`/diagnostic/results?${params.toString()}`)
    }
  }, [phase, responses, router, sessionId])

  function handleOrdAnswer(label: string, isCorrect: boolean) {
    const word = store.currentOrdWord()
    if (!word || !sessionId) return
    const responseMs = Date.now() - answerStartTime
    isCorrect ? haptics.correct() : haptics.wrong()
    selectAnswer(label)
    const correctLabel = currentOrdOptions.find((o) => o.isCorrect)?.label ?? 'A'
    submitAnswer({ type: 'ord', wordId: word.id, chosenLabel: label, correctLabel, isCorrect, responseMs })
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
          <p className="text-sm text-dark/50">Förbereder diagnosprov…</p>
        </div>
      </div>
    )
  }

  const percent = progressPercent()

  if (phase === 'ord') {
    if (!currentWord) return null
    const lastOrdResponse = [...responses].reverse().find((r) => r.type === 'ord')

    return (
      <div className="flex flex-col">
        <SessionProgress percent={percent} phase="ord" />
        <div className="px-4 py-2">
          <p className="text-xs text-dark/40 text-center">Diagnosprov · Ordförståelse</p>
        </div>
        {showingFeedback && lastOrdResponse ? (
          <OrdFeedback
            word={currentWord}
            options={currentOrdOptions}
            chosenLabel={lastOrdResponse.chosenLabel}
            isCorrect={lastOrdResponse.isCorrect}
            onNext={advanceFromFeedback}
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

  if (phase === 'las') {
    if (!currentArticle) return null
    const articleRead = readArticleIds.has(currentArticle.id)
    const question = currentArticle.questions[currentLasQuestionIndex]
    const totalQ = currentArticle.questions.length
    const lastLasResponse = [...responses].reverse().find((r) => r.type === 'las')

    return (
      <div className="flex flex-col">
        <SessionProgress percent={percent} phase="las" />
        <div className="px-4 py-2">
          <p className="text-xs text-dark/40 text-center">Diagnosprov · Läsförståelse</p>
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
