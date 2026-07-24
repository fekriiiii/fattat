'use client'

import { useEffect, useCallback, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSessionStore } from '@/stores/sessionStore'
import { SessionProgress } from '@/components/session/SessionProgress'
import { OrdTyping } from '@/components/ord/OrdTyping'
import { OrdFeedbackTyping } from '@/components/ord/OrdFeedbackTyping'
import { OrdQuestion } from '@/components/ord/OrdQuestion'
import { OrdFeedback } from '@/components/ord/OrdFeedback'
import { ArticleReader } from '@/components/las/ArticleReader'
import { GistCheck } from '@/components/las/GistCheck'
import { LasQuestion } from '@/components/las/LasQuestion'
import { LasFeedback } from '@/components/las/LasFeedback'
import { shuffleOptions } from '@/lib/fsrs/engine'
import type { OrdOption } from '@/components/ord/OrdQuestion'
import type { LasOption } from '@/components/las/LasQuestion'
import { Button } from '@/components/ui/Button'
import { AlertTriangle, BookOpen, X } from 'lucide-react'
import { useScrollToTop } from '@/hooks/useScrollToTop'
import { haptics } from '@/lib/utils/haptics'

const ORD_LABELS = ['A', 'B', 'C', 'D', 'E'] as const
const LAS_LABELS = ['A', 'B', 'C', 'D'] as const

