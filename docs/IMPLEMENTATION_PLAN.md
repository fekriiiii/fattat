# Fattat — Implementation Plan

> This document explains what we're building, why each decision was made, and in what order. Written so a non-technical reader can follow along.

---

## The Big Picture

Think of building Fattat like building a restaurant. Before customers arrive, you need:
1. The kitchen (database — where all data lives)
2. The front door and seating (authentication — how users log in and navigate)
3. The menu engine (FSRS — the algorithm that decides what words to show)
4. The dining experience (the actual study screens)
5. The loyalty programme (streaks, notifications, habit mechanics)

We're building in exactly that order so every step produces something testable.

---

## Technology Choices — Explained Simply

| What | Tool | Why (in plain language) |
|---|---|---|
| The app framework | **Next.js** | The most popular way to build modern web apps. Works perfectly on mobile browsers. |
| The database | **Supabase** | A managed database service — we don't have to run servers. Free to start, scales when needed. |
| User login | **Supabase Auth** (email + password) | Standard email and password login. Simple and instant — no waiting for a magic link email to arrive. |
| The memory algorithm | **ts-fsrs** | An open-source implementation of FSRS, the best-researched spaced repetition algorithm. Free to use. |
| Email sending | **Resend** | Simple, reliable transactional email. Free tier covers the launch phase. |
| Push notifications | **Web Push API** | Native browser notifications — no app install needed. |
| Hosting | **Vercel** | One-click deployment. Handles all server infrastructure. Free hobby tier. |
| Styling | **Tailwind CSS** | A way of writing visual styles directly in the code. Makes it easy to keep the design consistent. |

**Total cost to launch: ~0 kr/month** until the free tiers are outgrown.

---

## Brand System

These values are hardcoded throughout the app and never change:

| Colour | Hex code | Used for |
|---|---|---|
| Primary teal | `#0F766E` | Buttons, highlights, active states |
| Charcoal | `#1F2937` | Body text, dark backgrounds |
| Cream | `#FBFAF7` | Page backgrounds |
| Gold | `#D4A017` | Accent — streaks, achievements |

**Font:** Aeonik (Regular + Bold) — already installed in the project.

---

## Database Structure — What Data We Store

Think of the database as a collection of spreadsheets (called "tables"), each storing one type of information.

### `words` — The ORD word bank
One row per word. Columns: the word itself, its correct synonym, four wrong options (distractors), a Swedish definition, an example sentence, its domain (juridik, medicin, etc.), and difficulty level. This table is seeded from the ORD CSV you'll provide.

### `articles` — The LÄS article bank
One row per article/text. Columns: title, the full article body, source, domain, genre, word count, difficulty level, whether it's a short (2-question) or long (4-question) text, the questions themselves (stored as structured data), and vocabulary words to highlight. Seeded from the LÄS CSV.

### `user_profiles` — Who each user is
One row per user. Stores: their exam date, target score, when they want to study each day, their study cue, what tier they're on, and optionally their previous HP score (if they've sat the exam before — used to give a more accurate total HP prediction).

### `fsrs_cards` — Each user's memory state for each word
This is the heart of the spaced repetition system. One row per (user, word) pair. Stores the FSRS algorithm's internal state — essentially: "when should this person see this word again, based on how well they've been remembering it?"

### `study_sessions` — Records of each study session
One row per session. Stores: when it started and ended, how many ORD and LÄS questions were answered, and how many were correct.

### `session_responses` — Each individual question answer
One row per question answered. Stores: which word or article it was, what the user chose, what the correct answer was, whether it was right, and how long they took to answer.

### `user_streaks` — Streak tracking
One row per user. Stores: current streak, longest streak ever, the date they last studied, whether this week's streak freeze has been used.

### `study_plans` — The personalised 8-week plan
Generated after the diagnostic. Stores: exam date, target score, baseline score, and a week-by-week breakdown of goals.

### `article_completions` — Which articles a user has already seen
Prevents repeating the same article twice. One row per (user, article) pair.

