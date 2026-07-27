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

## Content Runway — how much to write, and when to stop

Two hard numbers in the code govern all content production. Both are ceilings, and neither moves
by writing more content. Read this before planning any batch.

**LÄS: one article per daily session.** `fetchArticles` returns exactly one
([builder.ts:285](src/lib/session/builder.ts#L285)) and completed articles are filtered out, so
**the bank is single-use**. If it empties, the session silently degrades to ORD-only. Target is
therefore *one article per remaining day*: **83 articles for the 18 okt 2026 run**, against 48
today (2026-07-27). ~36 to go.

**ORD: five new words per session, hard-capped.** `MIN_NEW_WORDS_PER_SESSION = 5`, but
`Math.min(5, limit/4)` uses it as a *maximum* ([engine.ts:148](src/lib/fsrs/engine.ts#L148)) —
the name is misleading. Raising `daily_ord_quota` does **not** raise it. 83 days × 5 = **415 words
is the absolute ceiling on what the founder can be introduced to**, and the bank already holds 400
curated.

### Two decisions that follow, so they are not re-litigated

1. **Twelve articles per week, not per day** (decided 2026-07-27, founder proposed daily). Anything
   past 83 is inventory that will never be opened before the exam, and that time is worth more as
   training time. Three more batches during August finishes the job; then stop writing and train.
   Twelve is also the proven batch size — bigger batches lower quality without raising output.
2. **ORD curation from here is infrastructure for article writing, not vocabulary for the founder.**
   Because of the 415 ceiling, new curated words widen the pool his 415 are drawn from but add
   nothing to how much he can learn. They are curated so that LÄS articles have domain vocabulary
   to feature. Do not justify an ORD batch by "more words to study" — that is not what it buys.

If the founder ever needs to absorb more than 415 words, the lever is the constant in
`engine.ts`, not the content pipeline. It has a real cost: more new words per day compounds the
review backlog, and 5/day is a defensible pedagogical setting.

---

## Recent Fixes

Only the two most recent sessions live here. Everything older is in `docs/CHANGELOG.md`.

**ELF-diagnostiken, en rättelse som skapade en daterad uppgift, och 60 ORD-ord i medicin och vetenskap (2026-07-27)** — en session där mätning slog magkänsla tre gånger i rad, två av dem mot mig.

1. **Grundaren mätte sin ELF och planen vändes.** HP ger 22 minuter för 10 ELF-uppgifter (verifierat i anvisningarna till ett riktigt provpass i `Past_hp/`). Grundaren läste texten och besvarade 5 uppgifter på **under 8 minuter mot en budget på 11**, med 4 rätt, och det enda felet var att han inte läste alternativen färdigt. **Tid är alltså inte flaskhalsen och engelskan är inte flaskhalsen** — han går för fort fram i en del där han har tid över. Rekommendationen dessförinnan, 20 minuter tung engelsk sakprosa om dagen, drogs tillbaka. ELF får noll daglig tid och en ren procedur i stället (läs alla fyra alternativ, bli inte klar tidigt, peka på meningen i texten). De 20 minuterna går till **MEK**, som är 20 obearbetade poäng. Urvalet är n=5 och det sägs rakt ut i beslutet; tidsmarginalen är för stor för att vara brus, felklassificeringen är en enda datapunkt.
2. **Fattat täcker halva den verbala delen, och ingen hade skrivit ner det.** HP:s 80 verbala poäng är ORD 20, LÄS 20, **MEK 20, ELF 20**. Vi tränar de två första. Det är en riktig produktobservation som grundarens egen träning avslöjade, och den är underlaget till MEK-frågan i november. Att bygga MEK nu vore fel: det skulle äta de 85 dagarna före 18 oktober, och innehållsbanken är fortfarande den knappa resursen.
3. **HP-appens svarsknapp är död på ELF, och det är deras frontend.** Console kastar ingenting. Network visar bara PostHog-anrop (200, 0.1 kB) och **inget anrop till deras egen server vid klick**, vilket dödar den rimliga alternativtolkningen att det var en betalspärr som tiger: en 401 kräver en förfrågan, och ingen görs. Deras egen telemetri fyrade på klicket, så datan finns redan i deras tratt. Dokumenterat i `analysis/COMPETITOR_hpappen.md` med den ärliga brasklappen att en lokalt buffrad provpass-motor också skulle ge tom nätverkstrafik.
4. **Rättelsen som är värd mest i hela sessionen, och den kom från grundaren.** Jag drog slutsatsen att ELF inte kan seedas av någon, eftersom varje fil i `Past_hp/` är "utan-elf". Fel. **UHR publicerar ELF-delen, men bara ungefär första veckan efter varje provtillfälle.** Det vänder fyndet: ORD och LÄS från gamla prov ligger uppe för alltid och det försprånget kan vi beta av när vi vill, medan **ELF är ett fönster som stängs en gång per sittning och varje fönster före nu är borta permanent**. Det är vår värsta innehållsasymmetri, inte vår bästa. Den konkreta följden ligger nu i tabellen nedan som en hård, daterad uppgift: hämta ELF-texterna veckan efter 18 oktober 2026, och **verifiera det exakta fönstret före sittningen, inte efter** (en plan byggd på sju dagar missar ett fönster på tre).
5. **60 kuraterade ORD-ord, banken 340 → 400, medicin och vetenskap avblockerade.** Båda domänerna hade 3 respektive 0 ord kvar utan artikelhem och har nu 30 var. Fördelningen sattes till **30/40/30** över svårighet i stället för korpusens 28/55/16, efter en avvägning värd att minnas: **övningsprovet drar en fast kvot 8/8/4** ([builder.ts:331](src/lib/session/builder.ts#L331)), alltså fyra d3-ord per prov ur en pool som var 56 stycken, och tolv övningsprov till oktober hade betytt igenkänning på form i stället för betydelse. Ren d3-batch valdes bort eftersom den flyttat banken till ~25% d3 mot provets 17%. Banken landar på **19% d3**. Dagliga sessioner påverkas inte alls: FSRS väljer difficulty-blint ([engine.ts:202](src/lib/fsrs/engine.ts#L202)), så svårighetsmixen styr bara övningsproven.
6. **Valideringen fångade två fel som annars gått igenom, och båda är av känd typ.** `följaktligen` fanns redan i banken (dubbletthuvudord = två FSRS-kort för ett ord), och `peroralt`-definitionen innehöll sitt eget rätta svar. Kontrollen kördes *före* append, mot lintens hårda regler plus skillens batchkrav. `lint-ord-corpus.cjs` rapporterar **937 rader, 0 fel**, och ingen av de 12 kvarvarande varningarna ligger på de nya raderna — de sitter alla på äldre kuraterade rader och har fått en egen rad i tabellen nedan.

Files: `ord-database.csv` (+60 rader, id 881–940), `analysis/COMPETITOR_hpappen.md`, `CLAUDE.md`. Inget seedat och inget pushat. *North Star: mål #1 — punkt 5 avblockerar Slot B, alltså varannan lång LÄS-text, vilket var det enda som stod mellan oss och fortsatt utbyggnad av LÄS-banken som i sin tur är hela dogfooding-beviset. Punkt 1 är den billigaste poängvinsten sessionen kunde ge grundaren: två till tre ELF-poäng utan en enda minuts extra plugg, och 85 dagar av rätt tränad tid i stället för fel. Punkt 4 är obekväm men nyttig, eftersom den identifierar den enda innehållsklyftan vi inte kan arbeta ikapp och sätter ett datum på den enda åtgärd som finns.*

**Tolv nya LÄS-artiklar: korpusen till 36 och fyra kompletta provpass-set på köpet (2026-07-25)** — den enda arbetsuppgift som stod som "High, do first", körd hela vägen.

1. **Fyra provpass-set, tolv artiklar (ids 29–40), planerade mot slot-modellens luckor och inte mot vad som var lätt att skriva.** Korpusen är nu **36 artiklar = 12 kompletta set, 12 kort / 24 lång, alltså exakt HP:s 1:2**. Varje domän fick minst en genre den aldrig haft: medicin/debatt, medicin/akademisk, medicin/personlig_essä, vetenskap/reportage, juridik/debatt, ekonomi/reportage, kultur/reportage, kultur/litterär_prosa, samhälle/debatt, samhälle/personlig_essä. Det var poängen med att planera batchen som set och inte som en hög texter: ensemblen av genrer per domän är det som gör att banken känns som fyra riktiga provpass och inte som tolv artiklar av samma slag.
2. **Svarsfördelningen landade på A 30 / B 30 / C 30 / D 30, alltså precis 25 procent per bokstav.** Den beräknades i förväg: korpusen låg på D 20 procent, så batchens 40 rätta svar tilldelades A 9 / B 8 / C 9 / **D 14** innan första frågan skrevs. Att välja bokstav *under* skrivandet i stället för att blanda om efteråt är nödvändigt, eftersom LÄS renderar alternativen i författad ordning och både `explanation` och `distractor_types` är nycklade mot den lagrade bokstaven.
3. **Guardsen fällde 19 fel som skulle ha gått igenom, och 14 av dem var samma sak som förra gången: längd-tell.** Rätt svar 1 till 13 tecken längre än det längsta felalternativet, i fjorton olika frågor, av tre olika författarpass. Det är nu tredje batchen i rad där maskinen hittar alla och författaren inga. Slutsatsen är inte att skärpa sig utan att kontrollen aldrig får tas bort. Utöver det: **fyra brödtexter under 950-ordsmålet** och **fem trasiga fel av två slag som är värda att minnas** (se punkt 4).
4. **Två felklasser som återkommer och som ingen framtida session ska behöva återupptäcka.** (a) **Flerordsuttryck i böjd form matchar inte seedens ordmatchare.** "tappat fattningen" och "maktlystna" fanns i brödtexten, men `vocab_highlights` letar efter `tappa fattningen` respektive `maktlysten` och hittade ingenting, vilket hade gett index -1 och tomma tooltips i produktion, exakt det fel som redan slagit till två gånger. Skriv flerordsuttryck i grundform i kroppen. (b) **Ett `passage_anchor` som klipper mitt i ett citat blir aldrig ordagrant**, eftersom det avslutande citattecknet inte står där i brödtexten. Ta hela repliken eller sluta före tecknet.
5. **ORD-banken är nu flaskhalsen, inte LÄS-banken.** 277 av 340 kuraterade ord har ett artikelhem. Av de 63 som återstår ligger **21 i juridik och 21 i kultur**, medan medicin har 3 och vetenskap 0 kvar. Det betyder att nästa Slot B-artikel (medicin eller vetenskap, alltså varannan lång text HP ställer) inte längre kan hämta domänord ur den kuraterade banken utan får låna från `allmän`. Det fungerar, men det är signalen att `/curate-ord-words` behöver köras på medicin och vetenskap innan LÄS-banken skalas vidare.

Files: `las/029–040*.json` (12 nya). `npm run las:lint` rapporterar **36/36 helt rena, 0 fel, 0 varningar**; seedad och `npm run las:verify` rapporterar **36/36 exakt**. *North Star: mål #1 — det här är den enda posten i tabellen som blockerade allt annat, eftersom grundaren inte kan dogfooda mot 18 oktober utan innehåll att träna på, och dogfoodingen är hela beviset marknadsplan v2 ska byggas på. Tolv kompletta provpass-set är fortfarande inte fyra månaders dagligt bruk, men det är första gången banken räcker till mer än ett övningsprov i månaden. Det är också innehåll HP-appen strukturellt inte kan matcha: deras hela LÄS-korpus är gamla prov och därmed ändlig.*

## What's Still to Build

| What | Where | Priority |
|---|---|---|
| **Fill the LÄS bank to 83 articles.** At **48** (16 provpass-set, 2026-07-27) the bank runs dry in mid-September against an 18 okt exam. **~36 to go, three batches of twelve, one batch per week during August.** The arithmetic and the two decisions behind that cadence are in *Content Runway* above; read it before planning a batch rather than re-deriving it. This blocks the founder's dogfooding, which is the entire proof for marketing v2. Use `/batch-las-articles`; run `npm run las:lint` first to read the answer-letter balance, and `npm run las:verify` after seeding. | `las/` | **High — do first** |
| **Curate ORD words: juridik and kultur are now the empty ones.** The 12-article batch on 2026-07-27 consumed most of the free pool: only **37 of 400 curated words still lack an article home**, and the split has inverted. juridik has **1** left (`häkta`), kultur **3**, allmän **3**, while medicin has 18 and vetenskap 12. The next juridik or kultur article therefore has no domain vocabulary to feature. Run `/curate-ord-words` on those two before the next LÄS batch, same 30/40/30 difficulty split. | `ord-database.csv` | **High — blocks the next LÄS batch** |
| **Fix 12 length-tell warnings on older curated ORD rows** (ids 571, 579, 593, 633, 643, 674, 676, 684, 716, 725, 765, 819). `node scripts/lint-ord-corpus.cjs` flags each: the correct answer is 7 to 13 characters longer than the longest distractor, so the answer is guessable from shape alone. Same defect class the LÄS guards keep catching. Repo-wide sweep, so it gets its own commit (commit rule 3). | `ord-database.csv` | Medium |
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
| **Capture the ELF texts in the week after 18 okt 2026.** UHR publishes the ELF part of each provpass only for roughly the first week after the sitting, then removes it and leaves the redacted "utan-elf" version that fills `Past_hp/`. Every window before now is gone permanently, which is why we hold zero ELF material and an incumbent of several years plausibly holds all of it. **Verify the exact window before 18 okt, not after** (the "one week" is founder recollection; if it is three days a seven-day plan misses it). Then make it a standing per-sitting calendar item. | manual | **High — hard, dated, unrepeatable** |
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
