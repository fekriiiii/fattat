# Fattat — Product Brief

> Swedish slang for "got it." A focused study tool for the verbal section of Högskoleprovet.

---

## What Fattat Is

Fattat is a web app that helps Swedish students prepare for the verbal half of Högskoleprovet (HP) — specifically:

- **ORD** (ordförståelse) — vocabulary questions
- **LÄS** (svensk läsförståelse) — reading comprehension questions

It does **not** cover math, MEK, or ELF in version 1.

**The core insight:** Every existing paid tool is weak on verbal, and no free tool has invested in it seriously. Fattat owns that gap — not by having more content, but by being built around how memory and learning actually work.

**Positioning:** *The focused tool for the verbal section of Högskoleprovet — curated vocabulary, real reading practice, and a daily habit built on learning science.*

**Taglines to test:**
- "Fatta provet."
- "Fattat HP."
- "Få stenkoll. Skriv vasst."

---

## Who It's For

Swedish students aged 15–28 preparing for Högskoleprovet who want to improve their verbal score. They:

- Study alongside school or work
- Are phone-first (used to apps like Duolingo and Kahoot)
- Have 15–20 minutes per day to give, not hours
- Have tried free tools and found them shallow
- Are willing to pay 99 kr/month **if the product clearly works**

---

## Market Context

### Paid competitors
| Tool | Price | Main weakness |
|---|---|---|
| HPguiden | 2 999 kr/year | Annual lock-in, reputation issues on Reddit |
| HP-appen | 149–249 kr/month | Verbal is weak, no spaced repetition |
| fatta.ai | Varies | AI-first generalist, HP is a side feature |

### Free competitors
| Tool | Weakness |
|---|---|
| studera.nu | Past exams only, no guidance or tracking |
| Anki/Quizlet community decks | Community-built, low quality, no HP-specific design |

**None of them have designed verbal learning around cognitive science.** That is the entire product differentiation.

---

## Pricing and Launch Model

### Free until 18 oktober 2026 (höst-HP)
All features are fully free during the launch phase. This is not a trial — it is a deliberate community-first launch. The framing: *"Gratis för tidiga användare till höst-HP 2026."*

This creates an honest, exam-anchored deadline rather than an arbitrary countdown.

### After 18 oktober 2026 — two tiers

**Free tier (permanent):**
- Diagnostic (one-time, full)
- 5 ORD words per day
- 1 LÄS unit per week
- Basic progress dashboard
- Implementation intention setup and push notifications

**Paid tier — 99 kr/month, no commitment, cancel anytime:**
- Full FSRS ORD deck — all words, full spaced repetition
- Daily LÄS units
- Weekly exam-mode session (mandatory — timed, no feedback during)
- Weakness detection and targeted mini-decks
- Predicted score range and goal gap dashboard
- Study partner sharing (private, one-to-one)

99 kr/month undercuts every paid competitor. No annual lock-in, ever.

---

## Learning Design — Non-Negotiable Principles

These are not features. They are design constraints that every decision must respect. They are grounded in cognitive science research and are what make Fattat different from content-delivery tools.

### 1. Retrieval practice over passive study
There is no passive mode. Students always see the question first and attempt an answer before seeing any answer. This applies to both ORD and LÄS. The testing effect has a consistent effect size of g = 0.50–0.61 across meta-analyses. Re-reading produces illusions of learning without durable retention.

> **What this means in the app:** No "preview" or "study" mode. Every session is a test.

### 2. Spaced repetition for ORD
The ORD module uses **FSRS** (Free Spaced Repetition Scheduler). This is the memory engine — it adapts review intervals to individual memory strength, scheduling each word for review just before it would be forgotten. Words are never "completed" — they cycle indefinitely at appropriate intervals.

> **What this means in the app:** The algorithm decides which words appear each session, not a simple queue or random selection.

### 3. Immediate corrective feedback
After every single question — ORD or LÄS — the correct answer is shown immediately with a brief explanation. For LÄS questions, the feedback includes a pointer to the specific passage in the article that contains the answer. Feedback is never delayed to the end of a session.

> **What this means in the app:** No "reveal all at end" design. One question, one answer, one explanation, move on.

### 4. Interleaving enforced
Every daily session mixes ORD and LÄS. Users cannot spend an entire session on one module. The default structure is ORD first, then LÄS, within every session. Within ORD, words from different domains (juridik, medicin, allmän, etc.) are mixed — not grouped.

> **What this means in the app:** The session controller enforces interleaving. No module-select screen at session start.

### 5. Desirable difficulty — no hints
ORD distractors are deliberately tricky near-synonyms. LÄS questions require close reading. There is no hint button anywhere in the app. When sessions are hard, the app frames this positively.

> **What this means in the app:** No hint feature, no "skip" on ORD questions, difficulty framed as positive signal.

### 6. Implementation intentions for habit formation
During onboarding, after the diagnostic and goal-setting, the app captures: (1) exam date, (2) target score, (3) a specific study time and cue ("after dinner", "on the bus"). A push notification fires at the exact chosen time. The notification uses if-then framing: "Det är 21:00 — dags för din Fattat-session."

