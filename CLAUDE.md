# CLAUDE.md

> Read this at the start of every session. It carries the things that must be true in *every*
> session: how to work with the founder, what we're aiming at, and the rules that can't be broken.
> Everything else is one hop away in the index below. Keep this file short on purpose.

---

## The Seed Command

```
npx tsx scripts/seed.ts --ord=ord-database.csv --las-dir=las
```

ORD words live in `ord-database.csv`. LÄS articles live in the **`las/` folder, one JSON file per
article**. The legacy `--las=las-database.csv` flag still imports the old CSV if ever needed, but
new articles are written to `las/`. Running `npm run seed` alone errors; use the full command.

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

---

## North Star

Two stacked goals:

1. **Be the best app in Swedish HP prep.** Best = candidates choose Fattat over alternatives. Wins on outcome (real score improvement), feel (mobile-first, low friction), and pedagogy (cognitive science, no passive study).
2. **10,000 SEK/month in revenue** — the practical signal that #1 is working.

Every feature, copy change, or product decision should serve at least one. If a change can't be tied to either, that's a scope-creep signal — flag it before building.

---

## Document Index

Every markdown doc in the project, and **when to open it**. If a session is about to make a
decision one of these covers, read it first rather than reasoning from scratch.

### Strategy and business — `docs/`

| File | Read it when |
|---|---|
| **`VISION.md`** | **Read first, before any strategy work.** The one thing we do NOT pivot. Two locked forks: Fattat is a *pedagogy* company (not an access company), and *not in its soul an HP company* (HP is a beachhead, not the ceiling). Use it to tell a healthy pivot from drift. |
| `BUSINESS_PLAN.md` | Any pricing, scaling, or exit-timing question, or when the founder raises money / marriage / co-founder / sell. Holds the floor (university without loans, since interest is haram) and the dream (household income), the runway (uni starts höst 2028 = only three monetization windows), and the de-spiking thread. |
| `MARKETING_PLAN.md` | Launch planning, positioning, content arc, platform choices. Note the status header: old Phase 1/2 are void. |
| `POST_HP_RESULT_PLAN.md` | Any post-October-2026 launch planning. If-then tree for the three possible HP outcomes, so a flat result can't trigger a panic pivot. |
| `MONETIZATION_RESEARCH.md` | Pricing, trial length, paywall placement, or "should we build a native app?". RevenueCat benchmarks filtered to Education / Western Europe. |
| `LEGAL_SETUP.md` | Anything about the company entity. Minor-as-sole-prop status, timeline, blockers, parents' off-ramp. |
| `PRODUCT_BRIEF.md` | You need the full product description, beyond the summary above. |

### Engineering — `docs/`

| File | Read it when |
|---|---|
| `IMPLEMENTATION_PLAN.md` | You need the database structure explained, or the intelligent session behaviours (smart catch-up, fatigue detection, domain gap detection). |
| `MIGRATIONS.md` | Touching the schema, or walking the pre-push checklist. All 24 migrations in order. |
| `CONTENT_SCHEMAS.md` | Writing or fixing ORD/LÄS content by hand, or changing the seed scripts. Includes the valid `domain` and `genre` enum values, which are a common seed-failure cause. |
| `CHANGELOG.md` | You need to know *why* something is the way it is: a past bug's root cause, a feature deliberately removed, a decision already made. Also holds the reasoning behind the commit rules. |

### Research — `analysis/`

