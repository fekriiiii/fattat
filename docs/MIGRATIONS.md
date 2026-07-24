# Database Migrations

> Split out of `CLAUDE.md` on 2026-07-24. **Read this when** touching the database schema,
> or when walking the pre-push checklist (every migration the code depends on must be
> applied to the production Supabase before deploying).
>
> Table-by-table explanations live in `IMPLEMENTATION_PLAN.md` → "Database Structure".

Run in order. All files in `supabase/migrations/`:

1. `001_initial.sql` — all tables, RLS, triggers
2. `002_hp_score.sql` — score scale 0–160 → 0.0–2.0
3. `003_plan_quota.sql` — `daily_ord_quota` on study_plans
4. `004_previous_hp.sql` — `previous_hp_score` on user_profiles
5. `005_accepted_synonyms.sql` — `accepted_synonyms` on words
6. `006_featured_ord_words.sql` — `featured_ord_words TEXT[]` on articles
7. `007_mek_elf_scores.sql` — `previous_mek_score` + `previous_elf_score` on user_profiles
8. `008_exam_schedule.sql` — `exam_schedule JSONB` on study_plans
9. `009_designed_content.sql` — `is_designed_content` flag on articles + source_name backfill
10. `010_session_payload.sql` — `payload JSONB` on study_sessions (resumable övningsprov)
11. `011_reschedule_count.sql` — `exam_reschedules_used` on study_plans
12. `012_score_predictions.sql` — `score_predictions` table (every HP prediction logged for later calibration)
13. `013_las_question_type.sql` — `las_question_type` on session_responses for LÄS sub-type profiling
14. `014_exam_mode_unique.sql` — partial unique index preventing concurrent in-progress övningsprov
15. `015_reported_hp_score.sql` — `reported_hp_score` + test date on user_profiles + `prediction_calibration` view (joins predictions with real HP outcomes)
16. `016_new_word_ids_fn.sql` — `select_new_word_ids` RPC (avoids URL-length limits when excluding seen words)
17. `017_waitlist_signups.sql` — Phase 1 email waitlist table with source tracking (TikTok / IG / YouTube / vän-skola / annat)
18. `018_flagged_synonyms.sql` — `flagged_synonyms` table; stores user-flagged synonym candidates (word_id, user_id, typed_answer) for founder review via Supabase dashboard
19. `019_session_balance.sql` — `session_balance TEXT` on study_plans (`'balanced' | 'ord_heavy' | 'las_heavy'`); auto-picked from diagnostic, user-overridable in profile
20. `020_extra_session_type.sql` — extends `session_type` check to include `'extra'` (the post-daily release-valve mode)
21. `021_mcq_graduation.sql` — `mcq_correct_streak INT` on `fsrs_cards`; gates MCQ → typing graduation behind 2 consecutive correct MCQ answers (instead of any first answer). Existing rows backfilled to 2 so live users don't get pulled backward into MCQ.
22. `022_curated_only_new_words.sql` — corpus split: `select_new_word_ids` RPC now filters `WHERE past_exams = 'curated'`. Past-HP words (`past_exams = '2024-V'` etc.) are no longer introduced as new daily FSRS cards; they remain in the database for övningsprov fresh-fills and as content seed.
23. `023_confidence_and_rating.sql` — `confidence TEXT` (`'sure'|'unsure'|'guess'`) + `fsrs_rating SMALLINT` (1–4) on `session_responses`. Confidence = LÄS calibration signal; fsrs_rating = faithful review log for future per-user FSRS parameter optimization.
24. `024_genre_debatt.sql` — rebuilds the `articles_genre_check` constraint to allow `'debatt'` (the schema from 001 only had the legacy name `'debatt_tvåroster'`, so debatt articles failed to seed). Keeps the legacy name; aligns the allowed list with the LÄS skills' genre vocabulary.

Table explanations: `docs/IMPLEMENTATION_PLAN.md` → "Database Structure"
