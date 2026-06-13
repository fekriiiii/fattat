-- MCQ → typing graduation gate.
--
-- Before this migration: any first answer on a word (right OR wrong) graduated
-- it to typing mode, because graduation was inferred from "fsrs_cards row
-- exists". That let lucky guesses promote unknown words straight into the
-- harder retrieval format, and the user would then crash on typing.
--
-- After this migration: a word stays in MCQ mode until it has been answered
-- correctly twice in a row in MCQ. The streak counter increments on a correct
-- MCQ answer and resets to 0 on a wrong one. Once it reaches 2, the word
-- graduates to typing and the counter is frozen (further typing answers
-- never touch it).
--
-- Existing rows are backfilled to 2 so users mid-flight don't get words
-- pulled backward into MCQ. The 2-in-a-row gate only applies to new words
-- introduced after this migration ships.

ALTER TABLE fsrs_cards
  ADD COLUMN mcq_correct_streak INT NOT NULL DEFAULT 0;

UPDATE fsrs_cards SET mcq_correct_streak = 2;
