-- Migration 011 — Reschedule allowance for övningsprov
--
-- Lets the user push a single scheduled övningsprov to a later date when
-- they're not available, with a hard cap so this doesn't slide into open-
-- ended procrastination. The cap is enforced server-side.
--
-- Counter resets only when a new study plan is generated (which already
-- happens on rediagnostic). No separate "renewal" mechanism.

ALTER TABLE study_plans
  ADD COLUMN IF NOT EXISTS exam_reschedules_used INTEGER NOT NULL DEFAULT 0;
