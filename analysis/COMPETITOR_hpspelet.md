# COMPETITOR — hpspelet.se

> Hands-on teardown of HP-spelet, walked end-to-end in a live browser session on
> a real account (free tier), **2026-07-23**. Read alongside `docs/VISION.md`
> (what we refuse to pivot) and `docs/MONETIZATION_RESEARCH.md` (pricing).
>
> **Verdict up front:** nothing here changes the vision, the pedagogy bet, or the
> launch plan. It changes two tactical things (onboarding framing, and how we
> talk about LÄS). The correct next action is still: **grow the LÄS bank.**

---

## 0. What it is, and who runs it

| | |
|---|---|
| Operator | Jupiter Technologies AB · org.nr 559574-6503 |
| Scope | **All 8 delprov** (ORD, LÄS, MEK, ELF, XYZ, KVA, NOG, DTK) |
| Claimed content | 25 000+ questions from past HP exams |
| Platforms | Web + native iOS app (App Store) |
| Price | **129 kr/månad**, cancel anytime, Stripe (card / Klarna / Link / Amazon Pay) |
| Core loop | Timed 7-question quiz sets → weekly leaderboard → streaks |
| Spaced repetition | **None found** |

Positioning in their own words: *"Nå drömutbildningen med Sveriges smartaste
HP-träning."* The felt product is a **competitive quiz game**, not a study
system. That distinction runs through everything below.

### Scale — the most useful number in this teardown

The public weekly leaderboard reports **153 active users this week**, top scorer
at 455 correct answers, #50 at 18. That is the order of magnitude of the
self-described "Sveriges största plattform".

Caveats, stated honestly: late July is deep off-season (HP is 18 oktober), the
board may only count opted-in users, and the iOS app population may not be
fully reflected. Treat 153 as a floor for weekly actives, not a total user
count. Even so — the market leader's active base is in the hundreds, not the
tens of thousands. **10 000 SEK/month is ~78 subscribers at their price, or ~25
at ours.** The category is winnable by a small, sharp product.

Related credibility note: their landing-page testimonials repeat the same three
stock-photo people four times in the carousel, and the claim "6 av 10
Snabblärd-användare höjer sin HP-nivå" carries no methodology. Treat all their
public numbers as marketing.

---

## 1. Surface-by-surface walkthrough

### Onboarding (7 steps, ~8 minutes)

`Välj användarnamn → Vad drömmer du om? → Välj din maskot → Varför just
[program]? → Sätt ditt mål → 12-frågors diagnos → Commitment-skärm → direkt in i
ett quiz`

The first thing the product does after signup is **set up your competitive
identity** (username "visas på topplistan och i matcher", then a mascot). The
leaderboard isn't a feature bolted on; it's the spine.

Then the strongest single move in the whole product: **"Vad drömmer du om?"** —
you pick a *program* (Läkare, Psykolog, Sjuksköterska…), each labelled with its
required HP (Läkare HP 1.70). It then proposes a target *with margin* (1.80),
asks *"Varför just Läkare?"* with six motivation options, and from that point on
every screen frames progress as **gap to the program**, not gap to a number:
*"Du ligger på 1,56 · målet för Läkare: 1,80"*.

The commitment screen ends with a **pre-checked** email marketing opt-in. Minor
dark pattern; also a GDPR question mark for a Swedish AB.

### Diagnos (12 questions, ~7 min, 90s per question)

Immediate but shallow feedback: *"Rätt svar! Bra jobbat!"* or *"Fel, rätt svar
var D. Fortsätt träna!"* — the correct letter, no reasoning, then auto-advance.
Skippable via "Hoppa över".

Two significant findings:

1. **LÄS is not in the diagnostic at all.** The intro screen shows four chips —
   ORD, XYZ, LÄS, KVA — but the actual 12 items were ORD ×2, MEK ×2, NOG ×3,
   KVA ×3, XYZ ×2. The results screen lists ORD / NOG / MEK / KVA / XYZ. LÄS is
   absent, and on the dashboard it sits under *"Testa för att se var du står"*
   with a "Börja träna" placeholder. The obvious reason: a reading passage does
   not fit a 90-second-per-question game format.
