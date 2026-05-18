-- Migration 014 — One in-progress exam_mode session per user
--
-- Closes a race in /api/test/build: two concurrent requests could each find no
-- in-progress session and each INSERT a fresh study_sessions row, leaving the
-- user with two parallel test sessions and answers split across them.
--
-- A partial unique index makes "in-progress exam_mode session" exclusive at
-- the database level. The second concurrent INSERT raises 23505, which the
-- route catches and converts into a resume of the winning session.

-- Backfill: the race has already created duplicate in-progress exam_mode
-- sessions for some users. Close all but the most recently started one per
-- user so the unique index can be built. We mark them completed_at = NOW()
-- rather than deleting, to preserve the session_responses history that may
-- already reference them.
WITH ranked AS (
  SELECT id,
         ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY started_at DESC) AS rn
  FROM study_sessions
  WHERE session_type = 'exam_mode' AND completed_at IS NULL
)
UPDATE study_sessions
SET completed_at = NOW()
WHERE id IN (SELECT id FROM ranked WHERE rn > 1);

CREATE UNIQUE INDEX IF NOT EXISTS uniq_exam_mode_in_progress
  ON study_sessions (user_id)
  WHERE session_type = 'exam_mode' AND completed_at IS NULL;
