/**
 * verify-las-seed.ts — assert that what is in las/ is what is in Postgres.
 *
 * Why this exists (in plain language): twice now, an article field has been
 * quietly renamed or dropped on the way into the database, and nobody found out
 * for weeks because nothing crashed. The feature just did nothing.
 *
 *   • 2026-06-16 — `featured_ord_words` was never copied at all, so the whole
 *     ORD→LÄS reinforcement feature was a silent no-op.
 *   • 2026-07-24 — the seed wrote `definition_sv` while the UI read
 *     `definition`, so ~110 hand-written vocabulary definitions had never once
 *     rendered in production since the feature shipped.
 *
 * Both were invisible bugs of the same shape: the seed "succeeded", the app
 * rendered, and the content was gone. This script closes that class by
 * comparing every article file against the row it produced, field by field.
 *
 * It matters more the bigger the bank gets. A mapping bug across 13 articles is
 * an afternoon; across 100 it is the whole content week.
 *
 * How to run (after seeding):
 *   npx tsx scripts/verify-las-seed.ts
 *   npx tsx scripts/verify-las-seed.ts --dir=las
 *
 * Exit code 1 means the database does not match the files. Re-seed, or fix the
 * mapping in seed.ts, then run this again.
 *
 * Requirements: .env.local with NEXT_PUBLIC_SUPABASE_URL and
 * SUPABASE_SERVICE_ROLE_KEY (same as the seed).
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'

dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('\n❌ Saknar miljövariabler. .env.local måste innehålla:')
  console.error('  NEXT_PUBLIC_SUPABASE_URL=...')
  console.error('  SUPABASE_SERVICE_ROLE_KEY=...\n')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

const args = process.argv.slice(2)
const dirArg = args.find((a) => a.startsWith('--dir='))
const dir = dirArg ? dirArg.split('=')[1] : 'las'

type FileQuestion = {
  n?: number
  type?: string
  stem?: string
  options?: Record<string, string>
  correct?: string
  passage_anchor?: string
  explanation?: string
  distractor_types?: Record<string, string>
}

type FileArticle = {
  id: number | string
  title: string
  body: string
  domain: string
  genre: string
  unit_position: string
  difficulty: number
  word_count?: number
  question_count?: number
  questions: FileQuestion[]
  vocab_highlights: Array<{ word: string; definition?: string; definition_sv?: string }>
  featured_ord_words: string[] | string
}

type DbVocab = { word?: string; definition?: string; start_index?: number; end_index?: number }

// Mirrors add-las-article.cjs: accepts ["a","b"] or the {"a","b"} literal.
function featuredWords(f: unknown): string[] {
  if (Array.isArray(f)) return f.map((w) => String(w).trim()).filter(Boolean)
  if (typeof f === 'string') return (f.match(/"([^"]+)"/g) || []).map((s) => s.slice(1, -1))
  return []
}

function loadFiles(): Array<{ file: string; data: FileArticle }> {
  const full = path.isAbsolute(dir) ? dir : path.join(process.cwd(), dir)
  if (!fs.existsSync(full)) {
    console.error(`\n❌ Mappen ${dir}/ finns inte.\n`)
    process.exit(1)
  }
  return fs
    .readdirSync(full)
    .filter((f) => f.endsWith('.json'))
    .sort()
    .map((f) => ({
      file: f,
      data: JSON.parse(fs.readFileSync(path.join(full, f), 'utf8')) as FileArticle,
    }))
}

async function main() {
  const files = loadFiles()
  console.log(`\n🔍 Verifierar ${files.length} artiklar i ${dir}/ mot databasen\n`)

  const { data: rows, error } = await supabase
    .from('articles')
    .select('id, title, body, domain, genre, unit_position, difficulty, word_count, question_count, questions, vocab_highlights, featured_ord_words')

  if (error) {
    console.error('❌ Kunde inte läsa articles-tabellen:', error.message)
    process.exit(1)
  }

  // The seed matches on title (articles have no natural key), so we do too.
  const byTitle = new Map<string, Record<string, unknown>>()
  for (const r of rows ?? []) byTitle.set(String(r.title).trim(), r as Record<string, unknown>)

  const problems: string[] = []
  let okCount = 0

  for (const { file, data } of files) {
    const issues: string[] = []
    const row = byTitle.get(String(data.title).trim())

    if (!row) {
      problems.push(`✗ ${file}\n    saknas helt i databasen (titel: "${data.title}") — seed har inte körts eller misslyckades`)
      continue
    }

    // -- scalar fields -------------------------------------------------------
    const scalars: Array<[string, unknown, unknown]> = [
      ['domain', data.domain, row.domain],
      ['genre', data.genre, row.genre],
      ['unit_position', data.unit_position, row.unit_position],
      ['difficulty', Number(data.difficulty), Number(row.difficulty)],
    ]
    for (const [name, want, got] of scalars) {
      if (want !== got) issues.push(`${name}: filen säger ${JSON.stringify(want)}, databasen ${JSON.stringify(got)}`)
    }

    // Body must survive verbatim — a truncated body silently breaks every
    // passage_anchor and every vocab highlight index at once.
    if (String(data.body).trim() !== String(row.body ?? '').trim()) {
      const a = String(data.body).trim().length
      const b = String(row.body ?? '').trim().length
      issues.push(`body skiljer sig (fil ${a} tecken, databas ${b})`)
    }

    // -- questions -----------------------------------------------------------
    const dbQuestions = Array.isArray(row.questions) ? (row.questions as FileQuestion[]) : []
    if (dbQuestions.length !== data.questions.length) {
      issues.push(`questions: filen har ${data.questions.length}, databasen ${dbQuestions.length}`)
    } else {
      data.questions.forEach((q, i) => {
        const d = dbQuestions[i]
        if (!d) { issues.push(`fråga ${i + 1} saknas i databasen`); return }
        if (d.correct !== q.correct) issues.push(`fråga ${i + 1}: correct är "${q.correct}" i filen men "${d.correct}" i databasen`)
        const wantOpts = Object.keys(q.options ?? {}).sort().join(',')
        const gotOpts = Object.keys(d.options ?? {}).sort().join(',')
        if (wantOpts !== gotOpts) issues.push(`fråga ${i + 1}: svarsalternativen skiljer sig (${wantOpts} mot ${gotOpts})`)
        // The two fields that carry our actual pedagogy. If either is dropped,
        // feedback degrades to "rätt/fel" without anyone noticing.
        if ((q.explanation ?? '') !== (d.explanation ?? '')) issues.push(`fråga ${i + 1}: explanation skiljer sig`)
        if ((q.passage_anchor ?? '') !== (d.passage_anchor ?? '')) issues.push(`fråga ${i + 1}: passage_anchor skiljer sig`)
        const wantDt = Object.keys(q.distractor_types ?? {}).sort().join(',')
        const gotDt = Object.keys(d.distractor_types ?? {}).sort().join(',')
        if (wantDt !== gotDt) issues.push(`fråga ${i + 1}: distractor_types-nycklar skiljer sig (${wantDt || 'inga'} mot ${gotDt || 'inga'})`)
      })
    }

    // -- vocab_highlights ----------------------------------------------------
    // This is where the definition_sv bug lived: right count, right words,
    // empty text. Checking the count alone would have missed it.
    const dbVocab = Array.isArray(row.vocab_highlights) ? (row.vocab_highlights as DbVocab[]) : []
    if (dbVocab.length !== data.vocab_highlights.length) {
      issues.push(`vocab_highlights: filen har ${data.vocab_highlights.length}, databasen ${dbVocab.length}`)
    } else {
      data.vocab_highlights.forEach((vh, i) => {
        const d = dbVocab[i]
        if (!d) { issues.push(`vocab_highlight ${i + 1} saknas i databasen`); return }
        if (d.word !== vh.word) issues.push(`vocab_highlight ${i + 1}: ordet är "${vh.word}" i filen men "${d.word}" i databasen`)
        const wantDef = String(vh.definition ?? vh.definition_sv ?? '').trim()
        const gotDef = String(d.definition ?? '').trim()
        if (gotDef === '') issues.push(`vocab_highlight ${i + 1} ("${vh.word}"): definition är TOM i databasen — tooltipen visar ingenting`)
        else if (gotDef !== wantDef) issues.push(`vocab_highlight ${i + 1} ("${vh.word}"): definition skiljer sig från filen`)
        if (d.start_index === -1 || d.end_index === -1) {
          issues.push(`vocab_highlight ${i + 1} ("${vh.word}"): index -1 — ordet hittades inte i brödtexten, markeringen blir död`)
        }
      })
    }

    // -- featured_ord_words --------------------------------------------------
    // This is where the 2026-06-16 bug lived: the column simply stayed empty.
    const wantFeat = featuredWords(data.featured_ord_words)
    const gotFeat = featuredWords(row.featured_ord_words)
    if (wantFeat.length > 0 && gotFeat.length === 0) {
      issues.push(`featured_ord_words: filen har ${wantFeat.length} ord men databasen är TOM — ORD→LÄS-kopplingen är en no-op för den här artikeln`)
    } else if (wantFeat.join('|').toLowerCase() !== gotFeat.join('|').toLowerCase()) {
      issues.push(`featured_ord_words: filen har [${wantFeat.join(', ')}], databasen [${gotFeat.join(', ')}]`)
    }

    if (issues.length === 0) {
      okCount++
    } else {
      problems.push(`✗ ${file}\n` + issues.map((i) => `    ${i}`).join('\n'))
    }
  }

  // Rows in the database that no file produced. Usually a renamed title, which
  // leaves the old row behind and serves stale content to students forever.
  const fileTitles = new Set(files.map((f) => String(f.data.title).trim()))
  const orphans = (rows ?? []).filter((r) => !fileTitles.has(String(r.title).trim()))

  console.log('─'.repeat(72))
  if (problems.length) problems.forEach((p) => console.log(p + '\n'))
  if (orphans.length) {
    console.log(`⚠ ${orphans.length} artiklar finns i databasen utan motsvarande fil i ${dir}/:`)
    orphans.forEach((o) => console.log(`    "${o.title}" (id ${o.id})`))
    console.log('  Troligen en omdöpt titel. Den gamla raden ligger kvar och kan fortfarande serveras.\n')
  }

  console.log('─'.repeat(72))
  console.log(`${okCount}/${files.length} artiklar matchar databasen · ${problems.length} med avvikelser · ${orphans.length} föräldralösa rader`)

  if (problems.length > 0) {
    console.log('\nDatabasen matchar inte filerna. Kör seed igen, eller rätta mappningen i scripts/seed.ts.\n')
    process.exit(1)
  }
  console.log('\n✅ Databasen matchar las/ exakt.\n')
}

main().catch((e) => {
  console.error('❌ Oväntat fel:', e)
  process.exit(1)
})
