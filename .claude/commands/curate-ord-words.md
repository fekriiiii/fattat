# Curate ORD Words — Phase 2

Generate vocabulary (ORD) words for the Fattat word database that match the empirical style fingerprint of the past-exam words (Phase 1) but are **not** sourced from past exams. Used to expand the deck beyond the ~540 past-exam words toward broader domain coverage.

This command is **the Phase 2 counterpart** to `/extract-hp-words` (Phase 1).

---

## Step 1 — Gather inputs

Ask the user for:
1. **Target domain** — one of: `juridik`, `medicin`, `kultur`, `vetenskap`, `samhälle`, `ekonomi`, `allmän`. The skill produces words for one domain at a time so the batch stays focused.
2. **Batch size** — how many words to generate (e.g. 20, 50, 100). Default to 20 if unspecified.
3. **Difficulty mix** (optional) — if the user doesn't specify, default to the deck's empirical curve: **~55% difficulty 2, ~29% difficulty 1, ~16% difficulty 3**.

If the user just says "do the next batch" without specifying, recommend a domain based on which is currently most under-target — see the recommended Phase 2 composition below.

---

## Step 2 — Load reference materials

Read these files, in order:

1. **`STYLE_PROFILE_ORD.md`** at project root — the structural fingerprint (POS, difficulty, lengths). The new batch must converge on these distributions.
2. **`STYLE_PROFILE_ORD_SEMANTICS.md`** at project root — the semantic/formation fingerprint (loanword bias, fixed phrases, archaic register, native Swedish). **Critical: see Section "Semantic balance — what HP actually tests" below.**
3. **`ord-database.csv`** at project root. From it:
   - Find the **current maximum `id`** — new rows continue from here.
   - Build a **dedup set** of every `word` (lowercased, trimmed) — Phase 2 must never propose a word that already exists in any form.
   - Read 8–12 recent high-quality entries from the target domain (if any exist) to anchor the writing voice for that domain.
4. **`scripts/analyze-ord-style.mjs`** and **`scripts/analyze-ord-semantics.mjs`** — only if profiles are missing or stale; re-run to regenerate.

---

## Semantic balance — what HP actually tests (mandatory)

The structural profile alone is not enough. Empirical comparison of past-exam (Phase 1) vs first 170 curated words (early Phase 2) revealed a serious blind spot: **Phase 2 over-produces academic loanwords and under-produces the native-Swedish, idiomatic, archaic-literary, and figurative flavor that HP actually loves.**

Concretely, in the past-exam corpus:
- **7.8%** are fixed phrases / multi-word idiomatic entries (e.g. *i sin linda*, *på måfå*, *av hävd*, *i ottan*).
- **8.9%** have a *Formellt register* note.
- **5.0%** have an idiom note (*Fast uttryck*).
- **3.9%** are flagged *Ålderdomligt / Arkaiskt / Litterärt*.
- **1.5%** are tagged as figurative/metaphorical extensions of common stems (e.g. *hårdragen* = literally "dragged hard," meaning "over-stretched argument").
- **30%** contain å/ä/ö in the stem (Swedish-native indicator) — Phase 2 was at 24%.
- Only **2.4%** end in `-tion` (Phase 2 was at 7.1% — overproduced).
- Only **1.3%** end in `-isk` (Phase 2 was at 7.6% — overproduced).

### Mandatory composition rules for every batch

**For each batch of ≥30 words, regardless of domain:**

1. **Include at least 1 fixed phrase or idiomatic expression** as `pos = annat`. Examples of the format:
   - *i sin linda* → *i sin början* (fixed_phrase)
   - *slå mynt av* (vb fixed phrase) → *utnyttja för vinst*
   - *på måfå* (adv fixed phrase) → *slumpmässigt*
   - Even specialist domains have these — juridik has *ex officio*, *ad acta*; medicin has *in vivo*, *per oralt*.

2. **Include at least 1 word with `Formellt register` note** — a Swedish-native word that's elevated but not loaned. Examples: *enträgen*, *aktad*, *eftermäle*, *vedertagen*.

3. **Bias toward Swedish-native compounds over Romance loanwords.** When you have a choice between `behandla` (Swedish-native verb) and `prosekutera` (Latin verb), pick `behandla`-style words. Aim for **≥30% of single-word entries to contain å/ä/ö in the stem**.

4. **Avoid over-using `-tion`, `-isk`, `-era`, `-iv` endings.** These are over-represented in Phase 2. As a rule of thumb: **no more than 5 of any 50-word batch should end with `-tion`** (or `-ation`, `-sion`); same cap for `-isk` (or `-iskt`).

### Domain-specific guidance

