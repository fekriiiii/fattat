-- Store the user's previous HP score (if they have one) so we can give
-- a more accurate total-HP prediction that accounts for their quant performance.
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS previous_hp_score DECIMAL(3,2)
  CHECK (previous_hp_score BETWEEN 0 AND 2.0);
