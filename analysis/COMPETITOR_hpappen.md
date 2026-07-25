# COMPETITOR — hpappen.se

> Hands-on teardown of HP-appen, walked end-to-end in a live browser on a real,
> newly created free account, **2026-07-24**. Screens in
> `analysis/hpappen-screens/`. Read alongside `analysis/COMPETITOR_hpspelet.md`
> (the other incumbent), `docs/VISION.md` and `docs/MONETIZATION_RESEARCH.md`.
>
> **Verdict up front:** this is a far more serious competitor than hpspelet, and
> it is the one that actually overlaps our claimed differentiators. They ship
> spaced repetition on ORD, quoted passage anchors in LÄS solutions, morphology
> teaching, an AI coach, and immediate feedback. Two things did *not* change:
> our LÄS bank is still the binding constraint, and their verbal pedagogy has
> real, verifiable cracks. What did change: **"cognitive-science-grounded" is no
> longer a differentiator we can claim unopposed.** It has to be earned on
> execution, and the execution gap is in LÄS and in error-specific feedback.

---

## 0. What it is, and who runs it

| | |
|---|---|
| Operator | **Edtech Disruptor AB** (magnus@hpappen.se) |
| Founded | 2021. Venture Cup topp-20, Slush, Breakit coverage, Dream Big finalist |
| Team | **7 named people**: founder (Magnus Olsson), CMO/co-founder, CTO, utbildningsansvarig (Jörgen Niklasson, "prisbelönt mattelärare"), frontend dev, product lead, UX designer |
| Scope | All 8 delprov |
| Claimed content | **14 263 uppgifter med lösningar**, 31 kompletta gamla prov (2011→), 133 videolektioner, 20 textlektioner |
| Platforms | Web only (responsive; no native app found) |
| Price | 179 kr/mån (one half of the test) · **299 kr/mån** (allt) · **989 kr / 6 mån** engångsbetalning |
| Free tier | Permanent but tiny: ~100 sample questions total, the single newest exam, 2 intro lessons |
| Spaced repetition | **Yes** — "ORD-lista (med spaced repetition)" |
| Core loop | Pick a delprov → 10-question timed set → immediate solution + AI coach → normerad poäng per delprov |

Their own framing: *"Plugga smartare till högskoleprovet."* The felt product is
a **complete study system**, not a quiz game. Where hpspelet feels like a game,
HP-appen feels like a well-staffed course platform.

### Scale — the numbers that matter

The in-app leaderboards report participant counts, and they are the most honest
figures available anywhere in this market:

| Board | Definition | Participants |
|---|---|---|
| Pluggmaskiner | flest rätta svar **senaste 30 dagarna** | **753** |
| Streakmästare | users with a live daily streak | **281** |

Read that as **~750 monthly actives and ~280 daily-ish actives in deep off-season**
(HP is 18 oktober; this is late July). Caveats: streaks only launched ~63 days
ago, so the streak board undercounts; the boards may exclude opted-out users;
and free users like our test account are included, so these are not paying-user
counts.

Two things follow. First, their public marketing claim of **"20 000+ studenter
årligen"** is a cumulative-registration number, not an active-user number — the
gap is roughly 25×. Treat every public figure of theirs as marketing. Second,
and more usefully: **the category leader has hundreds of actives, not tens of
thousands.** Our test account, one day old with a 1-day streak, ranked **#177 of
281**. 10 000 SEK/month is ~34 subscribers at their 299 kr price, or ~25 at our
399 kr per provomgång. The market remains winnable by a small, sharp product —
but the incumbent here has 7 people and VC-startup credentials, not a hobby
project.

---

## 1. Surface-by-surface walkthrough

### Signup → immediate hard paywall

Email signup is two steps (email, then password). The moment the account exists,
**the app opens `/checkout` with the three pricing plans and no visible skip** —
only a small unlabelled X in the corner (invisible to screen readers; it does not
appear in the accessibility tree at all). A student who does not spot that X
reasonably concludes the app costs money before you can try it.

This is worth dwelling on because their landing page says "Prova gratis" seven
times. There is **no free trial** in the RevenueCat sense. There is a permanently
limited free tier. That is a different, and weaker, promise than ours.

### Onboarding — an 11-task checklist, not a diagnostic

No goal-setting, no program choice, no "when is your exam" question. Instead the
dashboard shows **"Uppgifter att komma igång med — du är klar med 1 av 11"**:

