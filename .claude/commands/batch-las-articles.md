# Batch LÄS Articles — Generate or Format Multiple

Add several LÄS articles to the database in one pass. Optimised for speed: databases are read once, coverage tracking updates across the batch, and review happens in a single round rather than article-by-article. Use `/write-las-article` for careful single-article work.

---

## Two modes

**Generate mode — the default.** Write several *new* articles from scratch, planned as a set against the slot model, with the same craft as `/write-las-article`, then reviewed together at one gate. This is the default whenever the skill is invoked without pasted articles — e.g. "bygg databasen", "skriv en batch", "kör batch", or just `/batch-las-articles [N]`. **Do not ask the user to paste anything in this mode.**

**Format mode.** Format several *pre-generated* articles the user pastes in (Codex, Gemini, manual, …). Use this **only** when the user actually pastes articles in the `===ARTIKEL N===` format, or explicitly says "formatera dessa". It lives under "Format mode" further down.

---

## Generate mode (default)

Generates N articles from scratch — one databases read, one slot plan, one review gate for the whole set.

### G1 — Read databases once
Read the `las/` folder and `ord-database.csv` a single time for the whole batch (same as Step 2 below): current max id, the featured-word coverage map, and every curated ORD word with `word / definition_sv / domain / past_exams`.

### G2 — Plan the batch against the slots
Classify existing articles into Slots A/B/C (the slot model is in `/write-las-article`). Show the slot-status table, then **propose the specific N articles** that best fill the gaps, in priority order: most underfilled slot first, then any missing genres, keeping the kort:lång ratio near 1:2 and the two lång domains in a set distinct.
- **Count:** take it from the invocation (`/batch-las-articles 3` → 3). If none is given, propose a sensible set (default 3, a near-complete provpass-set). **Confirm the one-line plan before generating — this is the only setup gate.** Announce each as `Slot X — domän / genre / unit`.

### G3 — Generate each article
For every planned article, run `/write-las-article` Steps 4–8 silently (no per-article output yet):
- **Step 4** — select curated-only ORD words (Tier 1/2, domain-fit, not already featured anywhere in `las/` or earlier in this batch). lång 8–12, kort 4–6.
- **Step 5–6** — write the body in the genre's register (the register table + HP markers live in `/write-las-article`). Each target word appears **exactly once**; hit the length target (lång ≥ 950, kort 250–400); **no em-dash**.
- **Step 7** — write the questions for the genre's type mix, following `Bilaga: Distraktordesign` in `analysis/_LAS_analys.md`: eight tools, correct answer = a reworded abstraction/synthesis (never an echo of the anchor), all four options length-matched so **the correct answer is never the longest**, ≥1 `sant_men_fel_fråga` and ≥1 `nära_men_inte_riktigt` per question.
- **Step 8** — compile `vocab_highlights` + curated-only `featured_ord_words`.

### G4 — Validate every article before showing it
For each article, check and fix **before** the gate: word count in range, no em-dash, **each featured word present exactly once**, no stray uncontrolled ORD words, and a `--dry-run` of its payload through `scripts/add-las-article.cjs` that returns clean (this is what catches the length-tell, curated-only, and cross-article-overlap warnings). Resolve every warning yourself; surface only one that genuinely needs a human call.

### G5 — One combined review gate
Present the **whole batch in a single message** — each article's body followed by its questions, with a one-line blind-test note per question — then ask once:
> *"Ser hela batchen bra ut? Skriv 'ja' så skriver jag alla till `las/` — annars säg vilken artikel (eller fråga) du vill ändra."*

On "ja": write each article via `scripts/add-las-article.cjs` (see Step 6), delete the temp files, then show the coverage report + updated slot table, and offer to seed (`npx tsx scripts/seed.ts --las-dir=las`) and commit. If the user wants changes to one article, revise just that one, re-show it, and re-ask the same single question.

---

## Format mode (paste existing articles)

Use the steps below **only** in Format mode — when the user pastes their own drafts in.

---

## Step 1 — Gather all inputs

Ask the user to paste all articles using this exact separator format:

```
===ARTIKEL 1===
TITEL: ...
BODY: ...
FRÅGOR:
1. ...
   A) ... B) ... C) ... D) ... SVAR: B
2. ...
   A) ... B) ... C) ... D) ... SVAR: A
UNIT: kort/lång
KÄLLA: (url or blank)
KÄLLNAMN: (name or blank)
PAST_HP: (e.g. 2024-H or blank)

===ARTIKEL 2===
...
```