2. **The output is a bare point estimate with no uncertainty.** 10/12 correct →
   *"Estimerat HP 1.46"*, presented as a precise number in a hero ring. Per
   *subject* it reports "ORD 100%" — from two questions.

### Quiz (the main loop)

7 questions per set, single subject, per-set countdown (≈45s/question for XYZ,
201s for a LÄS set). One screen per question, 4–5 options, tap to answer.

The feedback loop, precisely:

1. Tap an option → correct/incorrect colours immediately, options lock.
2. A one-line verdict appears: *"Fel, rätt svar var A. Fortsätt träna!"*
3. A **"Visa förklaring (3 kvar)"** button appears for roughly **two seconds**,
   then the app auto-advances to the next question.
4. If you tap it in time, auto-advance stops and a split-screen panel opens:
   **"SIGGE FÖRKLARAR"** — a named mascot coach giving a genuinely well-written
   step-by-step explanation, paginated ("Visa mer · 1 av 2"), with the correct
   option restated below and a "Nästa fråga" button.

The explanation quality is good. Example, verbatim:

> *"Här är det redan höjda priset givet, 552 kr, och vi ska baklänges hitta vad
> varan kostade innan höjningen med 15%. Eftersom 552 är resultatet efter
> höjningen ska man dela bort höjningen, inte lägga på ännu mer. Rätt svar är B
> (480 kr)."*

But it is **metered on the free tier** — the counter went 3 kvar → 2 kvar as I
used them — and it is **offered in a ~2-second window** before the app moves on.
The single most learning-dense moment in the product is opt-in, rate-limited,
and time-boxed.

Leaving a quiz mid-way shows: *"Du har svarat på 2 av 7 frågor. Dina resultat
sparas inte om du lämnar nu."* — **no resume.**

### Quiz completion

Confetti, a streak modal (*"1 dag! Fortsätt så, du bygger en vana!"*), then a
summary: rätt/fel/andel rätt, a per-question strip, **"Gå igenom 4 fel"**
(batched review of wrong answers, on top of the inline feedback), a
school-comparison teaser, and a Snabblärd upsell.

Front and centre: **"DIN HP-POÄNG 1.56 · −0.02 · Föregående: 1.58"** — a live
rating that moves after every 7-question set.

### ORD

Standard HP format: headword, 5 options A–E, tap to answer. Same feedback loop
as everything else. No typing variant, no definition, no example sentence, no
morphology — just the correct letter (plus a metered AI explanation).

Distractor quality is the weak point. Real item from their bank:

> **accentuera** — A framhäva · B tona ner · C dämpa · D dölja · E minimera

Four of five options mean roughly "reduce". The correct answer is the odd one
out and is solvable without knowing the headword. This is the exact
AI-generated-distractor failure mode documented in `analysis/_LAS_analys.md`.

### LÄS

Real past-HP texts (I got "Parkeringsavgiften", a genuine HD-beslut text).
Layout: **text pane on the left, question and options on the right,
simultaneously**. The passage stays open the entire time. 7 questions per set,
~200s total.

So LÄS here is an **open-book find-the-sentence exercise**. No closed-text
retrieval, no gist check, no vocabulary support, no question-type strategy
teaching, no per-type profiling.

### Topplista

Weekly ranking, resets Monday ("nollställs om 2d 22h"), tabs for *Denna vecka /
Streaks / HP-poäng*, filters for *Alla / Ditt mål*. Podium for top 3, "Bli
vänner" button on every row. Ranked by raw correct answers — i.e. **by volume,
not by accuracy or learning.**

### Vänner + Utmana

`Vänner` is a referral loop stated plainly: *"Dela din länk med en kompis som
också ska skriva provet → När de går med via länken blir ni vänner automatiskt
→ Ni ser varandra på veckans lista."* Invitation is the growth engine, and it is
built into the product rather than bolted on as marketing.

`Utmana` adds 1v1 realtime matches, private games, quick match, public games,
subject filters (Alla / Kvantitativ / Verbal) — and **"Arenan"**, a daily
scheduled event at **20:00**, seven questions, one track. A standing daily
appointment, Wordle-style.

### Profil

