# Format LÄS Article — Add to Database

Take a LÄS article and questions (from any source: Codex, Gemini, Claude, manual) and format them as a complete database row for `las-database.csv`. The skill automatically detects ORD-database words already in the article and proposes natural synonym swaps to bake in more — strengthening the ORD ↔ LÄS pedagogical loop.

---

## Step 1 — Gather inputs

Ask the user for:
1. **Article title**
2. **Article body** (full text)
3. **Source URL** (if from a real news/research source — otherwise leave blank)
4. **Source name** (e.g. "SVT Nyheter", "Riksrevisionen") — leave blank for designed pedagogical material
5. **Questions + correct answers** (paste in any format — Claude will parse)
6. **unit_position** — `kort` (2 questions) or `lång` (4 questions)
7. **past_hp** — if from a real exam, which one (e.g. `2024-H`). Leave blank for designed material.

> Note: the user does **not** need to list which ORD words are in the article. Step 3 detects them automatically. Step 4 then proposes swaps to bake more in.

### Source-name defaulting (Step 17)

If the user leaves `source_name` blank (the typical case for designed pedagogical material), **default it to `"Fattat"`**. This brands the text as a Fattat original — matching how textbook publishers credit themselves. Set `is_designed_content = TRUE` in this case.

If a real source is provided (real news, real research summary), keep the actual source name + URL and set `is_designed_content = FALSE`.

**Never use the label "AI-genererad" anywhere user-facing.** That label misrepresents the rigor of the workflow (corpus-based generation from real HP exams, HP-grade quality verified, ORD words baked in). The disclosure that some references are constructed lives in onboarding (one-time, plain Swedish), not on the article itself.

---

## Step 2 — Read databases

Read `las-database.csv` to find the current maximum `id`. New row continues from there.

Read `ord-database.csv` in full. Build a working list of every ORD entry with these fields:
- `word` (the headword)
- `correct_synonym`
- `accepted_synonyms` (comma-separated alternatives)
- `definition_sv`
- `pos` (part of speech, useful for swap viability)
- `domain` (so swaps stay register-appropriate)

---

## Step 3 — Auto-detect existing ORD words in the body

Scan the article body for **any word that matches an ORD-database entry**, in any inflected Swedish form. Match against:
- the headword (`word`)
- the `correct_synonym`
- any of the `accepted_synonyms`

Be morphology-aware: e.g. `prognos` should match `prognosen`, `prognoser`, `prognosens`. `belägga` should match `belägger`, `belagts`, `belagd`. Use stem/prefix matching when forms differ; trust Swedish judgment.

Output a list of detected ORD words, e.g.:

> **Hittade ORD-ord redan i texten:** `förskjutning`, `vördnad`, `godtycke`, `motsägelsefull`, `premieras` (5 ord)

If zero matches, say so explicitly — that's a signal the article may need more aggressive baking in Step 4.

---

## Step 4 — Propose ORD-baking swaps

Now actively look for places where a non-ORD-database word in the body could be **naturally replaced** with an ORD-database word (or one of its synonyms). The goal is to weave more ORD-database vocabulary into the article so students encounter recently-practiced words in reading context.

### 4a — Build a coverage map before proposing

Before generating any proposals, compute word coverage across the existing database:

1. Read all rows in `las-database.csv` and collect every word listed in each row's `featured_ord_words` column.
2. Count how many articles each ORD word already appears in. Call this its **coverage count**.
3. Build a **priority list** for this article:
   - **Tier 1 (prefer strongly):** ORD words with coverage count 0 — never used in any article yet
   - **Tier 2 (prefer):** ORD words with coverage count 1–2
   - **Tier 3 (neutral):** ORD words with coverage count 3–5
   - **Tier 4 (deprioritize):** ORD words with coverage count 6+ — already well-covered

4. Within each tier, **prefer words whose `domain` matches the article's domain** (determined in Step 6 — if not yet known, infer from the body). A Tier 1 word in a matching domain beats a Tier 1 word in a mismatched domain.

The priority list does not override quality — a Tier 1 word that produces a forced or unnatural swap should still be dropped. But when two swap candidates are equally natural, always pick the higher-priority word.

> **Why this matters:** Without coverage tracking, the same 20 common words get baked into every article while 900 domain-specific words never appear. This spreads vocabulary exposure intentionally across the whole database.

### 4b — Rules for proposing swaps