Parse all articles before proceeding. Confirm how many were received:
> "Jag har tagit emot X artiklar. Bearbetar nu..."

**Source-name defaulting:** If `KÄLLNAMN` is blank, default to `"Fattat"` and set `is_designed_content = TRUE`. If a real source is named, keep it and set `is_designed_content = FALSE`.

---

## Step 2 — Read databases once

Read both databases **once** for the entire batch — do not re-read between articles.

**From the `las/` folder (one JSON file per article):**
- Find the current maximum `id` — batch IDs start from `max_id + 1`
- Build a **coverage map**: for every article file, collect all words in `featured_ord_words` and count how many articles each word appears in

**From `ord-database.csv`:**
- Load every ORD entry: `word`, `correct_synonym`, `accepted_synonyms`, `definition_sv`, `pos`, `domain`

The coverage map is **live** — it updates as each article in the batch commits its words (see Step 4), so later articles in the batch don't repeat the same words as earlier ones.

---

## Step 3 — ORD detection pass (all articles)

Scan every article body for existing ORD-database words in any inflected Swedish form (morphology-aware — see single-article command for rules).

Show a compact summary:

```
Artikel 1 — "Titel": prognos, diffus (2 ord)
Artikel 2 — "Titel": inga ORD-ord hittade
Artikel 3 — "Titel": vördnad, godtycke, premieras (3 ord)
...
```

Articles with zero matches are flagged — they need more aggressive swap proposals in Step 4.

---

## Step 4 — Swap proposals (all articles, one approval round)

Process articles **in order**. For each article:

1. **Use the current coverage map** (updated by all previous articles in this batch)
2. Apply the same priority tiers as in the single-article command:
   - Tier 1: coverage count 0 (never used anywhere)
   - Tier 2: coverage count 1–2
   - Tier 3: coverage count 3–5
   - Tier 4: coverage count 6+ (deprioritise)
   - Within each tier, prefer words matching the article's domain
3. Propose 3–6 natural swap candidates per article (fewer if already vocabulary-rich)
4. **Tentatively mark proposed words as +1 coverage** in the running map immediately — so the next article in the batch won't propose the same Tier 1 words again

Present all proposals in one block:

```
━━━ ARTIKEL 1 — "Titel" ━━━
Förslag 1.1 — bake in: «förskjutning» [Tier 1 — 0 artiklar]
  Original: "Den gradvisa förändringen skedde över decennier."
  Förslag:  "Den gradvisa **förskjutningen** skedde över decennier."
  Varför: Exakt synonymt; akademisk register matchar.

Förslag 1.2 — bake in: «belägga» [Tier 1 — 0 artiklar]
  Original: "Forskarna kunde bekräfta sambandet."
  Förslag:  "Forskarna kunde **belägga** sambandet."
  Varför: Exakt synonymt; vetenskaplig stil matchar.

━━━ ARTIKEL 2 — "Titel" ━━━
Förslag 2.1 — bake in: «vederlag» [Tier 1 — 0 artiklar]
  ...
```

Then ask in one message:

> *"Godkänn förslagen per artikel. Format: 'A1: 1,2 | A2: alla | A3: inga | A4: 1,3' osv. Du kan också skriva 'alla' för alla artiklar."*

### Apply approved swaps

Apply only approved swaps per article. Update the **live coverage map** — remove tentative marks for rejected proposals, keep marks for approved ones.

Do **not** show final bodies one by one. Instead show a single compact confirmation:

```
Artikel 1: "förskjutning", "belägga" inbakade ✓
Artikel 2: inga ändringar
Artikel 3: "vördnad" inbakad ✓
...
```

Ask: *"Ser kropparna naturliga ut? Skriv 'ja' för att fortsätta, eller ange vilken artikel du vill justera."*

---

## Step 5 — Silent processing pass

For all articles simultaneously, run Steps 5–9 from the single-article command silently (no output until Step 6):

- **Step 5:** Compile final ORD word list (detected + approved swaps)
- **Step 6:** Determine domain, genre, word_count, difficulty, question_count
- **Step 7:** Format questions JSON (type, stem, options, correct, passage_anchor, explanation, distractor_types, notes)
- **Step 8:** Format vocab_highlights JSON
- **Step 9:** Set featured_ord_words (**curated words only** — `past_exams = 'curated'`; past-HP words stay in the body/glossary but are never featured)

