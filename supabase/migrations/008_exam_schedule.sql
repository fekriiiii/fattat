-- Algorithm-driven exam scheduling.
-- Replaces the implicit fixed-weekly veckoprov cadence with a phase-based
-- schedule computed when the study plan is generated. The schedule is
-- stored as an ordered JSONB array of ISO date strings — each entry is
-- one upcoming or past övningsprov (rebrand of veckoprov).
--
-- Pacing rule (v1, phase-based only):
--   • Foundation phase  (first 40% of prep time): every 10–14 days
--   • Build phase       (40–80% of prep time):    every  5–7  days
--   • Test density      (80–95% of prep time):    every  2–3  days
--   • Taper             (last 5% of prep time):   none
--
-- v2 (deferred): performance-adaptive — accelerate/decelerate cadence
-- based on predicted HP score drift and recent session-average changes.
-- Implemented in src/lib/session/planner.ts → computeExamSchedule().
ALTER TABLE study_plans
  ADD COLUMN IF NOT EXISTS exam_schedule JSONB NOT NULL DEFAULT '[]'::jsonb;