| File | Read it when |
|---|---|
| **`LEARNING_SCIENCE.md`** | **Any decision touching session design, feedback flows, FSRS settings, or new learning features.** Maps every learning-engine feature to its evidence base, and records what was deliberately NOT built, with reasons. |
| **`COMPETITOR_hpspelet.md`** | **Any positioning, pricing-comparison, or "should we build feature X because they have it" discussion.** Teardown of the market leader. Headlines: they run no spaced repetition at all, LÄS is their weakest flank, price 129 kr/mån, and ~153 weekly actives (so 10k SEK/month is a few dozen subscribers, not a miracle). §6 is the one that should worry us: they grow through the product and we have no referral mechanic. |
| **`COMPETITOR_hpappen.md`** | **Any positioning or pricing discussion, and before claiming spaced repetition or cognitive science as a differentiator.** Teardown of the *serious* incumbent (7-person team, ~750 monthly actives, 299 kr/mån or 989 kr/6 mån). They ship SR on ORD, quoted passage anchors in LÄS, morphology, an AI coach. §2 is what they beat us on; §5 is the rewritten differentiation claim. |
| `_LAS_analys.md` | Writing LÄS questions. Holds the **distractor-design appendix**, which is mandatory reading before generating questions, plus per-text classification for 16 provpass. |
| `LAS_katalog.md` | You want the catalogue of real HP LÄS texts across 49 provpass: titles, bylines, word counts, themes. |
| `ORD_analys.md` | Writing or auditing ORD items. Statistics and patterns across 490 real items, including the finding that no headword ever repeats. |
| `ORD_databas.md` | You need the raw catalogue of all 490 past ORD items with their five options and correct answers. |
| `ORD_morfologi.md` | Working on the morphology decode feature, or asking whether root/prefix teaching transfers to Swedish. |
| `STYLE_PROFILE_ORD.md` | Generating curated ORD words. Empirical fingerprint of the past-exam items to match. |
| `STYLE_PROFILE_ORD_SEMANTICS.md` | Checking whether curated words have drifted from past-exam words semantically. Phase 1 vs Phase 2 comparison. |
| `ANALYS_INDEX.md` | You want the corpus-level findings summary across all the HP analysis (uniqueness, answer-letter distribution, question-type mix, LÄS length architecture). Navigation now lives here in CLAUDE.md instead. |

### Content authoring — `.claude/commands/`

| Command | Use it when |
|---|---|
| `/extract-hp-words` | Turning a past HP exam PDF + facit into ORD rows. |
| `/curate-ord-words` | Generating new curated ORD words (the ones that actually go into daily sessions). |
| `/write-las-article` | Writing one new LÄS article from scratch. |
| `/format-las-article` | Formatting an article you already have into the LÄS schema. |
| `/batch-las-articles` | Writing several LÄS articles in one pass. **This is the current priority work.** |

---

## Locked Decisions

