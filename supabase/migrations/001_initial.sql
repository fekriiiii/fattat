-- Fattat — Initial Database Schema
-- Run this in the Supabase SQL editor or via `supabase db push`

-- ─────────────────────────────────────────────────────────────────────────────
-- EXTENSIONS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ─────────────────────────────────────────────────────────────────────────────
-- USER PROFILES
-- Auto-created on auth.users insert via trigger below
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_profiles (
  id                  UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name        TEXT,
  exam_date           DATE,
  target_score        INTEGER CHECK (target_score BETWEEN 0 AND 160),
  preferred_notify_at TIME DEFAULT '19:00',
  study_cue           TEXT,
  timezone            TEXT NOT NULL DEFAULT 'Europe/Stockholm',
  tier                TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'paid')),
  onboarded_at        TIMESTAMPTZ,
  notification_state  JSONB NOT NULL DEFAULT '{}',
  sessions_completed  INTEGER NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- WORDS (ORD database)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS words (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  word             TEXT NOT NULL UNIQUE,
  pos              TEXT NOT NULL DEFAULT 'substantiv'
                   CHECK (pos IN ('substantiv', 'verb', 'adjektiv', 'adverb', 'preposition', 'annat',
                                  'sb', 'vb', 'adj', 'adv')),
  correct_synonym  TEXT NOT NULL,
  distractor_1     TEXT NOT NULL,
  distractor_2     TEXT NOT NULL,
  distractor_3     TEXT NOT NULL,
  distractor_4     TEXT NOT NULL,
  definition_sv    TEXT NOT NULL,
  example_sentence TEXT NOT NULL DEFAULT '',
  domain           TEXT NOT NULL DEFAULT 'allmän'
                   CHECK (domain IN ('juridik', 'medicin', 'kultur', 'vetenskap', 'samhälle', 'ekonomi', 'allmän')),
  difficulty       INTEGER NOT NULL DEFAULT 2 CHECK (difficulty BETWEEN 1 AND 3),
  past_exams       TEXT[] NOT NULL DEFAULT '{}',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_words_domain ON words(domain);
CREATE INDEX IF NOT EXISTS idx_words_difficulty ON words(difficulty);

-- ─────────────────────────────────────────────────────────────────────────────
-- ARTICLES (LÄS database)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS articles (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title            TEXT NOT NULL,
  body             TEXT NOT NULL,
  source_url       TEXT,
  source_name      TEXT,
  domain           TEXT NOT NULL DEFAULT 'allmän'
                   CHECK (domain IN ('juridik', 'medicin', 'kultur', 'vetenskap', 'samhälle', 'ekonomi', 'allmän')),
  genre            TEXT NOT NULL DEFAULT 'populärvetenskap'
                   CHECK (genre IN ('populärvetenskap', 'akademisk', 'reportage', 'juridisk',
                                    'personlig_essä', 'debatt_tvåroster', 'lyrik_prosa', 'litterär_prosa')),
  word_count       INTEGER NOT NULL DEFAULT 0,
  difficulty       INTEGER NOT NULL DEFAULT 2 CHECK (difficulty BETWEEN 1 AND 3),
  unit_position    TEXT NOT NULL CHECK (unit_position IN ('kort', 'lång')),
  question_count   INTEGER NOT NULL DEFAULT 2,
  questions        JSONB NOT NULL DEFAULT '[]',
  -- questions shape: [{id, type, stem, options:{A,B,C,D}, correct, passage_anchor, explanation}]
  -- type: 'huvudtanke'|'detalj'|'syfte'|'slutledning'|'jämförande'|'ståndpunkt'
  vocab_highlights JSONB NOT NULL DEFAULT '[]',
  -- vocab_highlights shape: [{word, definition_sv, start_index, end_index}]
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_articles_unit_position ON articles(unit_position);
CREATE INDEX IF NOT EXISTS idx_articles_domain ON articles(domain);

-- ─────────────────────────────────────────────────────────────────────────────
-- FSRS CARDS (per-user per-word spaced repetition state)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fsrs_cards (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  word_id        UUID NOT NULL REFERENCES words(id) ON DELETE CASCADE,
  due            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  stability      FLOAT NOT NULL DEFAULT 0,
  difficulty     FLOAT NOT NULL DEFAULT 5,
  elapsed_days   INTEGER NOT NULL DEFAULT 0,
  scheduled_days INTEGER NOT NULL DEFAULT 0,
  reps           INTEGER NOT NULL DEFAULT 0,
  lapses         INTEGER NOT NULL DEFAULT 0,
  learning_steps INTEGER NOT NULL DEFAULT 0,
  state          INTEGER NOT NULL DEFAULT 0,
  -- 0=New, 1=Learning, 2=Review, 3=Relearning
  last_review    TIMESTAMPTZ,
  miss_count     INTEGER NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, word_id)
);

CREATE INDEX IF NOT EXISTS idx_fsrs_user_due    ON fsrs_cards(user_id, due);
CREATE INDEX IF NOT EXISTS idx_fsrs_user_miss   ON fsrs_cards(user_id, miss_count DESC);
CREATE INDEX IF NOT EXISTS idx_fsrs_user_state  ON fsrs_cards(user_id, state);

-- ─────────────────────────────────────────────────────────────────────────────
-- STUDY SESSIONS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS study_sessions (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  session_type TEXT NOT NULL CHECK (session_type IN ('daily', 'diagnostic', 'exam_mode')),
  started_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  ord_count    INTEGER NOT NULL DEFAULT 0,
  ord_correct  INTEGER NOT NULL DEFAULT 0,
  las_count    INTEGER NOT NULL DEFAULT 0,
  las_correct  INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_date ON study_sessions(user_id, started_at DESC);

-- ─────────────────────────────────────────────────────────────────────────────
-- SESSION RESPONSES (individual question answers)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS session_responses (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id    UUID NOT NULL REFERENCES study_sessions(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  question_type TEXT NOT NULL CHECK (question_type IN ('ord', 'las')),
  word_id       UUID REFERENCES words(id),
  article_id    UUID REFERENCES articles(id),
  question_id   TEXT,
  chosen_label  TEXT NOT NULL,
  correct_label TEXT NOT NULL,
  is_correct    BOOLEAN NOT NULL,
  response_ms   INTEGER,
  answered_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_responses_session    ON session_responses(session_id);
CREATE INDEX IF NOT EXISTS idx_responses_user_word  ON session_responses(user_id, word_id);
CREATE INDEX IF NOT EXISTS idx_responses_user_type  ON session_responses(user_id, question_type, is_correct);

-- ─────────────────────────────────────────────────────────────────────────────
-- USER STREAKS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_streaks (
  user_id               UUID PRIMARY KEY REFERENCES user_profiles(id) ON DELETE CASCADE,
  current_streak        INTEGER NOT NULL DEFAULT 0,
  longest_streak        INTEGER NOT NULL DEFAULT 0,
  last_activity_date    DATE,
  freeze_available      BOOLEAN NOT NULL DEFAULT TRUE,
  freeze_used_this_week BOOLEAN NOT NULL DEFAULT FALSE,
  total_days_studied    INTEGER NOT NULL DEFAULT 0,
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- STUDY PLANS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS study_plans (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id            UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  exam_date          DATE NOT NULL,
  target_score       INTEGER NOT NULL,
  baseline_score     INTEGER NOT NULL DEFAULT 0,
  weekly_goals       JSONB NOT NULL DEFAULT '[]',
  implementation_cue TEXT,
  active             BOOLEAN NOT NULL DEFAULT TRUE,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- ARTICLE COMPLETIONS (prevents repeating articles)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS article_completions (
  user_id      UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  article_id   UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  session_id   UUID REFERENCES study_sessions(id),
  accuracy     FLOAT,
  reading_ms   INTEGER,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, article_id)
);

CREATE INDEX IF NOT EXISTS idx_completions_user ON article_completions(user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- PUSH SUBSCRIPTIONS (Web Push API)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  endpoint     TEXT NOT NULL UNIQUE,
  p256dh       TEXT NOT NULL,
  auth_key     TEXT NOT NULL,
  user_agent   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_sent_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_push_user ON push_subscriptions(user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- STUDY PARTNERS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS study_partners (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inviter_id   UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  invitee_id   UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  invite_token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  status       TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'declined')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE user_profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE fsrs_cards         ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_responses  ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_streaks       ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_plans        ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_partners     ENABLE ROW LEVEL SECURITY;

-- Users own their own rows
CREATE POLICY "own_profile"      ON user_profiles      FOR ALL USING (auth.uid() = id);
CREATE POLICY "own_cards"        ON fsrs_cards         FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_sessions"     ON study_sessions     FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_responses"    ON session_responses  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_streak"       ON user_streaks       FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_plan"         ON study_plans        FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_completions"  ON article_completions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_push"         ON push_subscriptions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_partners"     ON study_partners     FOR ALL
  USING (auth.uid() = inviter_id OR auth.uid() = invitee_id);

-- Partner invite_token read for accept flow (unauthenticated read by token)
CREATE POLICY "partners_token_read" ON study_partners FOR SELECT
  USING (TRUE);

-- Content tables are public read
ALTER TABLE words    ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "words_public_read"    ON words    FOR SELECT USING (TRUE);
CREATE POLICY "articles_public_read" ON articles FOR SELECT USING (TRUE);

-- ─────────────────────────────────────────────────────────────────────────────
-- FUNCTIONS + TRIGGERS
-- ─────────────────────────────────────────────────────────────────────────────

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_fsrs_updated_at
  BEFORE UPDATE ON fsrs_cards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create profile + streak on new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id) VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO user_streaks (user_id) VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Weekly streak freeze reset (call this from a cron job or Supabase Edge Function every Monday)
CREATE OR REPLACE FUNCTION reset_weekly_streak_freeze()
RETURNS void AS $$
BEGIN
  UPDATE user_streaks
  SET freeze_available = TRUE,
      freeze_used_this_week = FALSE,
      updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
