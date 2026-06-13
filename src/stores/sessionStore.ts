import { create } from 'zustand'
import type { Word, Article } from '@/types/database'
import type { SessionPhase, SessionResponse } from '@/types/session'

interface SessionStore {
  // Session metadata
  sessionId: string | null
  isDiagnostic: boolean

  // Phase machine
  phase: SessionPhase
  currentOrdIndex: number
  currentLasIndex: number
  currentLasQuestionIndex: number

  // Content queues
  ordWords: Word[]
  articles: Article[]
  newWordIds: Set<string>

  // Responses collected
  responses: SessionResponse[]

  // UI state
  showingFeedback: boolean
  selectedLabel: string | null
  answerStartTime: number

  // Personal trainer state
  fatigueDetected: boolean
  fatigueDismissed: boolean // permanently dismissed for this session
  domainGap: string | null
  catchUpMode: boolean
  catchUpMessage: string | null
  focusDomain: string | null
  focusMessage: string | null
  balanceMessage: string | null

  // Actions
  initSession: (params: {
    sessionId: string
    ordWords: Word[]
    articles: Article[]
    newWordIds?: string[]
    isDiagnostic?: boolean
    catchUpMode?: boolean
    catchUpMessage?: string | null
    focusDomain?: string | null
    focusMessage?: string | null
    balanceMessage?: string | null
    priorResponses?: SessionResponse[]
  }) => void
  selectAnswer: (label: string) => void
  submitAnswer: (response: SessionResponse) => void
  // Resets the response timer. Called when an article reader or gist gate
  // closes so question-1 response_ms measures the question, not the reading.
  markAnswerStart: () => void
  advanceFromFeedback: () => void
  dismissFatigue: () => void
  dismissDomainGap: () => void
  restoreResponses: (responses: SessionResponse[]) => void
  reset: () => void

  // Computed
  currentOrdWord: () => Word | null
  currentArticle: () => Article | null
  totalOrd: () => number
  totalOrdAnswered: () => number
  progressPercent: () => number
}

const initialState = {
  sessionId: null,
  isDiagnostic: false,
  phase: 'ord' as SessionPhase,
  currentOrdIndex: 0,
  currentLasIndex: 0,
  currentLasQuestionIndex: 0,
  ordWords: [],
  articles: [],
  newWordIds: new Set<string>(),
  responses: [],
  showingFeedback: false,
  selectedLabel: null,
  answerStartTime: Date.now(),
  fatigueDetected: false,
  fatigueDismissed: false,
  domainGap: null,
  catchUpMode: false,
  catchUpMessage: null,
  focusDomain: null,
  focusMessage: null,
  balanceMessage: null,
}

