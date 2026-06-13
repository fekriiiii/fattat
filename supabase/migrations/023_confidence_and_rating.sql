-- 023: Confidence calibration + FSRS rating log
--
-- confidence: user's one-tap confidence judgment on LÄS answers in daily
-- sessions ('sure' | 'unsure' | 'guess'). Metacomprehension research shows
-- the gap between felt confidence and actual comprehension is a core deficit
-- in weak readers; logging it enables calibration feedback ("säker men fel")
-- and a future per-question-type calibration surface on the dashboard.
--
-- fsrs_rating: the FSRS rating (1=Again, 2=Hard, 3=Good, 4=Easy) actually
-- applied at review time for ORD answers. Previously only is_correct +
-- response_ms were stored and the rating was re-derivable — but the latency→
-- rating mapping is now format-aware (and may change again), so the applied
-- rating must be logged at write time. This is the review log a per-user FSRS
-- parameter optimizer needs once a user accumulates ~1000 reviews.

ALTER TABLE session_responses
  ADD COLUMN IF NOT EXISTS confidence TEXT
    CHECK (confidence IN ('sure', 'unsure', 'guess'));

ALTER TABLE session_responses
  ADD COLUMN IF NOT EXISTS fsrs_rating SMALLINT
    CHECK (fsrs_rating BETWEEN 1 AND 4);