### `push_subscriptions` — Browser notification subscriptions
Stores the technical details needed to send push notifications to a specific browser.

### `study_partners` — Partner invite links
Stores invite tokens and the relationship between inviter and invitee.

---

## Security: Row Level Security (RLS)

Every user can only see and modify their own data. This is enforced at the database level, not just in the app code. Even if someone found a technical loophole in the app, they could not read another user's responses, streaks, or plans.

Words and articles are public — any logged-in user can read them (they need to, to do the questions).

---

## Build Order — 15 Steps

Each step produces something testable. Steps are in dependency order — later steps build on earlier ones.

---

### Step 1 — Scaffold + brand system
*What:* Create the project folder, install all software packages, set up Tailwind with brand colours, install the Aeonik font.

*Why first:* Everything else runs on top of this foundation. Like laying the concrete slab before building walls.

*Test:* Run the app locally and see a blank cream-background page using Aeonik font.

---

### Step 2 — Supabase schema
*What:* Write and run the SQL migration that creates all the database tables described above, along with security rules and automatic triggers (e.g., auto-create a user profile when someone signs up).

*Why now:* The database is the single source of truth. Every step after this reads from or writes to it.

*Test:* Open the Supabase dashboard and confirm all tables exist with the correct columns.

---

### Step 3 — Auth: login + session management
*What:* Build the login page (email + password), the middleware that checks whether a user is logged in on every page load, and the callback handler. Supports both sign-up and sign-in from the same screen.

*Why now:* Nothing works until users can identify themselves. Auth is the gate.

*Test:* Create an account with email + password → arrive at the dashboard. Sign out → get redirected back to login. Try wrong password → see error message.

---

### Step 4 — FSRS engine
*What:* A wrapper around the ts-fsrs library that translates between our database format and the algorithm's format. Includes: creating new cards, rating answers (correct = Good, wrong = Again), fetching which words are due for review, and interleaving words by domain.

*Why now:* The session assembler (next step) depends on this.

*Test:* Run a standalone script that creates a card, rates it wrong, rates it right, and verifies the next-due dates are moving forward correctly.

---

### Step 5 — Session assembler
*What:* The logic that builds a daily session: (1) find weakness words (missed 3+ times), (2) get FSRS-ordered ORD words, (3) pick today's LÄS articles (1 short + 2 long, not yet completed), (4) interleave domains, (5) create a session record in the database.

*Why now:* The session UI (steps 7–8) needs this to know what to show.

*Test:* Call the session-build API as a logged-in user. Verify the response contains words from multiple domains and the correct article types.

---

### Step 6 — Seed script (placeholder content)
*What:* A script that inserts 20 placeholder ORD words (2-3 per domain) and 3 placeholder LÄS articles into the database, so all subsequent steps can be tested before the real CSVs arrive.

*Why now:* Without content in the database, the session assembler returns empty arrays and nothing can be tested.

*Later:* When you provide the real CSVs, running the same script with the CSV files replaces the placeholders with real content.

*Test:* Run `npm run seed` and check: words table has 20 rows, articles table has 3 rows.

---

### Step 7 — Zustand session store
*What:* A client-side state manager that holds the in-progress session between screen transitions. Think of it as the app's short-term memory while you're in the middle of a study session.

It tracks: which phase you're in (weakness → ORD → LÄS → complete), which question is current, what answers have been given, and whether the feedback screen is showing.

*Why now:* Both the ORD and LÄS components (steps 8–9) read from and write to this store.

*Test:* Not directly testable — its behaviour is verified through the session UI.

---

### Step 8 — ORD question + feedback UI
*What:* The screens for answering ORD questions.

**OrdQuestion:** Shows the word, its example sentence, and 5 options (A–E) shuffled deterministically. No skip button. The "choose an answer" prompt stays until an option is tapped.

**OrdFeedback:** Shown immediately after tapping. Correct answer turns green. Wrong choice turns red. The Swedish definition appears. A "Nästa" button (or 2.5-second auto-advance on correct) moves to the next question.

On each answer: the FSRS card is updated in the database, and the response is saved.

