-- Migration 010 — Resumable övningsprov
--
-- Adds a generic JSONB payload column to study_sessions so an in-progress
-- session can remember its question pool. For exam_mode this stores
-- {ord_word_ids: string[], article_ids: string[]} so a browser refresh
-- doesn't reshuffle the test or reset the 30-minute timer.
--
-- Diagnostic and daily sessions don't currently use this, but the column
-- is generic enough to extend later (e.g. resumable diagnostic).

ALTER TABLE study_sessions
  ADD COLUMN IF NOT EXISTS payload JSONB;