Analytics surface: HP-poäng, träffsäkerhet, best quiz, per-delprov ratings with
accuracy, "Insikter" naming the weakest subject, trend, strongest subject, and
a **Skola** field powering school-level comparison.

### Paywall — "Snabblärd"

**129 kr/månad**, "Avbryt när som helst", full Stripe checkout embedded in a
modal. No free trial offered anywhere I saw. No term or annual option.

Sold as: obegränsade quizzer · förklaringar på varje fråga · personlig HP-coach
(smart frågeurval) · HP-prognos mot ditt mål · utveckling per delprov.
`HP-simulering` (a full 5-pass mock exam) is Snabblärd-only.

Free-tier limits confirmed: **metered AI explanations** (3/day observed). The
"obegränsade quizzer" bullet implies a daily quiz cap on free as well, which I
did not hit within this session and therefore cannot state as fact.

### Spaced repetition — searched for, not found

No "due today", no review queue, no interval, no card state, no evidence that a
missed item returns on a schedule. What exists instead:

- **"Rekommenderad träning"** — ranks *subjects* by accuracy ("XYZ Behöver
  förbättring") and links to a quiz. Subject-level, not item-level.
- **"Gå igenom 4 fel"** — end-of-quiz review of the wrongs, in-session only.
- **"Snabblärd: smart frågeurval"** — a paid claim of intelligent selection;
  unverifiable from the free tier, but the free product shows no scheduling
  concept at all.

The retention mechanic is **streaks and leaderboard resets**, not spacing.

---

## 2. What they genuinely do better than Fattat

Honestly, and without flattering us:

1. **The onboarding is better than ours, and it's not close.** "Vad drömmer du
   om?" → pick Läkare → we'll tell you it needs 1.70 → let's aim 1.80 → *why*
   does this matter to you → here's your gap. Ours asks for previous HP scores
   and a target number. Theirs attaches the entire product to a want. Every
   later screen is framed as gap-to-dream, which makes the number mean
   something.
2. **Explanation UX.** The split-screen "Sigge förklarar" panel — mascot,
   paginated reasoning, correct answer restated — is a better-designed feedback
   surface than our ORD feedback card. The writing is good. That we give
   explanations away free and they meter them doesn't change that theirs is the
   nicer surface.
3. **Content breadth.** All 8 delprov, real past-exam material at volume,
   already extracted and structured. Our ~877 ORD words + 13 LÄS articles is a
   rounding error next to it. For a candidate who wants one app for the whole
   exam, we are not an option at all.
4. **Distribution is built into the product.** The friend-invite loop, 1v1
   challenges, school comparison and weekly leaderboard mean the product
   recruits for itself. Fattat has no referral mechanic whatsoever — our growth
   plan is entirely "founder posts content later".
5. **The daily appointment (Arenan, 20:00).** A recurring scheduled event is a
   strong, cheap retention primitive. We have notifications that no cron is
   even calling yet.
6. **Native iOS app.** Same account, synced. We're web-only by decision (see
   `MONETIZATION_RESEARCH.md`), but for a 17-year-old "finns den i App Store?"
   is a real objection we currently answer with no.
7. **Visible daily progress.** Every session moves a number and a graph. Ours
   deliberately de-emphasised the HP number after the honesty pass — correct
   scientifically, weaker motivationally. We should acknowledge we paid a real
   cost there.
8. **Design polish.** Confident dark theme, good motion, coherent mascot system.
   Our June design pass closed most of this gap; they are still at least our
   equal on feel.

---

## 3. What they do worse — and what it violates

Mapped against our non-negotiables (`CLAUDE.md` §Non-Negotiable Rules,
`VISION.md` §Product):

| Our rule | HP-spelet | Verdict |
|---|---|---|
| No passive study mode | Retrieval-only quizzes; but LÄS is open-book | **Partial violation** — LÄS is a search task, not recall |
| Question always before answer | Yes, always | **Complies** |
| No hint buttons | Pre-quiz strategy tips ("Testa att sätta in svarsalternativen") shown before the set, not per question | **Borderline, acceptable** |
| No skip on ORD | Diagnosis is skippable wholesale; individual items time out | **Partial** |
| FSRS decides order | Nothing decides order except subject choice | **Absent** |
| Immediate feedback | Correct/incorrect is immediate; **the actual explanation is metered and time-boxed** | **Violation in substance** |
| Interleaving enforced | User picks a single subject per quiz; no interleaving | **Absent** |

