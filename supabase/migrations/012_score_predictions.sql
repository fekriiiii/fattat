-- 012 — Score prediction log
-- Every time the app shows a user a predicted HP band (or a verbal-accuracy
-- fallback), we record it here. This is the data we'll later compare to
-- real HP outcomes to calibrate the model.
--
-- Two write paths today:
--   1. POST /api/diagnostic/complete  → source = 'diagnostic_complete'
--   2. /dashboard server render        → source = 'dashboard'
--
-- The "predicted_*" columns are nullable because predictScore() returns null
-- for users who haven't given us a previous HP score — in that case we show
-- a verbal-accuracy percentage instead, which we still log.

CREATE TABLE IF NOT EXISTS score_predictions (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  source              TEXT NOT NULL CHECK (source IN ('diagnostic_complete', 'dashboard')),

  -- The HP band shown to the user. NULL when verbal-accuracy mode (no previous HP).
  predicted_low       REAL,
  predicted_mid       REAL,
  predicted_high      REAL,

  -- Always populated — the verbal hit rate (ORD retention + LÄS accuracy) / 2.
  -- Useful as a model-agnostic outcome variable for calibration analysis.
  verbal_accuracy     REAL NOT NULL,

  -- Inputs that produced the prediction, snapshotted at this moment.
  ord_retention       REAL NOT NULL,
  las_accuracy        REAL NOT NULL,
  session_count       INTEGER NOT NULL DEFAULT 0,

  -- Priors known at prediction time. NULL means user hasn't given them to us yet.
  -- Snapshotted because the user can later update them in their profile.
  previous_hp_score   REAL,
  previous_mek_score  REAL,
  previous_elf_score  REAL,

  -- Optional FK for diagnostic-source rows (links to the session whose results
  -- triggered the prediction). Dashboard rows leave this NULL.
  session_id          UUID REFERENCES study_sessions(id) ON DELETE SET NULL,

  -- Extension point for inputs we add later without a migration.
  meta                JSONB NOT NULL DEFAULT '{}',

  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_score_predictions_user_created
  ON score_predictions(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_score_predictions_source
  ON score_predictions(source);

-- RLS — same pattern as session_responses: users only see/write their own rows.
ALTER TABLE score_predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_predictions" ON score_predictions
  FOR ALL USING (auth.uid() = user_id);
