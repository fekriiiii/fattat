'use client'

import { useEffect, useCallback, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSessionStore } from '@/stores/sessionStore'
import { SessionProgress } from '@/components/session/SessionProgress'
import { WeaknessBadge } from '@/components/ord/WeaknessDeck'
import { OrdTyping } from '@/components/ord/OrdTyping'
import { OrdFeedbackTyping } from '@/components/ord/OrdFeedbackTyping'
import { ArticleReader } from '@/components/las/ArticleReader'
import { LasQuestion } from '@/components/las/LasQuestion'
import { LasFeedback } from '@/components/las/LasFeedback'
import { shuffleOptions } from '@/lib/fsrs/engine'
import type { LasOption } from '@/components/las/LasQuestion'
import { Button } from '@/components/ui/Button'
import { AlertTriangle, BookOpen, X } from 'lucide-react'
import { useScrollToTop } from '@/hooks/useScrollToTop'

const LAS_LABELS = ['A', 'B', 'C', 'D'] as const

export default function SessionPage() {
  const router = useRouter()
  const initiated = useRef(false)
  const [readArticleIds, setReadArticleIds] = useState<Set<string>>(new Set())
  const [currentLasOptions, setCurrentLasOptions] = useState<LasOption[]>([])

  const store = useSessionStore()
  const {
    sessionId,
    phase,
    weaknessWords,
    responses,
    showingFeedback,
    selectedLabel,
    answerStartTime,
    currentLasQuestionIndex,
    fatigueDetected,
    domainGap,
    catchUpMode,
    catchUpMessage,
    initSession,
    selectAnswer,
    submitAnswer,
    advanceFromFeedback,
    dismissFatigue,
    dismissDomainGap,
    progressPercent,
  } = store

  const currentWord = store.currentOrdWord()
  const currentArticle = store.currentArticle()

  // Scroll to top on every step transition (phase, question swap, feedback toggle, article-read advance)
  useScrollToTop([phase, showingFeedback, currentWord?.id, currentArticle?.id, currentLasQuestionIndex, readArticleIds.size])

  // Build session on mount
  useEffect(() => {
    if (initiated.current) return
    initiated.current = true
    async function start() {
      const res = await fetch('/api/session/build', { method: 'POST' })
      if (!res.ok) { router.push('/dashboard'); return }
      const data = await res.json()
      initSession({
        sessionId: data.sessionId,
        weaknessWords: data.weaknessWords,
        ordWords: data.ordWords,
        articles: data.articles,
        catchUpMode: data.catchUpMode ?? false,
        catchUpMessage: data.catchUpMessage ?? null,
      })
    }
    start()
  }, [initSession, router])

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

  // Navigate to complete when done
  useEffect(() => {
    if (phase !== 'complete' || !sessionId) return
    const ord = responses.filter((r) => r.type === 'ord')
    const las = responses.filter((r) => r.type === 'las')
    Promise.all([
      fetch('/api/session/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          ordCount: ord.length,
          ordCorrect: ord.filter((r) => r.isCorrect).length,
          lasCount: las.length,
          lasCorrect: las.filter((r) => r.isCorrect).length,
        }),
      }),
      fetch('/api/streak/update', { method: 'POST' }),
    ])
    router.push('/session/complete')
  }, [phase]) // eslint-disable-line react-hooks/exhaustive-deps

  // Handle ORD answer (typing version)
  const handleOrdAnswer = useCallback(
    (typedText: string, isCorrect: boolean) => {
      const word = store.currentOrdWord()
      if (!word || !sessionId) return
      const responseMs = Date.now() - answerStartTime
      selectAnswer(typedText)
      submitAnswer({
        type: 'ord',
        wordId: word.id,
        domain: word.domain,
        chosenLabel: typedText,
        correctLabel: word.correct_synonym,
        isCorrect,
        responseMs,
      })
      fetch('/api/fsrs/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, wordId: word.id, isCorrect, responseMs }),
      })
    },
    [store, sessionId, answerStartTime, selectAnswer, submitAnswer]
  )

  // Handle LÄS answer
  const handleLasAnswer = useCallback(
    (label: string, isCorrect: boolean) => {
      const article = store.currentArticle()
      if (!article) return
      const question = article.questions[currentLasQuestionIndex]
      if (!question) return
      const responseMs = Date.now() - answerStartTime
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
    },
    [store, currentLasQuestionIndex, answerStartTime, selectAnswer, submitAnswer, currentLasOptions]
  )

  // Loading
  if (!sessionId) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-dark/50">Förbereder session…</p>
        </div>
      </div>
    )
  }

  const percent = progressPercent()

  // ─── FATIGUE OVERLAY ──────────────────────────────────────────────────────────
  if (fatigueDetected) {
    return (
      <div className="flex flex-col min-h-screen bg-cream">
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="max-w-sm w-full bg-white rounded-card border border-amber-200 shadow-sm p-6 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="text-amber-600" size={20} />
              </div>
              <h2 className="text-lg font-bold text-dark leading-tight">
                Du börjar tappa fokus
              </h2>
            </div>
            <p className="text-sm text-dark/65 leading-relaxed">
              Vi sparar resten till imorgon bitti när du är fräsch. Det du gjort idag räknas — och hjärnan befäster minnen bäst när den vilar.
            </p>
            <Button
              fullWidth
              onClick={() => {
                const ord = responses.filter((r) => r.type === 'ord')
                const las = responses.filter((r) => r.type === 'las')
                if (sessionId) {
                  fetch('/api/session/complete', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      sessionId,
                      ordCount: ord.length,
                      ordCorrect: ord.filter((r) => r.isCorrect).length,
                      lasCount: las.length,
                      lasCorrect: las.filter((r) => r.isCorrect).length,
                    }),
                  })
                  fetch('/api/streak/update', { method: 'POST' })
                }
                router.push('/session/complete')
              }}
            >
              Avsluta för idag
            </Button>
            <button
              onClick={dismissFatigue}
              className="text-sm text-dark/40 underline underline-offset-2 text-center"
            >
              Fortsätt ändå
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ─── ORD / WEAKNESS ───────────────────────────────────────────────────────────
  if (phase === 'weakness' || phase === 'ord') {
    if (!currentWord) return null
    const lastOrdResponse = [...responses].reverse().find((r) => r.type === 'ord')

    return (
      <div className="flex flex-col">
        <SessionProgress percent={percent} phase={phase} />
        {phase === 'weakness' && <WeaknessBadge count={weaknessWords.length} />}

        {/* Catch-up banner (shown once at start) */}
        {catchUpMode && catchUpMessage && responses.length === 0 && (
          <div className="mx-4 mt-3 mb-1 bg-primary/8 border border-primary/20 rounded-card px-4 py-3 flex items-start gap-3">
            <BookOpen size={16} className="text-primary shrink-0 mt-0.5" />
            <p className="text-sm text-dark/70 leading-relaxed">{catchUpMessage}</p>
          </div>
        )}

        {/* Domain gap banner */}
        {domainGap && !showingFeedback && (
          <div className="mx-4 mt-3 mb-1 bg-amber-50 border border-amber-200 rounded-card px-4 py-3 flex items-start gap-3">
            <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-dark leading-tight">Här finns en kunskapslucka</p>
              <p className="text-xs text-dark/55 mt-0.5">
                Tre fel i rad inom <span className="font-medium">{domainGap}</span>. Vi fortsätter — och en läsartikel om ämnet väntar i LÄS-delen.
              </p>
            </div>
            <button onClick={dismissDomainGap} className="text-dark/30 hover:text-dark/60 transition-colors mt-0.5">
              <X size={14} />
            </button>
          </div>
        )}

        {showingFeedback && lastOrdResponse ? (
          <OrdFeedbackTyping
            word={currentWord}
            typedText={lastOrdResponse.chosenLabel}
            isCorrect={lastOrdResponse.isCorrect}
            onNext={advanceFromFeedback}
          />
        ) : (
          <OrdTyping word={currentWord} onAnswer={handleOrdAnswer} />
        )}
      </div>
    )
  }

  // ─── LÄS ──────────────────────────────────────────────────────────────────────
  if (phase === 'las') {
    if (!currentArticle) return null
    const articleRead = readArticleIds.has(currentArticle.id)
    const question = currentArticle.questions[currentLasQuestionIndex]
    const totalQ = currentArticle.questions.length
    const lastLasResponse = [...responses].reverse().find((r) => r.type === 'las')

    return (
      <div className="flex flex-col">
        <SessionProgress percent={percent} phase="las" />

        {!articleRead ? (
          <ArticleReader
            article={currentArticle}
            onDoneReading={() => {
              setReadArticleIds((prev) => new Set([...prev, currentArticle.id]))
            }}
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