After 5 correct ORD answers: the streak is updated (minimum session threshold).

*Test:* Answer 5 ORD questions. Verify in the database that fsrs_cards has updated due dates and session_responses has 5 rows.

---

### Step 9 — LÄS reader + question + feedback UI
*What:* The screens for reading articles and answering LÄS questions. This is the most complex part of the app.

**ArticleReader:** Displays the full article with vocabulary words highlighted. Tapping a highlighted word opens a definition panel. A reading timer shows elapsed time and estimated words-per-minute pace. "Jag är klar" (I'm done reading) collapses the article and reveals the questions.

**LasQuestion:** Shows the question + 4 options (A–D). No skip. No hint.

**LasFeedback:** Shown immediately after answering. The correct passage in the (collapsed) article text is highlighted. The correct answer is shown. "Nästa fråga" moves forward.

On article completion: a record is saved so this article is never shown to this user again.

*Test:* Read an article, answer all questions. Verify article_completions has a new row, and feedback shows the correct passage highlighted.

---

### Step 10 — Session controller page
*What:* The main `/session` page that ties everything together. It:
1. Calls the session-build API to get today's plan
2. Loads the plan into the Zustand store
3. Renders the correct component based on the current phase (weakness → OrdQuestion → ArticleReader → session complete)
4. Shows a progress bar at the top

*Test:* Start a session from the dashboard. Confirm ORD questions appear first, then LÄS, then the complete screen.

---

### Step 11 — Diagnostic flow
*What:* A special session (not FSRS-ordered, no streak update) that:
1. Shows 10 ORD + 10 LÄS questions from a random sample
2. Shows results: estimated score range and weakest domains
3. Collects: exam date, target score, implementation intention (study time + cue)
4. Generates an 8-week study plan and saves it

*Test:* Complete the diagnostic. Verify study_plans table has a new row with the correct exam date and 8 weekly goals.

---

### Step 12 — Dashboard
*What:* The home screen a logged-in user sees. A server component (fetches all data directly, no loading spinner). Shows:
- Predicted score range (calculated from FSRS retention and LÄS accuracy)
- Score gap to target
- Exam countdown + specific weekly goal
- Current streak + monthly consistency grid
- Domain weakness map
- Button to start today's session

*Test:* After completing a session, reload the dashboard. Verify the score updates, the streak calendar shows today as studied.

---

### Step 13 — Streak manager
*What:* Logic that runs when a session is completed:
- Compares today's date to the last-studied date (in Stockholm timezone)
- If consecutive: increments the streak
- If one day missed + freeze available: applies the automatic freeze (streak continues), marks freeze as used
- If more days missed: resets streak to 1 but messages positively

Copy rule: **never** display "Du tappade din streak." Always display "Du har studerat X av de senaste Y dagarna."

*Test:* Study two days in a row → verify streak = 2. Skip a day → verify auto-freeze applied, streak still shows. Skip two days → verify streak reset to 1 with positive message.

---

### Step 14 — Push notifications
*What:* Browser push notifications delivered at the user's chosen time each day.

Three parts:
1. **Service worker** (`public/sw.js`) — a small background script the browser installs. It receives push events and shows the notification even when the app isn't open.
2. **Subscription flow** — after onboarding, the app asks permission and registers the browser with our server.
3. **Delivery cron** — a Vercel scheduled job that runs every 5 minutes, checks which users are due a notification right now (matching their chosen time in their timezone), and sends it.

Notification copy: *"Det är [tid] — dags för din Fattat-session. 15 minuter."*

Second reminder: sent 2 hours after the first if the session hasn't been done. Once only, not persistent.

*Test:* Subscribe in the browser. Manually trigger the send API. Verify notification appears.

---

### Step 15 — PWA + study partner
*What:*

**PWA (Progressive Web App):** Adds a `manifest.json` file that tells browsers this app can be installed to the home screen like a native app. An "Add to Home Screen" prompt appears after 3 sessions.

**Study partner:** Optional feature. A user can generate a shareable link. The recipient sees the user's streak and weekly goal — no account needed to view. The recipient can optionally link as a study partner.

---

## Content Seeding — When You Provide the CSVs

The seed script (`scripts/seed.ts`) reads the ORD CSV and the `las/` article folder:

```
npx tsx scripts/seed.ts --ord=ord-database.csv --las-dir=las
```

(LÄS articles are now one JSON file per article in `las/`; the legacy `--las=las-database.csv` flag still imports the old single CSV if needed.)

This will:
1. Read the ORD CSV and insert all words into the `words` table
2. Read the LÄS CSV and insert all articles into the `articles` table
3. Skip any row that already exists (safe to run multiple times)

The CSV schemas (column names and formats) must match what's described in the product brief. We'll validate this together when you provide the files.

---

## Environment Variables

These are secret values the app needs to function. They go in a `.env.local` file (never committed to version control):

```
NEXT_PUBLIC_SUPABASE_URL=          # Your Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=     # Your Supabase public API key
SUPABASE_SERVICE_ROLE_KEY=         # Your Supabase secret key (for seeding)
RESEND_API_KEY=                    # Your Resend email API key
VAPID_PUBLIC_KEY=                  # Push notification public key
VAPID_PRIVATE_KEY=                 # Push notification private key
VAPID_SUBJECT=                     # Your contact email (mailto:you@example.com)
NEXT_PUBLIC_APP_URL=               # Your app's public URL
```

**To generate the VAPID keys** (push notification keys), run once:
```
npx web-push generate-vapid-keys
```

---

## What's Already Been Built (current as of session 5)

The entire core of the app is complete. Every item below exists in the codebase and is functional:

| File/folder | What it is |
|---|---|
| `package.json` | Dependencies list — all packages installed |
| `tailwind.config.ts`, `src/app/globals.css` | Brand colours + Aeonik font |
| `src/app/layout.tsx`, `src/app/page.tsx` | Root HTML shell + root redirect |
| `public/fonts/` | Aeonik Regular + Bold woff2 files |
| `supabase/migrations/001_initial.sql` | Full database schema (all tables, RLS, triggers) |
| `supabase/migrations/002_hp_score.sql` | Score scale migration — changes columns from raw points (0–160) to HP scale (0.0–2.0) |
| `supabase/migrations/003_plan_quota.sql` | Adds `daily_ord_quota` column to study plans |
| `supabase/migrations/004_previous_hp.sql` | Adds `previous_hp_score` column to `user_profiles` — stores user's prior quant HP result for a more accurate total HP prediction |
| `src/types/database.ts`, `src/types/session.ts` | TypeScript type definitions |
| `src/lib/supabase/client.ts`, `server.ts` | Database connection helpers |
| `src/middleware.ts` | Auth guard on every page |
| `src/app/(auth)/login/page.tsx` | Email + password login page (sign up + sign in on one screen) |
| `src/app/(auth)/callback/route.ts` | Auth callback handler |
| `src/app/(app)/layout.tsx` | App shell with bottom navigation |
| `src/components/layout/BottomNav.tsx` | Bottom navigation bar |
| `src/components/layout/ServiceWorkerRegistration.tsx` | Registers service worker on first load |
| `src/components/ui/Button.tsx`, `Card.tsx`, `Progress.tsx`, `Badge.tsx` | Reusable UI primitives |
| `src/lib/utils/cn.ts`, `date.ts` | CSS class utility + date helpers (Stockholm timezone) |
| `src/lib/fsrs/engine.ts` | FSRS algorithm wrapper (ts-fsrs v5) |
| `src/lib/session/builder.ts` | Session assembly logic (incl. smart catch-up) |
| `src/lib/session/scoring.ts` | Score prediction algorithm (raw → HP scale) |
| `src/lib/session/planner.ts` | Gap analysis engine — calculates words-per-day needed to reach target HP score |
| `src/stores/sessionStore.ts` | Zustand session state (incl. fatigue + domain gap detection) |
| `scripts/seed.ts` | CSV importer for ORD words and LÄS articles |
| `src/lib/streak/manager.ts` | Streak tracking logic |
| `src/lib/notifications/push.ts` | Push notification library |
| `src/hooks/usePushNotifications.ts` | Push notification React hook |
| `src/app/api/session/build/route.ts` | API: build a daily session |
| `src/app/api/session/complete/route.ts` | API: record session completion |
| `src/app/api/diagnostic/build/route.ts` | API: build diagnostic test |
| `src/app/api/diagnostic/complete/route.ts` | API: record diagnostic completion + generate study plan |
| `src/app/api/test/build/route.ts` | API: build weekly exam (veckoprov) session |
| `src/app/api/fsrs/review/route.ts` | API: submit answer + update FSRS card |
| `src/app/api/streak/update/route.ts` | API: update streak after session |
| `src/app/api/push/subscribe/route.ts` | API: register browser for push notifications |
| `src/app/api/notifications/schedule/route.ts` | API: cron job to send daily notifications |
| `src/components/ord/OrdQuestion.tsx` | ORD multiple-choice question (5 options, A–E) |
| `src/components/ord/OrdFeedback.tsx` | ORD feedback (definition + example sentence) |
| `src/components/ord/OrdTyping.tsx` | ORD typing variant — user types the synonym |
| `src/components/ord/OrdFeedbackTyping.tsx` | Feedback for typing variant |
| `src/components/ord/WeaknessDeck.tsx` | Weakness word badge shown before session |
| `src/components/las/ArticleReader.tsx` | Article reader (full text, vocab highlights) |
| `src/components/las/VocabTooltip.tsx` | Vocab tooltip on highlighted words |
| `src/components/las/ReadingTimer.tsx` | Reading timer (elapsed time + words/min) |
| `src/components/las/LasQuestion.tsx` | LÄS multiple-choice question (4 options, A–D) |
| `src/components/las/LasFeedback.tsx` | LÄS feedback (passage highlight + correct answer) |
| `src/components/session/SessionProgress.tsx` | Progress bar during a session |
| `src/components/dashboard/ScoreGauge.tsx` | Predicted HP score gauge |
| `src/components/dashboard/ScoreTrajectory.tsx` | Score progress over time chart |
| `src/components/dashboard/StreakCalendar.tsx` | Monthly streak grid |
| `src/components/dashboard/DomainMap.tsx` | Domain weakness heatmap |
| `src/components/dashboard/WeeklyGoal.tsx` | Weekly goal widget |
| `src/components/dashboard/ExamCountdown.tsx` | Exam countdown in days |
| `src/components/dashboard/StudyPlanCard.tsx` | Dashboard card showing daily commitment + word progress, links to /plan |
| `src/app/(app)/plan/page.tsx` | Full study plan page — daily time, new words/day, word bank progress, week-by-week breakdown |
| `src/app/(app)/session/page.tsx` | Daily session controller (catch-up/fatigue/domain-gap UI) |
| `src/app/(app)/session/complete/page.tsx` | Session complete screen |
| `src/app/(app)/test/page.tsx` | Weekly exam (veckoprov) — timed, no FSRS updates |
| `src/app/(app)/test/results/page.tsx` | Weekly exam results with HP score estimate |
| `src/app/(app)/diagnostic/page.tsx` | One-time diagnostic session |
| `src/app/(app)/diagnostic/results/page.tsx` | Diagnostic results + study plan generation |
| `src/app/(app)/onboarding/page.tsx` | Onboarding flow (exam date, target, study cue) |
| `src/app/(app)/dashboard/page.tsx` | Main dashboard |
| `src/app/(app)/dashboard/loading.tsx` | Dashboard loading skeleton |
| `src/app/(app)/profile/page.tsx` | Profile page |
| `src/app/(app)/profile/ProfileForm.tsx` | Profile edit form (client component) |
| `public/manifest.json` | PWA manifest |
| `public/sw.js` | Service worker |
| `vercel.json` | Vercel cron config |

**Still to build:** Push notification 24h before each scheduled övningsprov (extension of Step 16b), Step 16b v2 performance-adaptive scheduling (deferred), haptic feedback on correct answers, study partner pages.

**Recently completed:** Step 16a (veckoprov mirrors HP verbal-provpass structure), Step 16b v1 (algorithm-driven exam scheduling), Step 17 (constructed-content disclosure).

---

## Step 16a — Upgrade veckoprov to mirror HP verbal-provpass structure

The existing **veckoprov** (`src/app/(app)/test/` + `src/app/api/test/`) is already 80% of what's needed: timed exam mode, no FSRS updates, draws ORD + LÄS questions, results page with HP score estimate. The remaining 20% is making its **structure mirror a real HP verbal provpass** so students rehearse the actual exam shape, not an arbitrary mix.

### Current veckoprov composition (to be changed)

- 20 ORD words
- 1 kort article + 1 lång article = 2 + 4 = 6 LÄS questions
- **Total: 26 questions**

### Target composition (HP-mirrored)

| Section | Count | Notes |
|---|---|---|
| ORD | **10** | Down from 20. Pseudo-randomly drawn, weighted toward words not seen in last ~7 days, with domain spread. |
| LÄS | **10** | 1 kort (2 q) + 2 långa (4+4 q). Up from 1 kort + 1 lång. Domain-varied across the three texts (e.g. one NV, one SH, one humaniora). |
| **Total** | **20 questions** | Half of the real 40-question verbal provpass; remaining half (MEK + ELF) is excluded per firm rule. |

### Why this is honest

A real HP verbal provpass is **ORD 10 + LÄS 10 + MEK 10 + ELF 10 in 50 minutes**. Fattat's veckoprov covers only the ORD + LÄS portion (per the firm exclusion of MEK and ELF). Naming matters: in the UI, frame it as *"Veckoprov — ORD + LÄS"* or *"Verbal-segment-simulering"* so students know exactly what they're rehearsing. They use **free past HP PDFs from UHR** for full verbal-provpass + MEK + ELF + quant simulation in the high-density phase.

### Files to change (no new files needed)

- [src/app/api/test/build/route.ts](src/app/api/test/build/route.ts) — change ORD limit from 20 → 10, add second `lång` article, keep `kort` at 1
- [src/app/(app)/test/page.tsx](src/app/(app)/test/page.tsx) — handle the third article, make sure timing UI is prominent
- [src/app/(app)/test/results/page.tsx](src/app/(app)/test/results/page.tsx) — show per-section breakdown (ORD score vs. LÄS score), make clear this is the ORD+LÄS sub-score, link to UHR PDFs for full-HP practice
- Optional: tighten timer display to a clearer countdown (~25 min for HP-proportional pacing — half of the real 50-minute verbal provpass)

### Run cadence

- **Habitual / weekly:** the dashboard surfaces the veckoprov on Sundays (current behavior).
- **On-demand:** allow the user to start a new veckoprov whenever — useful in the test-density phase (days 100–145 of prep) when running 1–2/week.

### Recommended prep flow (for the founder's own 150-day HP prep)

| Phase | Days | Daily / weekly practice |
|---|---|---|
| Foundation | 1–60 | Daily Fattat ORD + LÄS sessions; veckoprov on Sundays |
| Build endurance | 60–100 | Daily Fattat sessions; **2–3 standalone MEK sessions** from past HP PDFs (~25 min each, timed) so MEK isn't a cold start; **2–3 ELF maintenance sessions** from past HP PDFs |
| Test density | 100–145 | Daily Fattat sessions (lighter); 1–2× upgraded veckoprov/week in Fattat; **1–2 full HP mock provpass per week from UHR PDFs with a timer** (real MEK + ELF + quant); track score against the HP 0.0–2.0 scale |
| Taper | 145–150 | Light Fattat review only. No mocks. Sleep. |

This split uses Fattat where it's strongest (ORD + LÄS skill building, ORD+LÄS timing simulation via the upgraded veckoprov) and free past HP PDFs where Fattat doesn't cover (MEK, ELF, quant, full-format simulation). No HP-Appen subscription needed.

---

## Step 16b — Algorithm-driven exam scheduling (replace fixed weekly cadence)

A fixed "every Sunday" cadence is arbitrary and one-size-fits-all. Different students at different points in their prep need different exam frequencies. The algorithm should compute *when* the user should next take an exam based on their plan, time remaining, and progress — turning the veckoprov from a generic ritual into a coaching cadence.

### Why this exists

Real exam coaches don't say "take a mock every Sunday." They say "you're at week 3 of 12, take one mock now and another in 10 days; in week 9 take three per week." The cadence ramps as exam day approaches. This matches both established prep methodology and how the founder's own 150-day plan was scoped (foundation → build → test density → taper). The fixed weekly veckoprov already in the app doesn't reflect any of this.

### v1 scope (this round) — phase-based pacing only

Compute exam schedule purely from `(days_total, days_remaining)`. No performance feedback yet — that's v2.

**Pacing rule:**

| Phase of prep | % of total prep time | Cadence between exams |
|---|---|---|
| Foundation | first 40% | every 10–14 days |
| Build | 40–80% | every 5–7 days |
| Test density | 80–95% | every 2–3 days |
| Taper | last 5% | none |

**Worked example — founder's 150-day plan:**

- Days 1–60 (foundation): ~5 exams (every 12 days)
- Days 60–120 (build): ~10 exams (every 6 days)
- Days 120–143 (test density): ~10 exams (every ~2.5 days)
- Days 143–150 (taper): 0 exams
- **Total: ~25 scheduled exams across 150 days**

### Database changes

New migration `008_exam_schedule.sql`:
- Add `exam_schedule JSONB DEFAULT '[]'::jsonb` to `study_plans` table — stores an ordered array of ISO date strings, each one a scheduled exam date.

### Code changes

- `src/lib/session/planner.ts` — add `computeExamSchedule(daysTotal: number, daysRemaining: number, planStartDate: Date): string[]` that returns the array of ISO dates.
- When a study plan is generated (in the diagnostic-complete flow) or updated, populate `exam_schedule`.
- Optional: a small endpoint to reschedule on demand (`/api/plan/reschedule-exams`).

### UI changes

- **Plan page** — show upcoming exams as a list or timeline (*"Inplanerade övningsprov: 12 maj · 24 maj · 5 juni · ..."*).
- **Dashboard** — surface *"Nästa övningsprov: om X dagar"* prominently (replace any current "weekly exam" badge).
- **Push notification** — fire 24 hours before each scheduled exam.
- **Rename veckoprov → övningsprov** in user-facing Swedish copy. `session_type = 'exam_mode'` stays the same internally.

### v2 (later, NOT this round) — performance-adaptive

Once v1 is dogfooded:
- If predicted HP score is below target by >0.15, accelerate cadence by 30%.
- If above target by >0.10, decelerate by 30%.
- If recent session-average dropped >0.10 since last exam, schedule one within 24h.

Defer until v1 is felt in real use.

### Habit risk and mitigation

A fixed "Sunday" cadence builds ritual through predictability. Variable cadence risks weakening that. Mitigation: surface the *next scheduled exam* prominently on the dashboard (*"om 3 dagar"*), show the full 7-day-ahead schedule on the plan page, and push-notify 24h ahead. The exam stays predictable to the user, just not on a fixed weekday.

---

## Step 17 — Constructed-content disclosure (no "AI" framing)

LÄS texts in Fattat are **designed pedagogical material** — written specifically to match HP style, length, ORD-integration, and difficulty. Some texts include constructed names of researchers, studies, or institutions for narrative realism. These are *not* factual sources and students need to know that — but the disclosure must not undermine the perceived quality of the content.

### Principle

Brand texts as **Fattat originals**. Disclose that some studies/sources/names in texts are constructed for pedagogical purposes. Do **not** use the word "AI-genererad" anywhere user-facing — that label carries a "ChatGPT slop" connotation that misrepresents the rigor of the content (corpus-based generation from 16 real HP exams, HP-grade quality verified against a 7-point checklist, ORD words baked in, length calibrated to the empirical 783–1192 range for long texts). Industry convention matches: textbook publishers don't disclose the author's tools — they brand the material under their imprint and move on.

### What needs to happen

1. **Branding (per article)**
   - For designed pedagogical texts (the vast majority): set `source_name = "Fattat"` — treating Fattat as the publisher.
   - For real-source articles (rare; from actual news/research): keep the real source name and URL.
   - No per-text "AI-genererad" tag anywhere user-facing.

2. **Onboarding disclosure (one-time, plain Swedish)**

   Surfaced once during onboarding (or first-session intro), then never repeated:

   > *"Texterna i Fattat är skrivna i HP-stil för läsförståelseträning. Studier, källor och namn är ibland konstruerade för pedagogiska syften — använd dem inte som faktakällor."*

3. **Optional internal flag (analytics only, never user-facing)**

   Add `is_designed_content BOOLEAN DEFAULT TRUE` column to the `articles` table for internal tracking. Used only for backend analytics (which articles are designed vs. real-source). Never displayed in the UI.

### Domain-specific care: medicin

Medical/health content carries a higher misinformation risk if a constructed study is screenshotted out of context. For `domain = 'medicin'` articles specifically, the `/format-las-article` skill should consider whether the references can be made more obviously hypothetical (e.g., "ett svenskt universitetssjukhus" instead of "Karolinska") or be loosely based on real published research. This is a tightening of the skill, not a separate feature.

### Priority

**Required before public launch.** Not blocking for the founder's solo 150-day dogfooding phase — during personal use the founder already knows the texts are designed.

---

## What NOT to Build (Firm Exclusions)

- No MEK, ELF, math, or any quantitative content
- No AI tutoring or AI-generated explanations
- No hint buttons anywhere in the app
- No skip button on ORD questions
- No passive study mode (no showing answers without testing)
- No public profiles, leaderboards, or community features
- No native iOS/Android apps (v1 is web only)
- No annual subscription or lock-in pricing

---

## Testing Checklist

When each step is complete, this is how to verify it works:

| Feature | How to test |
|---|---|
| Auth | Sign in with email → check Supabase dashboard: user_profiles + user_streaks rows created automatically |
| Seed | Run `npm run seed` → check: 20 words, 3 articles in database |
| FSRS | Run test script → verify word's next-due date moves forward after answering |
| Session build | Call build API → verify ORD words from multiple domains + correct article types |
| ORD flow | Answer 5 ORD questions → verify fsrs_cards updated, session_responses rows created, streak incremented |
| LÄS flow | Complete article → verify article_completions row created, passage highlight on feedback |
| Streak | Study 2 days in a row → streak = 2. Skip 1 day → auto-freeze applied. Skip 2 days → streak reset to 1 |
| Dashboard | After session: score gauge updates, streak calendar shows today as studied |
| Push | Subscribe in browser → trigger send manually → notification appears |
| Diagnostic | Complete 20 questions → results page shows score range + weakest domains → study_plans row created |
| Interleaving | In a session: verify ORD appears before LÄS, verify ORD words span multiple domains |
| No passive mode | Verify there is no "reveal answer" or "study mode" path anywhere in the app |

---

## Intelligent Session Behaviours

> Moved here from `CLAUDE.md` on 2026-07-24.

Three silent features — no UI toggles, user only sees the friendly result:

**Smart Catch-up** (`src/lib/session/builder.ts` → `detectCatchUp()`)
Triggers when away >2 days AND >30 overdue words. Replaces normal FSRS order with the 20 most fragile words (most lapses, lowest stability). Blue banner explains.

**Fatigue Detection** (`src/stores/sessionStore.ts`)
Triggers after an 8-answer ORD warmup, when either 5+ wrong in the last 7 ORD answers OR avg response time >12s over the last 3. Full-screen overlay offers to end session or continue.

**Domain Gap Detection** (`src/stores/sessionStore.ts`)
Triggers when 3 consecutive wrong ORD answers come from the same domain. Amber banner names the domain. LÄS article selection already prefers matching domain.