- **`allmän` batches** are the most important for semantic recalibration. They should be **dominated by**:
  - Fixed phrases / idioms (target ≥15% of an allmän batch)
  - Swedish-native literary register words (e.g. *enträgen*, *enveten*, *sårbar*, *omsorgsfull*)
  - Figurative/metaphorical extensions of common stems
  - Archaic/literary register entries (target ≥10% of an allmän batch)
  - Reflexive verbs (e.g. *freda sig*, *bemöda sig*)
  - Concrete cultural objects (e.g. *parkas*, *kandelaber*, *koffert*, *galosch*)
- **`kultur` batches** should include **literary/aesthetic terminology with etymological richness** — *parafras*, *pastisch*, *allegori* — but balanced with native-register words like *gestalta*, *kröna*, *målande*.
- **`samhälle` batches** should include **everyday formal Swedish about social structures** — not just abstract policy nouns. Mix *koalition* with *gemene man*, *jämkning* with *såta vänner*.
- **`juridik`, `medicin`, `vetenskap`, `ekonomi`** are inherently more loanword-heavy and academic — that's OK, but each batch must still include the one fixed phrase + one formal-register slot above.

### How to write good notes (rebalanced)

The Phase 2 batches over-used `Latinskt lånord` style notes. Going forward:

- **Skip `Latinskt lånord` / `Grekiskt lånord` notes** when the word's form makes the origin obvious (`-tion`, `-isk`, `-era`, `-iv`, `-us`, `-um`).
- **Keep origin notes** only when the etymology is surprising or pedagogically valuable (e.g. `karantän` Italian, `parkas` Inuit/Russian, `tariff` Arabic).
- **Add `Formellt register` notes** when the word is Swedish-native but elevated — this is the biggest under-used note category.
- **Add `Fast uttryck` notes** to all fixed phrases.
- **Add `Ålderdomligt` / `Litterärt register`** when a word is real but rarely used in modern everyday Swedish (*arla*, *grift*, *eftermäle*).
- **Add `Bildlig användning vanligast`** when the figurative meaning is the tested one (*hårdragen*, *trollbinda*).
- **Add etymology like "linda är bindel som spädbarn lindas i"** for fixed phrases — teach the picture, not just the origin.

---

## Step 3 — Source candidate words

Phase 2 words are **not extracted from PDFs**. They are curated from Claude's knowledge of formal Swedish vocabulary in the chosen domain.

### Sourcing rules

Candidate words must:
- Be **standard Swedish**, not English or untranslated loanwords (`computer` ✗, `dator` ✗ too easy — but `datorisering`, `algoritmisk` ✓).
- Belong to the **HP register**: words that appear in Swedish broadsheet newspapers (DN, SvD), academic prose, literary fiction, or specialist non-fiction. Not slang, not technical jargon understandable only to specialists, not children's vocabulary.
- Have **at least one clear single-word Swedish synonym** (multi-word synonyms allowed for ~30% of the batch, matching the empirical profile).
- Be **realistic HP test candidates** — words a test designer would plausibly use. When in doubt, ask: *would this word feel at home in a past HP exam?*
- Not already exist in the database (use the dedup set built in Step 2).

### Domain-specific sourcing notes

- **juridik** — court/process vocabulary (`häktning`, `anstånd`), rights/obligations terminology, contract language, words about legality/legitimacy. Avoid niche statute names.
- **medicin** — symptoms, treatments, anatomy, public-health terms. Latin-derived terms welcome (`palpation`, `prognos`, `remission`). Avoid drug brand names and ultra-specialist disease names.
- **kultur** — arts, literature, music, theatre, philosophy, historical periods, aesthetic terminology. French/Italian loans common here (`pastisch`, `koloratur`, `mecenat`).
- **vetenskap** — physics, biology, chemistry, technology, mathematics, methodology terms (`empiri`, `hypotes`, `replikerbar`). Avoid Greek-letter symbols and formulas.
- **samhälle** — politics, sociology, media, education, social structures (`segregation`, `mandatperiod`, `polarisering`). Avoid party-specific or country-specific terminology.
- **ekonomi** — business, finance, trade, markets (`likviditet`, `protektionism`, `inflationsspiral`). Avoid ticker symbols and brand names.
- **allmän** — general formal/literary Swedish vocabulary with no clear specialist domain. This is the largest existing bucket — Phase 2 should **not over-add** here unless the user explicitly asks.

### Difficulty calibration

- **diff 1** — Educated adult Swedes recognise it from newspaper reading. Most students will get it right.
- **diff 2** — Requires broad reading or active vocabulary. Common pivot point for HP. *Most of the batch should land here.*
- **diff 3** — Rare, archaic, technical, or specialist register. Latin/French/Greek loans frequently fall here.

Distribute the batch across difficulties per the profile (or per user override).

---

## Step 4 — Generate one database row per word

Use the **exact same column order and formatting rules** as `/extract-hp-words` (Phase 1). The only differences are: `past_exams` is filled with `curated` (not an exam code), and the distractors are generated by you rather than transcribed from a test.

