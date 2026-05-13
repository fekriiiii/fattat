-- Stores additional correct synonyms for a word beyond the one tested in HP.
-- Used by the typing variant so alternative valid answers are not marked wrong.
-- Format: comma-separated Swedish words, e.g. 'spådom,prediktion'
ALTER TABLE words
  ADD COLUMN IF NOT EXISTS accepted_synonyms TEXT;
