# Write LÄS Article — Generate and Add to Database

Generate an HP-authentic LÄS article from scratch, with ORD-database vocabulary baked in during writing. Uses empirical HP patterns (from `analysis/_LAS_analys.md`) to match authentic register, length, and question-type distribution. Always plans against the target slot distribution before writing. Outputs a complete CSV row for `las-database.csv`.

---

## HP Slot Model — the target distribution

Every HP provpass contains exactly **3 LÄS texts**: 1 kort (2 frågor) + 2 lång (4 frågor vardera). Fattat models this as **3 slots per provpass-set**:

| Slot | unit_position | Frågor | Domain |
|---|---|---|---|
| A — Kort | `kort` | 2 | any — lyrik/skönlitterär most common (~25%), men även medicin, samhälle, kultur, vetenskap |
| B — Lång 1 | `lång` | 4 | cluster 1: `medicin` or `vetenskap` |
| C — Lång 2 | `lång` | 4 | cluster 2: `samhälle`, `ekonomi`, `juridik`, or `kultur` |

A **complete provpass-set** = one article in Slot A + one in Slot B + one in Slot C.

**Target ratio**: for every 3 articles in the database — 1 kort : 2 lång.

**Balance rules**:
- Slot A (kort): domain varies freely. Track genre sub-distribution — avoid running ≥3 lyrik_prosa in a row.
- Slot B (lång): alternate `medicin` / `vetenskap` across articles (50/50 target).
- Slot C (lång): broad domain cluster. Track sub-distribution — target roughly equal coverage of samhälle, kultur, juridik/ekonomi over time. Genre within slot should vary (not all debatt, not all essä).
- The two lång texts in each set must cover **different domains** from each other.

---

## Invocation modes

The skill has two modes:

**Plan mode** — invoked with `/write-las-article plan` or when the user asks "vad saknas", "vad ska vi skriva härnäst", "visa planen":
- Run Steps 1–2 (database reads) then jump to Step 3 (coverage report) and stop. Do not write an article.

**Write mode** — invoked normally (no argument, or with specific domain/genre/theme):
- Run all steps through Step 9. **There is exactly ONE approval gate: the complete draft (body + questions, shown together) in Step 7.** Setup (Step 1/3b) and ORD-word selection (Step 4) are auto-derived and merely *announced*, never gated; the append (Step 9) runs automatically on that single "ja", relying on the script's guards. Do not ask for separate sign-off on inputs, the word list, the body, or the append — one "ja", not five.

---

## Step 1 — Determine inputs (Write mode only) — no gate

Take these from the invocation if the user supplied them; otherwise auto-derive **every** one from the Step 3 gap analysis. **Do not ask** — announce the resolved choice in a single line before writing (e.g. *"Väljer: Slot C — `juridik` / `juridisk` / lång. Tema: X."*). The user steers by rejecting the final draft, not by a setup gate.
1. **Domän** — `medicin`, `vetenskap`, `samhälle`, `kultur`, `ekonomi`, `juridik`
2. **Genre** — `populärvetenskap`, `debatt`, `akademisk`, `reportage`, `juridisk`, `personlig_essä`, `lyrik_prosa`, `litterär_prosa`
3. **unit_position** — `kort` / `lång`
4. **Tema** (valfritt) — derive an uncovered subject if not given.

---

## Step 2 — Read databases

1. Read `las-database.csv`:
   - Find the current maximum `id`
   - For each existing article, record: `domain`, `genre`, `unit_position`, `featured_ord_words`
   - Build a coverage map: count how many times each ORD word appears across all `featured_ord_words` columns

2. Read `ord-database.csv` in full (read in chunks of ~200 rows if needed). Extract for each entry:
   - `word`, `correct_synonym`, `accepted_synonyms`, `definition_sv`, `pos`, `domain`, `difficulty`, `past_exams`

---

## Step 3 — Coverage report (always shown, both modes)

### 3a — Slot count

Classify each existing article into Slot A / B / C / D using the slot model above. Count articles per slot.

Present a compact table:

