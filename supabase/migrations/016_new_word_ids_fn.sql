-- Returns word IDs the user has never seen before (no fsrs_card entry).
-- Using a server-side function avoids URL length limits that arise when
-- passing hundreds of UUID exclusions as a query parameter.
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
  WHERE w.id NOT IN (
    SELECT fc.word_id
    FROM fsrs_cards fc
    WHERE fc.user_id = p_user_id
  )
  ORDER BY random()
  LIMIT p_limit;
$$;