Run quality checks silently. If any article fails a check (e.g. a passage_anchor can't be found verbatim in the final body), flag it specifically rather than blocking the whole batch.

---

## Step 6 — Write all article files

Assign IDs sequentially from `max_id + 1`. Each article becomes its own file in `las/`.

To add the batch, use the shared safe writer `scripts/add-las-article.cjs` (same mechanism as `write-las-article` Step 9), run **once per article**. It auto-counts word-count, validates (em-dash ban, length-tell, curated-only featured words, cross-article overlap) and verifies each record parses back before writing `las/<id>-<slug>.json`.

Each article file's keys:
`id, title, source_url, source_name, domain, genre, word_count, difficulty, question_count, unit_position, past_hp, body, questions, vocab_highlights, featured_ord_words, is_designed_content, notes`

1. Find the current max id. For each article build a **plain JSON payload** with an explicit sequential `id` (max+1, max+2, …) plus `title`, `domain`, `genre`, `unit_position`, `difficulty`, `body` (final, post-swap), `questions`, `vocab_highlights`, `featured_ord_words` (array of strings). Write each to its own temp file (e.g. `_las_1.json`, `_las_2.json`).
2. Preview the whole batch first — run each payload with `--dry-run`, show the combined summary, resolve any ⚠ warnings, then ask: *"Ser det bra ut? Jag lägger till artiklarna i `las/`."*
3. On confirm, run each payload without the flag, in id order. Then delete the temp files.

---

## Quality checks (per article, flagged individually)

- passage_anchor is a verbatim quote from the **final** body (post-swap)
- Every wrong option has a distractor_type
- Blind-test each question against `Bilaga: Distraktordesign` in `analysis/_LAS_analys.md`: flag (don't silently format) any where the correct answer is guessable on length/keyword/plausibility, merely echoes the anchor, or has a caricature distractor — these come from outside and may be weak
- Every ORD word in vocab_highlights is present in the final body and in ord-database.csv
- question_count matches actual questions
- unit_position matches: `kort` = 2 questions, `lång` = 4 questions
- No article has zero ORD words — flag and suggest the user swap it out or re-generate with more vocabulary surface area
- Inga em-dash (—) i någon kropp eller frågetext; ersätt med punkt, komma eller kolon. Em-dash är en AI-signatur och blockeras hårt av `add-las-article.cjs` per artikel (en em-dash stoppar den artikelns append, inte hela batchen)

---

## Answer-letter balance (decided 2026-07-24, from the corpus)

Real HP spreads the correct answer close to evenly across the options
(`analysis/ANALYS_INDEX.md`: 17.6% to 22.4% across A–E). Our LÄS corpus had
drifted to **A 32% / B 32% / C 25% / D 12%** — D at half its expected share.
Over a hundred articles that becomes a pattern a student can exploit, which
means the item stops measuring reading comprehension.

**Before generating a batch**, run:

```
node scripts/lint-las-corpus.cjs --quiet
```

and read the `nästa batch:` line in the corpus section. It names the
under-represented letters. Place correct answers so the batch pulls the corpus
toward 25% per letter rather than repeating the existing lean. Do this by
choosing which option slot the correct answer occupies while writing, not by
shuffling afterwards: LÄS options are rendered in authored order and the
explanations and `distractor_types` are keyed to the stored letter.

Per-article, the existing rule still holds: never put every answer on one letter.

---

## Run the corpus lint before you finish

After the last article is appended:

```
node scripts/lint-las-corpus.cjs
```

Zero errors is the bar for a batch being done. The lint runs the same
`checkArticle()` that `add-las-article.cjs` runs per article, plus the
corpus-wide checks (answer spread, kort/lång balance, duplicate ids and titles,
domain concentration, featured-word reuse) that no single article can see.
Report the summary line and any remaining warnings to the founder.

If the batch is going to be seeded, follow with `npm run las:verify` after the
seed to confirm the database actually matches the files.

---

## Coverage summary at the end

After all rows are confirmed and appended, show:

```
Täckningsrapport — denna batch
Nya ord introducerade (Tier 1): förskjutning, belägga, vördnad ... (N ord)
Ord som inte fick plats den här gången (Tier 1, ingen naturlig swap hittades): X, Y, Z
Totalt unika ord täckta i hela databasen nu: N / [total ord i ORD-databasen]
```

This tells the user which Tier 1 words still need an article home — useful input for what to generate next externally.
