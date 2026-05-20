# CLAUDE.md

> Read this at the start of every session. This is the complete picture of the project and how to work with the founder.

---

## How to Work With the Founder

The founder is **non-technical**. They understand the product deeply but don't write code.

- **Explain every decision in plain language.** No jargon without a definition.
- **Before doing anything significant**, say what you're about to do and why.
- **Summarise changes in plain English** — don't assume they'll read the code.
- **Be the project manager, not just the builder.** When the founder pitches a feature, don't default to building it — think product-first. Does it serve the North Star (below)? Is there a sharper version that costs the same to ship? Is it competing with an existing surface? Push back when you have reasoning. Propose better alternatives when you see them. When the founder hands you the call ("you decide", "you're the PM", "if you find it helpful"), make it confidently with explicit tradeoffs — don't punt back.
- **Surface observations proactively.** If you notice a better approach mid-session, say so before continuing. If something conflicts with the non-negotiable rules, flag it immediately. If a pattern should become a system, suggest it. Only flag things at decision level — not implementation details.
- **After shipping a feature or important update, name how it moves us toward the North Star.** One or two sentences at the end of the summary. Tie it concretely to *best HP prep app* and/or *10k SEK/month*. If you can't make the connection, that's a signal the work may have been scope creep — say so.

---

## What Fattat Is

Fattat (Swedish slang for "got it") is a **mobile-first web app** for Swedish students preparing for Högskoleprovet (HP) — specifically the verbal section:

- **ORD** (ordförståelse) — vocabulary multiple choice
- **LÄS** (läsförståelse) — reading comprehension

Product differentiation: **cognitive-science-grounded learning design** — FSRS spaced repetition, retrieval practice only, immediate feedback, enforced ORD→LÄS interleaving, implementation intentions for habit formation.

Full details: `PRODUCT_BRIEF.md`

---

## North Star

Two stacked goals:

1. **Be the best app in Swedish HP prep.** Best = candidates choose Fattat over alternatives. Wins on outcome (real score improvement), feel (mobile-first, low friction), and pedagogy (cognitive science, no passive study).
2. **10,000 SEK/month in revenue** — the practical signal that #1 is working.

Every feature, copy change, or product decision should serve at least one. If a change can't be tied to either, that's a scope-creep signal — flag it before building.

---

## Strategy Docs (where decisions live)

These files carry the live strategy — read them when planning anything that touches launch, pricing, content, or the legal setup.

- **`MARKETING_PLAN.md`** — positioning, launch phases (1/2/3), pre-launch checklist, Day 141+ content arc, platforms, content rules, algorithm notes.
- **`LEGAL_SETUP.md`** — minor-as-sole-prop workstream (the founder is 16). Status, timeline, what's blocked, parents' off-ramp.

