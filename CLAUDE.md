# CLAUDE.md

> Read this at the start of every session. This is the complete picture of the project and how to work with the founder.

---

## How to Work With the Founder

The founder is **non-technical**. They understand the product deeply but don't write code. They are actively developing their business thinking — reading books, listening to podcasts — and may ask strategic questions (pricing, co-founders, positioning, fundraising, mental models) that reflect evolving or shifting views. Treat these as real discussions, not distractions. Engage with the thinking, challenge it if warranted, and connect it back to Fattat's specific situation.

- **Explain every decision in plain language.** No jargon without a definition.
- **Before doing anything significant**, say what you're about to do and why.
- **Summarise changes in plain English** — don't assume they'll read the code.
- **Be the project manager, not just the builder.** When the founder pitches a feature, don't default to building it — think product-first. Does it serve the North Star (below)? Is there a sharper version that costs the same to ship? Is it competing with an existing surface? Push back when you have reasoning. Propose better alternatives when you see them. When the founder hands you the call ("you decide", "you're the PM", "if you find it helpful"), make it confidently with explicit tradeoffs — don't punt back.
- **Surface observations proactively.** If you notice a better approach mid-session, say so before continuing. If something conflicts with the non-negotiable rules, flag it immediately. If a pattern should become a system, suggest it. Only flag things at decision level — not implementation details.
- **After shipping a feature or important update, name how it moves us toward the North Star.** One or two sentences at the end of the summary. Tie it concretely to *best HP prep app* and/or *10k SEK/month*. If you can't make the connection, that's a signal the work may have been scope creep — say so.
- **Engage with strategic and business questions as a real co-founder would.** When the founder asks about pricing, co-founders, distribution, fundraising, mental models, or anything else they're developing a view on — engage seriously. Challenge the thinking if warranted. Give a verdict, not just options. Connect it back to Fattat's specific situation. Don't just redirect to the product.
- **Give verdicts, not menus.** When the founder asks "should I do X or Y?" don't list pros and cons and leave it open. Make a recommendation. Explain the reasoning. Let them push back. A co-founder who always says "it depends" is useless.
- **Challenge assumptions, not just execute.** If the founder says "let's build X," the first question is why — not how. Is this the right problem? Is this the right moment? Is there a cheaper test first? Only build after the thinking is sound.
- **Notice patterns across sessions.** Memory exists for this. If the founder keeps circling the same uncertainty, name it. If a decision made earlier now looks wrong given new information, flag it unprompted.

---

## What Fattat Is

Fattat (Swedish slang for "got it") is a **mobile-first web app** for Swedish students preparing for Högskoleprovet (HP) — specifically the verbal section:

- **ORD** (ordförståelse) — vocabulary multiple choice
- **LÄS** (läsförståelse) — reading comprehension

Product differentiation: **cognitive-science-grounded learning design** — FSRS spaced repetition, retrieval practice only, immediate feedback, enforced ORD→LÄS interleaving, implementation intentions for habit formation.

Full details: `docs/PRODUCT_BRIEF.md`

---

## North Star

Two stacked goals:

1. **Be the best app in Swedish HP prep.** Best = candidates choose Fattat over alternatives. Wins on outcome (real score improvement), feel (mobile-first, low friction), and pedagogy (cognitive science, no passive study).
2. **10,000 SEK/month in revenue** — the practical signal that #1 is working.

Every feature, copy change, or product decision should serve at least one. If a change can't be tied to either, that's a scope-creep signal — flag it before building.

---

## Strategy Docs (where decisions live)

These files carry the live strategy — read them when planning anything that touches launch, pricing, content, or the legal setup.