export default function SessionPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initiated = useRef(false)
  const [readArticleIds, setReadArticleIds] = useState<Set<string>>(new Set())
  // articleId → the one-sentence huvudtanke the user wrote after reading.
  // Client-only; shown back on huvudtanke question feedback for self-comparison.
  const [gistTexts, setGistTexts] = useState<Record<string, string>>({})
  const [currentOrdOptions, setCurrentOrdOptions] = useState<OrdOption[]>([])
  const [currentLasOptions, setCurrentLasOptions] = useState<LasOption[]>([])
  const [alreadyDone, setAlreadyDone] = useState(false)
  const [buildError, setBuildError] = useState(false)

  const store = useSessionStore()
  const {
    sessionId,
    phase,
    newWordIds,
    responses,
    showingFeedback,
    selectedLabel,
    answerStartTime,
    currentLasQuestionIndex,
    fatigueDetected,
    domainGap,
    catchUpMode,
    catchUpMessage,
    focusMessage,
    balanceMessage,
    initSession,
    selectAnswer,
    submitAnswer,
    markAnswerStart,
    advanceFromFeedback,
    dismissFatigue,
    dismissDomainGap,
    progressPercent,
  } = store

  const currentWord = store.currentOrdWord()
  const currentArticle = store.currentArticle()

  // Scroll to top on every step transition (phase, question swap, feedback toggle, article-read advance)
  useScrollToTop([phase, showingFeedback, currentWord?.id, currentArticle?.id, currentLasQuestionIndex, readArticleIds.size, Object.keys(gistTexts).length])

  // Build session on mount
  useEffect(() => {
    if (initiated.current) return
    initiated.current = true
    async function start() {
      // Optional ?focus=<domain> launches a session weighted toward that
      // domain. Sent in the body so the server validates against the user's
      // actual word pool and tells us what mode the session is in.
      // Optional ?mode=extra runs the "extra repetition" release valve —
      // recently-missed words only, no FSRS writes, no streak advance.
      const focus = searchParams.get('focus')
      const mode = searchParams.get('mode')
      const endpoint = mode === 'extra' ? '/api/session/build-extra' : '/api/session/build'
      let res: Response
      try {
        res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: mode === 'extra' ? '{}' : JSON.stringify({ focus: focus ?? undefined }),
        })
      } catch {
        // Network failure (offline, flaky mobile connection) — show retry
        // instead of silently bouncing the user back to the dashboard.
        setBuildError(true)
        return
      }
      if (!res.ok) { setBuildError(true); return }
      const data = await res.json()
      if (data.resumeExtra) {
        // In-progress extra exists — skip the chooser, hard-navigate to extra
        // mode so build-extra picks up the existing row and prior responses.
        window.location.href = '/session?mode=extra'
        return
      }
      if (data.alreadyDone) {
        // Daily already completed today — show the chooser screen instead
        // of building a duplicate daily session.
        setAlreadyDone(true)
        return
      }
      if (mode === 'extra' && !data.sessionId) {
        // No recently-missed words — nothing to extra-practice.
        router.push('/dashboard?extra=empty')
        return
      }
      initSession({
        sessionId: data.sessionId,
        ordWords: data.ordWords,
        articles: data.articles,
        newWordIds: data.newWordIds ?? [],
        catchUpMode: data.catchUpMode ?? false,
        catchUpMessage: data.catchUpMessage ?? null,
        focusDomain: data.focusDomain ?? null,
        focusMessage: data.focusMessage ?? null,
        balanceMessage: data.balanceMessage ?? null,
      })

      // Resume: replay any prior responses so the user lands on
      // the first unanswered question instead of restarting from the top.
      const prior = (data.priorResponses ?? []) as Array<{
        question_type: 'ord' | 'las'
        word_id: string | null
        article_id: string | null
        question_id: string | null
        chosen_label: string
        correct_label: string
        is_correct: boolean
        response_ms: number | null
        las_question_type: string | null
      }>
      if (prior.length > 0) {
        const validLasTypes = new Set(['huvudtanke', 'detalj_fakta', 'detalj_kausal', 'syfte_funktion', 'slutledning', 'jämförande', 'ståndpunkt'])
        store.restoreResponses(
          prior.map((r) => ({
            type: r.question_type,
            wordId: r.word_id ?? undefined,
            articleId: r.article_id ?? undefined,
            questionId: r.question_id ?? undefined,
            chosenLabel: r.chosen_label,
            correctLabel: r.correct_label,
            isCorrect: r.is_correct,
            responseMs: r.response_ms ?? 0,
            lasQuestionType: (r.las_question_type && validLasTypes.has(r.las_question_type)) ? r.las_question_type as any : undefined,
          }))
        )
      }
    }
    start()
  }, [initSession, store, router, searchParams])

  // Compute MCQ options for new words (so options are ready before the word renders)
  useEffect(() => {
    if (!currentWord) return
    if (!newWordIds.has(currentWord.id)) return
    const raw = [
      { text: currentWord.correct_synonym, isCorrect: true },
      { text: currentWord.distractor_1, isCorrect: false },
      { text: currentWord.distractor_2, isCorrect: false },
      { text: currentWord.distractor_3, isCorrect: false },
      { text: currentWord.distractor_4, isCorrect: false },
    ]
    setCurrentOrdOptions(shuffleOptions(raw).map((o, i) => ({ ...o, label: ORD_LABELS[i] })))
  }, [currentWord?.id]) // eslint-disable-line react-hooks/exhaustive-deps

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

  // Navigate to complete when done. Must AWAIT the complete API so completed_at
  // is written before the user can navigate elsewhere — otherwise a quick
  // dashboard→Studera bounce hits /api/session/build while the row is still
  // open and the chooser is bypassed by the resumeExtra branch.
  useEffect(() => {
    if (phase !== 'complete' || !sessionId) return
    const ord = responses.filter((r) => r.type === 'ord')
    const las = responses.filter((r) => r.type === 'las')
    let cancelled = false
    ;(async () => {
      await fetch('/api/session/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          ordCount: ord.length,
          ordCorrect: ord.filter((r) => r.isCorrect).length,
          lasCount: las.length,
          lasCorrect: las.filter((r) => r.isCorrect).length,
          lasResponses: las.map((r) => ({
            articleId: r.articleId,
            questionId: r.questionId,
            lasQuestionType: r.lasQuestionType ?? null,
            chosenLabel: r.chosenLabel,
            correctLabel: r.correctLabel,
            isCorrect: r.isCorrect,
            responseMs: r.responseMs,
            confidence: r.confidence ?? null,
          })),
        }),
      }).catch(() => {})
      // Streak update is best-effort and doesn't block navigation.
      fetch('/api/streak/update', { method: 'POST' }).catch(() => {})
      if (!cancelled) router.push(`/session/complete?sid=${sessionId}`)
    })()
    return () => { cancelled = true }
  }, [phase]) // eslint-disable-line react-hooks/exhaustive-deps

  // Handle ORD answer (typing version — review words)
  const handleOrdAnswer = useCallback(
    (typedText: string, isCorrect: boolean) => {
      const word = store.currentOrdWord()
      if (!word || !sessionId) return
      const responseMs = Date.now() - answerStartTime
      isCorrect ? haptics.correct() : haptics.wrong()
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

  // Handle ORD answer (MCQ version — new words seeing a word for the first time)
  const handleOrdAnswerMcq = useCallback(
    (label: string, isCorrect: boolean) => {
      const word = store.currentOrdWord()
      if (!word || !sessionId) return
      const responseMs = Date.now() - answerStartTime
      isCorrect ? haptics.correct() : haptics.wrong()
      selectAnswer(label)
      const correctLabel = currentOrdOptions.find((o) => o.isCorrect)?.label ?? 'A'
      submitAnswer({
        type: 'ord',
        wordId: word.id,
        domain: word.domain,
        chosenLabel: label,
        correctLabel,
        isCorrect,
        responseMs,
      })
      fetch('/api/fsrs/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, wordId: word.id, isCorrect, responseMs }),
      })
    },
    [store, sessionId, answerStartTime, selectAnswer, submitAnswer, currentOrdOptions]
  )

  // Handle LÄS answer
  const handleLasAnswer = useCallback(
    (label: string, isCorrect: boolean, confidence?: 'sure' | 'unsure' | 'guess') => {
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
        confidence,
      })
    },
    [store, currentLasQuestionIndex, answerStartTime, selectAnswer, submitAnswer, currentLasOptions]
  )

  // Already done today — offer extra repetition or send the user home.
  // This is the chooser shown when the bottom-nav Studera button is tapped
  // after the daily is complete. Keeps the FSRS gate honest without forcing
  // a dead-end disabled button.
  if (alreadyDone) {
    return (
      <div className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="max-w-sm w-full text-center flex flex-col gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-b from-[#11857C] to-primary-700 shadow-hero flex items-center justify-center mx-auto motion-safe:animate-pop-in">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FBFAF7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-dark">Dagens session är klar</h1>
            <p className="text-sm text-dark/65 mt-1.5 leading-relaxed">
              Vi sparar nya ord till imorgon. Vila är en del av inlärningen.
              Vill du ändå köra extra repetition på dina svaga ord?
            </p>
            <p className="text-xs text-dark/45 mt-2 leading-relaxed">
              Extra repetition påverkar inte din dagliga progress eller streaken.
            </p>
          </div>
          <div className="flex flex-col gap-2 mt-2">
            <Button
              fullWidth
              size="lg"
              onClick={() => {
                // Hard navigate to remount the page — the useEffect guard
                // initiated.current prevents a soft route change from re-fetching.
                window.location.href = '/session?mode=extra'
              }}
            >
              Kör extra repetition
            </Button>
            <button
              onClick={() => router.push('/dashboard')}
              className="text-sm text-dark/50 hover:text-dark/70 underline underline-offset-2 py-2"
            >
              Tillbaka till hem
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Build failed (server error or offline) — explain and offer retry instead
  // of a silent bounce to the dashboard.
  if (buildError) {
    return (
      <div className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="max-w-sm w-full text-center flex flex-col gap-4">
          <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mx-auto">
            <AlertTriangle className="text-amber-600" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-dark">Kunde inte starta sessionen</h1>
            <p className="text-sm text-dark/65 mt-1.5 leading-relaxed">
              Något gick fel. Kolla din uppkoppling och försök igen. Dina framsteg är sparade.
            </p>
          </div>
          <div className="flex flex-col gap-2 mt-2">
            <Button fullWidth size="lg" onClick={() => window.location.reload()}>
              Försök igen
            </Button>
            <button
              onClick={() => router.push('/dashboard')}
              className="text-sm text-dark/50 hover:text-dark/70 underline underline-offset-2 py-2"
            >
              Tillbaka till hem
            </button>
          </div>
        </div>
      </div>
    )
  }

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

  const endSessionForToday = () => {
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
      }).catch(() => {})
      fetch('/api/streak/update', { method: 'POST' }).catch(() => {})
    }
    router.push(`/session/complete?sid=${sessionId}`)
  }

  // ─── ORD ─────────────────────────────────────────────────────────────────────
  if (phase === 'ord') {
    if (!currentWord) {
      return (
        <div className="flex-1 flex items-center justify-center py-20">
          <div className="text-center px-6">
            <p className="text-sm text-dark/50 mb-4">Något gick fel när sessionen byggdes.</p>
            <button
              className="text-sm font-bold text-primary underline underline-offset-2"
              onClick={() => router.push('/dashboard')}
            >
              Tillbaka till start
            </button>
          </div>
        </div>
      )
    }
    const lastOrdResponse = [...responses].reverse().find((r) => r.type === 'ord')
    const isNewWord = newWordIds.has(currentWord.id)

    return (
      <div className="flex flex-col">
        <SessionProgress percent={percent} phase={phase} />

        {/* Catch-up banner (shown once at start) */}
        {catchUpMode && catchUpMessage && responses.length === 0 && (
          <div className="mx-4 mt-3 mb-1 bg-white border border-primary/15 shadow-card rounded-card px-4 py-3 flex items-start gap-3 motion-safe:animate-fade-up">
            <BookOpen size={16} className="text-primary shrink-0 mt-0.5" />
            <p className="text-sm text-dark/70 leading-relaxed">{catchUpMessage}</p>
          </div>
        )}

        {/* Balance banner — explains ORD-only / LÄS-only days on weighted plans. */}
        {!catchUpMode && balanceMessage && responses.length === 0 && (
          <div className="mx-4 mt-3 mb-1 bg-white border border-primary/15 shadow-card rounded-card px-4 py-3 flex items-start gap-3 motion-safe:animate-fade-up">
            <BookOpen size={16} className="text-primary shrink-0 mt-0.5" />
            <p className="text-sm text-dark/70 leading-relaxed">{balanceMessage}</p>
          </div>
        )}

        {/* Focus banner — shown once at start when launched from Veckans fokus.
            Suppressed when catch-up is active to avoid stacked banners. */}
        {!catchUpMode && focusMessage && responses.length === 0 && (
          <div className="mx-4 mt-3 mb-1 bg-white border border-primary/15 shadow-card rounded-card px-4 py-3 flex items-start gap-3 motion-safe:animate-fade-up">
            <BookOpen size={16} className="text-primary shrink-0 mt-0.5" />
            <p className="text-sm text-dark/70 leading-relaxed">{focusMessage}</p>
          </div>
        )}

        {/* Domain gap banner */}
        {domainGap && !showingFeedback && (
          <div className="mx-4 mt-3 mb-1 bg-amber-50 border border-amber-200/70 shadow-card rounded-card px-4 py-3 flex items-start gap-3 motion-safe:animate-fade-up">
            <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-dark leading-tight">Här finns en kunskapslucka</p>
              <p className="text-xs text-dark/55 mt-0.5">
                Du tappar på <span className="font-medium">{domainGap}</span>. Vi fokuserar på det, och en läsartikel om ämnet väntar i LÄS-delen.
              </p>
            </div>
            <button onClick={dismissDomainGap} className="text-dark/30 hover:text-dark/60 transition-colors mt-0.5">
              <X size={14} />
            </button>
          </div>
        )}

        {/* Fatigue banner — accuracy AND speed have both dropped, suggesting
            fatigue rather than just hard words. Advisory only, never blocks. */}
        {fatigueDetected && !showingFeedback && (
          <div className="mx-4 mt-3 mb-1 bg-amber-50 border border-amber-200/70 shadow-card rounded-card px-4 py-3 flex items-start gap-3 motion-safe:animate-fade-up">
            <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-dark leading-tight">Du börjar tappa fokus</p>
              <p className="text-xs text-dark/55 mt-0.5">
                Det du gjort idag räknas. Hjärnan befäster minnen bäst när den vilar.{' '}
                <button onClick={endSessionForToday} className="font-bold text-primary underline underline-offset-2">
                  Avsluta för idag
                </button>
              </p>
            </div>
            <button onClick={dismissFatigue} className="text-dark/30 hover:text-dark/60 transition-colors mt-0.5">
              <X size={14} />
            </button>
          </div>
        )}

        {/* Keyed wrapper re-triggers a subtle slide-in on every step change —
            question→feedback→next question — so the loop feels responsive
            rather than swapping content statically. motion-safe only. */}
        <div key={`${currentWord.id}-${showingFeedback ? 'fb' : 'q'}`} className="motion-safe:animate-slide-in">
        {isNewWord ? (
          showingFeedback && lastOrdResponse ? (
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
              onSelect={handleOrdAnswerMcq}
            />
          )
        ) : (
          showingFeedback && lastOrdResponse ? (
            <OrdFeedbackTyping
              word={currentWord}
              typedText={lastOrdResponse.chosenLabel}
              isCorrect={lastOrdResponse.isCorrect}
              onNext={advanceFromFeedback}
            />
          ) : (
            <OrdTyping word={currentWord} onAnswer={handleOrdAnswer} />
          )
        )}
        </div>
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

        {/* Keyed wrapper — same subtle step-transition as the ORD block. The
            key stays stable within a step (reading, writing gist, answering)
            so component-internal state is never reset mid-step. */}
        <div
          key={`${currentArticle.id}-${String(articleRead)}-${String(gistTexts[currentArticle.id] !== undefined)}-${currentLasQuestionIndex}-${showingFeedback ? 'fb' : 'q'}`}
          className="motion-safe:animate-slide-in"
        >
        {!articleRead ? (
          <ArticleReader
            article={currentArticle}
            onDoneReading={() => {
              setReadArticleIds((prev) => new Set([...prev, currentArticle.id]))
              markAnswerStart()
            }}
          />
        ) : currentArticle.unit_position === 'lång' && gistTexts[currentArticle.id] === undefined ? (
          // Gist-retrieval gate — lång articles only, once per article. The
          // user closes the text and writes the huvudtanke from memory before
          // any question shows. See GistCheck for the research rationale.
          <GistCheck
            onSubmit={(text) => {
              setGistTexts((prev) => ({ ...prev, [currentArticle.id]: text }))
              markAnswerStart()
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
            confidence={lastLasResponse.confidence}
            gistText={gistTexts[currentArticle.id] ?? null}
          />
        ) : null}
        </div>
      </div>
    )
  }

  return null
}
