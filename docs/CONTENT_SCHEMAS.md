# Content Schemas — ORD and LÄS

> Split out of `CLAUDE.md` on 2026-07-24. **Read this when** writing or fixing content by
> hand, or changing `scripts/seed.ts` / `scripts/add-las-article.cjs`.
>
> The content-authoring skills (`/extract-hp-words`, `/write-las-article`,
> `/format-las-article`, `/batch-las-articles`) carry their own copies of these schemas
> and are the normal way content gets written. Never hand-write a `las/*.json` file.

**ORD** (CSV: `ord-database.csv`): `id, word, pos, correct_synonym, distractor_1–4, definition_sv, example_sentence, domain, difficulty, past_exams, accepted_synonyms, notes`
- `accepted_synonyms` — **dead column.** Existed only to grade typed answers; typing was removed 2026-07-24. Nothing reads it and the content skills no longer generate it. Left in place because dropping it is not worth the migration.

**LÄS** (one JSON file per article in `las/`): `id, title, source_url, source_name, domain, genre, word_count, difficulty, question_count, unit_position, past_hp, body, questions, vocab_highlights, featured_ord_words, is_designed_content, notes`
- `questions` — array: `[{n, type, stem, options:{A,B,C,D}, correct, passage_anchor, explanation, distractor_types, notes}]`
- `vocab_highlights` — array: `[{word, definition}]`
- `featured_ord_words` — array of strings: `["prognos","diffus"]`


## Valid enum values (enforced by database CHECK constraints)

Getting these wrong makes the row fail to seed. See `supabase/migrations/001_initial.sql`
and `024_genre_debatt.sql`.

- **`domain`** (words + articles): `juridik`, `medicin`, `kultur`, `vetenskap`, `samhälle`, `ekonomi`, `allmän`
- **`genre`** (articles): `populärvetenskap`, `akademisk`, `reportage`, `juridisk`, `personlig_essä`, `debatt`, `debatt_tvåroster`, `lyrik_prosa`, `litterär_prosa`
