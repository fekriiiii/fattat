-- Session balance: lets strong-LÄS users run ORD-heavy schedules (and vice
-- versa) so they don't burn out on the part they're already good at.
--
-- 'balanced'  — ORD + LÄS every session (today's behaviour)
-- 'ord_heavy' — LÄS only mån/ons/fre; ORD every day. For users with LÄS% ≥ ORD% + 20pp on diagnostic
-- 'las_heavy' — ORD only tis/tors/lör; LÄS every day. For users with ORD% ≥ LÄS% + 20pp on diagnostic
--
-- Picked automatically on diagnostic completion; user can switch in profile.

alter table study_plans
  add column if not exists session_balance text not null default 'balanced'
  check (session_balance in ('balanced', 'ord_heavy', 'las_heavy'));