- **Pricing:** 399 SEK per provomgång (one-time, ~3 months access), 7-dagars gratis prov. Not monthly subscription.
- **Audience:** Swedish HP candidates strong on kvantitativa where verbala drags HP down — verbal-delta is the marketing metric, never absolute HP score before the real result.
- **Launch shape (revised 2026-06-11):** public dogfooding series paused. Founder trains privately in Fattat for the real HP **18 oktober 2026** (anmälan 11–18 augusti 2026, hard deadline). Marketing plan v2 gets built around the actual outcome after results land (~late Nov '26); first monetization window is the våren 2027 sitting (10 april). Waitlist stays up passively.
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

Environment variables: copy `.env.example` to `.env.local` and fill it in.

---

## Brand

- **Primary teal:** `#0F766E`
- **Charcoal:** `#1F2937`
- **Cream:** `#FBFAF7`
- **Gold:** `#D4A017`
- **Font:** Aeonik (Regular + Bold) at `public/fonts/`
- **Language:** Swedish throughout the UI. No English copy in the app.

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
9. **No em-dashes (—) anywhere the user can read.** Applies to app copy, ORD rows, LÄS questions/explanations/options, landing page, emails, push notifications, legal pages. Use a comma, period, colon or parentheses — pick the one the sentence actually calls for; never swap the character mechanically. Two clarifications that matter:
   - **The em-dash (—) is an English mark and does not belong in Swedish text at all.** The Swedish **tankstreck (–) is legitimate typography** and is *not* banned. What reads as AI-written is over-reliance on dash-parentheticals, not the character.
   - **LÄS article bodies are the deliberate exception.** They imitate real Swedish journalism, which is what HP draws its texts from, so normal tankstreck use there is correct and should be left alone. The ban is fully in force on everything written in Fattat's own voice, including LÄS explanations.
   - Code comments are exempt — users never see them.

---

## Commit & Deploy Strategy

Six rules. Each exists because something specific went wrong; the reasoning is in
`docs/CHANGELOG.md` → "Appendix — why the commit & deploy rules exist".

1. **Commit each finished unit of work, proactively, without asking.** A unit is one thing describable in a sentence and revertable alone.
2. **Never commit code that doesn't compile.** Typecheck and `npm run build` green *before* committing.
3. **Repo-wide sweeps get their own commit, ordered first or last, never interleaved** with behavioural changes.
4. **Never push without the founder's explicit OK.** Push to `main` auto-deploys production at fattat.se. Pushing is publishing, not a technical step.
5. **Fixed pre-push checklist, walked and reported every time:** production build green; every migration the code depends on applied to production Supabase; a plain-Swedish summary of what changes *for the user*.
6. **Deploy in deliberate batches, not per commit.**

Solo workflow: commit straight to `main`, no branches. Commit messages explain *why*, not just
what, because the founder reads them to understand their own project.

---

## Content Workflow

**ORD** — `/extract-hp-words` turns a past HP exam PDF + facit into CSV rows for
`ord-database.csv`. `/curate-ord-words` generates the curated words that daily sessions actually
use (past-HP words are övningsprov-only; see the corpus split in `docs/CHANGELOG.md`).

**LÄS** — `/write-las-article`, `/format-las-article`, `/batch-las-articles`. Claude auto-detects
existing ORD-database words in the body, proposes synonym swaps to bake in more ORD words, then
generates `passage_anchor`, `explanation`, `distractor_types`, `vocab_highlights` and
`featured_ord_words`. Output is one JSON file in `las/`, written via
`scripts/add-las-article.cjs`, which validates and encodes. **Never hand-write the file.**

**ORD→LÄS connection:** `featured_ord_words` on articles lets the session builder prefer articles
that reinforce recently practiced ORD words. Silent, users just notice relevance.

Field schemas and the valid `domain` / `genre` enum values: `docs/CONTENT_SCHEMAS.md`.

---

## Recent Fixes

Only the two most recent sessions live here. Everything older is in `docs/CHANGELOG.md`.

**Content QA rails, the HP-appen teardown, and the first batch on them (2026-07-24, part 3)** — the session that made scaling the LÄS bank safe, then scaled it.

1. **HP-appen teardown → `analysis/COMPETITOR_hpappen.md`.** Walked end to end on a real free account. This is a materially more serious competitor than hpspelet: 7-person team, founded 2021, ~750 monthly actives (their in-app leaderboards report participant counts, which is the most honest scale figure available anywhere in this market; their public "20 000+ studenter årligen" is cumulative signups, off by ~25×). **They already ship what we call our differentiation** — spaced repetition on ORD, quoted passage anchors in LÄS solutions, morphology on demand, immediate feedback, an AI coach. So "cognitive-science-grounded" is no longer a claim we hold alone. What survives is architecture they cannot add in a sprint: a **real scheduler** (theirs marks a word *färdiginlärd* after one correct answer, and their own community has a user with a 900-word unmanageable backlog), **error-specific feedback** (their panel is byte-identical whether you were right or wrong), **session design** (they have no session concept at all), and **self-written LÄS** (their entire 1 080-question LÄS corpus is past exams, and finite). Two verified defects worth remembering because they are our own bug classes: their AI reads **unshuffled option letters** and mislabels every distractor, and the advertised LÄS *citatmarkör* fails outright because the AI has no access to the passage. Pricing check also favours us: a full sitting costs ~900–1 200 kr there against our 399 kr, and their "mest populära" plan is a 989 kr six-month one-time purchase, which is our packaging.
2. **The content QA rails, built before the batch rather than after.** `scripts/las-checks.cjs` holds every LÄS rule in one module so the authoring path (`add-las-article.cjs`, one article) and the sweep (`lint-las-corpus.cjs`, all of them) run the *identical* check — two copies would drift within a week. New rules beyond what existed: **`passage_anchor` must appear verbatim in the body** (a fabricated citation is worse than none, and is exactly what we watched HP-appen ship), vocab highlights must resolve using **seed.ts's own matcher** so the guard predicts precisely what the seed will do, `distractor_types` keys must be real option letters, and a length ceiling. Plus `lint-ord-corpus.cjs` for the ORD side. **The lint found four live defects on its first run:** vocab highlights for `kontroversiell`, `kartlägga`, `upprätthålla` and `åkomma` use forms absent from their own bodies, so the seed wrote index -1 and **those tooltips were dead in production** — the third instance of this bug class. Two of my own checks were wrong on that first run and are now correct: anchors may join two passages with an internal ellipsis, and a quote clipped mid-sentence legitimately ends with a period the body lacks.
3. **Two content rules settled from data, not taste.** The **odd-one-out rule** and the **answer-letter balance**; both measurements and their consequences are in `docs/CHANGELOG.md` → Closed items. Short version: at least one distractor must share the correct answer's word-count class (8 curated rows fixed), and the corpus went from A 32 / B 32 / C 25 / **D 12** to **A 26 / B 28 / C 26 / D 20**, inside HP's empirical band for the first time.
4. **Six new LÄS articles, corpus 18 → 24** (ids 23–28), two complete provpass-sets, planned into the thinnest Slot C domains. Bank is now **8 kort / 16 lång = exactly the 1:2 HP ratio**, 8 complete sets, and 169 of 340 curated ORD words have an article home. **The guards paid for themselves immediately:** across six articles they caught a letter reference in an explanation, **five separate length-tells** (correct answer 1–5 characters longer than the longest distractor, in five different questions), and **four bodies under the 950-word floor**. Every one would have shipped. The length-tell is precisely the failure the distractor appendix warns is hardest to see in your own work, and it was: the machine caught all five, the author caught none.
5. **Two dogfooding fixes.** No word definitions in **övningsprov or diagnostic** — real HP offers no word aid, so giving one during a measurement inflates the very score it exists to produce, and the diagnostic also picks the study plan. `ArticleReader` takes `showVocab` (default true, daily sessions unchanged); when off the highlighted words render as plain text, since an underline you cannot tap is worse than none. And the **mobile definition sheet was unreadable**: `VocabTooltip` and `BottomNav` were both `z-50` and the nav renders later, so the nav covered the definition. Now portalled to `<body>` at `z-[60]`, with scroll-lock, Escape, and the document-level `mousedown` listener removed (it double-fired on touch and could close the sheet on the tap that opened it).

Also: the lång-length threshold now splits into a **target** (950, warned only while authoring) and a **floor** (800, HP's real span, warned always), after the founder decided the two legacy short articles stay. A warning that will never be acted on is how a team learns to ignore warnings, which matters far more at 85 articles than at 24.

Files: `analysis/COMPETITOR_hpappen.md` (+ screens), `scripts/{las-checks,lint-las-corpus,lint-ord-corpus}.cjs`, `scripts/verify-las-seed.ts`, `scripts/add-las-article.cjs`, `las/023–028*.json` + fixes to `005/008/020`, `ord-database.csv` (9 rows), `src/components/las/{VocabTooltip,ArticleReader}.tsx`, `src/app/(app)/{test,diagnostic}/page.tsx`, both content skills, `package.json` (`las:lint`, `ord:lint`, `las:verify`). Typecheck + production build green; seeded and `las:verify` reports **24/24 exact**. **Not verified end-to-end:** the mobile tooltip needs a real look on a phone. *North Star: goal #1 — the teardown is the uncomfortable half (a competitor with 7 people already says "spaced repetition" in their UI), and the rails are the answer to it. We cannot out-claim them; we can out-execute them, and the evidence that this is winnable is that their flagship LÄS feature is broken in production while ours now cannot ship a citation that isn't in the text.*

**ORD typing removed → recall pause; one article per session; LÄS letter-references; plan-lock refresh (2026-07-24, part 2)** — the remaining four items from the founder's dogfooding notebook.
1. **Typed synonyms replaced by a graduated recall pause.** The typed-answer format was removed everywhere. Founder's case, which holds: HP never asks a candidate to *produce* a synonym, only to recognise one, so typing violated the transfer-appropriate-processing principle the corpus split was already built on. Worse, it was corrupting data — a **correct** answer missing from `accepted_synonyms` was scored wrong, and FSRS then rescheduled a known word as if it were unknown. (`flagged_synonyms` was, in effect, an admission we knew about the failure mode and were only measuring it.) What replaces it keeps the retrieval attempt but stops grading it: for words already answered correctly twice, the options are held back **3 s** behind a countdown ("Tänk på svaret först"), so the word has to be retrieved before it can be recognised. **New words get no pause** — pausing on a word the student cannot possibly know yet only costs time. `mcq_correct_streak` (migration 021) keeps its shape and changes job: it used to gate MCQ→typing, it now gates no-pause→pause. **The trap in this change** was FSRS latency: a naive implementation counts the 3 s pause as slow recall and rates every familiar word Hard, which is exactly the "Hard misuse" bug fixed in June wearing a new costume. The response timer therefore starts when the options *appear*, never at mount (`onReveal` → `markAnswerStart`), and the server's second, slower threshold set for typing was deleted rather than left to rot. Deleted: `OrdTyping`, `OrdFeedbackTyping`, `lib/utils/levenshtein`, `api/words/flag-synonym` (~330 lines, a closed island). **Honest note:** producing a word from memory *is* a stronger memory trace than choosing one, so this trades a real learning mechanism for a real data defect. The pause recovers part of it. No measurement will tell us if that was the right trade.
2. **LÄS options no longer shuffled, and three bugs fell out of it.** (a) **Eight explanations** across four articles named the answer by letter ("alltså svar D") while options were shuffled at render, so the letter was wrong on screen — all eight rewritten to describe *what makes the answer right*, which is better teaching anyway. (b) **Distractor hints were effectively random**: `LasFeedback` looked up `distractor_types[chosenLabel]` using the *displayed* label, which shuffling had already decoupled from the stored letter, so a wrong answer got an arbitrary explanation of its own wrongness. Fixed for free by removing the shuffle. (c) Removing the shuffle then *exposed* a position tell in article 007 (3 of 4 answers on A), fixed by swapping two options — carrying `distractor_types` across with them, since it is keyed by letter. Shuffling was safe to drop because ORD, not LÄS, is the format that needs it (ORD options come from fixed CSV columns with the correct synonym always first — **that shuffle must stay**), articles are never re-served to the same user, and the corpus-wide answer spread is even. Two new hard guards in `add-las-article.cjs`: letter references in explanations, and every answer in an article on one letter.
3. **One article per session, was 1 kort + 2 lång.** ~2100 words and 10 questions on top of the full ORD block put LÄS alone past 20 minutes. Format is picked **first**, weighted by how many unseen articles each pool still holds, then the best-scoring article in that pool wins. Picking the top-scoring article across both pools instead would have quietly starved the kort pool — weak-type score counts matching questions and lång articles have 4 to kort's 2, so lång would win nearly every time and the short format would never be practised.
4. **Plan/dashboard stayed padlocked until a manual reload.** `getOnboardingState` reads the DB correctly; the problem was *when*. The `(app)` layout is a server component, and client-side navigation reuses its cached RSC payload — the one rendered back when the diagnostic was still incomplete. `router.refresh()` now runs in `.finally` on the diagnostic-complete POST (the call that writes `completed_at`). One refresh covers all three gated surfaces, since it invalidates the whole router cache.

Also restored an `await` on `/api/session/complete` in the "avsluta för idag" path — it had been dropped in an uncommitted edit, against a warning written 40 lines above it in the same file. Without it a fast bounce into Studera can hit `/api/session/build` on a still-open row and slip a second daily session past the gate (double FSRS quota).

Files: `src/components/ord/OrdQuestion.tsx`, `src/components/ord/OrdFeedback.tsx`, `src/lib/fsrs/engine.ts`, `src/app/api/fsrs/review/route.ts`, `src/app/(app)/session/page.tsx`, `src/app/(app)/{test,diagnostic}/page.tsx`, `src/app/(app)/diagnostic/results/page.tsx`, `src/lib/session/{builder,planner}.ts`, `scripts/add-las-article.cjs`, `las/005–009*.json`; deleted `OrdTyping`, `OrdFeedbackTyping`, `levenshtein`, `api/words/flag-synonym`. Typecheck + production build green. **Not verified end-to-end** — the plan-lock fix in particular needs a real walk through the diagnostic. *North Star: goal #1 — but the honest headline is that this session fixed things rather than adding any, and the article bank went 13 → 13. At one article per session and 86 days to 18 oktober, the bank is now the binding constraint on the whole plan: ~85 articles needed, 13 exist, and when it empties LÄS silently vanishes from the session with no message. Content, not features, is the next real work.*

## What's Still to Build

| What | Where | Priority |
|---|---|---|
| **Fill the LÄS bank until it feeds ~4 months of daily training.** At **24 articles** (8 kompletta provpass-set, 2026-07-24) the founder still runs out of content long before 18 okt — this blocks the founder's own dogfooding, which is the entire proof for marketing v2. Nothing else competes for this time. Use `/batch-las-articles`; run `npm run las:lint` first to read the answer-letter balance, and `npm run las:verify` after seeding. | `las/` | **High — do first** |
| **Revisit tester recruitment earlier than late Aug 2026.** 10–20 people using the app weekly before October solves three things at once: content feedback, the n=1 proof problem, and the first seeds of distribution. Parked in June because the founder had too much on; the competitor teardown changed the risk calculus. | manual | **High — decide before mid-Aug** |
| **Distribution session (own agenda, not a sub-item).** Fattat has zero referral mechanic and no way for a stranger to find it; hpspelet grows through the product itself (invite link → auto-friend → shared weekly leaderboard). Better pedagogy does not distribute itself. Schedule after the LÄS bank is deep enough to train on, and well before the våren-2027 window. See `analysis/COMPETITOR_hpspelet.md` §6. | strategy | High (schedule Q4 2026) |
| Program-first onboarding — replace "target HP score" with "Vad drömmer du om?" → pick a program → show its typical HP requirement → target with margin → frame all progress as gap-to-program. Needs a static program→antagningspoäng table + copy. Queue *behind* content, not ahead of it. See `analysis/COMPETITOR_hpspelet.md` §5. | `src/app/(app)/onboarding/page.tsx` | Medium |
| Calibrate HP prediction against `prediction_calibration` view once ~5–10 users report real scores | `src/lib/session/scoring.ts` | High (waiting on data) |
| Per-user FSRS parameter optimization — run the FSRS optimizer over `session_responses.fsrs_rating` logs and store per-user parameters. Trigger: any user crosses ~1,000 logged ratings (founder dogfooding will get there first). | `src/lib/fsrs/engine.ts` + script | Medium (waiting on data) |
| Dashboard calibration surface — per-question-type confidence calibration ("På slutledning är du ofta säker men fel"). Trigger: ≥30 confidence-tagged LÄS responses per user. | `src/app/(app)/dashboard/page.tsx` | Medium (waiting on data) |
| Prequestion A/B experiment for LÄS (question stems before reading) — evidence is promising but mixed for text; see `analysis/LEARNING_SCIENCE.md` before building | `src/app/(app)/session/page.tsx` | Low (Phase 2+) |
| Push notifications — daily reminders route exists and is complete (`/api/notifications/schedule`) but **no cron is calling it**. Vercel Hobby only allows daily crons; the route needs every-5-min cadence to match user-chosen times. Fix for Phase 2: set up a free external cron at cron-job.org pointing at `/api/notifications/schedule` every 5 min with `Authorization: Bearer <CRON_SECRET>`. The 24h-before-övningsprov feature is a separate addition on top of this. | `src/app/api/notifications/schedule/route.ts`, vercel.json | Phase 2 |
| Performance-adaptive exam scheduling (v2) | `src/lib/session/planner.ts` | Low |
| ESLint cleanup pass — currently bypassed in build via `next.config.mjs`; clear unused vars, `any` types, and missing useEffect deps | repo-wide | Medium (post-launch) |
| Session payload bloat — daily session stores full article bodies in JSONB; should mirror övningsprov and store IDs only | `src/app/api/session/build/route.ts` | Low |
| Study partner pages | `src/app/(app)/partner/` | Low |
| HP result popup — after exam_date + ~42 days, show a one-time dashboard popup: "Fick du ditt HP-resultat?" with a score slider + "Nej tack" dismiss. Writes to `reported_hp_score` on `user_profiles` (DB column already exists from migration 015). Replaces the removed profile form field. Trigger: Phase 3, ~late November 2026. | `src/components/dashboard/`, `src/app/api/profile/` | Phase 3 |
| Founder must-dos (ongoing) — HP-anmälan 11–18 aug 2026 (hard deadline), record raw session footage/screenshots privately, keep growing ORD + LÄS content to feed ~4 months of daily use | manual | High (ongoing) |

---

## Key Architecture Decisions

**Email + password (not magic link):** Simpler mobile UX — no waiting for email.

**FSRS not SM-2:** More research-backed; ts-fsrs is TypeScript-native.

**ORD before LÄS:** Vocabulary is the foundation; LÄS needs warm-up attention.

**No module-select screen:** Would undermine interleaving. Session controller decides automatically.

**JSONB for questions:** Avoids join on every article load; keeps reading screen fast.

**Supabase over Firebase:** PostgreSQL handles the complex queries needed for score prediction and domain maps.

**Vercel:** Zero-ops, built-in cron, free tier covers launch.