The substantive failures:

1. **No spaced repetition.** Their entire schedule is "whatever you feel like
   training today". A word you got wrong on Monday returns only by chance. This
   is the single biggest pedagogical gap and it is the thing we are built on.
2. **The explanation is behind a counter and a two-second window.** This is the
   deepest conflict with our vision: they have deliberately made the *effective*
   path (read why you were wrong) harder than the lazy path (tap through), and
   then charged 129 kr/month to unmake that friction. We hold that the effective
   path must be the default one.
3. **LÄS is barely a product.** Not in the diagnostic; open-book; no gist
   retrieval; no question-type strategy; no vocabulary layer. For an app whose
   name is about the whole exam, the verbal half is thin.
4. **A precision-implying score built on almost nothing.** HP 1.46 from 12
   questions, "ORD 100%" from two, and a rating that visibly moves ±0.02 after a
   7-question set. We removed exactly this in the 2026-05-15 honesty pass. Their
   version is more motivating and less true.
5. **Volume-ranked leaderboard.** Ranking by raw correct answers rewards
   grinding easy questions. It optimises for time-in-app, not score movement.
6. **No resume.** Leave a quiz, lose the answers. Ours resumes daily sessions,
   övningsprov and (since June) the diagnostic.
7. **ORD distractor quality.** AI-generated option sets that are solvable
   without knowing the headword (see `accentuera` above). Our curation standard
   is materially higher; this is where our small corpus is worth more per item
   than their large one.

---

## 4. Pricing and packaging vs our 399 SEK

| | HP-spelet | Fattat |
|---|---|---|
| Model | Subscription, **129 kr/mån**, cancel anytime | One-time **399 kr per provomgång** (~3 månader) |
| Trial | None visible | 7 dagars gratis prov |
| Free tier | Substantial — full question bank, quizzes, leaderboard, 3 explanations/day | Nothing free beyond the trial |
| Scope | All 8 delprov | ORD + LÄS only |
| Paid unlocks | Unlimited explanations, unlimited quizzes, HP-simulering, coach, prognos | Everything |

**Cost for one exam cycle.** A candidate who trains three months pays them
**387 kr** — within 12 kr of our 399. Six months of serious prep costs 774 kr,
nearly double us. So we are *cheaper for the committed student and more
expensive for the dabbler*, which is exactly the segment split we want. Our
price is not the problem.

**The real asymmetry is the free tier, not the price.** They give away a usable
product with a genuinely large question bank and charge for convenience
(unlimited explanations, no caps). We charge for access to a smaller bank. On a
naive feature-count comparison — 25 000 questions across 8 delprov, free, versus
~900 words and 13 articles across 2 delprov, 399 kr — we lose badly, and we will
keep losing that comparison no matter how much content we add. **We cannot win
on breadth and we should stop implicitly competing there.**

What we can win on is the claim they cannot make: *your verbal score moved*.
Which is precisely what 18 oktober exists to produce. Nothing about their
pricing suggests we should change ours; `MONETIZATION_RESEARCH.md`'s Phase-2
test (399/499/599) still stands unmodified.

One packaging idea worth holding for Phase 2, not now: their subscription bills
indefinitely and quietly punishes the student who preps for six months. "399 kr,
en gång, hela provomgången — inget abonnemang som fortsätter dra" is a clean
contrast line for a Swedish teenage audience paying with a parent's card.

---

## 5. The one thing worth stealing

**Program-first goal setting.** Replace "what HP score are you targeting?" with
*"Vad drömmer du om?"* — the student picks a program, we show its typical HP
requirement, propose a target with margin, and from then on every progress
surface reads *"Du ligger på X · målet för Läkare: 1.80"*.

Why this one:

- It costs a static table (program → typical antagningspoäng) and copy changes
  in `src/app/(app)/onboarding/page.tsx`. No architecture, no migration, no new
  content. Days, not weeks.
