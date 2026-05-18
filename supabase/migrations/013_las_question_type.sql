-- Track which LÄS question sub-type was answered (detalj, slutledning, etc.)
-- Enables per-question-type performance profiling and article selection bias.
ALTER TABLE session_responses
  ADD COLUMN IF NOT EXISTS las_question_type TEXT
    CHECK (las_question_type IN (
      'huvudtanke', 'detalj_fakta', 'detalj_kausal',
      'syfte_funktion', 'slutledning', 'jämförande', 'ståndpunkt'
    ));