```
SLOT-STATUS (N artiklar totalt = X kompletta set + Y lösa)

  Slot A  Kort   [N] artiklar   (lyrik_prosa: X, litterär_prosa: Y, övrigt: Z)
  Slot B  Lång1  [N] artiklar   (medicin: X, vetenskap: Y)
  Slot C  Lång2  [N] artiklar   (samhälle: X, kultur: Y, juridik: Z, ekonomi: W)

Ratio kort:lång = [N]:[N] (mål 1:2)
Minsta sloten: [Slot X] → nästa artikel bör fylla denna slot.
```

**Plan mode**: after showing this table, also list the next 6 recommended articles (slot + suggested domain + suggested genre + suggested theme), ordered by priority (most underfilled slot first, variety within slot). Stop here.

**Write mode**: show table, then continue.

### 3b — Derive missing inputs (Write mode, if user said "välj")

- **unit_position**: if Slot A is most underfilled → `kort`; if Slot B or C → `lång`
- **domain**: for Slot B pick whichever of medicin/vetenskap has fewer articles; for Slot C pick the least-represented sub-domain (samhälle, kultur, juridik, ekonomi); for Slot A domain varies freely
- **genre**: pick the least-used genre within the slot
- **tema**: pick a subject appropriate to domain + genre that hasn't been covered in recent articles

Announce the choices clearly before proceeding:
> *"Väljer: Slot B — `populärvetenskap` / `vetenskap` / lång. Tema: [X]."*

---

## Step 4 — Select target ORD words

### 4a — Coverage tiers

Using the coverage map from Step 2, assign each ORD word a tier:
- **Tier 1:** coverage 0 — never used (prefer strongly)
- **Tier 2:** coverage 1–2 (prefer)
- **Tier 3:** coverage 3–5 (neutral)
- **Tier 4:** coverage 6+ (deprioritize)

### 4b — Select candidates

**Hard filter — curated only.** Target and feature ONLY words with `past_exams = 'curated'`. Daily ORD introduces *only* curated words as new FSRS cards (migration 022); past-HP words (`past_exams = '2024-V'`, `'2017-V'`, …) are never practiced daily, so featuring them gives **dead ORD→LÄS reinforcement** — the article can never be selected for "you recently practiced word X" because X is never in the user's daily rotation. Past-HP words may still appear *incidentally* in the body (often they're the most natural term — e.g. a legal term in a juridisk text) and may be glossed in `vocab_highlights` as reading help, but they must NOT be `featured_ord_words` targets. `append-las-row.cjs` enforces this with a warning, but select correctly from the start.

Build a shortlist of **curated** ORD words that fit the article's domain + genre. Priority:
1. Tier 1/2 curated words whose `domain` matches
2. Tier 1/2 curated words from adjacent domains
3. Tier 3 curated domain-matching words if shortlist is thin

Only include words that can be used naturally in the target register.

Target count:
- **lång**: 8–12 ORD words
- **kort**: 4–6 ORD words

### 4c — Select (no gate)

Pick the words internally — no separate approval. They surface in the final draft (Step 7) for the single review, and `append-las-row.cjs` enforces curated-only + no cross-article overlap. If the user named a theme/angle, prefer words that serve it.

---

## Step 5 — Writing parameters

### Length targets
- `lång`: 1000–1200 words. Never below 950 — HP median is ~1100.
- `kort`: 250–400 words.

### Register by genre

**populärvetenskap**: Named Swedish author (plausible academic or journalist name). Third-person. Passive constructions and nominalizations. Specific research findings with named studies, institutions, or researchers (plausible, not externally verifiable). Dense information per sentence. No hedging about whether the science matters.

**debatt**: Clear argumentative voice attributed to a named author. Takes a position in paragraph 1. Uses rhetorical contrast ("Trots att...", "Det hävdas att... men i verkligheten..."). Statistics and named opponents or institutions. Ends with a concrete demand or vision.

**akademisk**: Formal, nominalized prose. Passive preferred. Long noun phrases. Complex subordination. Cites positions and counterpositions without taking explicit sides. Dense and precise.

