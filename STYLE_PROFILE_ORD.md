# ORD Database Style Profile

> Auto-generated from `ord-database.csv` by `scripts/analyze-ord-style.mjs`.
> Total entries analyzed: **540**.

This document captures the empirical "fingerprint" of the past-exam ORD words.
Use it as the style reference when generating curated (non-past-exam) words in Phase 2.

---

## 1. Part of speech (POS) distribution

- sb: 249 (46.1%)
- adj: 140 (25.9%)
- vb: 103 (19.1%)
- adv: 33 (6.1%)
- annat: 11 (2.0%)

**Interpretation:** Use these proportions as the target mix when curating new words.

---

## 2. Difficulty distribution

- 2: 295 (54.6%)
- 1: 156 (28.9%)
- 3: 89 (16.5%)

**Interpretation:** Phase 2 should match this curve — most curated words land at difficulty 2, with a smaller tail at 1 and 3.

---

## 3. Domain distribution

- allmän: 344 (63.7%)
- kultur: 58 (10.7%)
- samhälle: 39 (7.2%)
- vetenskap: 35 (6.5%)
- juridik: 29 (5.4%)
- medicin: 24 (4.4%)
- ekonomi: 11 (2.0%)

**Interpretation:** Domains with fewer entries are the gap-fill targets for Phase 2.

---

## 4. Past exam coverage (Phase 1 source spread)

- 2022-V: 40 (7.4%)
- 2021-V: 40 (7.4%)
- 2026-V: 20 (3.7%)
- 2025-H: 20 (3.7%)
- 2025-V: 20 (3.7%)
- 2024-H: 20 (3.7%)
- 2024-V: 20 (3.7%)
- 2023-H: 20 (3.7%)
- 2023-V: 20 (3.7%)
- 2022-H: 20 (3.7%)
- 2019-H: 20 (3.7%)
- 2020-H: 20 (3.7%)
- 2021-H: 20 (3.7%)
- 2019-V: 20 (3.7%)
- 2018-H: 20 (3.7%)
- 2018-V: 20 (3.7%)
- 2017-H: 20 (3.7%)
- 2017-V: 20 (3.7%)
- 2016-H: 20 (3.7%)
- 2016-V: 20 (3.7%)
- 2015-H: 20 (3.7%)
- 2015-V: 20 (3.7%)
- 2014-H: 20 (3.7%)
- 2014-V: 20 (3.7%)
- 2013-H: 20 (3.7%)

---

## 5. Definition (Swedish) length — words

- Range: 1–14
- Mean: 7.95, median: 8
- 10th–90th percentile: 4–12

**Style rule for Phase 2:** Aim for definitions in the **4–12 word** range. Avoid dictionary-bloat (≥30 words).

---

## 6. Example sentence length — words

- Range: 6–16
- Mean: 9.79, median: 10
- 10th–90th percentile: 8–12

**Style rule for Phase 2:** Example sentences should sit in the **8–12 word** range. Single, complete, contextual sentences — not lists.

---

## 7. Accepted synonyms

- Words with accepted_synonyms set: **493 / 540** (91.3%)
- Among those, mean alternative count: 2.09
- Range: 1–4

**Style rule for Phase 2:** Most words have 1–4 accepted alternative spellings for the typing variant. Match this density.

---

## 8. Notes field — register / etymology tags

- Words with non-empty notes: **226 / 540** (41.9%)
- Bucketed:
  - lånord-tag: 124
  - formell-register: 39
  - övrigt: 36
  - fackterm: 8
  - ålderdomligt/arkaiskt: 7
  - bildligt/metafor: 6
  - vardagligt: 4
  - synonym-info: 2

**Style rule for Phase 2:** Add a short register/etymology note when the word is a loanword, formal register, archaic, or metaphorical. Skip notes for plain everyday words.

---

## 9. Word length (characters)

- Range: 3–21
- Mean: 8.56, median: 8
- 10th–90th percentile: 5–12

---

## 10. Correct synonym — single-word vs multi-word

- Multi-word correct synonyms: 169 / 540 (31.3%)

**Style rule for Phase 2:** Most correct synonyms are single-word. Use multi-word forms (e.g. "upphöjd plattform") only when no single Swedish word captures the meaning.

---

## 11. Distractor word count

- Range: 1–6 words
- Multi-word distractors: 523 / 2160 (24.2%)

**Style rule for Phase 2:** Distractors should match the correct synonym's length profile — if the correct is single-word, distractors should be too.

---

## 12. POS × difficulty crosstab

| POS | diff 1 | diff 2 | diff 3 | total |
|---|---|---|---|---|
|  | 0 | 4 | 0 | 4 |
| adj | 40 | 81 | 19 | 140 |
| adv | 11 | 21 | 1 | 33 |
| annat | 5 | 6 | 0 | 11 |
| sb | 64 | 125 | 60 | 249 |
| vb | 36 | 58 | 9 | 103 |

---

## 13. Domain × difficulty crosstab

| Domain | diff 1 | diff 2 | diff 3 | total |
|---|---|---|---|---|
| allmän | 110 | 192 | 42 | 344 |
| ekonomi | 6 | 4 | 1 | 11 |
| juridik | 4 | 20 | 5 | 29 |
| kultur | 12 | 28 | 18 | 58 |
| medicin | 3 | 15 | 6 | 24 |
| samhälle | 15 | 21 | 3 | 39 |
| vetenskap | 6 | 15 | 14 | 35 |

---

## How to use this profile

When generating Phase 2 (curated) words via the upcoming `/curate-ord-words` skill, the new entries should — **as a batch** — converge on the same distributions and length profiles documented above.

For each individual word, follow the style rules called out in each section.
