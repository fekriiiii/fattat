-- Add daily ORD quota to study plans (computed from gap analysis after diagnostic)
ALTER TABLE study_plans
  ADD COLUMN IF NOT EXISTS daily_ord_quota INTEGER NOT NULL DEFAULT 15;
