# LEARNING_SCIENCE.md — Research Foundation for the Learning Engine

> Companion to `MONETIZATION_RESEARCH.md`, but for pedagogy. Read this before
> any decision that touches session design, feedback flows, FSRS settings, or
> "should we add feature X to make users learn better?" Last updated 2026-06-10.

---

## Why this doc exists

Fattat's differentiator is *cognitive-science-grounded learning design*. That
claim only holds if features trace back to actual evidence, not vibes. This doc
records what the evidence says, what we shipped because of it, and what we
deliberately did NOT build.

---

## Part 1 — Reading comprehension (LÄS)

### Finding 1: Self-explanation is one of the strongest known interventions

A meta-analysis of 64 studies / ~6,000 participants (Bisra et al. 2018,
*Educational Psychology Review*) found prompted self-explanation improves
learning with **g ≈ 0.55** — comparable to mastery learning and peer tutoring.
The effect holds across text study, not just problem solving. The key
mechanism: generating an explanation yourself beats being given one.

**Shipped:** the gist-retrieval gate (`GistCheck`). After reading a lång
article in a daily session, the user writes the huvudtanke in one sentence
*from memory* before any question appears. Never graded — generation is the
intervention. Lång articles only (kort articles are too short to have a
situation model worth retrieving).

### Finding 2: Weak readers don't know when they've misunderstood