- **`docs/VISION.md`** — the fixed point everything else hangs off (Lean Startup vision → strategy → product stack). Read this first. The Vision section is the one thing we do NOT pivot; strategy and product are pivotable. Two locked founder-level forks: (1) Fattat is a **pedagogy** company, not an access company — the enemy is the broken way people study, not prep being expensive; (2) Fattat is **not, in its soul, an HP company** — the ambition is the world's best learning app, and HP is a beachhead (possibly a multi-year one) not the ceiling. Vision is written broad on purpose even though every near-term decision is 100% about winning HP. Use this doc to tell a healthy pivot (adjust strategy/price/audience) apart from drift (abandoning the pedagogy bet) — most useful if the våren-2027 monetization window underperforms.
- **`docs/MARKETING_PLAN.md`** — positioning, launch phases (1/2/3), pre-launch checklist, Day 141+ content arc, platforms, content rules, algorithm notes.
- **`docs/POST_HP_RESULT_PLAN.md`** — conditional if-then tree for after the founder's HP result lands (~late Nov 2026). Three branches (big delta / modest delta / flat-negative) + the n=1 proof problem + pre-result actions. NOT marketing v2 (that's still built after the result) — this only fixes what we do per outcome so a flat result can't trigger a panic pivot of the vision. Read before any post-October launch planning.
- **`docs/BUSINESS_PLAN.md`** — the founder's personal financial arc and what Fattat must do to serve it. Exit-agnostic on purpose (keep-vs-sell undecided; near-term work is identical either way). Two levels: the **floor** (get through university *without loans* — interest is haram, so CSN's lån is off the table; Fattat must replace ~9–10k SEK/month net) and the **dream** (stable, household-sized income to marry in early 20s). Names the central tension (spiky twice-yearly exam revenue is the wrong shape for both → de-spiking / year-round value is the one thread that serves both keep- and sell-paths), the runway (university starts **höst 2028**, so only **three** monetization windows before then: vår27/höst27/vår28), the sellability spine (predictable revenue, growth, moat, #1-in-niche), and the AB-conversion-before-sale flag. Read before any pricing, scaling, or exit-timing discussion, or when the founder raises money/marriage/co-founder/sell questions.
- **`docs/LEGAL_SETUP.md`** — minor-as-sole-prop workstream (the founder is 16). Status, timeline, what's blocked, parents' off-ramp.
- **`analysis/LEARNING_SCIENCE.md`** — the pedagogy research foundation. Read before any decision touching session design, feedback flows, FSRS settings, or new learning features. Maps every learning-engine feature to its evidence base (self-explanation g≈.55, metacomprehension calibration, FSRS Hard-misuse, per-user optimization) and records what was deliberately NOT built (prequestions, graded gist, text-visible-during-questions) with reasons.
- **`docs/MONETIZATION_RESEARCH.md`** — industry benchmarks from RevenueCat's State of Subscription Apps 2026, filtered to Education / Western Europe, with Fattat-specific implications. **Read before any pricing, trial-duration, paywall-design, or "should we build a native app?" decision.** Contains: a web-app translation of SOSA's native-funnel terminology (since Fattat has no "install" event), realistic conversion benchmarks to target, the Phase 2 pricing test plan (399 / 499 / 599 SEK), the data refuting "shorter trials convert better" (5–9 days is the sweet spot — keep our 7-day), the Education category's Day 4–7 conversion spike pattern that justifies the diagnostic-results-page paywall placement, and the native-app analysis (short answer: not before Phase 3, do a Google Play TWA first if needed). Also lists what does NOT apply (retention/renewal data, App Store refund mechanics, AI-app dynamics).

**Locked decisions worth surfacing here:**
- **Pricing:** 399 SEK per provomgång (one-time, ~3 months access), 7-dagars gratis prov. Not monthly subscription.
- **Audience:** Swedish HP candidates strong on kvantitativa where verbala drags HP down — verbal-delta is the marketing metric, never absolute HP score before the real result.
- **Launch shape (revised 2026-06-11):** public dogfooding series paused — founder had too much going on. Founder now trains privately in Fattat for the real HP **18 oktober 2026** (anmälan 11–18 augusti 2026 — hard deadline), aiming for a strong result. Marketing plan v2 gets built around the actual outcome after results land (~late Nov '26); first monetization window is the våren 2027 sitting (10 april). Waitlist stays up passively. Old Phase 1/2 are void — see the status header in `docs/MARKETING_PLAN.md`.
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
19. `019_session_balance.sql` — `session_balance TEXT` on study_plans (`'balanced' | 'ord_heavy' | 'las_heavy'`); auto-picked from diagnostic, user-overridable in profile
20. `020_extra_session_type.sql` — extends `session_type` check to include `'extra'` (the post-daily release-valve mode)
21. `021_mcq_graduation.sql` — `mcq_correct_streak INT` on `fsrs_cards`; gates MCQ → typing graduation behind 2 consecutive correct MCQ answers (instead of any first answer). Existing rows backfilled to 2 so live users don't get pulled backward into MCQ.
22. `022_curated_only_new_words.sql` — corpus split: `select_new_word_ids` RPC now filters `WHERE past_exams = 'curated'`. Past-HP words (`past_exams = '2024-V'` etc.) are no longer introduced as new daily FSRS cards; they remain in the database for övningsprov fresh-fills and as content seed.
23. `023_confidence_and_rating.sql` — `confidence TEXT` (`'sure'|'unsure'|'guess'`) + `fsrs_rating SMALLINT` (1–4) on `session_responses`. Confidence = LÄS calibration signal; fsrs_rating = faithful review log for future per-user FSRS parameter optimization.

Table explanations: `docs/IMPLEMENTATION_PLAN.md` → "Database Structure"

---

## Non-Negotiable Rules

1. **No passive study mode.** Question always before answer.
2. **No hint buttons.** Anywhere. Ever.
3. **No skip on ORD questions.** Must choose an answer.
4. **FSRS decides word order** — not queue, not random.
5. **Immediate feedback** after every question.
6. **Every session: ORD first, then LÄS** — on session days where both modules run. Strong-LÄS users can opt into `ord_heavy` (LÄS mån/ons/fre only) and strong-ORD users into `las_heavy` (ORD tis/tors/lör only); the plan is auto-picked from the diagnostic and toggleable in profile. When both run, ORD still precedes LÄS — no module-select screen.
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

**Design system pass: depth, signature surfaces, motion (2026-06-12)** — full visual upgrade, zero logic changes (classNames/CSS/presentational markup only; all timers, handlers, store logic untouched). The app read as "technically tidy, zero wow": one flat shadow level, identical white cards, 5px hairline bars, plain white nav. Five changes:
1. **Elevation scale** — three warm charcoal-tinted shadow levels (`shadow-card` / `card-hover` / `raised`) plus brand glows (`shadow-hero` teal, `glow-gold`); every card now also carries a hairline `border-dark/[0.05]` for crispness. Card radius 16px → 20px.
2. **Signature surfaces** — `.surface-hero` (deep teal gradient + faint gold aurora, used on exam countdown, diagnostic-results hero, övningsprov results hero, plan goal card, completion check-circles) and `.surface-ink` (charcoal + teal glow, used on the locked-dashboard diagnostic card). This is the app's recognizable visual identity for "money moments".
3. **Component upgrades** — Button primary/secondary/danger get vertical gradients + inner top sheen + colored shadows; Progress bars 5px → 8px with gradient fills; option buttons (ORD MCQ + LÄS) get circular letter chips and gradient selected state; inputs get focus rings (`0 0 0 4px` teal at 10%); BottomNav is frosted glass (`bg-white/85 backdrop-blur-xl`) with a teal pill behind the active icon.
4. **Motion choreography** — dashboard sections stagger in (`fade-up` at 60ms steps, `motion-safe:` gated); result pills `pop-in`; new keyframes `scale-in`/`bar-grow`/`shimmer`; easing switched to M3 emphasized-decelerate curve.
5. **Consistency sweep** — shared `.card-label` class for the uppercase kicker on every stat card; ambient teal radial wash behind app + login; feedback definition cards get a teal left-accent bar; session-complete stat cards get ORD-teal/LÄS-gold top accents.

Files: `tailwind.config.ts`, `src/app/globals.css`, `src/app/(app)/layout.tsx`, `src/components/ui/{Card,Button,Progress,Badge}.tsx`, `src/components/layout/BottomNav.tsx`, all dashboard components + page, `src/components/{ord,las,session}/*`, session/complete + session + diagnostic-results + plan + profile + onboarding + test + login pages. Deliberately NOT done: dark mode (brand is cream-first; a half-shipped dark theme reads worse than none — revisit as a real project if users ask). Production build verified green. *North Star: goal #1 — "feel" is one of the three stated wins (outcome, feel, pedagogy), and the prior design was visibly template-grade next to premium consumer apps; the hero surfaces also dress the future Phase-2 paywall moments (diagnostic results, övningsprov results) so the conversion surface looks worth paying for.*

**Audit pass: diagnostic results + onboarding (2026-06-11)** — three fixes from auditing the Phase-2-critical screens:
1. **Prediction-log pollution on refresh (data bug).** The diagnostic results page POSTs `/api/diagnostic/complete` on mount, so every browser refresh re-ran the whole route: a duplicate row into `score_predictions` (directly polluting the `prediction_calibration` view the HP model will be calibrated against), a plan rewrite, and an FSRS re-seed attempt. The route now checks `completed_at` first; repeat calls compute and return the same band/gap/balance but skip every write.
2. **Onboarding uncertainty constants disagreed on the same screen.** On the MEK/ELF step, `PrecisionIndicator` showed ±0.33 (using 0.08 for missing ELF) while `PredictionBand` directly below it showed ±0.29 (correctly using 0.04, the halved value when previous HP is known — per `buildScoreBand`). `SummaryStep` had the same 0.08 hardcode. Both now use 0.04 when a previous HP score exists.
3. **Diagnostic results reveal animated.** Extracted `useCountUp` to `src/hooks/useCountUp.ts` (shared with session-complete); verbal träffprocent counts up in the teal hero card, sections fade up staggered. This is the future Phase-2 paywall surface — it should feel like a personal report, not a printout.

Files: `src/app/api/diagnostic/complete/route.ts`, `src/app/(app)/onboarding/page.tsx`, `src/app/(app)/diagnostic/results/page.tsx`, `src/hooks/useCountUp.ts` (new), `src/app/(app)/session/complete/page.tsx`. *North Star: #1 fix protects the calibration dataset that goal-#1's "real score improvement" claim will eventually rest on; #2 removes a visible credibility crack in the most trust-sensitive flow (two numbers disagreeing about the same prediction); #3 dresses the future conversion surface.*

**UI polish: reward-moment animation pass (2026-06-11)** — targeted motion, not a redesign (the brand system itself is sound). New Tailwind keyframes (`pop-in`, `fade-up`, `slide-in`), all gated behind `motion-safe:` so reduced-motion users get static content. Session-complete page upgraded: check-circle pops in, content reveals staggered, ORD/LÄS percentages count up (rAF, reduced-motion-aware `useCountUp`), streak milestones (7/14/30/50/100 days) get named celebration copy in gold, and a "X nya ord påbörjade" line shows visible growth (store-derived; hidden after tab-switch fallback). Daily session loop: keyed wrapper around each ORD/LÄS step re-triggers a 0.22s slide-in per transition — keys are stable *within* a step so ArticleReader/GistCheck internal state never resets mid-step. Files: `tailwind.config.ts`, `src/app/(app)/session/complete/page.tsx`, `src/app/(app)/session/page.tsx`. *North Star: goal #1 — the completion screen is the daily habit-loop reward; flat reward moments are where habit apps quietly lose users.*

**Reliability pass: Stockholm-time day boundaries + diagnostic resume + build-error UX (2026-06-11)** — bug-hunt follow-up to Learning Engine v2. Three fixes:
1. **UTC/Stockholm day-boundary bug cluster.** Vercel runs UTC; every "today" boundary computed with `setHours(0,0,0,0)` or `getDay()` server-side rolled over at 01:00/02:00 Swedish time. Consequences: a daily session completed at 00:30 Stockholm counted as *yesterday*, so the daily-done gate let the user build a second daily the same day (double FSRS quota — exactly what the gate exists to prevent); ord_heavy/las_heavy users got the wrong module plan between midnight and 02:00; the dashboard greeting and CTA disagreed with the build gate. New helpers in `src/lib/utils/date.ts` — `stockholmDayStartUtcIso()` (UTC instant of Stockholm midnight), `stockholmIsoWeekday()`, `stockholmHour()` — applied in `/api/session/build`, `/api/session/build-extra`, dashboard (done-today + in-progress + greeting + calendar month), `balance.ts` weekday plans, plan page exam filters, and `lib/hp/exam-dates.ts`. Streak manager was already Stockholm-correct; client components use device time and were left alone.
2. **Diagnostic resume.** Leaving mid-diagnostic no longer restarts it from scratch (was the listed pre-Phase-2 blocker). Same pattern as övningsprov: pool persisted in the session payload at build, every answer logged live via new `/api/diagnostic/answer` (ownership + session-type checked), build route resumes any incomplete diagnostic from the last 24h and replays prior responses; the page pre-marks answered articles as read. `/api/diagnostic/complete` now deletes the per-answer ORD rows before its authoritative batch insert (idempotent, no double-counting in `prediction_calibration`); LÄS rows are kept — a side bonus, since diagnostic LÄS answers (incl. `las_question_type`) were previously never logged at all and now feed weak-type profiling from Day 0. Deliberately does NOT close abandoned payload-less diagnostics the way the daily builder closes orphans — a "completed" empty diagnostic would flip `getOnboardingState().diagnosticCompleted` and unlock the app off a half-finished baseline.
3. **Build-failure retry screens.** `/session` and `/diagnostic` silently bounced to the dashboard when the build API failed or the network dropped (common on mobile). Both now show a branded error screen with "Försök igen" + a way home.

Files: `src/lib/utils/date.ts`, `src/lib/session/balance.ts`, `src/lib/hp/exam-dates.ts`, `src/app/api/session/build/route.ts`, `src/app/api/session/build-extra/route.ts`, `src/app/api/diagnostic/build/route.ts`, `src/app/api/diagnostic/answer/route.ts` (new), `src/app/api/diagnostic/complete/route.ts`, `src/app/(app)/dashboard/page.tsx`, `src/app/(app)/plan/page.tsx`, `src/app/(app)/session/page.tsx`, `src/app/(app)/diagnostic/page.tsx`. *North Star: goal #1 — "best app" is mostly the absence of moments that break trust: a double daily session, a vanished diagnostic, a silent bounce to home. All three are now gone; the timezone fix specifically protects FSRS integrity for night-owl students, who are a large share of 18-year-olds.*

**Learning Engine v2 — research-grounded LÄS + FSRS upgrade (2026-06-10)** — a research pass (documented in `analysis/LEARNING_SCIENCE.md`) produced four shipped changes:
1. **FSRS typing-rating fix (data-integrity bug).** One latency threshold set (Easy <2s, Hard >7s) applied to both MCQ taps and typed answers — but typing a Swedish synonym takes ~3–5s of motor time alone, so correct typing answers were systematically rated Hard. That's the "Hard misuse" pattern the FSRS authors warn the algorithm cannot adapt to: suppressed intervals, inflated review workload on every graduated word. Now format-aware (typing: Easy <6s, Hard >15s), with the format inferred server-side from `mcq_correct_streak < 2` — the same predicate the UI uses to pick MCQ vs typing, so nothing client-supplied is trusted. The applied rating is now also logged to `session_responses.fsrs_rating`, giving a faithful review log so a per-user FSRS parameter optimizer can run once a user crosses ~1,000 reviews.
2. **LÄS confidence calibration — built, then disabled same-day by founder decision.** The flow (extra tap Säker / Osäker / Jag gissade after picking an option, säker-men-fel amber callout in feedback) is fully implemented behind `askConfidence` on `LasQuestion` (default false) with the `confidence` column from migration 023, but **no surface enables it**. Founder's reasoning: the extra tap degrades UX, and "how confident was I?" is itself a fuzzy question for the user mid-session. If revisited, do it as a sampling experiment (a few questions per week), not per-question. Do not re-enable without asking.
3. **Gist-retrieval gate on lång articles.** Daily sessions: after closing the text and before the first question, the user writes the huvudtanke in one sentence from memory (min 10 chars, never graded). Self-explanation meta-analysis g≈.55; delayed generation with the text closed is also what makes comprehension self-judgments accurate (Thiede's gamma .70 vs .37). The sentence is shown back on huvudtanke-question feedback for self-comparison. Client-only state — no migration. Kort articles skip the gate.
4. **Per-type strategy tips on wrong LÄS answers.** `TYPE_STRATEGIES` map in `LasFeedback` — one HP-specific strategy line per question type (e.g. slutledning: "kan du peka på raden som tvingar fram slutsatsen?"), teaching the transferable move for the category alongside the existing distractor-specific hint.

Also: new `markAnswerStart` store action resets the response timer when the article reader or gist gate closes, so LÄS question-1 `response_ms` no longer includes reading time. Files: `supabase/migrations/023_confidence_and_rating.sql`, `src/lib/fsrs/engine.ts`, `src/app/api/fsrs/review/route.ts`, `src/app/api/session/complete/route.ts`, `src/types/session.ts`, `src/types/database.ts`, `src/stores/sessionStore.ts`, `src/components/las/LasQuestion.tsx`, `src/components/las/LasFeedback.tsx`, `src/components/las/GistCheck.tsx` (new), `src/app/(app)/session/page.tsx`, `analysis/LEARNING_SCIENCE.md` (new). *North Star: goal #1 — the FSRS fix repairs the core differentiator's data integrity (every graduated word was being mis-scheduled); the three LÄS features attack the actual bottleneck of reading comprehension (knowing when you've misunderstood) rather than just serving more questions, which no Swedish HP competitor does.*

**Övningsprov 5/5 mix + explainer + split results (2026-05-30)** — follow-up to the corpus split. With daily sessions on curated only and övningsprov fresh-fill on past-HP, a Phase-2 user who had been practicing diligently would face 10 unfamiliar past-HP words in their first post-split övningsprov and read it as "Fattat tested me on what it never taught me" — even though the score is honest. Three changes together:
1. **`buildPool` caps reviewed at 5** (was 10), fills the remaining 5 from novel past-HP. Both pools always get exactly 5 slots in steady state (Day 0 diagnostic seeds ~20 past-HP cards into FSRS, so the "reviewed" half exists even on first övningsprov). `SessionPayload.novel_word_ids` persists which subset is novel so the results-page split survives a refresh.
2. **Explainer screen** on every fresh övningsprov (suppressed on resume so users mid-test aren't re-blocked): "Av X ord är ungefär A sådana du tränat på och B nya ord från äkta HP-prov. Det riktiga provet fungerar likadant — du möter alltid okända ord." `src/app/(app)/test/page.tsx` shows it after build returns and before the first ORD render.
3. **Results page splits ORD score** into "Ord du tränat på" (with hint "bra koll på det du repeterat") and "Nya HP-ord" (with hint "hur du tar dig an okända ord — som på riktiga provet"), under the existing combined Ordförståelse bar. Falls back to combined-only when either pool has 0 questions. URL params extended: `ordReviewedCorrect / ordReviewedTotal / ordNovelCorrect / ordNovelTotal`.

The explainer costs ~10–30s of the 30-min timer — accepted as minor for the UX gain (a confused-then-demoralized user costs more). Files: `src/types/database.ts`, `src/app/api/test/build/route.ts`, `src/app/(app)/test/page.tsx`, `src/app/(app)/test/results/page.tsx`. *North Star: goal #1 — protects the cog-sci differentiator (test measures real ability) without alienating the user emotionally. The split score is also more pedagogically useful than a single number: the user sees both "consolidation of practiced material" and "transfer to novel material" as distinct signals.*

**Corpus split: daily = curated, övningsprov = past-HP (2026-05-30)** — HP never reuses ORD headwords (0 of 490 over 13 years per `analysis/ORD_analys.md`). Drilling a past-HP word like `anseende` in daily FSRS rotation gives the user 0% exam-day appearance odds on that specific item. Concept-cluster transfer was the steel-man case for keeping them — `tillrättavisning` is the correct definition for three different past-HP words (*näsbränna, reprimand, åthutning*) — but `/curate-ord-words` already spawns curated variants that cover the same concept clusters AND have nonzero appearance probability. So past-HP words become redundant the moment their concept is covered by a generated card. Cognitive-science backing (transfer-appropriate processing, narrow transfer of learning) supports the split: practice that matches test conditions wins. Three changes shipped together:
1. **Migration 022** — `select_new_word_ids` RPC filters `WHERE past_exams = 'curated'`. Past-HP words are never introduced as new daily FSRS cards.
2. **`selectDueWordIds` fallback path** — mirrors the same filter so dev environments without migration 022 don't accidentally seed past-HP cards.
3. **Övningsprov fresh-fill inverted** — `/api/test/build` now pulls `WHERE past_exams != 'curated' AND past_exams IS NOT NULL` for novel words. Övningsprov is the authentic-exam-simulation surface; it should feel like the real test, with real past-exam material. Reviewed-card pool stays untouched (whatever's in user's FSRS history).

Existing users keep their FSRS history on past-HP cards — those continue scheduling normally until they lapse off the deck. The split only affects *new introductions* going forward. Diagnostic untouched — keeps using past-HP for honest HP-baseline measurement.

Files: `supabase/migrations/022_curated_only_new_words.sql`, `src/lib/fsrs/engine.ts`, `src/app/api/test/build/route.ts`. *North Star: goal #1 — exam-day recall odds = words-studied × appearance-probability. The previous mix (~540 past-HP + 340 curated) capped that at ~340/(HP vocab universe). The split lifts the cap to (all curated)/(HP vocab universe). Doubling curated content now doubles ceiling directly, not partially.*

**Exam-aware FSRS retention target (2026-05-30)** — `ts-fsrs` default `request_retention = 0.9` is calibrated for lifelong learners with no deadline. HP candidates have a fixed exam date — tighter targets as it approaches stretch intervals less aggressively in exchange for fitting more new words into the remaining runway. New helpers in `src/lib/fsrs/engine.ts`: `retentionForDaysToExam(days)` returns 0.90 (≥90 days) / 0.88 (60–89) / 0.85 (30–59) / 0.82 (<30); `pickNextExamDate(exam_schedule)` finds the next future ISO date; `daysUntil(date)` does the math. `scheduleCard` takes an optional `requestRetention` and caches schedulers per target value. `/api/fsrs/review` fetches the active plan's `exam_schedule` in parallel with the FSRS card lookup; `/api/diagnostic/complete` threads `examSchedule` into `seedFsrsFromDiagnostic`. Re-evaluated on every review, so the schedule tightens automatically as the deadline approaches. Silent — no user-facing UI. Constants frozen at `beta` until ~5–10 real HP scores feed `prediction_calibration`. Files: `src/lib/fsrs/engine.ts`, `src/app/api/fsrs/review/route.ts`, `src/app/api/diagnostic/complete/route.ts`. *North Star: goal #1 — Anki/Quizlet have no deadline awareness; the cognitive-science framing now extends to exam-aware scheduling, which no competitor does.*

**Weakness-deck phase removed (2026-05-30)** — the badge "5 svaga ord — du har missat dessa förut" was showing the same words week after week. Root cause: `selectWeaknessWordIds` queried `fsrs_cards WHERE miss_count >= 3 AND due <= now ORDER BY miss_count DESC LIMIT 5`. `miss_count` is **lifetime-cumulative and never resets**, so historical lapses dominated the sort forever regardless of current mastery; descending order meant the same top-5 always won. The feature promised "we know your weak spots" but delivered "Groundhog Day with words from week 1" — actively eroding the brand promise of adaptiveness while duplicating a job FSRS already does via stability/lapses scheduling. Pulled the whole surface:
- `selectWeaknessWordIds` deleted from `src/lib/fsrs/engine.ts`
- `weakness` phase removed from `SessionPhase` type, `sessionStore` queue/init/advance/restore, `SessionProgress` labels, `buildDailySession` plan
- `WeaknessBadge` component deleted (`src/components/ord/WeaknessDeck.tsx`)
- `/api/session/build` no longer returns or persists `weaknessWords` in the payload (existing in-progress payloads safely ignore the field on resume)
- **Catch-up mode stays** — its lapses-DESC + stability-ASC ordering on `fsrs_cards` is the FSRS-native version of "fragile right now" and rotates correctly; the only change is it no longer carves out a separate weakness pool
- **Extra repetition mode rewired** — `/api/session/build-extra` was also using the broken signal as its primary source. Now picks the last 15 distinct missed ORD words ordered by `answered_at DESC` (the recently-missed query that was previously only a fallback). Rotates naturally as the user accumulates new misses.

Files: `src/types/session.ts`, `src/stores/sessionStore.ts`, `src/components/session/SessionProgress.tsx`, `src/lib/fsrs/engine.ts`, `src/lib/session/builder.ts`, `src/app/api/session/build/route.ts`, `src/app/api/session/build-extra/route.ts`, `src/app/(app)/session/page.tsx`, `src/app/(app)/test/page.tsx`, `src/app/(app)/diagnostic/page.tsx`, `src/components/ord/WeaknessDeck.tsx` (deleted). *North Star: goal #1 — the cognitive-science framing requires that adaptive features actually adapt. A stale UI surface lying about its smarts costs more than the warmup it nominally provided. FSRS already prioritizes fragile cards via stability; catch-up mode handles the away-too-long case correctly. If we later want a real fragility front-load we'll build it on a non-cumulative signal (recent-window misses or low-stability sample), not the lifetime miss_count trap.*

**MCQ graduation gate + övningsprov delay exemption (2026-05-30)** — two follow-ups to the same-day "Forced learning engagement" change below.
1. **Graduation logic fixed at the structural level.** The old behavior promoted a word from MCQ to typing after *any* first answer (right or wrong), because graduation was implicit in "an `fsrs_cards` row exists". A lucky guess on the 4-option MCQ (25% baseline) — or even a wrong answer — could push an unknown word straight into the harder retrieval format, and the user would crash. New rule: a word stays in MCQ until **2 consecutive correct MCQ answers**, then graduates to typing. A wrong MCQ answer resets the streak. Once graduated the streak is frozen; typing answers don't touch it. Cuts pure-luck graduations from ~25% to ~6%. Migration `021_mcq_graduation.sql` adds `mcq_correct_streak INT` to `fsrs_cards`; existing rows are backfilled to 2 so live users (incl. the founder's dogfooding history) stay on their current typing words and the gate only applies to words introduced going forward. `selectDueWordIds` in `src/lib/fsrs/engine.ts` now treats due cards with `streak < 2` as MCQ-mode (added to the same `newIds` set the session page already uses to pick the question component). `/api/fsrs/review/route.ts` increments / resets / freezes the streak based on the existing card's value — the route doesn't need to know whether the answer came from MCQ or typing because the streak field itself is the source of truth (`< 2` means the UI was showing MCQ).
2. **Övningsprov exempted from the MCQ absorption pause.** The 4.5s read window introduced below correctly applies in learning contexts (daily session, diagnostic, onboarding) but distorts pacing in `övningsprov` — at ~80 questions a practice test, it would add ~6 minutes for no learning benefit (the test is an exam simulation). `OrdFeedback` now takes an optional `delayMs` prop (default `4500`); `src/app/(app)/test/page.tsx` passes `0`.

Files: `supabase/migrations/021_mcq_graduation.sql`, `src/types/database.ts`, `src/lib/fsrs/engine.ts`, `src/app/api/fsrs/review/route.ts`, `src/components/ord/OrdFeedback.tsx`, `src/app/(app)/test/page.tsx`. *North Star: goal #1 — closes the same hole as the entry below but at the data-model level, so the cognitive-science framing holds even when users guess well or run out of attention.*

**Forced learning engagement on wrong answers (2026-05-30)** — fix for the auto-tap-past-feedback problem (founder caught their own habit of skipping the correct synonym, definition, and example after a wrong answer; same problem causes the MCQ-lucky-guess → typing-crash pipeline). Two changes:
1. **MCQ feedback (`OrdFeedback`)** — mandatory 4.5s read window on the Next button for both correct and wrong answers. Button disabled with label "Läs definitionen…" and a teal progress fill below; activates as "Nästa" when the window elapses. Applies wherever `OrdFeedback` renders (daily session, övningsprov, diagnostic, onboarding).
2. **Typing feedback (`OrdFeedbackTyping`) — wrong-answer flow** — replaced single Next button with a study-test sequence. **Phase 1 (study):** correct synonym + definition + example shown, "Fortsätt" button (flag-synonym link still available here). **Phase 2 (retrieve):** synonym hidden ("_ _ _ _ _"), definition + example shown with the headword regex-blanked (`\bword\w*` for Swedish suffix tolerance) so the example serves as a cue without leaking the answer, input box — user retypes the synonym from memory. Correct → advance; wrong → fallback. **Phase 3 (fallback):** synonym shown again, must be typed visible to advance (motor engagement on the second miss). Correct typing answers unchanged (instant Next — they already retrieved). Phase 2's retrieve attempt is not logged to `session_responses` or FSRS — the original wrong answer is the data point; this is purely a learning gate.

Pedagogically this is the testing-effect-on-feedback move (Roediger, Pyc & Rawson) — re-retrieval after error consolidates the memory trace far more than reading the answer. The MCQ pause prevents shallow guessing from graduating words prematurely; the typing study-test pattern guarantees the feedback moment isn't wasted. Both add ~30–60 sec to a typical daily session, concentrated on words the user is struggling with — exactly where the time should land. Files: `src/components/ord/OrdFeedback.tsx`, `src/components/ord/OrdFeedbackTyping.tsx`. *North Star: goal #1 — the cognitive-science differentiator means little if users skip the most learning-dense moment in the loop. This closes that hole without raising raw difficulty.*

**Extra repetition release valve (2026-05-27)** — after a daily session, the dashboard showed "klar för idag" but the bottom-nav Studera button (and any direct nav to /session) still spun up a brand-new daily, inflating tomorrow's FSRS quota and polluting spacing. Gate is now at the API: `/api/session/build` returns `{ alreadyDone: true }` when a daily was completed today instead of inserting a new row. The session page detects that and shows a centered chooser screen ("Dagens session är klar" + big "Kör extra repetition" button + small "Tillbaka till hem" link). No awkward dashboard underline link — the chooser lives in the session flow. Extra mode (new `session_type='extra'`) runs **weakness words only** (falls back to recently-missed if none), no LÄS articles, no new ORD introductions. The `/api/fsrs/review` route checks `session.session_type` and skips the FSRS card upsert + miss_count increment when `'extra'` — only the `session_responses` row is written so accuracy stats still count. Streak unaffected (existing filter already excludes non-daily/exam_mode). Övningsprov stays independent of the daily-done gate. Files: `supabase/migrations/020_extra_session_type.sql`, `src/app/api/session/build/route.ts`, `src/app/api/session/build-extra/route.ts`, `src/app/api/fsrs/review/route.ts`, `src/app/(app)/session/page.tsx`, `src/app/(app)/dashboard/page.tsx`. *North Star: goal #1 — protects the cognitive-science differentiator (FSRS spacing actually means something) without alienating motivated users who genuinely want more reps.*

**Adaptiv sessionsbalans (2026-05-27)** — diagnostic now picks an ORD/LÄS plan based on the gap between baseline ORD% and LÄS% accuracy. Three plans:
- `balanced` (default, |gap| < 20pp) — today's behaviour, ORD + LÄS every session
- `ord_heavy` (LÄS% − ORD% ≥ 20pp) — ORD daily, LÄS only mån/ons/fre
- `las_heavy` (ORD% − LÄS% ≥ 20pp) — LÄS daily, ORD only tis/tors/lör

20pp threshold chosen because the diagnostic (20 ORD + ~6 LÄS) has a ~10pp std error; gaps inside that are noise and balanced wins on interleaving grounds. Off-days return empty word/article arrays from `buildDailySession`; sessionStore advances phase past the empty side automatically; a banner explains. Catch-up mode (>2 days away + >30 overdue) overrides off-day rules so the backlog can't grow. Auto-picked at diagnostic complete, surfaced on results page with a "byt till balanserad" link, and toggleable in profile. Rule #6 amended with a footnote: ORD-before-LÄS still holds whenever both run. Migration `019_session_balance.sql` adds `session_balance` to `study_plans`. Files: `supabase/migrations/019_session_balance.sql`, `src/lib/session/balance.ts`, `src/lib/session/builder.ts`, `src/app/api/diagnostic/complete/route.ts`, `src/app/api/session/build/route.ts`, `src/app/api/study-plan/balance/route.ts`, `src/stores/sessionStore.ts`, `src/app/(app)/session/page.tsx`, `src/app/(app)/diagnostic/results/page.tsx`, `src/app/(app)/profile/page.tsx`, `src/app/(app)/profile/ProfileForm.tsx`, `src/types/database.ts`. *North Star: serves goal #1 — your sister's "I won't do LÄS daily if I'm 17/20" was a Phase 2 conversion blocker; this removes it without breaking interleaving for the median user.*

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

**Landing copy rewrite + waitlist hardening (2026-05-20)** — dropped "strong on matten" niche framing, went broad. New hero ("ORD och LÄS. Byggt för att fastna."), problem section, features H2, feature card copy, dogfooding section, and final CTA all rewritten. Waitlist route hardened: IP-hash DB check (max 3 signups per IP) added on top of existing in-memory rate limit. Founder notification email via Resend fires on every new signup. `src/app/page.tsx`, `src/app/api/waitlist/route.ts`.

**Phase 1 deployment (2026-05-18)** — code went from localhost to https://fattat.se in one session. GitHub repo `fekriiiii/fattat` (private), Vercel auto-deploys on push to `main`, domain via Strato pointing at Vercel with Let's Encrypt SSL. Two build fixes shipped: `next.config.mjs` bypasses ESLint (accumulated repo-wide warning debt, tracked), `tsconfig.json` excludes `scripts/` (seed.ts uses dotenv which isn't a runtime dep). Notifications cron removed from `vercel.json` — Hobby plan limits crons to daily; re-add on Pro upgrade in Phase 2. Email forwarding via **ImprovMX** (free tier, 2 MX + 1 SPF TXT records at Strato): `hej@fattat.se`, `info@fattat.se`, `contact@fattat.se` all forward to founder's Gmail. Chose ImprovMX over Cloudflare Email Routing to avoid moving DNS off Strato (CF Routing requires CF nameservers).

**Phase 1 landing page + bug-fix pass (2026-05-17)** — landing page shipped, plus an 8-item bug sweep across the app.

*Landing page (waitlist mode for Phase 1):*
1. **Public landing at `/`** — replaced the old `/login` redirect. Hero with form above the fold, second waitlist surface at page bottom, problem/features/dogfooding sections in between. Brand-anchored design (teal F-mark, animated live chip, dark dogfooding block).
2. **Waitlist signup endpoint** — `/api/waitlist` with email validation, 1-req/min/IP rate limit, max-3-signups-per-IP-hash DB check, dup-email-as-success behavior. Founder gets a Resend notification email (from `onboarding@resend.dev`) on every new signup showing email + source platform.
3. **Source attribution** — required dropdown captures which platform (TikTok/IG/YouTube/vän-skola/annat) brought each lead. Pre-launch checklist item #4 done.
4. **Middleware update** — `/`, `/privacy`, `/terms` now public; logged-in users still get `/` → `/dashboard` redirect so the app surface is unaffected.
5. **Boilerplate `/privacy` and `/terms`** — GDPR basics with founder as data controller until enskild firma is registered. Real legal review needed before Phase 2 monetization (see `docs/LEGAL_SETUP.md`).

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
| Per-user FSRS parameter optimization — run the FSRS optimizer over `session_responses.fsrs_rating` logs and store per-user parameters. Trigger: any user crosses ~1,000 logged ratings (founder dogfooding will get there first). | `src/lib/fsrs/engine.ts` + script | Medium (waiting on data) |
| Dashboard calibration surface — per-question-type confidence calibration ("På slutledning är du ofta säker men fel"). Trigger: ≥30 confidence-tagged LÄS responses per user. | `src/app/(app)/dashboard/page.tsx` | Medium (waiting on data) |
| Prequestion A/B experiment for LÄS (question stems before reading) — evidence is promising but mixed for text; see LEARNING_SCIENCE.md before building | `src/app/(app)/session/page.tsx` | Low (Phase 2+) |
| Push notifications — daily reminders route exists and is complete (`/api/notifications/schedule`) but **no cron is calling it**. Vercel Hobby only allows daily crons; the route needs every-5-min cadence to match user-chosen times. Fix for Phase 2: set up a free external cron at cron-job.org pointing at `/api/notifications/schedule` every 5 min with `Authorization: Bearer <CRON_SECRET>`. The 24h-before-övningsprov feature is a separate addition on top of this. | `src/app/api/notifications/schedule/route.ts`, vercel.json | Phase 2 |
| Performance-adaptive exam scheduling (v2) | `src/lib/session/planner.ts` | Low |
| ~~Founder creates account live on Day 0 video~~ — superseded 2026-06-11: public series paused; founder trains privately for HP 2026-10-18. New must-dos: HP-anmälan 11–18 aug 2026 (hard deadline), record raw session footage/screenshots privately, keep growing ORD + LÄS content to feed ~4 months of daily use | manual | High (ongoing) |
| Review `flagged_synonyms` table periodically and promote valid entries to `accepted_synonyms` in CSV + DB | Supabase dashboard + ord-database.csv | Ongoing |
| ESLint cleanup pass — currently bypassed in build via `next.config.mjs`; clear unused vars, `any` types, and missing useEffect deps | repo-wide | Medium (post-launch) |
| Session payload bloat — daily session stores full article bodies in JSONB; should mirror övningsprov and store IDs only | `src/app/api/session/build/route.ts` | Low |
| Study partner pages | `src/app/(app)/partner/` | Low |
| HP result popup — after exam_date + ~42 days, show a one-time dashboard popup: "Fick du ditt HP-resultat?" with a score slider + "Nej tack" dismiss. Writes to `reported_hp_score` on `user_profiles` (DB column already exists from migration 015). Replaces the removed profile form field. Trigger: Phase 3, ~late November 2026. | `src/components/dashboard/`, `src/app/api/profile/` | Phase 3 |

---

## Key Architecture Decisions

**Email + password (not magic link):** Simpler mobile UX — no waiting for email.

**FSRS not SM-2:** More research-backed; ts-fsrs is TypeScript-native.

**ORD before LÄS:** Vocabulary is the foundation; LÄS needs warm-up attention.

**No module-select screen:** Would undermine interleaving. Session controller decides automatically.

**JSONB for questions:** Avoids join on every article load; keeps reading screen fast.

**Supabase over Firebase:** PostgreSQL handles the complex queries needed for score prediction and domain maps.

**Vercel:** Zero-ops, built-in cron, free tier covers launch.
