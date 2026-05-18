import type { Word, Article, LasQuestion } from './database'

export type SessionPhase = 'weakness' | 'ord' | 'las' | 'complete'

export interface OrdOption {
  label: 'A' | 'B' | 'C' | 'D' | 'E'
  text: string
  isCorrect: boolean
}

export interface OrdQuestionData {
  word: Word
  options: OrdOption[]
}

export interface LasQuestionData {
  article: Article
  question: LasQuestion
  questionIndex: number
}

export interface SessionResponse {
  type: 'ord' | 'las'
  wordId?: string
  domain?: string          // ORD only — used for domain gap detection
  articleId?: string
  questionId?: string
  lasQuestionType?: LasQuestion['type']  // LÄS only — for question-type profiling
  chosenLabel: string
  correctLabel: string
  isCorrect: boolean
  responseMs: number
}
