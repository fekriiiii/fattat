# CLAUDE.md

> Read this at the start of every session. This is the complete picture of the project and how to work with the founder.

---

## How to Work With the Founder

The founder is **non-technical**. They understand the product deeply but don't write code.

- **Explain every decision in plain language.** No jargon without a definition.
- **Before doing anything significant**, say what you're about to do and why.
- **Summarise changes in plain English** — don't assume they'll read the code.
- **Act as a personal assistant, not just a builder.** Surface observations proactively mid-session: if you notice a better approach, say so before continuing. If something conflicts with the non-negotiable rules, flag it immediately. If a pattern should become a system, suggest it. Only flag things at decision level — not implementation details.

---

## What Fattat Is

Fattat (Swedish slang for "got it") is a **mobile-first web app** for Swedish students preparing for Högskoleprovet (HP) — specifically the verbal section:

- **ORD** (ordförståelse) — vocabulary multiple choice
- **LÄS** (läsförståelse) — reading comprehension

Product differentiation: **cognitive-science-grounded learning design** — FSRS spaced repetition, retrieval practice only, immediate feedback, enforced ORD→LÄS interleaving, implementation intentions for habit formation.

Full details: `PRODUCT_BRIEF.md`

---

## Tech Stack

| Layer | Tool |
|---|---|
| Framework | Next.js 14 App Router + TypeScript |
| Database + Auth | Supabase (PostgreSQL + email/password auth) |
| Hosting | Vercel |
| Spaced repetition | ts-fsrs |
| Email | Resend |
| Push notifications | Web Push API + service worker |
| Styling | Tailwind CSS |
| Client state | Zustand |

---

## Brand

- **Primary teal:** `#0F766E`
- **Charcoal:** `#1F2937`
- **Cream:** `#FBFAF7`
- **Gold:** `#D4A017`
- **Font:** Aeonik (Regular + Bold) at `public/fonts/`
- **Language:** Swedish throughout the UI. No English copy in the app.

---

## Environment Variables

`.env.local` in the project root:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=                     ← mailto:you@example.com
NEXT_PUBLIC_VAPID_PUBLIC_KEY=      ← same as VAPID_PUBLIC_KEY
NEXT_PUBLIC_APP_URL=
CRON_SECRET=                       ← also set in Vercel env vars
```

---

## Database Migrations (run in order)

All files in `supabase/migrations/`:

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

Table explanations: `IMPLEMENTATION_PLAN.md` → "Database Structure"

---

## Non-Negotiable Rules

1. **No passive study mode.** Question always before answer.
2. **No hint buttons.** Anywhere. Ever.
3. **No skip on ORD questions.** Must choose an answer.
4. **FSRS decides word order** — not queue, not random.
5. **Immediate feedback** after every question.
6. **Every session: ORD first, then LÄS.** No module-select screen.
7. **No "Du tappade din streak"** messaging. Use "Du har studerat X av de senaste Y dagarna."
8. **Swedish throughout** the UI.

---

## Content Workflow

Two slash commands in `.claude/commands/`:

**ORD — `/extract-hp-words`**
User provides a past HP exam PDF + facit PDF. Claude extracts words, identifies correct synonyms and distractors, writes Swedish definitions and example sentences, classifies domain/difficulty. Output: CSV rows for `ord-database.csv`.

**LÄS — `/format-las-article`**
User provides article + questions (generated externally in HP style). Claude auto-detects existing ORD-database words in the body, proposes 3–6 synonym swaps to bake in more ORD words (user approves each), then generates `passage_anchor`, `explanation`, `distractor_types`, `vocab_highlights`, `featured_ord_words`. Output: complete CSV row for `las-database.csv`.

**ORD→LÄS connection:** `featured_ord_words` on articles lets the session builder prefer articles that reinforce recently practiced ORD words. Silent — users just notice relevance.

### CSV schemas

**ORD:** `id, word, pos, correct_synonym, distractor_1–4, definition_sv, example_sentence, domain, difficulty, past_exams, accepted_synonyms, notes`
- `accepted_synonyms` — comma-separated alternatives for the typing variant (e.g. `spådom,prediktion`)

**LÄS:** `id, title, source_url, source_name, domain, genre, word_count, difficulty, question_count, unit_position, past_hp, body, questions, vocab_highlights, featured_ord_words, notes`
- `questions` — JSON: `[{n, type, stem, options:{A,B,C,D}, correct, passage_anchor, explanation, distractor_types, notes}]`
- `vocab_highlights` — JSON: `[{word, definition}]`
- `featured_ord_words` — Postgres array literal: `{"prognos","diffus"}`

---

## Intelligent Session Behaviours

Three silent features — no UI toggles, user only sees the friendly result:

**Smart Catch-up** (`src/lib/session/builder.ts` → `detectCatchUp()`)
Triggers when away >2 days AND >30 overdue words. Replaces normal FSRS order with the 20 most fragile words (most lapses, lowest stability). Blue banner explains.

**Fatigue Detection** (`src/stores/sessionStore.ts`)
Triggers when 3+ wrong out of last 5 ORD answers, OR avg response time >8s over last 3. Full-screen overlay offers to end session or continue.

**Domain Gap Detection** (`src/stores/sessionStore.ts`)
Triggers when 3 consecutive wrong ORD answers come from the same domain. Amber banner names the domain. LÄS article selection already prefers matching domain.

---

## Recent Fixes

**Diagnostic calibration (2026-05-11)** — four bugs fixed:
1. Sample increased from 10 → 20 ORD words (8 easy + 8 medium + 4 hard, matching HP's difficulty curve)
2. Added randomization — previously every user got the same fixed words and articles
3. Baseline HP now uses `previous_hp_score / previous_mek_score / previous_elf_score` from onboarding instead of hardcoded quant assumption
4. Results page band (`hpLow`/`hpHigh`) now comes from the API using personalized data

Files: `src/lib/session/builder.ts`, `src/app/api/diagnostic/complete/route.ts`, `src/app/(app)/diagnostic/results/page.tsx`

---

## What's Still to Build

| What | Where | Priority |
|---|---|---|
| Push notification 24h before each övningsprov | `src/app/api/notifications/schedule/route.ts` | Medium |
| Performance-adaptive exam scheduling (v2) | `src/lib/session/planner.ts` | Low |
| Haptic feedback on correct answers | `src/lib/utils/haptics.ts` + session page | Medium |
| Study partner pages | `src/app/(app)/partner/` | Low |

---

## Key Architecture Decisions

**Email + password (not magic link):** Simpler mobile UX — no waiting for email.

**FSRS not SM-2:** More research-backed; ts-fsrs is TypeScript-native.

**ORD before LÄS:** Vocabulary is the foundation; LÄS needs warm-up attention.

**No module-select screen:** Would undermine interleaving. Session controller decides automatically.

**JSONB for questions:** Avoids join on every article load; keeps reading screen fast.

**Supabase over Firebase:** PostgreSQL handles the complex queries needed for score prediction and domain maps.

**Vercel:** Zero-ops, built-in cron, free tier covers launch.