> **What this means in the app:** Onboarding must capture time + cue, not just exam date. Push notifications are personalised to the chosen time.

---

## ORD Module

Each question matches HP format exactly:
- Target word shown (with an example sentence)
- Five options labeled **A–E**
- One correct synonym, four tricky distractors
- Options shuffled randomly each time the question is shown

**Session behaviour:**
- FSRS determines which words appear — not a queue
- New words introduced gradually (default ~5/day)
- After each question: correct answer + one-line explanation of why the correct synonym fits and why the closest distractor does not
- **Weakness detection:** when a word is missed 3+ times, it surfaces in a mini-deck at the start of the next session — unpredictably (variable reward mechanic)
- Words from different domains are mixed, never grouped

**Word domains:** juridik, medicin, kultur, vetenskap, samhälle, ekonomi, allmän

**Difficulty levels:** 1 (common academic), 2 (medium), 3 (rare/very academic)

---

## LÄS Module

**Real HP LÄS structure — the app must replicate this exactly:**
Each daily unit has 3 texts with 10 questions total, distributed **2 + 4 + 4**. The short text (2 questions) comes first, followed by two long texts (4 questions each).

**Question format:** 4 options labeled A–D (never 5). One correct.

**Question types:**
- huvudtanke (main idea)
- detalj (detail/causal)
- syfte/funktion (purpose of a textual element)
- slutledning (inference)
- jämförande (comparative — used for two-voice or poem+prose texts)
- ståndpunkt (does the author take a position?)

**Reading view:**
- Article text displayed in full with vocabulary words highlighted — tap to see definition
- Reading timer visible — shows elapsed time and estimated words/minute pace
- Questions appear after the full text is shown — no mid-text interruption
- After each question: correct answer + the specific passage highlighted in the text

**Weekly exam-mode session (paid tier):**
- One full unit, strict 22-minute timer, no feedback during the session
- Feedback shown only after all 10 questions are submitted
- Replicates real HP time pressure

---

## Diagnostic and Study Plan

Available free on signup. This is the acquisition magnet — it demonstrates product value before asking for commitment.

**Flow:**
1. 10 ORD questions (spread across difficulty levels and domains)
2. 10 LÄS questions (one short text + one long text)
3. Results: estimated current score range, weakest ORD domains, weakest LÄS question types
4. Exam date input (required)
5. Target score input (required)
6. Implementation intention: specific study time + cue
7. Output: personalised 8-week study plan

The study plan updates dynamically as actual performance data comes in. It is not static after generation.

---

## Progress Dashboard

- **Predicted score range** — updated based on FSRS performance and LÄS accuracy
- **Score gap to target** — visible, closes as user improves
- **Exam countdown** in days with a weekly specific goal ("Den här veckan: repetera 40 ord och läs 2 texter")
- **Streak display** — shown as "days this month" alongside current streak count
- **Domain weakness map** — which ORD domains and LÄS question types need work
- **Weekly summary** — accuracy trend, difficulty trend, session consistency

---

## Habit Mechanics

### Streaks
- Minimum to maintain streak: 5 ORD questions (< 3 minutes) — lowers barrier on hard days
- Target session: 15–20 minutes mixing ORD and LÄS
- **One automatic streak freeze per week** — no purchase, no request needed
- Broken streak messaging: *"Du har studerat X av de senaste Y dagarna"* — never *"Du tappade din streak"*
- Streak display: current streak + monthly consistency view side by side

### Notifications
- Push notification fires at the exact time the user chose during onboarding
- If-then framing: *"Det är [tid] — dags för din Fattat-session. 15 minuter."*
- Second notification if session not completed 2 hours after the first — once only, not persistent

### Study partner (optional)
- Opt-in during onboarding — not surfaced aggressively
- User can share a weekly summary link — recipient sees streak + weekly accuracy, no account needed
- Entirely private — no public profiles, no leaderboards, no community

---

## Platform

Mobile-first responsive web app. Built for small screens from day one — not retrofitted later.

Native iOS/Android only after clear user demand (500+ users asking). Not a v1 concern.

---

## Voice and Tone

Fattat is confident, direct, and treats users as capable adults. It does not condescend, does not over-explain, and does not use corporate language.

- **Swedish throughout** — no English in the UI
- **Tone:** like a smart friend who knows how to study, not a teacher
- **Difficulty framed positively:** *"Det var en tuff session — det betyder att du lär dig"* — not *"Du hade en svår dag"*
- **Failure messaging** is honest and forward-looking, never shaming
- The name Fattat should feel earned — the product should make users feel like they actually *"fattat"* something by the end of each session

---

## What NOT to Build in v1

These are firm exclusions:

- Math, DTK, KVA, NOG, XYZ — any quantitative content
- MEK (meningskomplettering) — verbal but out of scope for v1
- ELF (engelsk läsförståelse) — out of scope for v1
- AI tutoring chat or AI-generated explanations
- Video content
- Native iOS or Android apps
- Public social features: leaderboards, community forums, public procfiles
- Hint buttons anywhere in the app
- A passive "study mode" where answers are shown without testing
- Annual subscription or multi-month lock-in pricing