**reportage**: Journalistic, concrete. Short-to-medium sentences mixed with longer analytical ones. Named sources with direct or indirect quotes. Specific details (years, numbers, places). A driving question answered across the text.

**juridisk**: Bureaucratic-formal. Passive + infinitive constructions. Embedded lists and precise distinctions. Impersonal voice ("nämnden konstaterar", "det följer av").

**personlig_essä**: First-person, reflective. Starts concrete (memory, observed detail), widens to general claim. Literary allusions welcome.

**lyrik_prosa**: Compressed, image-driven. Non-linear. Ambiguity intentional. Word choice foregrounded. `kort` only.

**litterär_prosa**: Third-person or close first-person. Concrete scene, emotional undercurrent. Suggestive rather than explicit. `kort` only.

### HP register markers (enforce for all genres)

- **Specificity**: named people (plausible Swedish names), named institutions, specific years, specific numbers
- **Information density**: every sentence carries a substantive claim — no padding, no meta-commentary
- **Complex subordination**: use inskjutna bisatser, participial phrases, genitive chains; ≥20% of sentences should contain embedded clauses
- **No pedagogical scaffolding**: never write "Som vi ska se", "Det är viktigt att notera", "I denna text diskuterar vi"
- **Swedish discourse markers**: "Det framgår att", "Forskning visar att", "Enligt X har det visats att", "Det råder delade meningar om"
- **Source voice**: sounds like it appeared in a real Swedish publication (Forskning & Framsteg, Läkartidningen, DN Debatt, Riksrevisionen, Juridisk Tidskrift)
- **Inga em-dash (—)**: använd punkt, komma eller kolon i stället. Em-dash är den tydligaste signaturen på AI-skriven text. Gäller brödtext *och* frågetext (stem/alternativ/förklaring). Kolon för utvikning och en-dash (–) för intervall är okej. Hård spärr i `append-las-row.cjs` som blockerar append om en em-dash slinker med.

### ORD word integration rules

- Use each target ORD word (or an inflected form, or a listed synonym) exactly once
- Never cluster two ORD words in the same sentence unless thematically inseparable
- No quotation marks or "det vill säga"-pauses around the word
- The word should appear where it is the most natural lexical choice

---

## Step 6 — Write the article

Write the full article body.

**Title**: 2–5 words, noun-phrase style ("Heterotrofa bakterier", "Normativ rättsekonomi", "Skogsbruk på villovägar"). Literary genres may use more evocative titles.

Present:

```
---
UTKAST: [Titel]

[full article body]

---
ORD-ord inbakade: [word1], [word2], ... (N ord)
Längd: ~X ord
Slot: [A/B/C/D] — [genre] / [domän] / [unit_position]
```

Do not show or gate the body on its own. Hold it and present it together with the questions at the single gate in Step 7.

---

## Step 7 — Generate questions

Use the **confirmed article body** for all passage_anchor extractions.

### Distraktordesign — read first (obligatoriskt)

**Before writing any option, read the appendix `Bilaga: Distraktordesign` at the end of `analysis/_LAS_analys.md`.** It is the empirically reverse-engineered model of how real HP builds the four options so the correct answer can't be guessed. The single most common failure in AI-generated HP questions is that **the correct answer is too easy to spot** — it is the longest, most hedged, most "complete" option and paraphrases the most quotable sentence, while the distractors are caricatures that can be eliminated without reading. That is the opposite of HP. Follow the appendix's eight distractor tools and the per-question construction order. The non-negotiable rules distilled from it:

- Every distractor must be built FROM a real element of the text, misused via one of the eight tools (sant-men-fel-fråga, förkastat alternativ, rätt fakta/påhittat motiv, omvänd riktning, ytlig nyckelordsläsning, nära-men-inte-riktigt, fel led i två-leds, sant-för-en-del). No absent/false caricature distractors.
- The correct answer is a **reworded abstraction or a synthesis of ≥2 places** — never a verbatim echo of the anchor. Move the text's most memorable keywords/facts INTO the distractors, not the correct option.
- **Equalize all four options** in length, clause structure, and concreteness. For nuanced/stance questions give all four the same "X men Y" skeleton so the most balanced one isn't a tell. A synthesis correct answer runs long because it joins two clauses — so actively pad the distractors with their own qualifying clauses. **Count the words: the correct answer must never be the clearly longest option.** This is how the length-tell sneaks back in after the content is fixed.
- At least one distractor must use tool 1 (sant-men-fel-fråga) and at least one tool 6 (nära-men-inte-riktigt).
- **Blind-test every question:** would someone who only skimmed pick the right answer on length, keyword, or plausibility? If yes, rewrite until the only path to the correct answer is the precise reading operation.

### Question count
- `kort`: 2 questions
- `lång`: 4 questions

### Question type selection by genre

| Genre | lång (4 frågor) | kort (2 frågor) |
|---|---|---|
| populärvetenskap | DET, DET/INF, INF, HT | HT + DET |
| debatt | ÅSY, ÅSY, DET, HT | ÅSY + INF |
| akademisk | DET, INF, ÅSY, STR | DET + INF |
| reportage | DET, INF, ÅSY, HT | INF + HT |
| juridisk | DET, DET, HT, STR | DET + HT |
| personlig_essä | INF, ÅSY, STR, HT | INF + ÅSY |
| lyrik_prosa | INF, STR | INF + HT |
| litterär_prosa | INF, INF, STR, HT | INF + HT |

Map to internal `type` values:
- DET → `detalj_fakta` or `detalj_kausal` (causal when the question is about why/how)
- ÅSY → `ståndpunkt`
- INF → `slutledning`
- HT → `huvudtanke`
- STR → `syfte_funktion`
- KRI → `jämförande`

### Question JSON structure:

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

### Rules

- **stem**: references the text explicitly; standard HP phrasings: "Vad framgår av texten om...?", "Vilket påstående stöds av texten?", "Vad är textförfattarens huvudsakliga ståndpunkt?", "Vilken alternativ rubrik sammanfattar textens huvudinnehåll bäst?"
- **correct answer**: unambiguously supported by passage_anchor alone
- **distractors**: each wrong option records which of the eight distractor tools it uses (the `distractor_types` value names the tool, e.g. `sant_men_fel_fråga`, `förkastat_alternativ`, `rätt_fakta_påhittat_motiv`, `omvänd_riktning`, `ytlig_nyckelordsläsning`, `nära_men_inte_riktigt`, `fel_led_två_leds`, `sant_för_en_del`). The three distractors must use three *different* tools; ≥1 must be `sant_men_fel_fråga` and ≥1 `nära_men_inte_riktigt`. The label states *why the distractor tempts*, not merely that it's wrong.
- **passage_anchor**: verbatim quote from confirmed body, 1–3 sentences. It must confirm the correct answer — but the correct option must *reword/abstract* it, not echo it. For HT/ÅSY/INF the anchor may span two places; the answer is a synthesis, not a copy.
- **explanation**: one sentence, plain Swedish, references the anchor

Show questions for review, including a one-line blind-test note per question proving the distractors aren't eliminable without reading:

```
FRÅGA 1 [type] — Korrekt: [X]
Stem: ...
A: ...  B: ...  C: ...  D: ...
Anchor: "..."
Verktyg: A=[tool] · C=[tool] · D=[tool]
Blindtest: [why a skimmer can't pick [X] on length/keyword/plausibility]
```

**This is the single approval gate.** Present the complete draft in ONE message — the body (UTKAST block from Step 6) followed by all questions (format above) — then ask once: *"Ser hela utkastet bra ut? Skriv 'ja' så lägger jag till artikeln — annars säg vad du vill ändra."* On "ja", go straight to Step 9 and append automatically with no further questions. If the user requests changes, revise and re-show only what changed, then re-ask the same single question.

---

## Step 8 — Compile ORD word metadata

From the confirmed article body:

1. List every ORD word (headword form) present in any inflected form
2. Look up `definition_sv` and `past_exams` for each in `ord-database.csv`