export const useSessionStore = create<SessionStore>((set, get) => ({
  ...initialState,

  initSession({ sessionId, ordWords, articles, newWordIds = [], isDiagnostic = false, catchUpMode = false, catchUpMessage = null, focusDomain = null, focusMessage = null, balanceMessage = null, priorResponses }) {
    set(() => {
      const base = {
        ...initialState,
        sessionId,
        isDiagnostic,
        ordWords,
        articles,
        newWordIds: new Set(newWordIds),
        // On LÄS-only days, ord arrays are empty — jump straight to 'las'.
        phase: (ordWords.length > 0
          ? 'ord'
          : articles.length > 0
            ? 'las'
            : 'complete') as SessionPhase,
        answerStartTime: Date.now(),
        catchUpMode,
        catchUpMessage,
        focusDomain,
        focusMessage,
        balanceMessage,
      }
      if (!priorResponses || priorResponses.length === 0) return base

      // Restore position from prior responses in the same update to avoid a
      // flash of question 1 between initSession and a separate restoreResponses call.
      const ordCount = priorResponses.filter((r) => r.type === 'ord').length
      const lasCount = priorResponses.filter((r) => r.type === 'las').length

      let lasIndex = 0
      let lasQuestionIndex = 0
      let remaining = lasCount
      for (let i = 0; i < articles.length; i++) {
        const qCount = articles[i].questions.length
        if (remaining < qCount) { lasIndex = i; lasQuestionIndex = remaining; remaining = 0; break }
        remaining -= qCount
        lasIndex = i + 1
        lasQuestionIndex = 0
      }

      let phase: SessionPhase
      if (ordCount < ordWords.length) {
        phase = 'ord'
      } else if (lasCount < articles.reduce((sum, a) => sum + a.questions.length, 0)) {
        phase = 'las'
      } else {
        phase = 'complete'
      }

      return {
        ...base,
        responses: priorResponses,
        currentOrdIndex: Math.min(ordCount, ordWords.length),
        currentLasIndex: lasIndex,
        currentLasQuestionIndex: lasQuestionIndex,
        phase,
        showingFeedback: false,
        selectedLabel: null,
      }
    })
  },

  selectAnswer(label) {
    if (get().showingFeedback) return
    set({ selectedLabel: label })
  },

  markAnswerStart() {
    set({ answerStartTime: Date.now() })
  },

  submitAnswer(response) {
    set((s) => {
      const newResponses = [...s.responses, response]

      // Fatigue detection (ORD only, skip if already detected or permanently dismissed)
      let fatigueDetected = s.fatigueDetected
      if (!fatigueDetected && !s.fatigueDismissed && response.type === 'ord') {
        const ordResponses = newResponses.filter((r) => r.type === 'ord')
        // Warmup: need at least 8 ORD answers before fatigue can trigger
        if (ordResponses.length >= 8) {
          const last7 = ordResponses.slice(-7)
          const wrongInLast7 = last7.filter((r) => !r.isCorrect).length
          const last3 = ordResponses.slice(-3)
          const avgMs =
            last3.length >= 3 ? last3.reduce((sum, r) => sum + r.responseMs, 0) / last3.length : 0
          // Fatigued if: 5+ wrong in last 7, OR taking >12s average in last 3
          fatigueDetected =
            (last7.length >= 7 && wrongInLast7 >= 5) || (last3.length >= 3 && avgMs > 12000)
        }
      }

      // Domain gap detection (ORD only, skip if already detected)
      let domainGap = s.domainGap
      if (!domainGap && response.type === 'ord') {
        const ordResponses = newResponses.filter((r) => r.type === 'ord')
        const last3 = ordResponses.slice(-3)
        if (last3.length >= 3 && last3.every((r) => !r.isCorrect && r.domain)) {
          const domains = last3.map((r) => r.domain)
          if (domains.every((d) => d === domains[0])) {
            domainGap = domains[0] ?? null
          }
        }
      }

      return { responses: newResponses, showingFeedback: true, fatigueDetected, domainGap }
    })
  },

  advanceFromFeedback() {
    const s = get()

    // Currently in ord phase
    if (s.phase === 'ord') {
      const nextOrdIndex = s.currentOrdIndex + 1
      if (nextOrdIndex < s.ordWords.length) {
        set({
          currentOrdIndex: nextOrdIndex,
          showingFeedback: false,
          selectedLabel: null,
          answerStartTime: Date.now(),
        })
      } else if (s.articles.length > 0) {
        // Move to LÄS
        set({
          phase: 'las',
          showingFeedback: false,
          selectedLabel: null,
          currentLasIndex: 0,
          currentLasQuestionIndex: 0,
          answerStartTime: Date.now(),
        })
      } else {
        set({ phase: 'complete' })
      }
      return
    }

    // Currently in LÄS phase
    if (s.phase === 'las') {
      const currentArticle = s.articles[s.currentLasIndex]
      if (!currentArticle) {
        set({ phase: 'complete' })
        return
      }
      const nextQIndex = s.currentLasQuestionIndex + 1
      if (nextQIndex < currentArticle.questions.length) {
        // Next question in same article
        set({
          currentLasQuestionIndex: nextQIndex,
          showingFeedback: false,
          selectedLabel: null,
          answerStartTime: Date.now(),
        })
      } else {
        // Move to next article
        const nextArticleIndex = s.currentLasIndex + 1
        if (nextArticleIndex < s.articles.length) {
          set({
            currentLasIndex: nextArticleIndex,
            currentLasQuestionIndex: 0,
            showingFeedback: false,
            selectedLabel: null,
            answerStartTime: Date.now(),
          })
        } else {
          set({ phase: 'complete' })
        }
      }
    }
  },

  dismissFatigue() {
    // Permanently dismiss fatigue for the rest of this session
    set({ fatigueDetected: false, fatigueDismissed: true })
  },

  dismissDomainGap() {
    set({ domainGap: null })
  },

  // Replays a list of already-answered responses into the store, advancing
  // the index pointers past them so the next question shown is the first
  // unanswered one. Used by övningsprov on resume after a browser refresh.
  // Skips the fatigue / domain-gap detection path that submitAnswer runs —
  // those should fire from live behavior, not historical replay.
  restoreResponses(responses) {
    set((s) => {
      const ordCount = responses.filter((r) => r.type === 'ord').length
      const lasCount = responses.filter((r) => r.type === 'las').length

      // Compute LÄS pointer by walking question counts per article.
      let lasIndex = 0
      let lasQuestionIndex = 0
      let remaining = lasCount
      for (let i = 0; i < s.articles.length; i++) {
        const qCount = s.articles[i].questions.length
        if (remaining < qCount) {
          lasIndex = i
          lasQuestionIndex = remaining
          remaining = 0
          break
        }
        remaining -= qCount
        lasIndex = i + 1
        lasQuestionIndex = 0
      }

      // Determine phase based on how far the user got.
      let phase: SessionPhase
      if (ordCount < s.ordWords.length) {
        phase = 'ord'
      } else if (lasCount < s.articles.reduce((sum, a) => sum + a.questions.length, 0)) {
        phase = 'las'
      } else {
        phase = 'complete'
      }

      return {
        responses,
        currentOrdIndex: Math.min(ordCount, s.ordWords.length),
        currentLasIndex: lasIndex,
        currentLasQuestionIndex: lasQuestionIndex,
        phase,
        showingFeedback: false,
        selectedLabel: null,
        answerStartTime: Date.now(),
      }
    })
  },

  reset() {
    set(initialState)
  },

  currentOrdWord() {
    const s = get()
    return s.ordWords[s.currentOrdIndex] ?? null
  },

  currentArticle() {
    const s = get()
    return s.articles[s.currentLasIndex] ?? null
  },

  totalOrd() {
    return get().ordWords.length
  },

  totalOrdAnswered() {
    return get().responses.filter((r) => r.type === 'ord').length
  },

  progressPercent() {
    const s = get()
    const totalLasQ = s.articles.reduce((sum, a) => sum + a.questions.length, 0)
    const total = s.ordWords.length + totalLasQ
    if (total === 0) return 0
    const done = s.responses.length
    return Math.round((done / total) * 100)
  },
}))
