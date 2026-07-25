-- 025 — Target program (program-first onboarding)
--
-- Onboarding's 'target' step used to be a raw HP-score slider (0.5–2.0).
-- It now leads with "Vad drömmer du om?" — pick a university program from a
-- static list, see its typical HP admission score, and get a target with a
-- small safety margin above it. target_score (migration 002) still holds the
-- resulting number and drives all downstream planning/prediction code
-- unchanged; this column only remembers which program produced it, so the
-- dashboard and summary can frame progress as "gap to program" instead of a
-- bare number. NULL when the user picked "sätt eget mål" instead.

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS target_program TEXT;

COMMENT ON COLUMN user_profiles.target_program IS
  'Display name of the university program the user picked in onboarding as their goal (e.g. "Läkarprogrammet"). NULL if they set a custom score instead. Purely presentational — target_score is still the number the planner uses.';