1. Skapa ett konto (pre-checked)
2. A welcome lesson
3. 10 ORD-frågor **utan tidpress**
4–11. 10 timed questions in each of ORD, XYZ, MEK, KVA, ELF, NOG, LÄS, DTK

The payoff is framed explicitly: *"Ta dig igenom alla så får du en poängprognos
på vart du ligger!"* It is a diagnostic wearing a to-do list's clothes, and the
framing is better than ours — it converts an 80-question assessment into eight
small, individually rewarding steps instead of one wall.

The welcome lesson itself is not passive: it ends with a multiple-choice question
(*"Vad tror du är viktigast för att lyckas?"*) with the instruction **"Svara på
frågan, tills du får rätt svar"**. Retrieval practice inside the marketing copy.

Completing it fires a **streak modal**: 🔥 1, "Dag 1 streak!", with a milestone
ladder 3 / 7 / 14 / 30 / 60 / 100 and a progress bar to the next one.

### ORD — the question loop

Layout: word on the left, five options, "Svara" button, AI coach panel on the
right. Each item carries a difficulty chip (Bas / Medel) and a provenance chip
(HT 2018, VT 2019, Våren 2026, or "HP-appen" for self-written). Recommended time
per question is stated up front: **18 sekunder**.

Three mechanics we have explicitly banned:

- **"Jag kan inte detta ord"** — an honest-signal skip button under every ORD item.
- **"Hjälp mig med första steget"** — a hint chip available *before* answering.
- **A question navigator** letting you jump freely between the 10 items.

In fairness, the hint is Socratic rather than an answer-giver. Asked for help on
*slå sina lovar kring*, it replied: *"Steg 1: Känn efter — vad låter rimligt? …
Välj max två bokstäver som du tycker låter rimligast."* That is elimination
coaching, not a giveaway. It still lets a student defer the retrieval attempt,
which is the reason our rule exists.

**Feedback after answering** is a definition, two example sentences with the word
bolded, and a synonym list — all clearly hand-written, not generated. Then three
AI follow-up chips: *"Visa mig ett längre stycke med ordet inkluderat"*,
*"Förklara ordets ursprung"*, *"Förklara felaktiga svarsalternativen"*.

The etymology one is genuinely good. On *okular* it produced a structured answer:
modern meaning → Latin *oculus* = öga → *ocularis* → cognates *binokulär*,
*ocular*. That is the morphology-decode feature from our backlog, shipped, for
every one of 8 285 words, in about four seconds.

### ORD — the defect worth knowing about

**Their feedback does not know whether you got it right.** I answered *slå mynt
av* deliberately wrong (chose "Förgylla"; correct is "Utnyttja"). The panel
showed the identical definition block it shows on a correct answer. No "fel", no
acknowledgment, no explanation of what "förgylla" means or why it lost. The
error-specific teaching only exists if the student thinks to tap a chip.

And when they do tap it, **the AI reads different option letters than the screen
shows.** Verbatim from the "Förklara felaktiga svarsalternativen" response:

> *"Därför är **C) Utnyttja** det som ligger närmast rätt betydelse. […]
> **A) Ersätta** […] **B) Förstärka** […] **D) Förgylla** […] **E) Bearbeta**"*

On screen the options were A) Bearbeta, B) Förstärka, C) Förgylla, D) Ersätta,
E) Utnyttja. **Every letter is wrong** except B, which is right by coincidence.
The AI is being handed the un-shuffled database ordering while the UI renders a
shuffled one. This is exactly the bug class we fixed in our LÄS on 2026-07-24
(`distractor_types` keyed by stored letter, options shuffled at render). Theirs
is live in production, on their flagship AI feature, in the delprov they have the
most content in.

The same mismatch appeared in the pre-answer hint, so it is systematic, not a
one-off.

### ORD — the spaced repetition claim, examined

This is the finding that matters most to us, so it gets stated precisely.

`/plugga/ord` contains a section headed **"ORD-lista (med spaced repetition)"**
with four buckets:

| Bucket | Count after my 10-question session |
|---|---|
| Alla uppgifter | 8 285 |
| **Under inlärning** | **1** |
| **Färdiginlärda** | **9** |
| Sparade uppgifter | 0 |

