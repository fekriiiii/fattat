-- 015 — Reported HP score (calibration feedback loop)
--
-- Migration 012 added score_predictions to log every prediction we show users.
-- Until now there was no way to compare those predictions against real exam
-- outcomes. This migration captures the user-reported actual HP score after
-- they sit the real Högskoleprovet, and exposes a view that joins predictions
-- with their outcomes for calibration analysis.
--
-- Naming note: `previous_hp_score` (migration 004) is the user's score from a
-- PRIOR HP attempt, given during onboarding. `reported_hp_score` (here) is the
-- score from the exam they took WHILE using Fattat — the ground truth our
-- predictions are supposed to approximate.

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS reported_hp_score      NUMERIC,
  ADD COLUMN IF NOT EXISTS reported_hp_test_date  DATE,
  ADD COLUMN IF NOT EXISTS reported_hp_reported_at TIMESTAMPTZ;

COMMENT ON COLUMN user_profiles.reported_hp_score IS
  'User-reported HP score from the real exam taken while using Fattat. Used to calibrate score_predictions. NULL until reported.';
COMMENT ON COLUMN user_profiles.reported_hp_test_date IS
  'Date of the real HP exam the user is reporting a score for.';
COMMENT ON COLUMN user_profiles.reported_hp_reported_at IS
  'Timestamp when the user submitted their reported_hp_score (used to detect later corrections).';

-- Calibration view — joins every logged prediction with the user's eventual
-- real HP result, for any user who has reported one. The founder (or a future
-- analytics job) can query this directly to compute MAE, bias, band coverage,
-- etc. Predictions made AFTER the test date are excluded from calibration
-- because they're informed by the outcome (data leakage).
CREATE OR REPLACE VIEW prediction_calibration AS
SELECT
  sp.id                  AS prediction_id,
  sp.user_id,
  sp.source,
  sp.created_at          AS predicted_at,
  sp.predicted_low,
  sp.predicted_mid,
  sp.predicted_high,
  sp.verbal_accuracy,
  sp.ord_retention,
  sp.las_accuracy,
  sp.session_count,
  sp.previous_hp_score,
  sp.previous_mek_score,
  sp.previous_elf_score,
  up.reported_hp_score,
  up.reported_hp_test_date,
  up.reported_hp_reported_at,
  -- Convenience: signed error (predicted_mid - actual). Positive = we overpredicted.
  (sp.predicted_mid - up.reported_hp_score) AS error_mid,
  -- Whether the actual outcome fell inside the predicted band.
  CASE
    WHEN sp.predicted_low IS NULL THEN NULL
    WHEN up.reported_hp_score BETWEEN sp.predicted_low AND sp.predicted_high THEN TRUE
    ELSE FALSE
  END AS within_band
FROM score_predictions sp
JOIN user_profiles up ON sp.user_id = up.id
WHERE up.reported_hp_score IS NOT NULL
  AND (up.reported_hp_test_date IS NULL OR sp.created_at::date <= up.reported_hp_test_date);