**Locked decisions worth surfacing here:**
- **Pricing:** 399 SEK per provomgång (one-time, ~3 months access), 7-dagars gratis prov. Not monthly subscription.
- **Audience:** Swedish HP candidates strong on kvantitativa where verbala drags HP down — verbal-delta is the marketing metric, never absolute HP score before the real result.
- **Launch shape:** Phase 1 (email waitlist, Day 140 → ~Day 90, no signups) → Phase 2 (signups + paid, ~Day 90 → exam) → Phase 3 (score reveal + April '27 harvest, where 10k SEK/month plays out).
- **Legal entity:** Enskild firma in the founder's name (NOT AB, NOT parent-owned) with parent förmyndare consent + överförmyndare samtycke. Target ready by August 2026.

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
13. `013_las_question_type.sql` — `las_question_type` on session_responses for LÄS sub-type profiling
14. `014_exam_mode_unique.sql` — partial unique index preventing concurrent in-progress övningsprov
15. `015_reported_hp_score.sql` — `reported_hp_score` + test date on user_profiles + `prediction_calibration` view (joins predictions with real HP outcomes)
16. `016_new_word_ids_fn.sql` — `select_new_word_ids` RPC (avoids URL-length limits when excluding seen words)
17. `017_waitlist_signups.sql` — Phase 1 email waitlist table with source tracking (TikTok / IG / YouTube / vän-skola / annat)
18. `018_flagged_synonyms.sql` — `flagged_synonyms` table; stores user-flagged synonym candidates (word_id, user_id, typed_answer) for founder review via Supabase dashboard

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
Triggers after an 8-answer ORD warmup, when either 5+ wrong in the last 7 ORD answers OR avg response time >12s over the last 3. Full-screen overlay offers to end session or continue.

**Domain Gap Detection** (`src/stores/sessionStore.ts`)
Triggers when 3 consecutive wrong ORD answers come from the same domain. Amber banner names the domain. LÄS article selection already prefers matching domain.

---

## Recent Fixes

**Pre-dogfooding UX fixes (2026-05-20)**

5. **Övningsprov resume — question flash + LÄS article reader reset fixed** — on remount, `initSession` reset `currentOrdIndex: 0` then `restoreResponses` advanced it in a second React update, causing a visible flash of question 1. Also, `readArticleIds` (local state) reset on remount so resumed LÄS sessions showed the article reader again instead of the user's question. Fix: `initSession` now accepts optional `priorResponses` and restores position in a single `set()` call; test page pre-populates `readArticleIds` from the DB-returned prior responses. `src/stores/sessionStore.ts`, `src/app/(app)/test/page.tsx`

1. **Dashboard "previous HP" nudge removed** — the text "Lägg till ditt tidigare HP-resultat i profilen…" was permanently visible for users with no previous HP score. Removed. Dashboard falls back to verbal träffprocent silently. `src/app/(app)/dashboard/page.tsx`
2. **Session complete 0/0 bug fixed** — results showed 0/0 after switching tabs because they relied solely on Zustand in-memory state. Fix: session ID is now passed as `?sid=` in the URL on navigation; complete page fetches stats from `session_responses` as fallback if store is empty. `src/app/(app)/session/page.tsx`, `src/app/(app)/session/complete/page.tsx`
3. **Typo tolerance in ORD typing** — one-character typo forgiven for any accepted answer 6+ characters long; 5 characters and under stays strict. Uses Levenshtein distance 1. `src/lib/utils/levenshtein.ts`, `src/components/ord/OrdTyping.tsx`
4. **"Synonymen saknades?" flag button** — shows below wrong-answer feedback in typing mode. Tap saves `(word_id, typed_answer)` to `flagged_synonyms` table for founder review; confirmed with "Tack — vi kollar på det." Kept post-launch as a content improvement signal. `src/components/ord/OrdFeedbackTyping.tsx`, `src/app/api/words/flag-synonym/route.ts`, `supabase/migrations/018_flagged_synonyms.sql`

**Dogfooding strategy decisions (2026-05-20):**
- Day 140 = **2026-05-31** (159 − 140 = 19 days after 2026-05-12)
- Founder creates account **live on camera** for Day 0 video — no pre-seeded history
- Founder has no previous HP scores — enter nothing, stay transparent; diagnostic becomes the Day 0 baseline

**Phase 1 deployment (2026-05-18)** — code went from localhost to https://fattat.se in one session. GitHub repo `fekriiiii/fattat` (private), Vercel auto-deploys on push to `main`, domain via Strato pointing at Vercel with Let's Encrypt SSL. Two build fixes shipped: `next.config.mjs` bypasses ESLint (accumulated repo-wide warning debt, tracked), `tsconfig.json` excludes `scripts/` (seed.ts uses dotenv which isn't a runtime dep). Notifications cron removed from `vercel.json` — Hobby plan limits crons to daily; re-add on Pro upgrade in Phase 2. Email forwarding via **ImprovMX** (free tier, 2 MX + 1 SPF TXT records at Strato): `hej@fattat.se`, `info@fattat.se`, `contact@fattat.se` all forward to founder's Gmail. Chose ImprovMX over Cloudflare Email Routing to avoid moving DNS off Strato (CF Routing requires CF nameservers).

**Phase 1 landing page + bug-fix pass (2026-05-17)** — landing page shipped, plus an 8-item bug sweep across the app.

*Landing page (waitlist mode for Phase 1):*
1. **Public landing at `/`** — replaced the old `/login` redirect. Hero with form above the fold, second waitlist surface at page bottom, problem/features/dogfooding sections in between. Brand-anchored design (teal F-mark, animated live chip, dark dogfooding block).
2. **Waitlist signup endpoint** — `/api/waitlist` with email validation, 1-req/min/IP rate limit, dup-email-as-success behavior.
3. **Source attribution** — required dropdown captures which platform (TikTok/IG/YouTube/vän-skola/annat) brought each lead. Pre-launch checklist item #4 done.
4. **Middleware update** — `/`, `/privacy`, `/terms` now public; logged-in users still get `/` → `/dashboard` redirect so the app surface is unaffected.
5. **Boilerplate `/privacy` and `/terms`** — GDPR basics with founder as data controller until enskild firma is registered. Real legal review needed before Phase 2 monetization (see `LEGAL_SETUP.md`).

*Bug sweep:*
1. **P0 — fsrs/review IDOR** — route trusted client-supplied `sessionId`. Now verifies session belongs to authed user before writing.
2. **P1 — Diagnostic re-runs dropped session_responses** for already-seeded words, silently breaking `prediction_calibration`. Now logs all answers; only the FSRS-card insert respects the seeded filter.
3. **P1 — Övningsprov resume non-determinism** — `buildPool` queries now use `.order()` so a payload-less resume reconstructs the same pool.
4. **P1 — Daily session orphan rows** — session/build now closes the orphan (created without payload after a build crash) before inserting a fresh session.
5. **P1 — Planner formula bug** — `targetOrdAcc` used raw/80 instead of raw/120; was inflating quota for high-target / short-timeline users.
6. **P1 — FSRS new-word reservation** — small quotas hit `reviewLimit ≤ 0`; reservation now scales with quota via `Math.floor(limit/4)`.
7. **P2 — Streak freeze never replenished** — once burnt, every future missed day broke the streak. Added ISO-week rollover that resets `freeze_available` and `freeze_used_this_week`.

Files: `src/app/page.tsx`, `src/components/landing/WaitlistForm.tsx`, `src/app/api/waitlist/route.ts`, `src/app/privacy/page.tsx`, `src/app/terms/page.tsx`, `src/middleware.ts`, `supabase/migrations/017_waitlist_signups.sql`, `src/app/api/fsrs/review/route.ts`, `src/app/api/diagnostic/complete/route.ts`, `src/app/api/test/build/route.ts`, `src/app/api/session/build/route.ts`, `src/lib/session/planner.ts`, `src/lib/fsrs/engine.ts`, `src/lib/streak/manager.ts`, `src/app/(app)/session/page.tsx`, `src/app/(app)/diagnostic/page.tsx`, `src/app/(app)/test/page.tsx`, `src/lib/utils/haptics.ts`, `src/app/(app)/profile/ProfileForm.tsx`, `src/app/(app)/session/complete/page.tsx`, `src/hooks/usePushNotifications.ts`.

*Also in this session:* haptic feedback on every ORD/LÄS answer (via `src/lib/utils/haptics.ts`); profile notification status no longer lies when browser permission is granted but no push subscription exists.

**Score prediction honesty pass (2026-05-15)** — the predicted HP number was unvalidated and quietly leaned on three guesses. Five changes:
1. **UI demotion** — dashboard and diagnostic now lead with verbal träffprocent (what we measure). The HP number is shown smaller, with a `beta` tag and "kalibreras mot verkliga HP-resultat" caveat. `ScoreGauge` is no longer used.
2. **ELF hardcode replaced** — `estimateVerbalHp` now falls back to `previous_hp_score` for missing ELF (not the constant 1.0). ELF uncertainty halved (0.08 → 0.04) when HP is available.
3. **Difficulty-weighted retention** — `computeAvgRetention` now weights cards by FSRS difficulty (`0.5 + difficulty / 10`). Dashboard, plan, and study-plan/refresh now SELECT `difficulty`.
4. **Shared band helper** — extracted `buildScoreBand` + `estimateDiagnosticBand` in `scoring.ts`. The diagnostic route no longer duplicates the prediction formula inline; it shares math with `predictScore`.
5. **Calibration loop** — migration 015 adds `reported_hp_score` to `user_profiles` (collected via profile form) and a `prediction_calibration` view joining predictions with real outcomes. Until ~5–10 real scores accumulate, the band labels stay `beta` and constants stay frozen.

Files: `src/lib/session/scoring.ts`, `src/app/(app)/dashboard/page.tsx`, `src/app/(app)/diagnostic/results/page.tsx`, `src/app/api/diagnostic/complete/route.ts`, `src/app/(app)/profile/ProfileForm.tsx`, `src/app/(app)/onboarding/page.tsx`, `supabase/migrations/015_reported_hp_score.sql`.

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
| Calibrate HP prediction against `prediction_calibration` view once ~5–10 users report real scores | `src/lib/session/scoring.ts` | High (waiting on data) |
| Push notification 24h before each övningsprov | `src/app/api/notifications/schedule/route.ts` | Medium |
| Performance-adaptive exam scheduling (v2) | `src/lib/session/planner.ts` | Low |
| Founder creates account live on Day 0 video (diagnostic on camera, no pre-seeded history, no previous HP scores) | manual | High (pre-launch, Day 0 = 2026-05-31) |
| Review `flagged_synonyms` table periodically and promote valid entries to `accepted_synonyms` in CSV + DB | Supabase dashboard + ord-database.csv | Ongoing |
| ESLint cleanup pass — currently bypassed in build via `next.config.mjs`; clear unused vars, `any` types, and missing useEffect deps | repo-wide | Medium (post-launch) |
| Diagnostic resume — leaving mid-diagnostic restarts it from scratch. Same fix pattern as övningsprov: persist pool in session payload, restore on remount. Not a Day 0 blocker (founder is the only user and diagnostic happens once on camera). | `src/app/api/diagnostic/build/route.ts`, `src/app/(app)/diagnostic/page.tsx` | Medium (before Phase 2) |
| Session payload bloat — daily session stores full article bodies in JSONB; should mirror övningsprov and store IDs only | `src/app/api/session/build/route.ts` | Low |
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