So: **nine words moved to "färdiginlärd" after being answered correctly exactly
once.** One correct recognition, on a word the student may well have guessed from
five options, and it leaves the review pool. There is no interval, no due date,
no difficulty parameter surfaced anywhere in the UI, and no "kommer tillbaka om
X dagar". Their release notes describe the feature as *"lägg till egna ord att
öva på i din Spaced Repetition-ordlista"* — a manually curated list, closer to a
flashcard deck with a learned/not-learned flag than to a scheduler.

There is corroborating evidence from their own users. In their in-app community,
a user named Ludvig writes:

> *"Det var ett tag sedan jag övade ord och därför har en lista på 900+ ord
> byggts upp för spaced repetition. Det är för många för att jag ska kunna ta mig
> igenom, finns det något sätt att återställa de orden…"*

That is the classic un-scheduled-backlog failure: the list grows without bound,
there is no daily quota, no way to reset, and the fix HP-appen's founder offers
is manual (*"markera som klara… välj 'Jag kan redan ordet'"*). FSRS with a bounded
daily queue exists precisely to prevent that state.

**Honest conclusion:** they have spaced repetition in the marketing sense and a
binary learned-flag in the engineering sense. We have a real scheduler. But the
words "spaced repetition" now appear in a competitor's UI, in their release
notes, in a lesson title (`ORD → Spaced Repetition`, Premium) and in a blog post
on their marketing site. **We can no longer sell the concept. We have to sell the
difference, in outcomes a student can feel.**

### LÄS — better than expected, and the flank is narrower than we thought

Two-column serif layout, highlighter and pen tools, a 22-minute countdown per
text, a 1–4 sub-question navigator. Their LÄS corpus is **1 080 uppgifter, 100 %
"från gamla prov"** — no self-written articles at all, confirmed on both the
marketing site and the in-app content table. The text I drew was *Hår* (VT 2023,
~1 100 words, byline Annika Lund), i.e. a genuine past-exam text.

Feedback is deferred to the end of the 4-question block (Premium users can toggle
"rätta direkt" per their release notes) and is **strong**. For the question about
hair analysis vs blood tests, the solution opened with two verbatim quotes pulled
from the text —

> *"Ett hårprov bryts därför ned mycket långsamt…"*
> *"Ett blod- eller urinprov kan endast ge en ögonblicksbild från provtillfället."*

— then explained the reasoning in plain Swedish (ögonblicksbild vs tidslinje).
That is our `passage_anchor` + `explanation` pattern, and theirs is written at
least as well as ours.

**But the advertised citatmarkör is broken.** Their release notes promise
*"Citatmarkör i lösningar för LÄS och ELF: se direkt vilken eller vilka meningar
som avslöjar rätt svar"*. Tapping the chip **"Var hittar jag meningarna i
lösningen"** returned:

> *"Jag hjälper dig att hitta det i texten, men jag behöver först se själva texten"*

The AI does not have the passage in context. The headline LÄS feature, shipped
63 days ago, fails on the first article a new user opens. Same root cause as the
ORD letter bug: the AI layer is not wired to the content layer.

### Score prediction — fast, and not credible

After **four** LÄS sub-questions (all correct) and nothing else, `/plugga`
reported my **LÄS normerad poäng as 2.0** — the maximum on the scale. Meanwhile
ORD sat at 0.0 despite 9/10 correct, because the untimed onboarding set does not
count toward the prognosis. A student who does one text and glances at their
dashboard is told they are at the ceiling in reading comprehension.

They are aware of the general problem, and their own explanation of "Skapa eget
prov" shows real sophistication about it:

> *"När du gör ett gammalt prov kan det hända att du återser frågor du redan har
> gjort. Men så fungerar det inte på det riktiga högskoleprovet. […] När alla
> frågor är nya för dig blir din resultatprognos mer realistisk."*

Generating a personalised exam of only never-seen questions to keep the estimate
honest is a good idea we do not have. It sits next to a 4-question 2.0.

### Provpass — the best-executed surface in the product

Choose gamla prov or a generated one → **digitalt eller på papper** (print a PDF,
fill in answers in the app, get it graded and normed) → choose provpass → choose
**normal tid 55 min or förlängd 80 min** (dyslexia). Then a faithful exam
runner: 40 questions, live countdown, "Markera" to flag, "Lämna in", helskärm.

