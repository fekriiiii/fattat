# ORD + LÄS — analysfynd för Högskoleprovet 2013–2025

> **Navigering ligger numera i `CLAUDE.md` → "Document Index"** (uppdaterat 2026-07-24). Detta
> dokument behålls för sina *fynd* på korpusnivå, inte som filregister.

Detta är översiktsdokumentet för en datadriven genomgång av **75 PDF:er** från Högskoleprovet — 49 verbala provpass + 26 facit — där ORD- och LÄS-sektionerna analyserats.

## Snabbsiffror

| Mått | Värde |
|---|---|
| Provomgångar i basen | 25 (HT 2013 → VT 2025) |
| Verbala provpass extraherade | 49 |
| Facit-PDF:er parsade | 26 |
| **ORD-uppgifter med facit** | **490 / 490** |
| **LÄS-texter identifierade** | **~140** |
| **LÄS-bylines extraherade** | **~65** |
| Genomsnittlig LÄS-textmängd per provpass | ~3 200 ord |

## Genererade markdown-rapporter

| Fil | Innehåll |
|---|---|
| [ORD_databas.md](ORD_databas.md) | Fullständig katalog över **490 ordförståelseuppgifter** — varje uppslagsord med alla fem alternativ A–E, rätt svar markerat. Grupperade per provomgång. |
| [ORD_analys.md](ORD_analys.md) | Statistik och pluggstrategi: fördelning av rätt svar, **nyckelordsfrånvaron** (0 ord återkommer), distraktor-återanvändning, ord-typsfördelning, ordlängd vs uppgiftsnummer, alfabetisk index. |
| [LAS_katalog.md](LAS_katalog.md) | Katalog över LÄS-texter i samtliga 49 provpass: titlar, bylines, ordmängd per avsnitt, temasammanställning. |
| [_LAS_analys.md](_LAS_analys.md) | Djupare läsförståelse-analys för 16 utvalda provpass: per-text klassificering av domän, stil, källa, längd och frågetyp (HT, DET, INF, ÅSY, ORD, STR, KRI). Innehåller även bilagan om distraktordesign. |

## Viktigaste analytiska fynd

### ORD

1. **100 % unicitet på uppslagsordsnivå.** Inga av de 490 nyckelorden återanvänds över 12 årgångar. Pluggstrategi: lär in *vokabulärnivå*, inte gamla listor.
2. **Svarsbokstävernas fördelning är jämn** (17.6 % → 22.4 % över A→E). Gissningsregler à la "C är vanligast" har ingen statistisk grund i HP.
3. **15 facit-fraser återanvänds** (men för olika uppslagsord). Synonymen _tillrättavisning_ är t.ex. rätt svar för _näsbränna, reprimand, åthutning_ i tre olika provomgångar — distraktor-vokabulären roteras.
4. **43 idiomatiska flerords-uttryck** identifierade — dessa är överrepresenterade på position 8–10 och är ofta avgörande för slutpoängen.
5. **Ordlängden ökar med uppgiftsnumret**: position 1 har snittlängd ~7 tecken, position 10 ~10 tecken. Svårighetstrappan följer alltså också ordmorfologisk komplexitet.

### LÄS

1. **Strukturell stabilitet 2013→2025**: 2–4 texter per provpass, alltid 10 frågor (uppg. 11–20), genre-mixen *populärvetenskaplig + samhälls-/politik + kultur/litteratur* återkommer i nästan varje provpass.
2. **Längd-arkitektur**: median för en "lång" LÄS-text ≈ 1100 ord (span 800–1300); öppnande text oftast kort (200–500 ord). Total LÄS-textmängd per provpass: ~3 000–3 500 ord.
3. **Källor namnges nästan alltid** — UHR signerar texter med originalförfattare i högerkanten. Översättningar är ovanliga.
4. **Frågetypsdominans**: cirka 53 % av alla LÄS-frågor är antingen detaljförståelse (DET) eller författarens åsikt/syfte (ÅSY). Inferens (INF) ≈ 19 %. Huvudtanke (HT) ≈ 12 %. Ord-i-kontext (ORD) endast ≈ 3 %.
5. **"Alternativ rubrik"-formuleringen** är ett återkommande HT-format — finns i nästan varje provpass.
6. **Genusperspektiv återkommer** påtagligt — flera texter har explicit genus- eller maktperspektiv (Bankerna, Utsatta gruppers hälsa, Flickboken och yrkeslivet, Nya yrken, Trakasserier och tvång).

## Tekniska artefakter (för spårbarhet)

- `_extracted_*.txt` — `pdftotext -layout -enc UTF-8` av alla 75 PDF:er.
- `_parse_ord.py` — extraherar ORD-uppgifter (kolumn-medveten parser).
- `_parse_las.py` — extraherar LÄS-titlar och bylines.
- `_gen_ord_md.py` / `_gen_las_md.py` — markdown-generatorer.
- `_ord_data.json` / `_las_data.json` — strukturerad data, lämplig för vidare bearbetning.

## Avgränsningar

- **Heuristisk titelextraktion**: ~6 % av de identifierade LÄS-titlarna är fortfarande paragraffragment där PDF-extraktionen inte kunde separera kolumnerna rent. Bylines har högre felmarginal eftersom flerordsförfattare och institutionssignaturer faller utanför heuristikens mall.
- **Djup frågetyp-klassificering finns endast för 16 av 49 provpass** (de i `_LAS_analys.md`). Övriga 33 är endast katalogiserade på titelnivå.
- **MEK- och ELF-sektionerna är inte analyserade** — fokus enligt frågeställning var ORD + LÄS.
