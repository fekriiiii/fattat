# ORD Morphology Analysis — Can We Teach Students to Attack Unknown Words?

> Created 2026-06-16. Source: full sweep of all 877 rows in `ord-database.csv`.
> Question driving this: the SAT-vocab method (learn roots/prefixes so you can
> decode a word you've never seen) — does it transfer to Swedish HP ORD, and on
> *how much* of our actual corpus would it actually help?

---

## Why this exists

We made a deliberate decision (the corpus split, 2026-05-30) that daily practice
uses curated words while **övningsprov and the real exam always throw novel words**
at the user. We even built a screen that says exactly that — *"du möter alltid
okända ord."* But that screen *names* the problem and hands the student **no tool**
to deal with it. Morphological/cognate decoding is the candidate tool: a transferable
skill that raises performance on words the student has literally never studied —
the one thing pure memorisation can never do.

Before building anything, this doc answers two things with data, not vibes:
1. **How much of our corpus is decodable vs memorise-only?**
2. **Which specific building blocks are worth teaching** (ranked by how many of our
   real words each one unlocks)?

---

## Method (and why the raw counts lie)

877 rows → **69 multi-word idioms** set aside (morphology N/A) → **808 single words**
tagged programmatically against Swedish + Latin/Greek prefixes, suffixes and roots,
then **hand-corrected for false positives**. The correction step is not optional.
Three worked examples of why:

- **`gen` root: 24 raw hits, ~4 real.** Only `heterogen`, `antropogen`, `regenerera`
  are the Greek *-gen* (born/produce). The rest are the **native** Swedish `gen-`
  (=counter/back: `gensvar`, `genmäle`), the adverb ending `-ligen` (`tämligen`,
  `följaktligen`), or pure coincidence (`legend`, `borgen`).
- **`o-` negation: 37 raw, ~20 real.** The parser swept in `om-` (`omsättning`,
  `ombesörja`) and Latin `op-/ob-/or-` (`operera`, `observera`, `ornament`).
- **`-era`: 57 raw, 57 real.** Clean — and that matters below.

So treat the programmatic numbers as a *floor with noise*, and the verdicts below as
the hand-checked reality.

---

## Headline numbers

| Bucket | Count | Share | Morphology helps? |
|---|---|---|---|
| Multi-word idioms | 69 | 8% | **No** — learn as units / decode from *context*, not parts |
| Single words, decodable foothold | ~600 | ~68% of all rows | **Yes** (one of three strategies below) |
| Single words, memorise-only | ~140 | ~16% | **No** — only FSRS works |

"Decodable foothold" means a motivated student could narrow the meaning of the word
without having studied it — not that they'd nail it every time. The honest framing
for the product is **"decode to narrow the field, then eliminate,"** never
"decode = the answer."

---

## Update (2026-06-16): the *options*, not the headwords, are the bigger surface

Founder feedback after the first pass: the real bottleneck students report is not the
headword — it's **not knowing what the answer options mean** (you can know the stem and
still be stuck if 3 of the 5 alternatives are opaque). Re-ran the analysis on the option
columns (`correct_synonym` + `distractor_1..4`). The data backs the founder hard:

| | Headwords | Options |
|---|---|---|
| Distinct strings | 877 | **3 753** (2 542 single words + 1 211 phrases) |
| Decodable by affix (floor, no compounds/cognates) | ~58% | **48%** |

Two takeaways:
1. **The options are a ~6× larger vocabulary surface than the headwords**, and decode
   roughly as well. The vocabulary a student must parse to answer lives in the options.
   The affix-only 48% is again a *floor*; with compounds + cognates the real figure is
   in the same ~65–70% band as headwords.
