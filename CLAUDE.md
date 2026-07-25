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

**Tolv nya LÄS-artiklar: korpusen till 36 och fyra kompletta provpass-set på köpet (2026-07-25)** — den enda arbetsuppgift som stod som "High, do first", körd hela vägen.

1. **Fyra provpass-set, tolv artiklar (ids 29–40), planerade mot slot-modellens luckor och inte mot vad som var lätt att skriva.** Korpusen är nu **36 artiklar = 12 kompletta set, 12 kort / 24 lång, alltså exakt HP:s 1:2**. Varje domän fick minst en genre den aldrig haft: medicin/debatt, medicin/akademisk, medicin/personlig_essä, vetenskap/reportage, juridik/debatt, ekonomi/reportage, kultur/reportage, kultur/litterär_prosa, samhälle/debatt, samhälle/personlig_essä. Det var poängen med att planera batchen som set och inte som en hög texter: ensemblen av genrer per domän är det som gör att banken känns som fyra riktiga provpass och inte som tolv artiklar av samma slag.
2. **Svarsfördelningen landade på A 30 / B 30 / C 30 / D 30, alltså precis 25 procent per bokstav.** Den beräknades i förväg: korpusen låg på D 20 procent, så batchens 40 rätta svar tilldelades A 9 / B 8 / C 9 / **D 14** innan första frågan skrevs. Att välja bokstav *under* skrivandet i stället för att blanda om efteråt är nödvändigt, eftersom LÄS renderar alternativen i författad ordning och både `explanation` och `distractor_types` är nycklade mot den lagrade bokstaven.
3. **Guardsen fällde 19 fel som skulle ha gått igenom, och 14 av dem var samma sak som förra gången: längd-tell.** Rätt svar 1 till 13 tecken längre än det längsta felalternativet, i fjorton olika frågor, av tre olika författarpass. Det är nu tredje batchen i rad där maskinen hittar alla och författaren inga. Slutsatsen är inte att skärpa sig utan att kontrollen aldrig får tas bort. Utöver det: **fyra brödtexter under 950-ordsmålet** och **fem trasiga fel av två slag som är värda att minnas** (se punkt 4).
4. **Två felklasser som återkommer och som ingen framtida session ska behöva återupptäcka.** (a) **Flerordsuttryck i böjd form matchar inte seedens ordmatchare.** "tappat fattningen" och "maktlystna" fanns i brödtexten, men `vocab_highlights` letar efter `tappa fattningen` respektive `maktlysten` och hittade ingenting, vilket hade gett index -1 och tomma tooltips i produktion, exakt det fel som redan slagit till två gånger. Skriv flerordsuttryck i grundform i kroppen. (b) **Ett `passage_anchor` som klipper mitt i ett citat blir aldrig ordagrant**, eftersom det avslutande citattecknet inte står där i brödtexten. Ta hela repliken eller sluta före tecknet.
5. **ORD-banken är nu flaskhalsen, inte LÄS-banken.** 277 av 340 kuraterade ord har ett artikelhem. Av de 63 som återstår ligger **21 i juridik och 21 i kultur**, medan medicin har 3 och vetenskap 0 kvar. Det betyder att nästa Slot B-artikel (medicin eller vetenskap, alltså varannan lång text HP ställer) inte längre kan hämta domänord ur den kuraterade banken utan får låna från `allmän`. Det fungerar, men det är signalen att `/curate-ord-words` behöver köras på medicin och vetenskap innan LÄS-banken skalas vidare.

Files: `las/029–040*.json` (12 nya). `npm run las:lint` rapporterar **36/36 helt rena, 0 fel, 0 varningar**; seedad och `npm run las:verify` rapporterar **36/36 exakt**. *North Star: mål #1 — det här är den enda posten i tabellen som blockerade allt annat, eftersom grundaren inte kan dogfooda mot 18 oktober utan innehåll att träna på, och dogfoodingen är hela beviset marknadsplan v2 ska byggas på. Tolv kompletta provpass-set är fortfarande inte fyra månaders dagligt bruk, men det är första gången banken räcker till mer än ett övningsprov i månaden. Det är också innehåll HP-appen strukturellt inte kan matcha: deras hela LÄS-korpus är gamla prov och därmed ändlig.*