After submission: råpoäng, normerad poäng, a per-delprov table (ORD/LÄS/MEK/ELF),
and full "Till rättning" review with per-question time and solutions. Their free
tier includes the most recent exam (Våren 2026 April) in full — the rest are
Premium.

Their newest exam is **April 2026, already in the app**. Ours is a corpus of 18
self-written LÄS articles.

### Provpass — the answer button is dead on ELF (2026-07-25, confirmed client-side)

Founder ran an ELF block to diagnose his own weak delprov and **could not submit
answers: tapping "svara" did nothing**. He worked around it by answering five
items on his own and grading them outside the app.

This lands on the surface this teardown calls their best-executed one, on the
core interaction of a 299 kr/mån product. DevTools was run on the failing path
(`/hem` → `/plugga` → `/plugga/elf` → `exercises?category=ELF`) and settles what
it is:

- **Console: no exception.** Only Chrome's own `beforeinstallprompt` notice and a
  leftover `build api check called from component` debug log shipped to
  production. Their code does not throw.
- **Network (Fetch/XHR): nothing but PostHog.** Every request on the path is
  `/e/?…ver=1.396.2&compression=gzip-js`, 0.1 kB, 200. **No call to their own
  backend fires on click.**

**So it is not the paywall.** The obvious alternative reading was an entitlement
gate rendering as silence (their free tier carries only the newest exam in full,
older provpass are Premium), but a 401/403 requires a request, and no request is
made. The failure is client-side, in their code.

One honest caveat: if their provpass runner buffers answers locally and syncs
only at submission, absent network traffic would be normal and the defect would
instead be the UI failing to advance. Both readings put it in their frontend, and
neither is a paywall.

The detail worth keeping: **their PostHog events did fire on the click.** Their
own instrumentation is recording users pressing svara and not progressing. The
data showing this is already in their funnel.

Still n=1, one device, one session.

**Unrelated but from the same capture:** they intercept Chrome's PWA install
prompt with `preventDefault()` and then never call `prompt()` on this path. They
are a web app, same as us, and they are leaking installs. Relevant next time the
"should we build a native app?" question comes up (`docs/MONETIZATION_RESEARCH.md`).

**Separate from all of the above — ELF is our worst content asymmetry, not our
best.** Every file in our `Past_hp/` is "utan-elf" because the archived provpass
UHR keeps online have the English texts stripped (third-party licensed). The
first draft of this entry concluded from that that nobody can seed ELF and the
starting line is therefore level. **That was wrong.** Founder (2026-07-25):

> UHR does release the ELF part, but only during roughly the first week after
> each sitting. After that it comes down and only the redacted version remains.

That inverts the finding. ORD and LÄS from past exams stay downloadable forever,
so their corpus advantage there is one we can close whenever we spend the time.
**ELF is a closing window, once per sitting, and every window before now is gone
permanently.** hpappen has been operating for years, so they plausibly hold every
ELF block from every sitting in that span. We hold zero, and no amount of work
recovers them.

**The action this creates, and it is dated.** The founder sits HP on **18 oktober
2026** and the ELF texts go up in the week after. Capturing them is free, it is
the first brick in an ELF corpus, and missing it costs another six months.

- Verify the exact publication window *before* 18 okt, not after. "Roughly a
  week" is founder recollection; if it is three days, a plan built on seven
  misses it entirely.
- Then capture every sitting from here on. This is a standing calendar item, not
  a one-off.

MEK is unaffected by any of this and remains genuinely level: it is in every
archived provpass we already hold.

### Community, streaks, leaderboards

They moved their community **from Discord into the app** 18 days ago. It is real
and staffed: the founder answers by name within a day, often within hours. It is
also the single richest source of competitive intelligence available on this
market, because it is users describing what is not working. Three posts worth
quoting:

> *"Jag är stark på allt med läs, ord och engelska när jag gör hela prov. Men
> mattedelen bryter ner mig. Och jag tycker inte att HP-appen hjälper mig att
> studera effektivt för HP."*

> *"Jag är bra på mattedelen men jag fattar inte hur jag kan bli bättre på
> verbala delen, jag får knappast någon framgång. […] Just nu gör jag bara
> övningar på alla 4 verbala delar och läser det AI:n förklarar när jag har fel,
> men det känns inte som jag förbättras mycket."*

That second one is **our exact target customer, inside our competitor's product,
saying the product is not working for them.** The staff answer was: do the
courses, analyse your errors deeply, mängdträning comes later, *"sen tar den
verbala delen tid, det är bara så."*

