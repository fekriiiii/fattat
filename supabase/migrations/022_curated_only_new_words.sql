-- Corpus split: daily-session new-word introductions are now drawn ONLY from
-- curated content (past_exams = 'curated'). Past-HP words (past_exams set to
-- an exam code like '2024-V') stay in the database — they remain available for
-- övningsprov fresh-fills (authentic exam simulation) and as content seed for
-- /curate-ord-words — but they are no longer introduced as new daily-FSRS
-- words because they have 0% appearance probability on the actual exam.
--
-- Existing users keep their FSRS history on past-HP words: this function only
-- governs NEW introductions, never schedules already-known cards.

CREATE OR REPLACE FUNCTION select_new_word_ids(
  p_user_id uuid,
  p_limit    int
)
RETURNS TABLE(id uuid)
LANGUAGE sql
STABLE
AS $$
  SELECT w.id
  FROM words w
  WHERE 'curated' = ANY(w.past_exams)
    AND w.id NOT IN (
      SELECT fc.word_id
      FROM fsrs_cards fc
      WHERE fc.user_id = p_user_id
    )
  ORDER BY random()
  LIMIT p_limit;
$$;