**Morphology prefix layer, unblocked by an open Swedish lexicon (2026-07-24, part 4)** — the founder asked whether to wire Claude to synonymer.se or svenska.se through an MCP. The research killed both and found something better.

1. **Both named sources are dead ends, and it is worth writing down so no future session re-researches it.** synonymer.se has no API and licenses its content from *Bonniers svenska ordbok*, so pulling it into a paid product is a copyright problem (checking it by hand stays fine). svenska.se has no public API either; SAOL and SO *are* in Språkbanken's Karp as `salex_saol15` / `salex_so-frys`, but those resources answer `{"detail":"Not enough permissions"}`. The best Swedish dictionary is precisely the one we cannot have programmatically.
2. **What is open, and legally clean: SALDO.** Språkbanken's morphological lexicon, 128 036 entries, **CC-BY-4.0**, free in a commercial product with attribution, reachable through the open Karp v7 API with no key. Also open: `kelly` (CEFR level + frequency), `swesaurus` (synonyms with a 0–100 degree, but only 15 010 entries and it misses HP-level words like `vederhäftig`), and **Korp's count API** for real corpus frequency per million, which is the closest thing we have to an automated HP-likeness signal.
3. **MCP was the wrong packaging and the answer was not "more sources" but one specific unblock.** The decoder runs in the student's browser and must be instant and offline, so nothing can call Göteborg per word. What v1 of the morphology decoder actually lacked was a **base-word check**: it refused to decode any word starting with `o`, because of 183 such strings in the corpus only about half are the negating prefix and the rest are opaque (`ornament`, `observera`, `område`). SALDO answers exactly that question. `scripts/build-morph-prefixes.mjs` resolves every candidate at build time and writes `src/lib/ord/prefix-lexicon.ts`. **Corpus-wide result: 60 → 170 confident decodes**, suffix layer unchanged. Chaining is the nicest part: `oanvändbar` → `o + använd + bar`.
4. **The automated check got seven wrong, and only the hand pass caught them.** Of 116 machine-accepted entries, six are semantically false despite a structurally valid split, and are rejected with reasons in the script: `oförrätt` (a förrätt is a first course), `olat` (= bad habit, unrelated to `lat`), `olustig` (= uneasy, not "not funny"), `oförskämd` (from *skam*, not `förskämd`), `otäck` (base `täck` is archaic and reads as *täcka*), `oljudande` (here `o-` means *bad*). A seventh, `omedelbar`, was **created by the new chaining** splitting `medelbar` a second time into `o + medel + bar`. Existence-checking gets ~95% of the way; the hand pass is not optional, which is the same conclusion the original corpus analysis reached. Also fixed: the gloss fallback in `MorphemeBreakdown` assumed a suffix and would have printed `‑o`.

Files: `scripts/build-morph-prefixes.mjs` (new), `src/lib/ord/prefix-lexicon.ts` (new, generated), `src/lib/ord/morphology.ts`, `src/components/ord/MorphemeBreakdown.tsx`, `analysis/ORD_morfologi.md`. Typecheck + production build green. **Not verified end-to-end** — the breakdowns need a real look in a session's ORD feedback card. *North Star: goal #1 — HP-appen ships morphology too, so the differentiator is not that we have it but where it points: they decode the headword, we decode the **answer options**, which is where students actually stall. And unlike new content this makes content we already own teach more, which is the right kind of work while the LÄS bank is the scarce resource.*

## What's Still to Build

| What | Where | Priority |
|---|---|---|
| **Fill the LÄS bank until it feeds ~4 months of daily training.** At **36 articles** (12 kompletta provpass-set, 2026-07-25) the founder still runs out of content before 18 okt — this blocks the founder's own dogfooding, which is the entire proof for marketing v2. Nothing else competes for this time. Use `/batch-las-articles`; run `npm run las:lint` first to read the answer-letter balance, and `npm run las:verify` after seeding. | `las/` | **High — do first** |
| **Curate ORD words for medicin and vetenskap.** 277 of 340 curated words now have an article home, but the remaining 63 sit almost entirely in juridik (21) and kultur (21): medicin has 3 left and vetenskap 0. Slot B is every second lång text HP sets, so the next medicin/vetenskap article has no domain vocabulary left to feature. Run `/curate-ord-words` on those two domains before scaling the LÄS bank further. | `ord-database.csv` | **High — blocks further LÄS growth** |
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