2. The single most common decodable option pattern is the **meaning-bearing suffix**
   (`-lös`/`-full`/`-bar`/`-fri`): `grundlös` = grund+lös = "without ground" = baseless;
   `hjälplös`, `meningslös`, `hållbar`, `användbar`, `märkbar`, `uttrycksfull`,
   `fördomsfull`, `smittsam`. These are exactly the distractor words students blank on,
   and they decode in one second. This *raises* the priority of the meaning-bearing
   suffixes (strategy 2's tail) above where the headword-only analysis put them.

**Hard constraint this introduces — Non-Negotiable Rule #2 (no hints, ever).** Decoding
the options *during* the question is a hint, and it converts the retrieval test into a
lookup. So option-decoding **cannot** appear before the answer. The teaching has to live
in the **feedback** moment: we teach the student to decode options themselves and
reinforce it after they answer, so next time they crack a cold option unaided. That is
pedagogically stronger than a crutch (build the skill, don't rent it) and stays on-brand.

**Placement rule (keeps feedback from becoming a wall of text):**
- *Correct answer* → snappy: decode headword + correct synonym only (if decodable).
- *Wrong answer* → decode the options the student faced, reusing the existing study-test
  feedback sequence in `OrdFeedbackTyping`. Time lands on the words they struggled with.

**Frequency settled.** This is NOT övningsprov-only — the ORD feedback card already fires
on every ORD question in every daily session. With option-decode added, each daily
question now teaches ~half a dozen decodable words (headword + decodable options) instead
of one. That delivers frequent practice with no separate drill mode.

**Rejected: a standalone "practice morphology" drill.** Passive study (Rule #1), competes
with the core loop for daily time, and the skill consolidates best applied in context —
which feedback already provides on every question. Revisit only if we observe users
failing to pick up the skill in-loop; not before.

---

## The three decode strategies, ranked by payoff on *our* corpus

This is the key finding, and it **diverges from the SAT video's emphasis.** The video
leans hardest on Greek/Latin roots. In our corpus, roots are the *weakest* lever.
The order that actually pays off here is: **compounds > prefixes > cognates >> roots.**

### 1. Compound splitting (native Swedish) — ~50 words, highest transparency

The SAT method ignores this because English compounds aren't very productive. Swedish
builds hard words out of visible smaller words constantly, and the split is almost
always meaning-transparent:

- `hjärtefråga` = hjärta + fråga → a matter close to the heart (pressing issue)
- `näsbränna` = näsa + bränna → "nose-burn" → a reprimand
- `trångsynt` = trång + synt → narrow-sighted → bigoted
- `bärkraft` = bär + kraft → carrying-power → sustainability
- `svartmåla` = svart + måla → paint black → to defame
- `skenrättegång` = sken + rättegång → sham trial
- also: `kartlägga`, `bordlägga`, `mellanting`, `särdrag`, `mångfald`, `värdegrund`,
  `folkstyre`, `maktlysten`, `långsiktig`, `röstberättigad`, `läckergom`, `sömndrucken`,
  `nidbild`, `mästerverk`, `handfallen`, `väsensskild`, `straffvärde`…

**Highest teaching ROI per word**: once the student has the habit "can I split this?",
these decode almost for free.

### 2. Affix decomposition — prefixes carry meaning, roots barely exist here

**Negation / privative prefixes (the most valuable — they flip a known base):**

| Block | Meaning | ~Real count | Examples |
|---|---|---|---|
| `o-` | negation | ~20 | `obefogad`, `olidlig`, `otjänlig`, `oförrätt`, `ovillig`, `otillräknelig` |
| `miss-` | wrong/bad | few | `missunnsam` |
| `van-` | lack/defective | few | `vanställa` |
| `a-/an-` (Greek privative) | without | few | `anestesi` (=without sensation), `asymmetrisk` |

**Native semantic prefixes on a recognisable base (meaning-bearing):**

| Block | Meaning | ~Count | Examples |
|---|---|---|---|
| `för-` | intensify / away | ~25 | `förespråka`, `fördärva`, `förlösa`, `försumma` |
| `be-` | do-something-to | ~15 | `bestyrka`, `besinning`, `befrämja`, `begrunda` |
| `an-` | toward / on | ~10 | `anseende`, `anvisa`, `anförtro`, `anspråkslös` |
| `av-` | off / de- | ~13 | `avsteg`, `avyttra`, `avsky`, `avsätta` |
| `upp-`, `ut-`, `till-`, `under-`, `över-`, `fram-`, `åter-`, `gen-` (=counter) | directional | ~30 combined | `upptakt`, `utblottad`, `undergräva`, `övertramp`, `framsynt`, `gensvar` |

**International Latin/Greek prefixes — transfer to English AND other HP subjects:**

| Block | Meaning | ~Real count | Examples |
|---|---|---|---|
| `re-` | again / back | ~22 | `revidera`, `reflektera`, `regenerera`, `remission` |
| `kon-/kom-` | with / together | ~13 | `konsensus`, `konstellation`, `koherent` |
| `de-` | down / away | ~12 | `defekt`, `deduktion`, `depreciera`, `detronisera` |
| `pro-`, `pre-`, `ex-`, `in-`, `trans-`, `sub-`, `anti-`, `sym-/syn-`, `auto-`, `dia-` | various | ~30 combined | `prolog`, `premiss`, `exponera`, `transparens`, `antipati`, `symbios`, `autodidakt` |

**Roots are thin — do NOT over-invest here (this is the SAT-video correction):**
`log` ~5 (`prolog`, `fonologi`, `etymologi`), `pat` ~4 (`empati`, `antipati`, `patos`),
`krat` ~3 (`autokratisk`, `byråkrati`), `bio` ~3, Greek `-gen` ~4. Total real
root-decodable words across the *entire* corpus is under ~30. A dedicated "Greek and
Latin roots" course — the centrepiece of the SAT guide — would be effort spent on the
smallest slice of our words.

### 3. English-cognate recognition — the sleeper, cheapest to teach

A large slice of our "hard" academic and loan words are **transparent to anyone who
knows English**, with zero morphology training. Every HP candidate studies English.

`potential`, `banal`, `vital`, `diffus`, `modest`, `absurd`, `rationell`, `fiktiv`,
`exil` (exile), `eklips` (eclipse), `akut` (acute), `letal` (lethal), `malign`,
`partikel` (particle), `amplitud`, `isotop`, `entropi`, `nebulosa`, `mosaik`,
`parodi`, `skulptur` (sculpture), `sonett` (sonnet), `pamflett` (pamphlet),
`grotesk`, `sublim`, `monumentell`, `prosa`, `karantän` (quarantine), `katarakt`
(cataract), `protes` (prosthesis)… plus virtually all 57 `-era` verbs
(`illustrera`→illustrate, `vaccinera`→vaccinate, `kalkylera`→calculate).

This overlaps with strategy 2 but is worth naming separately because the *instruction*
is one sentence — "läs ordet högt, låter det som ett engelskt ord?" — versus a root
syllabus. **Highest reach for least teaching.**

---

## Suffixes: mostly class-only, do not oversell

A suffix match usually tells you the **word class**, not the **meaning**:

- **Class-only** (POS hint, opaque root): `-era` (verb), `-isk`/`-lig`/`-ig` (adj),
  `-ning`/`-ing`/`-ering`/`-ande` (noun), `-het`/`-itet`/`-ation`/`-tion`/`-ans`/`-ens`
  (abstract noun), `-ism`/`-ist`. Knowing `raljera` ends in `-era` tells you it's a
  verb — it does **not** tell you it means "joke ironically." Useful for
  *elimination by part of speech*, not for guessing the synonym.
- **Meaning-bearing** (treat these like mini-compounds — they DO help): `-lös`
  (without: `fruktlös`, `förbehållslös`), `-full` (full of: `taktfull`), `-bar`
  (can be …-ed: `gångbar`, `straffbar`), `-fri` (free of: `smärtfri`), `-värd`
  (worthy of: `klandervärt`), `-rik`, `-aktig`. ~15 words, and the decode is reliable.

So the suffix story splits cleanly: teach the ~7 meaning-bearing ones alongside
compounds; mention the class-only ones only as an *elimination* aid.

---

## The honest residue: ~140 memorise-only words

Morphology and cognates give **zero foothold** here. Naming this set is what keeps the
feature honest — and tells us where it must NOT pretend.

- **Native simplex words** (just rare, not built from parts): `diger`, `brysk`,
  `arla`, `städse`, `möda`, `rata`, `mota`, `baxa`, `länsa`, `kröna`, `blidka`,
  `stävja`, `rugga`, `nagga`, `hysa`, `vag`, `sank`, `krum`, `diger`, `spjuver`.
- **Culture-specific loans** (no English cognate the student would know): `gondol`,
  `galosch`, `koffert`, `oboe`, `haiku`, `kaki`, `foajé`, `schabrak`, `kommod`,
  `kandelaber`, `peang`, `estrad`, `baryton`, `lasyr`.
- **All 69 idioms** (`lägga band på sig`, `med nöd och näppe`, `slå mynt av`…) —
  these decode from *figurative/contextual* logic, which is the SAT video's
  "read the passage and predict" move. That maps to **LÄS-embedded vocab**, not
  standalone ORD. For ORD idioms it's memorisation + cultural exposure.

For this whole residue, **only FSRS works.** This is the boundary of the feature.

---

## What this means for the product

**Reach is real.** A decode skill gives a foothold on roughly two-thirds of single
words (compounds + meaning-bearing prefixes/suffixes + cognates). That is a large,
genuine lever on the exact problem (novel words) that no Swedish HP competitor
addresses.

**The teachable set is small.** The student does not need a 200-root syllabus. The
high-payoff set for *our* corpus is roughly:
- the **"can I split this?"** compound habit,
- ~6 negation/privative + ~10 native semantic prefixes,
- ~10 international Latin/Greek prefixes (which double as study aid for the
  quantitative section and English),
- the 7 meaning-bearing suffixes (`-lös`/`-full`/`-bar`/`-fri`/`-värd`/`-rik`/`-aktig`),
- the one-line **cognate** habit ("låter det som engelska?").

That's ~25–30 building blocks + 2 habits. Coverage-ranked, not exhaustive.

**Where it lives — and where it must NOT.** This is a *feedback-moment* feature, not a
lessons page:
- A standalone "roots course" is **passive study** → violates Non-Negotiable Rule #1.
- A per-question prompt to decompose is **per-question friction** → the founder has
  rejected that pattern (`feedback_no_per_question_friction`).
- The right home is the **feedback card the user already sees** after answering, and
  **only when the word is actually decodable** (show the breakdown for `näsbränna`
  and `obefogad`; show nothing for `diger` or `oboe` — a fake breakdown on an opaque
  word would erode trust faster than silence). Same pattern as the per-type strategy
  tips already in `LasFeedback`.

**Divergence from the SAT advice (PM note).** The video's headline — "memorise roots"
— is the *wrong* priority for Swedish HP. Our corpus rewards **compound-splitting and
English-cognate recognition** far more, both of which are easier to teach than a root
syllabus and neither of which the SAT method emphasises (English barely compounds, and
the SAT can't assume a second language). If we build this, lead with compounds +
cognates, treat prefixes as the solid middle, and keep roots as a short footnote.

**Content-leverage angle (ties to runway).** A morphology layer makes existing words
teach *more* — ~25 blocks illuminate ~600 words — so it stretches the content we
already have, which matters given the ~4 months of daily use the founder needs to feed
before HP 2026-10-18.

---

## Recommended next step (not yet built)

1. Add an optional `morphology` annotation per **decodable** word — either a stored CSV
   field (`{type: compound|prefix|cognate|suffix, breakdown, gloss}`) or computed at
   build time from a small block dictionary. ~600 words; the opaque ~140 + 69 idioms
   get nothing.
2. Surface it in the existing ORD feedback card, below the definition, only when present.
3. Do **not** build: a roots course, a per-question decompose prompt, or any breakdown
   on opaque words.

This is the scoping question to bring back to the founder before writing code: stored
field vs computed, and whether to start with the ~50 compounds + cognates only (fastest,
highest-trust subset) before touching prefixes.

---

## Build status — v1 shipped (2026-06-16)

Decided architecture: **computed at runtime** (not a stored CSV/DB field), because the
big surface is the option vocabulary (3 753 words) and most of those aren't headwords in
our DB — only a decode function reaches them, with no migration. Conservative by design:
returns a breakdown only when confident, `null` otherwise (silence on opaque words).

**v1 = meaning-bearing suffixes only:** `-lös`, `-full`, `-fri`, `-bar`, `-värd/-värt`,
`-aktig`. Verified against the full corpus (headwords + options, 4 562 deduped strings):
**60 confident decodes, zero wrong splits** after hand-tuning. Two guards earned during
verification, both worth keeping as the prefix layer lands:
- **Leading-`o` words are skipped.** An unhandled negation (`oanvändbar`, `ohållbar`)
  decoded by suffix alone would *invert* the meaning — worse than silence. They return
  when the `o-` prefix layer exists.
- **False-positive set** for words whose ending isn't really the suffix: `underbar`,
  `uppenbar`, `barbar`, `överfull` (`över-` prefix), `varaktig`.
- Paraphrase is only synthesised from an **unambiguous base** (no trailing linking
  `-s`/`-o`), so we never corrupt a stem like `gräns` → `grän`. Ambiguous bases fall back
  to split + gloss, which still teaches it.

Dropped from v1: `-sam` (meaning too varied — `hjälpsam` vs `långsam` vs `smittsam` —
for one honest gloss; revisit with smarter glossing).

**Placement (Rule #2 respected — never shown during a question):**
- MCQ feedback (`OrdFeedback`): a "Byggstenar" block below the options. Correct answer →
  headword + correct synonym only (snappy); wrong answer → headword + **every option**
  (the alternatives-decode the founder identified).
- Typing feedback (`OrdFeedbackTyping`): headword + correct synonym, shown in the correct
  branch and the wrong-answer study phase only (not during the retrieve/fallback retrieval
  moments).

Files: `src/lib/ord/morphology.ts` (new), `src/components/ord/MorphemeBreakdown.tsx`
(new), `src/components/ord/OrdFeedback.tsx`, `src/components/ord/OrdFeedbackTyping.tsx`.

**Next (v3), on these same rails:** compound-splitting, then a curated English-cognate
table. Each strictly widens recall; the conservative-silence contract stays.

---

## Build status — v2 prefixes shipped (2026-07-24)

The blocker v1 named was "a base-word check": you cannot tell `obefogad` (o + befogad)
from `ornament` (opaque) without knowing whether the remainder is a real Swedish word.
**SALDO answers it** — Språkbanken's morphological lexicon, 128 036 entries, CC-BY-4.0,
queried through the open Karp API. Strip the prefix, ask whether the base exists with a
compatible part of speech.

**Resolved at build time, not runtime.** The decoder runs in the student's browser on
every ORD feedback card, so it must be instant and offline, and the set of words it can
ever see is fixed by `ord-database.csv`. `scripts/build-morph-prefixes.mjs` does the
lookups once and writes `src/lib/ord/prefix-lexicon.ts`. Re-run it whenever the ORD
corpus grows. This does not break v1's runtime-decode architecture: the generated file
is a compiled-in dictionary, not a DB migration.

**Result on the full corpus (4 562 deduped headwords + options): 60 → 170 confident
decodes.** 110 prefix entries accepted out of 214 candidates.

**The automated check is necessary but not sufficient, and the hand-review is where the
real defects were caught.** Of 116 machine-accepted entries, **six were wrong** and are
now in `SEMANTIC_REJECTS` with reasons:

| Word | Why the split is wrong |
|---|---|
| `oförrätt` | `förrätt` is the first course of a meal |
| `olat` | means "bad habit"; nothing to do with `lat` |
| `olustig` | means "uneasy", not "not funny" |
| `oförskämd` | from *skam*, not from `förskämd` (= spoiled food) |
| `otäck` | base `täck` is archaic; a student reads it as *täcka* → "not covered" |
| `oljudande` | here `o-` means *bad*, not *not* — `oljud` is no negation of `ljud` |
| `omedelbar` | base ends in `-bar`, so chaining produced `o + medel + bar` |

That last one was created *by* the new prefix→suffix chaining and is the reason to keep
verifying against the whole corpus after every change, not just spot-checking.

**Chaining is the nicest thing v2 bought:** `oanvändbar` → `o + använd + bar`, three
morphemes, the exact word v1 had to stay silent on because an unhandled negation would
have inverted the suffix meaning.

**Two things v2 did NOT fix.** The base check does not replace v1's hand-tuned
`FALSE_POSITIVES` list for suffixes, because `under`, `bar`, `över` and `var` are all
real Swedish words — only `uppenbar` would have been caught. And `-sam` stays dropped.

Files: `scripts/build-morph-prefixes.mjs` (new), `src/lib/ord/prefix-lexicon.ts`
(new, generated), `src/lib/ord/morphology.ts`, `src/components/ord/MorphemeBreakdown.tsx`
(the gloss fallback assumed a suffix and printed `‑o`; it now places the hyphen by
position and renders both affixes on a chained decode).

---

*North Star: goal #1. This attacks the unknown-word problem we currently only name on
the övningsprov explainer, with a skill no Swedish HP competitor teaches — pedagogy, not
access, which is the locked vision. The corpus data also corrects a tempting wrong turn
(a Greek/Latin roots course) before any effort is spent on it.*
