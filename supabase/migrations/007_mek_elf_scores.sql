-- Store the user's previous HP scores for the two verbal subsections
-- Fattat doesn't train: MEK (meningskomplettering) and ELF (engelsk
-- läsförståelse). Both are optional — many users won't have or remember
-- these numbers. When NULL the scoring algorithm falls back to:
--   • MEK: an ORD-driven proxy (MEK is heavily vocab-dependent)
--   • ELF: a neutral 1.0 HP baseline (no good proxy from what we train)
-- When present they replace the old fixed 50% assumption with personal data.
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS previous_mek_score DECIMAL(3,2)
  CHECK (previous_mek_score BETWEEN 0 AND 2.0);

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS previous_elf_score DECIMAL(3,2)
  CHECK (previous_elf_score BETWEEN 0 AND 2.0);
