-- Step 17 — Constructed-content disclosure
--
-- LÄS texts in Fattat are designed pedagogical material. Some include
-- constructed names of researchers, studies, or institutions for narrative
-- realism (HP texts in real exams sometimes do this too). Students need
-- to know not to cite them as factual sources — but the disclosure must
-- not undermine perceived quality.
--
-- This migration adds an internal-only boolean flag for analytics. Defaults
-- to TRUE because virtually all articles in the bank are designed material.
-- Real-source articles (rare; from actual news/research) should set this
-- to FALSE during seeding.
--
-- The flag is NEVER shown to users. User-facing disclosure happens at:
--   1. Onboarding (one-time plain-Swedish note that some references are
--      constructed for pedagogical purposes — never the word "AI").
--   2. Article branding: source_name = "Fattat" for designed material,
--      keep real source_name + source_url for real-source articles.
ALTER TABLE articles
  ADD COLUMN IF NOT EXISTS is_designed_content BOOLEAN NOT NULL DEFAULT TRUE;

-- Backfill: any existing article without a source_name is designed material
-- written for Fattat. Brand it as a Fattat original so the UI doesn't
-- display "(no source)" or misleadingly attribute the text.
UPDATE articles
  SET source_name = 'Fattat'
  WHERE source_name IS NULL OR trim(source_name) = '';