A good swap must satisfy **all** of these:
- **Meaning preserved exactly** — not "close enough", actually the same.
- **Register matches** — don't put a folksy word into an academic essay or vice versa.
- **Domain appropriate** — don't drop a medical term into a humanities text.
- **Inflection correct** — if the original is plural definite, the swap is plural definite.
- **Doesn't break a passage_anchor** — if the sentence is the answer-anchor for a question, the swap must not change what makes the answer correct.
- **Natural, not crammed** — if a swap feels forced, drop it.

### 4c — How many to propose

Aim for **3–6 swap candidates**, not more. Quality over volume. If the article already has 8+ ORD words from Step 3, propose only 1–2 (or zero) — it's already vocabulary-rich.

### 4d — How to present swaps to the user

For each candidate, show:

```
Förslag #N — bake in: «<ord-word>» [Tier X — coverage: Y artiklar]

Original mening:
"<full sentence as written>"

Förslag:
"<full sentence with the swap, ORD-ordet markerat>"

Varför: <one short sentence — meaning equivalence + why it fits>
```

The `[Tier X — coverage: Y artiklar]` tag is shown so the user understands why a particular word was chosen over others.

Then ask: *"Vilka av förslagen vill du behålla? Skriv numren (t.ex. '1, 3, 4'), 'alla', eller 'inga'."*

### 4e — Apply approved swaps

Apply only the swaps the user approves. The result is the **final article body** that all subsequent steps work from. Show the final body briefly so the user can confirm it reads naturally before proceeding.

---

## Step 5 — Compile final ORD word list

Combine:
- ORD words detected naturally in Step 3
- ORD words baked in via approved swaps in Step 4

This combined list feeds `vocab_highlights` (the reading glossary — may include past-HP words). But `featured_ord_words` is the ORD→LÄS reinforcement tag and takes **curated words only** (`past_exams = 'curated'`): daily ORD never introduces past-HP words (migration 022), so featuring them is dead reinforcement. Look up `past_exams` for each detected/swapped word and drop non-curated ones from the featured set (they stay in the body and may stay in `vocab_highlights`). Deduplicate. (`append-las-row.cjs` warns if a non-curated word reaches `featured_ord_words`.)

---

## Step 6 — Determine metadata

From the final article body, determine:

**domain** — choose exactly one:
- `juridik` — law, rights, courts, crime
- `medicin` — health, biology, anatomy
- `kultur` — arts, literature, history, language
- `vetenskap` — science, research, technology
- `samhälle` — politics, society, social issues, education
- `ekonomi` — business, finance, trade

**genre** — choose exactly one:
- `populärvetenskap` — accessible science writing
- `akademisk` — formal research or academic text
- `reportage` — journalism, news feature
- `juridisk` — legal documents, authority reports
- `personlig_essä` — first-person essay
- `debatt_tvåroster` — debate with two opposing voices
- `lyrik_prosa` — poetry or literary prose
- `litterär_prosa` — literary fiction or narrative prose

**word_count** — count the words in the final article body (approximate is fine, ±20)

**difficulty** — rate 1, 2, or 3:
- 1 = accessible, everyday Swedish
- 2 = requires solid reading experience
- 3 = dense, formal, or technical register

**question_count** — count the questions provided

---

## Step 7 — Format the questions JSON

Use the **final article body** (after swaps) when extracting `passage_anchor`. For each question, produce this exact structure:

```json
{
  "n": 1,
  "type": "...",
  "stem": "...",
  "options": { "A": "...", "B": "...", "C": "...", "D": "..." },
  "correct": "B",
  "passage_anchor": "...",
  "explanation": "...",
  "distractor_types": { "A": "...", "C": "...", "D": "..." },
  "notes": ""
}
```

### `type` — choose the most accurate:
- `huvudtanke` — what is the main idea of the whole text?
- `detalj_fakta` — what does the text state about X?
- `detalj_kausal` — what does the text give as the cause/reason for X?
- `syfte_funktion` — what is the purpose/function of this part of the text?
- `slutledning` — what can be concluded/inferred from the text?
- `jämförande` — comparison between two perspectives or voices
- `ståndpunkt` — does the author/text take a position, and what is it?

### `passage_anchor`
Find and quote the **exact sentence or sentences** from the final article body that contain the answer. Rules:
- Must be a verbatim quote from the (post-swap) body — not paraphrased
- Should be the minimum text needed to confirm the correct answer (1–3 sentences)
- If the answer spans multiple parts of the text, quote the most central passage