And a coverage claim to be aware of:

> *"Min vän berättade att 18 av 20 ORD-ord på det senaste högskoleprovet fanns
> med i HP-appen. Stämmer det?"* — answered *"Det varierar mellan varje prov! Men
> vi försöker alltid uppdatera listan…"*

Vocabulary **coverage** is their ORD pitch: 8 285 words means the odds that a
real HP word appeared in your practice are high. That is a volume argument, and
it is a strong one against our curated corpus. Our counter is not volume, it is
retention — but we have to be able to say so with evidence.

Also notable: a staff post teaching daily-habit formation is, almost word for
word, **implementation intentions** — *"Klockan 19:00 sätter jag mig och pluggar
i 30 minuter"*, start small, fixed weekday plan (Måndag: ORD, Onsdag:
Läsförståelse…), don't break the chain. The cognitive-science playbook we built
into the product, they publish as advice.

### Profile

Anonymity controls (dölj profilbild / dölj namn — offered proactively in a modal,
because leaderboards expose your name), **dyslexi → förlängd tid**, sound toggle,
auto theme, account deletion. They ask for **fakultet** ("Vilket område siktar du
på?" — 12 options) but never for a program or an antagningspoäng target. Our
planned program-first onboarding is still unclaimed territory, in a weaker form.

### Mobile

Bottom tab bar, single-column LÄS with a "Visa uppgift" toggle to swap between
text and question, clean typography. It is good. Mobile-first is not a
differentiator against this competitor; it is table stakes.

---

## 2. What they genuinely do better than Fattat

1. **Content volume, by two orders of magnitude in LÄS.** 1 080 LÄS questions vs
   our 18 articles. 8 285 ORD vs our ~880. This is not close and it is the whole
   ballgame for a student choosing between us.
2. **Exam simulation.** Paper mode, extended time, per-provpass normering, flag
   for review, generated exams of unseen questions. We have övningsprov; this is
   a tier above.
3. **Teaching, not just testing.** 133 video + 20 text lessons by a named,
   credentialed teacher. We have zero explicit instruction — deliberately, but a
   student who does not know *how* to attack a LÄS text gets nothing from us.
4. **The AI coach, when it works.** Etymology on demand for 8 285 words is our
   morphology backlog item, live.
5. **Onboarding framing.** 11 small tasks with a stated payoff beats one long
   diagnostic.
6. **Community as a moat and a research channel.** Staffed, in-app, and it tells
   them what to build next.
7. **Provenance labelling.** Every item is tagged with its source exam and a
   difficulty chip. Cheap trust, and we do not do it.

## 3. What they do worse — and where our rules are vindicated

1. **Feedback is not error-specific.** Identical panel whether you were right or
   wrong. Our `distractor_types` per wrong answer is a real advantage, and it is
   the single clearest pedagogical gap in their product.
2. **The AI is not wired to the content.** Wrong option letters in ORD;
   no passage access in LÄS, so the flagship citatmarkör fails outright.
3. **Spaced repetition is a flag, not a scheduler.** Nine words "färdiginlärda"
   after one correct answer. Their own user with a 900-word unmanageable backlog
   is the proof.
4. **Score prediction is not calibrated.** 2.0 in LÄS off four questions.
5. **No interleaving, no session design.** The student chooses a delprov and
   grinds it. Nothing sequences ORD before LÄS, nothing balances the week,
   nothing stops a 350-question day. Our enforced session shape is a genuinely
   different product philosophy.
6. **Streak-loss pressure.** Milestone ladder, public streak leaderboard, name
   exposed by default. Non-Negotiable Rule #7 exists for this.
7. **The paywall lands before any value.** Checkout screen on signup, with an
   unlabelled close button.
8. **All LÄS content is past exams.** Finite, and every serious candidate has
   already seen those texts elsewhere for free. Self-written LÄS articles are a
   thing neither incumbent does.

---

## 4. Pricing vs our 399 kr per provomgång

| | HP-appen | hpspelet | Fattat |
|---|---|---|---|
| Entry | 179 kr/mån (half the test) | 129 kr/mån | — |
| Full | **299 kr/mån** | 129 kr/mån | **399 kr per provomgång (~3 mån)** |
| Best value | **989 kr / 6 mån** (≈165/mån) | — | — |
| Free | ~100 questions, permanent | limited | **7 dagars full access** |
| Guarantee | Resultatgaranti, max 1 500 kr | — | — |

A student preparing for one sitting spends roughly **900–1 200 kr** with
HP-appen (3–4 months at 299, or the 989 kr bundle). Our 399 kr is **less than
half**, for the same window. That is a much stronger price position than the
per-month comparison suggests, and the 989 kr bundle proves the market accepts
per-provomgång packaging — our locked pricing decision is validated by the
category leader's own "mest populär" plan.

Two details to use:

**The resultatgaranti is close to unclaimable.** The terms (`/villkoren`) require
completing 80 % of all lessons, answering 80 % of exercises across seven delprov
correctly (retries allowed), **40 % of the ORD bank correctly — ~3 300 words**,
registering for the *next* exam and sending proof. Refund capped at 1 500 kr. It
is a marketing instrument, not a promise. We should not copy it, and we should
not be intimidated by it.

**"Avsluta när du vill" is not what the terms say.** The pricing page and
checkout both say cancel anytime; `/villkoren` says *"En uppsägningstid om 30
dagar gäller."* A one-time purchase with no subscription at all — ours — is a
cleaner promise, and it is the honest kind of differentiation.

---

## 5. What this changes

**It does not change the vision, the pedagogy bet, or the pricing.** It changes
three things.

**(1) The differentiation claim has to be rewritten.** "Cognitive-science-grounded
learning design" is no longer ours alone — they say spaced repetition, they teach
implementation intentions, they give immediate feedback. What is still uniquely
ours, and defensible because it is *architecture* rather than a feature they can
add in a sprint:

- **A real scheduler** (FSRS with a bounded daily queue) vs a learned/not-learned
  flag that produces 900-word backlogs.
- **Error-specific feedback** — we tell you why *your* wrong answer was wrong.
- **Session design** — enforced ORD→LÄS interleaving, one article, a bounded
  day. They have no session concept at all.
- **Self-written LÄS content** — an infinite corpus vs a finite one both
  incumbents have exhausted.

That last one is the reason the LÄS bank remains the top priority. It is not
just our own dogfooding constraint; it is now the only content axis where we can
credibly be *better* rather than smaller.

**(2) LÄS is a narrower flank than the hpspelet teardown suggested.** hpspelet's
LÄS is weak. HP-appen's is good: real texts, quoted anchors, well-written
solutions, highlighter tools. Our LÄS advantage is not "we do LÄS and they
don't" — it is (a) fresh texts they cannot produce, (b) per-distractor
explanations they do not write, and (c) their citatmarkör being broken today.
The marketing line has to be specific enough to survive a student trying both.

**(3) Their community is a standing research feed, and it should be read
regularly.** It already gave us: the verbal-plateau complaint from our exact
target customer, the SR-backlog failure, and the ORD-coverage pitch. Reading it
monthly costs nothing.

### One thing worth stealing

**Provenance and difficulty chips on every item** ("HT 2018", "Bas"/"Medel"). It
costs almost nothing — we already know the source of every past-HP ORD row — and
it buys trust immediately: the student can see the question is real. Our corpus
split (past-HP items are övningsprov-only) even makes it more meaningful for us
than for them.

### One thing to deliberately NOT do

**Do not add a hint chip, a skip button, or a public streak leaderboard because
HP-appen has them.** Their leaderboard is the reason they needed an anonymity
modal on day one. Their hint chip is the reason a student can defer every
retrieval attempt. Rules #1, #2, #3 and #7 are the product.

---

## Method and limits

One session, ~35 minutes, on a **free** account created by the founder on
2026-07-24. Desktop 1366×900 plus a mobile pass at 390×844. Walked: landing page,
pricing, signup, checkout, dashboard, welcome lesson, ORD (10 questions, one
deliberately wrong), LÄS (one text, 4 questions), one verbal provpass from
Våren 2026 with grading and review, ORD-lista, community, profile, terms.

**Not seen, because they are behind the paywall:** the 133 video lessons, the
"ORD-träning i dialog" AI drilling mode, the Premium "rätta direkt" toggle, the
majority of the 14 263-question bank, and any long-run behaviour of the SR list
(the 900-word backlog is a user report, not something observed). No purchase was
made. The 753 / 281 leaderboard figures are as displayed in-app on the day.
