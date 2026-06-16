-- 024_genre_debatt.sql
-- The articles.genre CHECK constraint (from 001_initial.sql) allowed an old genre
-- name 'debatt_tvåroster' but not 'debatt' — which is the genre the LÄS content
-- skills (write/format/batch-las-article) actually produce for single-voice
-- debattartiklar. A debatt article therefore failed to seed with
-- "violates check constraint articles_genre_check".
--
-- This rebuilds the constraint to allow 'debatt'. The legacy name is kept so no
-- existing row can ever break, and the rest of the list matches the skills' genre
-- vocabulary exactly.

ALTER TABLE articles DROP CONSTRAINT IF EXISTS articles_genre_check;

ALTER TABLE articles ADD CONSTRAINT articles_genre_check
  CHECK (genre IN (
    'populärvetenskap',
    'akademisk',
    'reportage',
    'juridisk',
    'personlig_essä',
    'debatt',
    'debatt_tvåroster',
    'lyrik_prosa',
    'litterär_prosa'
  ));