### `explanation`
One sentence explaining why the correct answer is right. Plain Swedish. Should reference the passage anchor.

### `distractor_types`
For each **wrong** option, categorize why it is wrong. Use exactly one of these labels:
- `går_för_långt` — the option says more than the text supports; it's an overreach
- `ytlig_läsning` — sounds plausible on the surface but misreads the text
- `rätt_fakta_fel_fråga` — the statement is true according to the text, but doesn't answer this question
- `nära_men_inte_riktigt` — partially correct or very close, but misses something important

Only include keys for the wrong options (not the correct one).

**Blind-test the incoming questions before formatting (validation gate).** These questions come from outside, so they may be weak. For each one apply the test from `Bilaga: Distraktordesign` in `analysis/_LAS_analys.md`: would someone who only skimmed the text pick the correct answer on length, keyword, or general plausibility? Flag — don't silently format — any question where the correct answer is the longest/most-hedged option, where it merely echoes the anchor verbatim, or where a distractor is a caricature eliminable without reading. Tell the user which question is weak and why, and offer a stronger rewrite using the appendix's eight tools.

### `notes`
Leave blank unless there is something genuinely unusual worth flagging.

---

## Step 8 — Format vocab_highlights JSON

For each ORD word in the combined list from Step 5:
1. Look up `definition_sv` from `ord-database.csv`
2. Verify the word appears in the final body (it should, since the list was built from the body)

Output as:
```json
[
  { "word": "förskjutning", "definition": "..." },
  { "word": "vördnad", "definition": "..." }
]
```

Use the `definition_sv` value verbatim from the ORD database.

---

## Step 9 — Set featured_ord_words

The combined list from Step 5 — **curated words only** (`past_exams = 'curated'`; drop past-HP words even if they appear in the body) — formatted as a JSON array of strings:

```
["förskjutning","vördnad","godtycke","premieras"]
```

Order does not matter, but deduplicate.

---

## Step 10 — Assemble and output the CSV row

Output a single CSV row with these columns in exact order:

`id, title, source_url, source_name, domain, genre, word_count, difficulty, question_count, unit_position, past_hp, body, questions, vocab_highlights, featured_ord_words, is_designed_content, notes`

> The `is_designed_content` column was added in migration `009_designed_content.sql`. Default `TRUE` for designed pedagogical material (the typical case); `FALSE` only when the article is based on a real published source. Never displayed to users — internal flag only.

To add the row to the database, use the shared safe encoder `scripts/append-las-row.cjs` (same mechanism as `write-las-article` Step 9). It handles all CSV escaping, the `featured_ord_words` literal, word-count, next-id, validation (`correct` ∈ options, kort=2/lång=4, dup-title) and a parse-back check — so a stray quote can't silently break the seed pipeline.

1. Build a **plain JSON payload** (native values, no CSV escaping anywhere): `title`, `domain`, `genre`, `unit_position`, `difficulty`, `body` (the **final** body, after approved swaps), `questions`, `vocab_highlights` (Step 8), `featured_ord_words` (Step 9 — already an array of strings). For a real published source set `is_designed_content: false` with the matching `source_url`/`source_name`; otherwise the defaults (`TRUE` / `Fattat`) apply. Write it to `_las_payload.json`.
2. Preview + verify without writing: `node scripts/append-las-row.cjs _las_payload.json --dry-run`. Show the summary, resolve any ⚠ warnings, then ask: *"Ser det bra ut? Jag lägger till raden i `las-database.csv`."*
3. On confirm: `node scripts/append-las-row.cjs _las_payload.json`. Then delete the temp payload.

---

## Quality checks before output

- Final body reads naturally — no swap feels forced or breaks register
- Every question has a `passage_anchor` that is a verbatim quote from the **final** body (not the pre-swap version)
- Every wrong option has a `distractor_type`
- Every ORD word in `vocab_highlights` is present in the final body and exists in `ord-database.csv`
- `question_count` matches the actual number of questions
- `unit_position` matches: `kort` = 2 questions, `lång` = 4 questions
- If Step 3 found zero ORD words and Step 4 produced zero approved swaps, flag this to the user — the article won't reinforce any vocabulary and that defeats part of the LÄS pedagogical purpose
