# Fattat — HP-verbala

Ett modernt, webbaserat verktyg byggt för att hjälpa studenter att bemästra den **verbala delen av Högskoleprovet (HP)**. Applikationen erbjuder interaktiva övningar, ord-träning och analys baserat på historiska högskoleprov.

Besök den live-distribuerade appen här: [fattat](https://www.fattat.se/)

---

## 🚀 Funktioner & Innehåll
- **Ordträning (ORD):** Öva på ordkunskap med hjälp av en dedikerad databas över komplexa svenska ord.
- **Läs- & Analysverktyg (LAS):** Förbättra läsförståelsen med övningar strukturerade kring längre textstycken.
- **Historiska Prov:** Tillgång till samlat material och data från tidigare högskoleprov (`Past_hp`).
- **Analyspanel:** Följ din utveckling och se statistik över dina framsteg över tid.
- **Robust Backend:** Drivs med databashantering i realtid via Supabase.

---

## 🛠️ Stack & Teknologier
Projektet är byggt med ett modernt ekosystem för webbutveckling:
- **Framework:** [Next.js](https://nextjs.org) (App Router, bootstrappad med `create-next-app`)
- **Styling:** [Tailwind CSS](https://tailwindcss.com) & PostCSS
- **Databas & Auth:** [Supabase](https://supabase.com) (med tillhörande databasmigreringar)
- **Typsäkerhet:** TypeScript
---

## 📁 Projektstruktur
Här är en översikt av de viktigaste katalogerna och filerna i repot:
- `/src` — Innehåller applikationens källkod, komponenter och sidor (Next.js).
- `/supabase/migrations` — SQL-filer för uppsättning och migrering av databasscheman.
- `/Past_hp` & `/docs` — Historiskt provmaterial samt dokumentation.
- `ord-database.csv` & `las-database.csv` — Databaser i CSV-format innehållande ord samt läsförståelsematerial.
- `all-words-dedup.txt` — En rensad och deduplicerad ordlista för språkbehandling.
