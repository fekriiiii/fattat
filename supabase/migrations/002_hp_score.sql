-- Migrate target_score from raw points (0–160) to HP scale (0.0–2.0)
-- HP score = raw points / 80

ALTER TABLE user_profiles
  DROP CONSTRAINT IF EXISTS user_profiles_target_score_check,
  ALTER COLUMN target_score TYPE DECIMAL(3,2)
    USING ROUND((target_score::DECIMAL / 80)::NUMERIC, 2),
  ADD CONSTRAINT user_profiles_target_score_check
    CHECK (target_score BETWEEN 0 AND 2.0);

ALTER TABLE study_plans
  ALTER COLUMN target_score TYPE DECIMAL(3,2)
    USING ROUND((target_score::DECIMAL / 80)::NUMERIC, 2),
  ALTER COLUMN baseline_score TYPE DECIMAL(3,2)
    USING ROUND((baseline_score::DECIMAL / 80)::NUMERIC, 2);