**vocab_highlights** — reading glossary; may include any notable ORD word in the body, *including* past-HP words (they aid comprehension):
```json
[{ "word": "prognos", "definition": "..." }, ...]
```

**featured_ord_words** (Postgres array literal) — the ORD→LÄS reinforcement tag, so **curated words only** (`past_exams = 'curated'`). Drop any past-HP word from this list even if it appears in the body — daily ORD never trains it, so featuring it is dead reinforcement. (`append-las-row.cjs` warns if a non-curated word slips through.)
```
{"prognos","kontroversiell",...}
```

---

## Step 9 — Append the row via the safe encoder

Do **not** hand-encode the CSV. The fiddly + dangerous escaping (doubled quotes, embedded newlines, the `featured_ord_words` array literal, the file's BOM) is handled by a tested helper: `scripts/append-las-row.cjs`. It auto-counts `word_count`, auto-assigns the next `id`, validates the row (required fields, `correct` ∈ options, kort=2/lång=4, dup-title), and verifies the row parses back before writing. A single mis-typed quote in a hand-built row can break the seed pipeline silently — this removes that risk.

**difficulty**: 1 = accessible, 2 = solid reading required, 3 = dense/formal/technical.

Steps:

1. Assemble the confirmed article as a **plain JSON payload** (native values — no CSV escaping anywhere). Required keys: `title`, `domain`, `genre`, `unit_position`, `difficulty`, `body`, `questions` (array), `vocab_highlights` (array), `featured_ord_words` (**array of strings**, e.g. `["prognos","diffus"]` — the script builds the `{"..."}` literal). Optional (defaults applied): `id` (max+1), `word_count` (counted from body), `question_count` (= questions.length), `source_url` (`""`), `source_name` (`"Fattat"`), `past_hp` (`""`), `is_designed_content` (`true` → `TRUE`), `notes` (`""`). Write it to a temp file, e.g. `_las_payload.json`.

2. **Dry-run, then append — automatically** (the single "ja" from Step 7 already authorized this; do NOT ask again):
   ```
   node scripts/append-las-row.cjs _las_payload.json --dry-run
   node scripts/append-las-row.cjs _las_payload.json
   ```
   Only pause if the dry-run prints a ⚠ warning that genuinely needs a human decision (e.g. a length/curated/overlap issue you can't resolve yourself) — surface just that. A benign length warning for a body inside the HP empirical range (783–1192 words) is fine to note in passing and proceed.

4. Delete the temp payload file.

5. Show the updated slot table from Step 3a so the user sees how the balance shifted.

Column order in the CSV, for reference: `id, title, source_url, source_name, domain, genre, word_count, difficulty, question_count, unit_position, past_hp, body, questions, vocab_highlights, featured_ord_words, is_designed_content, notes`. The script reads these from the header row, so it stays correct even if the schema changes later.

---

## Quality checks before output

- Article is in authentic HP Swedish register (complex subordination, information density, no pedagogical scaffolding)
- Word count within target range (lång ≥ 950, kort 250–400)
- Every target ORD word from Step 4 appears in confirmed body; note any dropped and why
- No ORD word appears more than once in the body
- Every passage_anchor is verbatim from confirmed final body
- Each question passes the blind-test: the correct answer is a reworded abstraction/synthesis (not a verbatim echo of the anchor), all four options are matched in length and register, and the text's memorable keywords sit in the distractors — not the correct option
- Each question's three distractors use three different tools from the `Bilaga: Distraktordesign` set, with ≥1 `sant_men_fel_fråga` and ≥1 `nära_men_inte_riktigt`; no caricature/absent distractors
- question_count matches actual question count
- unit_position matches: `kort` = 2 questions, `lång` = 4 questions
- featured_ord_words matches ORD words actually present in confirmed body
- Inga em-dash (—) i brödtext eller frågetext (ersätt med punkt, komma eller kolon; hård spärr i `append-las-row.cjs`)
- Slot classification of this article is correct (will be used in updated slot table)