### `id`
Next integer after the current max in `ord-database.csv`.

### `word`
The Swedish target word in its standard dictionary form (uninflected). Lowercase unless it is a proper noun.

### `pos`
Part of speech, abbreviated:
- `sb` — substantiv (noun)
- `vb` — verb
- `adj` — adjektiv
- `adv` — adverb
- `annat` — for fixed phrases, interjektioner, conjunctions
- Leave blank only if genuinely ambiguous

**Target POS mix for the batch (per profile):** ~46% sb, ~26% adj, ~19% vb, ~6% adv, ~2% annat.

### `correct_synonym`
The single best Swedish synonym for the word. Rules:
- Prefer single-word synonyms (~69% of the batch should be single-word).
- Multi-word synonyms (~31%) only when no single word captures the meaning (e.g. *estrad* → *upphöjd plattform*).
- Must be a *real* synonym, not a definition.
- Must be a word an HP test designer would plausibly use as the correct answer option.

### `distractor_1`, `distractor_2`, `distractor_3`, `distractor_4`
Four wrong options. Quality rules — this is the hardest part:
- **The correct answer must never be the odd one out.** At least one distractor has to share the correct synonym's word-count class: if the correct answer is a phrase, at least one distractor is a phrase; if it is a single word, at least one distractor is a single word. The other three are free.
  This rule was settled on 2026-07-24 by measuring the 537 real past-HP items in `ord-database.csv`, not by taste. In real HP the correct answer is multi-word **31.1%** of the time, so blanket form-matching is wrong — but it is the *only* multi-word option in just **1.1%** of items, and the only single-word option in **0.0%** (zero of 537). Uniqueness of form is the tell, not the form itself.
  This is also what makes words like *katharsis*, *fontanell* and *unikum* writable: they have no single-word synonym, and that is fine as long as one distractor is also a phrase.
  Enforced by `node scripts/lint-ord-corpus.cjs`, which hard-fails a violating row.
- Each distractor must be a **real Swedish word/phrase** — never invented.
- Distractors must be **plausibly wrong**: words that an unsure test-taker might pick because they sound similar, are in the same semantic field, or share register — but are *not* synonyms of the target.
- **No outright giveaways** (don't include a near-synonym of any distractor that's obviously off-topic for the target).
- **Mix the trap types** across the four distractors, drawing from these archetypes:
  - **Semantic-field trap** — related concept but wrong meaning (for *prognos*: `diagnos`)
  - **Phonetic/spelling trap** — similar shape (for *vällust*: `velighet`)
  - **Register trap** — right domain, wrong specificity (for *anstånd*: `dröjsmål`)
  - **Antonym-adjacent trap** — opposite or near-opposite (for *expandera*: `krympa` is too obvious — use `stagnera` instead)
  - **False-friend trap** — looks like a translation but means something else
- **Never include a true synonym as a distractor.** If you would also accept it as correct, it can't be a distractor — drop it and pick a different distractor. (It used to go in `accepted_synonyms`; that column is now dead, see below.)

### `definition_sv`
A short Swedish definition. **Style rules from the profile (mandatory):**
- **4–12 words** (median 8). Anything outside this range fails the quality check.
- Plain Swedish. No academic meta-language ("benämning för", "begrepp inom").
- Capture the **core meaning only** — not edge cases or all senses.
- For verbs: start with "Att..." or describe the action directly.
- For nouns: describe the concept plainly.
- For adjectives/adverbs: describe the quality or manner.

Examples of the right style:
- *"En bedömning av hur något sannolikt kommer att utvecklas framöver."* (prognos)
- *"Skicklig på att manipulera andra eller uppnå mål med list."* (slug)
- *"Absolut inte; på intet sätt."* (ingalunda)

### `example_sentence`
One natural Swedish sentence showing the word in realistic use. **Style rules from the profile (mandatory):**
- **8–12 words** (median 10).
- Single complete contextual sentence — not a list, not two clauses joined by semicolon.
- Concrete, realistic scenario — not abstract or generic.
- Neutral to slightly formal register.
- Do not repeat the definition — show the word doing real work.
- The target word must appear in its natural inflected form for the context.

### `domain`
The domain provided by the user in Step 1. Every row in the batch shares this domain.

### `difficulty`
1, 2, or 3 per the calibration rules in Step 3. Match the target distribution.

### `past_exams`
**Always `curated`** for Phase 2 rows. This is the signal that distinguishes Phase 2 entries from Phase 1.

### `accepted_synonyms`
**Leave this blank.** As of 2026-07-24 no runtime code reads this column. It existed only to grade the typed-answer format (accept alternatives a student might type), and typing was removed that day in favour of recognition-only multiple choice. Keep the empty column so the CSV shape stays stable for `seed.ts`, but do not spend effort generating alternatives — it is dead work. (The old target of ~91% fill / ~2 alternatives per row no longer applies.)

