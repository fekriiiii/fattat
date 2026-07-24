# Extract ORD Words from HP Test PDFs — Phase 1

Extract vocabulary (ORD) words from official Högskoleprovet PDFs and format them for the Fattat word database. This command handles Phase 1: words directly sourced from past exams.

---

## Step 1 — Gather inputs

Ask the user for:
1. Path to the **test PDF** (provhäfte) — the actual exam paper
2. Path to the **facit PDF** — the answer key
3. **Exam code** in the format `YYYY-V` (vår) or `YYYY-H` (höst), e.g. `2024-H`

---

## Step 2 — Read the existing database

Read `ord-database.csv` from the project root. From it:
- Find the **current maximum `id`** — new rows continue from here
- Read 5–10 recent high-quality entries (those with full `definition_sv` and `example_sentence`) to calibrate the writing style

---

## Step 3 — Read both PDFs

Read the test PDF and the facit PDF.

In the test PDF, locate the **ORD (ordförståelse)** section. Each question shows:
- A target word (sometimes with a short context sentence)
- Five answer options labeled **A, B, C, D, E**

In the facit, find the correct letter for each ORD question.

---

## Step 4 — Generate one database row per word

For each ORD question, produce one row with these columns in exact order:

### `id`
Next integer after the current max in `ord-database.csv`.

### `word`
The target word exactly as printed in the test. Preserve capitalisation, hyphens, and spacing. For multi-word phrases (e.g. *lägga band på sig*), include the full phrase.

### `pos`
Part of speech, abbreviated:
- `sb` — substantiv (noun)
- `vb` — verb (include reflexive marker if the phrase is reflexive, e.g. *freda sig*)
- `adj` — adjektiv
- `adv` — adverb
- Leave blank if genuinely ambiguous (some fixed phrases function as multiple categories)

Infer from the word's form and the test context sentence if one is given.

### `correct_synonym`
The answer option the facit marks as correct. Use the **exact text** from the test — do not paraphrase.

### `distractor_1`, `distractor_2`, `distractor_3`, `distractor_4`
The four wrong options, in the order they appear in the test (skip the correct one).

### `definition_sv`
Write a short, plain Swedish definition. Rules:
- **One sentence, maximum 20 words**
- For verbs: start with "Att..." or describe the action directly
- For nouns: describe the concept plainly — not "En/Ett..." unless it reads naturally
- For adjectives/adverbs: describe the quality or manner
- **Plain Swedish** — no academic meta-language like "benämning för" or "begrepp inom"
- Capture the **core meaning** only, not edge cases or all senses
- Match the simple, direct style of entries already in the database — e.g.:
  - *"En bedömning av hur något sannolikt kommer att utvecklas framöver."* (prognos)
  - *"Skicklig på att manipulera andra eller uppnå mål med list."* (slug)
  - *"Absolut inte; på intet sätt."* (ingalunda)

### `example_sentence`
One natural Swedish sentence showing the word in realistic use. Rules:
- **Maximum 20 words**
- Concrete, realistic scenario — not abstract or generic
- The word should appear in a typical context, not a contrived one
- Neutral to slightly formal register — matches how the word appears in Swedish newspapers or non-fiction
- Do not repeat the definition — show the word doing real work in a sentence

### `domain`
Choose exactly one:
- `juridik` — law, rights, crime, courts
- `medicin` — health, biology, anatomy, treatment
- `kultur` — arts, literature, history, language
- `vetenskap` — science, research, technology
- `samhälle` — politics, society, social issues, education
- `ekonomi` — business, finance, commerce, trade
- `allmän` — everyday vocabulary with no clear specialist domain

When in doubt, use `allmän`.

### `difficulty`
Rate 1, 2, or 3:
- `1` — Common academic word; most HP test-takers with solid reading habits will know it
- `2` — Less common; requires broad reading experience to know reliably
- `3` — Rare, archaic, or technical; typically Latin/French loans or specialist register words

### `past_exams`
The exam code the user provided in Step 1, e.g. `2025-H`.

### `accepted_synonyms`
**Leave this blank.** It fed the app's typing variant (accept correct alternatives a student might type). Typing was removed 2026-07-24 in favour of recognition-only multiple choice, and no runtime code reads the column anymore. Keep it as an empty column so the CSV shape stays stable for `seed.ts`; do not generate alternatives.

### `notes`
Only fill in if there is something genuinely worth flagging for future review:
- Register: `Formellt register`, `Arkaiskt`, `Vardagligt`
- Origin: `Latinskt lånord`, `Franskt lånord`, `Grekiskt lånord`
- Grammar: `Reflexivt verb`, `Fast uttryck`, `Plural används oftast`
- Common confusion with another word

Leave blank otherwise. Do not add notes just to fill the column.

---

## Step 5 — Output and save

Show all generated rows as a formatted CSV block for the user to review.

Then ask: *"Ser det bra ut? Jag kan lägga till raderna direkt i `ord-database.csv`, eller så kopierar du dem till Google Sheets."*

If the user confirms appending:
- Open `ord-database.csv`
- Check if the header already has the `accepted_synonyms` column — if not, add it between `past_exams` and `notes`
- Append only the new rows — never modify existing rows
- Confirm how many rows were added

---

## Quality checks before output

Before showing the results, verify each row:
- `word` is non-empty
- `correct_synonym` is non-empty and matches one of the five test options exactly
- All four distractors are filled
- `definition_sv` is one sentence, ≤20 words, in Swedish
- `example_sentence` is one sentence, ≤20 words, in Swedish, and actually uses the word
- `domain` is one of the seven allowed values
- `difficulty` is 1, 2, or 3
- `past_exams` matches the exam code provided

If any row fails a check, fix it before output — do not ask the user to fix it manually.
