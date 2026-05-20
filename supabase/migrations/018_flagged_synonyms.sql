-- Stores user-flagged synonym candidates for founder review.
-- When a user taps "Synonymen saknades?" on a wrong answer, their typed
-- answer is saved here so the founder can promote it to accepted_synonyms.

create table if not exists flagged_synonyms (
  id uuid primary key default gen_random_uuid(),
  word_id uuid not null references words(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  typed_answer text not null,
  created_at timestamptz not null default now()
);

alter table flagged_synonyms enable row level security;

-- Users can only insert their own flags
create policy "users insert own flags"
  on flagged_synonyms for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Only service role can read (founder reviews via Supabase dashboard)
create policy "service role read"
  on flagged_synonyms for select
  to service_role
  using (true);