### `notes`
Add a short tag only when one of these applies (per the profile, ~42% of rows have notes):
- **Origin:** `Latinskt lånord`, `Franskt lånord`, `Grekiskt lånord`, `Tyskt lånord`, `Italienskt lånord`
- **Register:** `Formellt register`, `Litterärt register`, `Ålderdomligt`, `Arkaiskt`, `Vardagligt`
- **Grammar:** `Reflexivt verb`, `Fast uttryck`, `Plural används oftast`
- **Sense:** `Bildlig användning vanligast`, `Ofta i nekande sammanhang`

Leave blank for plain everyday words. Do not fill the field just to fill it.

---

## Step 5 — Quality checks before output

Before showing results, verify each row programmatically:

**Per-row checks:**
- `id` is the next integer (no gaps, no duplicates within the batch).
- `word` is non-empty, lowercase (unless proper noun), and **not in the dedup set** from Step 2.
- `correct_synonym` is non-empty and is **not** repeated in any of the four distractors.
- All four distractors are filled, non-empty, and distinct from each other and from `correct_synonym`.
- `definition_sv` is one sentence, **4–12 words**, in Swedish, does not contain the target word verbatim.
- `example_sentence` is one sentence, **8–12 words**, in Swedish, contains the target word (in any inflected form), and is not a paraphrase of the definition.
- `domain` matches the user's Step 1 input.
- `difficulty` is 1, 2, or 3.
- `past_exams` is exactly `curated`.
- `accepted_synonyms` is left blank (dead column, see its field section).
- `notes`, if present, draws from the allowed tag list (extend if needed but stay terse).

**Batch-level checks:**
- POS mix is within ±10pp of the target (~46/26/19/6/2).
- Difficulty mix is within ±10pp of the target (or user override).
- Multi-word `correct_synonym` rate is within 20–40%.
- `notes` fill rate is between 30% and 55%.
- **Semantic-balance checks** (new — see Section "Semantic balance"):
  - At least 1 fixed phrase / idiomatic entry per 30 words.
  - At least 1 `Formellt register` note per 30 words.
  - `-tion` endings ≤10% of single-word entries.
  - `-isk` endings ≤10% of single-word entries.
  - At least 30% of single-word entries contain å/ä/ö in stem (relax for inherently loanword-heavy specialist domains like medicin/vetenskap).
  - **For `allmän` batches**: fixed phrase rate ≥15% AND archaic-literary register rate ≥10%.

If any row fails a per-row check, **fix it before output** — do not ask the user to fix manually.
If any batch-level check is significantly off, regenerate the offending subset.

**Then run the corpus lint** once the rows are appended to `ord-database.csv`:

```
node scripts/lint-ord-corpus.cjs
```

Zero errors is the bar. It enforces the odd-one-out rule, catches a distractor
that is also listed as an accepted synonym (which makes an item unanswerable),
duplicate headwords (which would give FSRS two cards for one word), em-dash in
any user-visible column, and example sentences that do not contain their own
headword. Past-HP rows are exempt from the authoring rules — they reproduce real
exams verbatim and must never be "fixed".

---

## Step 6 — Output and save

Show all generated rows as a **single formatted CSV block** (no header — only the new data rows) for the user to review.

Then summarise:
- How many rows generated, in which domain, at which difficulty mix.
- Any notable choices (e.g. "skipped 3 candidates that overlapped existing entries: `palpation`, `remiss`, `anamnes`").

Then ask: *"Ser det bra ut? Jag kan lägga till raderna direkt i `ord-database.csv`, eller så granskar du dem först."*

If the user confirms appending:
- Open `ord-database.csv`.
- Append only the new rows — never modify existing rows.
- Confirm how many rows were added and the new total count.

---

## Recommended Phase 2 composition (target = 1000 words)

If the user is uncertain which domain to do next, recommend based on this gap-fill plan derived from the style profile (current → target):

| Domain | Current | Phase 2 to add | Final |
|---|---|---|---|
| juridik | 29 | 71 | 100 |
| medicin | 24 | 76 | 100 |
| ekonomi | 11 | 29 | 40 |
| vetenskap | 35 | 85 | 120 |
| samhälle | 39 | 81 | 120 |
| kultur | 58 | 62 | 120 |
| allmän | 344 | 56 | 400 |

Domains are listed roughly in priority order — the thinnest specialist domains first.

---

## Notes for future maintenance

- If `STYLE_PROFILE_ORD.md` becomes stale (e.g. after a large Phase 2 batch is appended), re-run `node scripts/analyze-ord-style.mjs` and re-read the profile before the next batch.
- The `past_exams=curated` marker lets the app distinguish Phase 2 entries later — e.g. for a future "appears on real HP" badge, or for separate FSRS pools if needed.
