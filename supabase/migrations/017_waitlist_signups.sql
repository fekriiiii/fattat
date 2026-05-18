-- Phase 1 waitlist. Captures email + acquisition source so we know which
-- platform (TikTok/IG/YouTube/word of mouth) is converting during the 140-day
-- dogfooding run, per MARKETING_PLAN.md pre-launch checklist item #4.

create table if not exists waitlist_signups (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  source text,
  user_agent text,
  ip_hash text,
  created_at timestamptz not null default now()
);

-- Case-insensitive uniqueness on email so resubmits don't create dupes.
create unique index if not exists waitlist_signups_email_lower_idx
  on waitlist_signups (lower(email));

create index if not exists waitlist_signups_source_idx on waitlist_signups (source);
create index if not exists waitlist_signups_created_at_idx on waitlist_signups (created_at desc);

-- Anyone (anon) can insert; only service_role can read. This keeps the email
-- list private — only admin tooling using the service key can export it.
alter table waitlist_signups enable row level security;

create policy "anon can insert waitlist signups"
  on waitlist_signups for insert
  to anon, authenticated
  with check (true);
