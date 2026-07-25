// Database types — generated from schema
// Run `npm run db:types` to regenerate from Supabase after schema changes

export type Domain = 'juridik' | 'medicin' | 'kultur' | 'vetenskap' | 'samhälle' | 'ekonomi' | 'allmän'
export type Genre = 'populärvetenskap' | 'akademisk' | 'reportage' | 'juridisk' | 'personlig_essä' | 'debatt_tvåroster' | 'lyrik_prosa' | 'litterär_prosa'
export type UnitPosition = 'kort' | 'lång'
export type SessionType = 'daily' | 'diagnostic' | 'exam_mode'
export type FsrsState = 0 | 1 | 2 | 3 // New | Learning | Review | Relearning
export type PartnerStatus = 'pending' | 'active' | 'declined'

export interface LasOption {
  A: string
  B: string
  C: string
  D: string
}

export interface LasQuestion {
  n: number
  type: 'huvudtanke' | 'detalj_fakta' | 'detalj_kausal' | 'syfte_funktion' | 'slutledning' | 'jämförande' | 'ståndpunkt'
  stem: string
  options: LasOption
  correct: 'A' | 'B' | 'C' | 'D'
  passage_anchor: string
  explanation: string
  distractor_types: Partial<Record<'A' | 'B' | 'C' | 'D', string>>
  notes: string
}

export interface VocabHighlight {
  word: string
  // The article files and the seed script both write `definition`. Rows seeded
  // before 2026-07 carry the same text under `definition_sv`, because the seed
  // script renamed the field on the way in while the UI kept reading
  // `definition` — so the tooltip rendered blank for every article ever seeded.
  // Both names are read (see VocabTooltip) so old rows work without a re-seed.
  definition?: string
  definition_sv?: string
}

export interface WeeklyGoal {
  week: number
  focus: string
  ord_target: number
  las_target: number
}

export interface Word {
  id: string
  word: string
  pos: string
  correct_synonym: string
  distractor_1: string
  distractor_2: string
  distractor_3: string
  distractor_4: string
  definition_sv: string
  example_sentence: string
  domain: Domain
  difficulty: number
  past_exams: string[]
  accepted_synonyms: string | null
  created_at: string
}

export interface Article {
  id: string
  title: string
  body: string
  source_url: string | null
  source_name: string | null
  domain: Domain
  genre: Genre
  word_count: number
  difficulty: number
  unit_position: UnitPosition
  question_count: number
  questions: LasQuestion[]
  vocab_highlights: VocabHighlight[]
  featured_ord_words: string[] | null
  is_designed_content: boolean  // Internal flag (Step 17) — never displayed to users
  created_at: string
}

export interface FsrsCard {
  id: string
  user_id: string
  word_id: string
  due: string
  stability: number
  difficulty: number
  elapsed_days: number
  scheduled_days: number
  reps: number
  lapses: number
  learning_steps: number
  state: FsrsState
  last_review: string | null
  miss_count: number
  // 0..2 — counts consecutive correct MCQ answers. Once at 2, the word has
  // graduated to typing mode and the counter is frozen.
  mcq_correct_streak: number
  created_at: string
  updated_at: string
}

export interface UserProfile {
  id: string
  display_name: string | null
  exam_date: string | null
  target_score: number | null
  target_program: string | null
  previous_hp_score: number | null
  previous_mek_score: number | null
  previous_elf_score: number | null
  reported_hp_score: number | null
  reported_hp_test_date: string | null
  reported_hp_reported_at: string | null
  preferred_notify_at: string
  study_cue: string | null
  timezone: string
  tier: 'free' | 'paid'
  onboarded_at: string | null
  notification_state: Record<string, unknown>
  sessions_completed: number
  created_at: string
  updated_at: string
}

export interface UserStreak {
  user_id: string
  current_streak: number
  longest_streak: number
  last_activity_date: string | null
  freeze_available: boolean
  freeze_used_this_week: boolean
  total_days_studied: number
  updated_at: string
}

export interface StudySession {
  id: string
  user_id: string
  session_type: SessionType
  started_at: string
  completed_at: string | null
  ord_count: number
  ord_correct: number
  las_count: number
  las_correct: number
  payload: SessionPayload | null
}

// Generic in-progress state for a session. Currently only exam_mode populates it,
// to make övningsprov resumable across browser refreshes.
export interface SessionPayload {
  ord_word_ids?: string[]
  article_ids?: string[]
  // Subset of ord_word_ids drawn from the fresh-fill past-HP pool (vs. words
  // the user already has FSRS history on). Lets the results page split the
  // score into "ord du tränat på" vs "nya HP-ord" — corpus split, 2026-05-30.
  novel_word_ids?: string[]
}

export interface SessionResponse {
  id: string
  session_id: string
  user_id: string
  question_type: 'ord' | 'las'
  word_id: string | null
  article_id: string | null
  question_id: string | null
  las_question_type: string | null
  chosen_label: string
  correct_label: string
  is_correct: boolean
  response_ms: number | null
  // LÄS daily sessions only — one-tap confidence judgment captured before
  // feedback. Enables calibration feedback ("säker men fel") — migration 023.
  confidence: 'sure' | 'unsure' | 'guess' | null
  // FSRS rating (1=Again 2=Hard 3=Good 4=Easy) applied at review time for ORD
  // answers. Review log for future per-user parameter optimization — migration 023.
  fsrs_rating: number | null
  answered_at: string
}

export interface StudyPlan {
  id: string
  user_id: string
  exam_date: string
  target_score: number
  baseline_score: number
  daily_ord_quota: number
  weekly_goals: WeeklyGoal[]
  implementation_cue: string | null
  active: boolean
  created_at: string
  exam_schedule: string[]  // YYYY-MM-DD ISO date strings, ascending — see Step 16b
  exam_reschedules_used: number
  session_balance: SessionBalance
}

export type SessionBalance = 'balanced' | 'ord_heavy' | 'las_heavy'

export interface StudyPartner {
  id: string
  inviter_id: string
  invitee_id: string | null
  invite_token: string
  status: PartnerStatus
  created_at: string
}

export interface PushSubscription {
  id: string
  user_id: string
  endpoint: string
  p256dh: string
  auth_key: string
  user_agent: string | null
  created_at: string
  last_sent_at: string | null
}

export interface ScorePrediction {
  id: string
  user_id: string
  source: 'diagnostic_complete' | 'dashboard'
  predicted_low: number | null
  predicted_mid: number | null
  predicted_high: number | null
  verbal_accuracy: number
  ord_retention: number
  las_accuracy: number
  session_count: number
  previous_hp_score: number | null
  previous_mek_score: number | null
  previous_elf_score: number | null
  session_id: string | null
  meta: Record<string, unknown>
  created_at: string
}