The metacomprehension literature (Thiede et al.; 2022 meta-analysis "Mind the
Gap") shows judgment accuracy of one's own comprehension is poor by default
(gamma ≈ .27 across studies) — readers press on, confident, while
misunderstanding. Two evidence-backed levers:

1. **Delayed generation**: writing keywords or a summary *after the text is
   closed* lifts metacomprehension accuracy dramatically (gamma .70 vs .37 in
   Thiede's delayed-keyword studies) because the judgment is then based on the
   situation model, not surface familiarity. Better calibration → better
   regulation → measurably better test performance.
2. **Confidence judgments with immediate feedback**: making a confidence call
   and instantly seeing the outcome trains calibration. The diagnostic moment
   is *confident-but-wrong* — that's where the user's model of the text and
   the text itself diverge.

**Shipped:**
- The gist gate doubles as delayed generation (text closed, summary from memory).

**Built but disabled (founder decision, 2026-06-10):** a per-question
confidence tap (`Säker / Osäker / Jag gissade`) with säker-men-fel feedback
callouts. Fully implemented behind `askConfidence` on `LasQuestion` +
`session_responses.confidence` (migration 023), enabled nowhere. Reason: the
extra tap degrades UX, and "how confident was I?" is itself a fuzzy judgment
to demand on every question. The evidence is real but the cost landed on the
wrong side — calibration training must not tax every single answer. If
revisited: sample a few questions per week, or attach it only to huvudtanke
questions after the gist gate. Do not re-enable without founder sign-off.

### Finding 3: Strategy instruction transfers across texts

Reading-strategy instruction (finding the line that forces an inference,
checking both halves of a comparison, separating author stance from reported
views) has consistent meta-analytic support, especially for adolescent readers.
Distractor-specific hints tell the user why *this* option was wrong; strategy
tips teach the move for the *category*.

**Shipped:** `TYPE_STRATEGIES` in `LasFeedback` — one HP-specific strategy line
per question type (huvudtanke, detalj, syfte, slutledning, jämförande,
ståndpunkt), shown on wrong answers only.

### Considered and NOT shipped (with reasons)

- **Prequestions (showing question stems before reading).** Pretesting
  research shows prequestions guide attention and can match or beat
  post-testing — but effects on *untested* material are mixed for text
  reading, and it would train a question-hunting reading style in the learning
  surface. Övningsprov already covers exam-strategy practice. Revisit as an
  A/B once Phase 2 has users.
- **Grading the gist sentence (NLP similarity).** The evidence is for the act
  of generating, not for being scored on it. Grading adds failure modes
  (false negatives in Swedish paraphrase) with no documented upside.
- **Text visible during questions.** Current answer-from-memory design is
  retrieval practice (harder = better encoding); the real exam allows
  re-scanning, which övningsprov can later mirror. Deliberate split.

---

## Part 2 — FSRS (ORD)

### Finding 4: "Hard misuse" is the one habit FSRS cannot adapt to

FSRS docs and the Anki/FSRS community are explicit: FSRS adapts to almost any
grading habit *except* systematically rating recalled-with-normal-effort
answers as Hard. Hard must mean "recalled with difficulty"; misuse suppresses
intervals and inflates workload, and optimizer-fitted parameters inherit the
distortion.

**Bug we had:** `ratingFromAnswerWithLatency` used one set of thresholds
(Easy < 2s, Hard > 7s) for both MCQ taps and typed answers. Typing a Swedish
synonym on mobile takes ~3–5s of motor time alone, so correct typing answers
were routinely rated Hard — an automated Hard-misuse machine for every
graduated word.

**Shipped:** format-aware thresholds (typing: Easy < 6s, Hard > 15s; MCQ
unchanged). The server infers format from `mcq_correct_streak` (< 2 = MCQ),
the same predicate the UI uses — nothing client-supplied to trust.

### Finding 5: Per-user parameter optimization is FSRS's biggest upside

Default FSRS parameters are population-level. Fitting parameters to a user's
own review log (~400–1,000 reviews) measurably improves scheduling. The
optimizer needs a faithful review log: timestamps + the rating actually
applied.

**Shipped:** `session_responses.fsrs_rating` (migration 023) now records the
applied rating (1=Again, 2=Hard, 3=Good, 4=Easy) at review time. Previously the
rating was only re-derivable from latency — which breaks the moment the
mapping changes (as it just did).

**Backlog (trigger: any user crosses ~1,000 logged ratings):** run the FSRS
optimizer (fsrs-rs-nodejs or the Python optimizer) over per-user logs and
store per-user parameters. Until then, defaults + exam-aware retention targets
(already live) are the right call.

### Already aligned with the evidence (no change needed)

- Exam-aware `request_retention` (0.90 → 0.82 as the exam approaches) — the
  research consensus is that desired retention is the single most important
  FSRS setting; ours is deadline-aware, which no competitor does.
- Retrieval-only practice, MCQ→typing graduation gate, forced-engagement
  feedback, interleaving — all consistent with the testing-effect and
  desirable-difficulties literature already cited in CLAUDE.md.

---

## Feature → evidence map (quick reference)

| Feature | Evidence base | Where |
|---|---|---|
| Gist-retrieval gate (lång articles) | Self-explanation g≈.55; delayed-summary metacomprehension effect | `src/components/las/GistCheck.tsx` |
| Confidence tap + säker-men-fel callout | Metacomprehension calibration training | `LasQuestion.tsx`, `LasFeedback.tsx`, migration 023 |
| Per-type strategy tips on wrong answers | Reading-strategy instruction meta-analyses | `LasFeedback.tsx` |
| Format-aware FSRS ratings | FSRS Hard-misuse guidance | `src/lib/fsrs/engine.ts`, `api/fsrs/review` |
| FSRS rating log | Per-user parameter optimization prerequisite | migration 023, `api/fsrs/review` |

## Sources

- Bisra, Liu, Nesbit, Salimi & Winne (2018), *Inducing Self-Explanation: a Meta-Analysis*, Educational Psychology Review — https://link.springer.com/article/10.1007/s10648-018-9434-x
- Thiede, Anderson & Therriault — delayed-keyword effect on metacomprehension — https://www.researchgate.net/publication/7378587_Understanding_the_Delayed-Keyword_Effect_on_Metacomprehension_Accuracy
- *Mind the Gap* meta-analysis of metacomprehension accuracy & interventions (2022) — https://www.researchgate.net/publication/360895688
- Why delayed summaries improve metacomprehension — https://www.sciencedirect.com/science/article/abs/pii/S000169180700128X
- Prequestioning & pretesting review (2023), Educational Psychology Review — https://link.springer.com/article/10.1007/s10648-023-09814-5
- FSRS tutorial & optimal retention wiki — https://github.com/open-spaced-repetition/fsrs4anki/blob/main/docs/tutorial.md, https://github.com/open-spaced-repetition/fsrs4anki/wiki/The-optimal-retention
- FSRS Hard-button misuse guidance — https://anki-decks.com/blog/post/anki-fsrs-explained/