- It violates none of our rules and doesn't touch the learning engine.
- It fixes a real weakness of our honesty pass. We correctly stopped shouting a
  fake-precise HP number — but we replaced it with *verbal träffprocent*, which
  is honest and emotionally inert. Gap-to-program restores motivational weight
  **without** requiring us to overclaim precision, because the program
  requirement is an external fact we don't have to model.
- It sharpens our own targeting. Our customer is the student whose verbal
  section is dragging a good quant score below a program cutoff. Program-first
  onboarding names that person's actual problem back to them on screen one.

Second-best, if there's appetite later: a **daily appointment** (their Arenan).
Cheap retention, no pedagogy cost. But it needs the push-notification cron that
is still unbuilt, so it's Phase 2 at the earliest.

## …and the one thing to deliberately NOT do

**Never meter, delay, or paywall the explanation.**

Their model — correct/incorrect free, *why* behind a counter and a two-second
window — is the most commercially tempting idea in this teardown. It converts,
because the moment a student wants to understand is the moment they'll pay. And
it is the precise inversion of our vision: it makes the effective path harder
than the lazy path and then sells the fix. If we ever build a free tier, the
feedback moment is the last thing to gate; gate *volume*, never *understanding*.

Runner-up to avoid: **the volatile live HP rating.** Watching a number move
−0.02 after seven questions is engaging and it is noise. We already decided this
in the honesty pass; the temptation will return when we see how good their
dashboard feels. The answer stays no.

---

## 6. Does this change positioning or the launch plan?

**No. Get back to the LÄS bank.**

The full reasoning, so this doesn't get relitigated:

- **They are not a pedagogy competitor.** They compete on engagement,
  competition and breadth. Nobody in this market is doing spaced repetition,
  closed-text retrieval, or interleaving. Our wedge is not just intact, it's
  unoccupied — and the market leader having 25 000 questions and no scheduler is
  positive evidence for the bet, not against it.
- **LÄS is their exposed flank and our deepest investment.** They don't test it
  in the diagnostic, and what they do ship is open-book search. Meanwhile LÄS is
  the section where our 13 articles are painfully few. Every additional article
  widens the one gap they can't easily close — building good LÄS content is slow
  and can't be solved by scraping past exams the way ORD can.
- **The one honest positioning line this session produced:** *"HP-spelet testar
  dig inte ens på läsförståelse i sin diagnos."* Verified first-hand, specific,
  and it lands with exactly our customer. Bank it for marketing v2.
- **Scale reframes the goal, favourably.** ~153 weekly actives at the top of the
  market means 10 000 SEK/month is a few dozen paying users, not a growth-hacking
  problem. That supports the current plan — win on outcome with a small, sharp
  product — over any pivot toward breadth.
- **Nothing here is urgent enough to move a date.** Not the anmälan window
  (11–18 augusti 2026), not HP on 18 oktober, not the våren-2027 monetization
  window. The one thing that would genuinely change our position is a verified
  verbal-delta on the founder's own result, and the only way to get it is to
  keep training in a product with enough content to train on.

**Two things this teardown should actually change, both small:**

1. Program-first onboarding (§5) — queue it behind content, not ahead of it.
2. Add "de testar inte ens LÄS" to the marketing-v2 evidence file when we build
   it after results land (`docs/POST_HP_RESULT_PLAN.md`).

**One thing it should make us slightly more nervous about, named honestly:** we
have no referral mechanic and no distribution plan other than "the founder posts
content after October". They grow through the product itself. That is a real
structural disadvantage and it is not solved by better pedagogy. It deserves a
proper session of its own — after the LÄS bank is deep enough to train on, and
before the våren-2027 window opens.

---

## Method and limits

- One live session, 2026-07-23, on a newly created free account, web only.
- Free tier only. Snabblärd (129 kr/mån) was **not** purchased, so "smart
  frågeurval", the HP-prognos and HP-simulering are unverified claims. It
  remains possible that paid tier contains scheduling logic invisible from free.
- Late July = off-season; all activity and leaderboard figures are lower-bound.
- The iOS app was not tested.
- Free-tier quiz cap not confirmed; explanation cap (3/day) confirmed by
  observation.
- Screenshots and accessibility snapshots from the session are in
  `.playwright-mcp/` (gitignored, local only).
