/**
 * Fattat — Database Seed Script
 *
 * What this does (in plain language):
 * 1. Reads the ORD CSV file (vocabulary words) and inserts them into the `words` table
 * 2. Reads the LÄS CSV file (articles) and inserts them into the `articles` table
 * 3. For each article, finds where each vocab highlight word appears in the body text
 *    and adds start/end position markers (needed for the in-app text highlighting feature)
 * 4. Skips any row that already exists (safe to run multiple times)
 *
 * How to run:
 *   npm run seed -- --ord=ord-database.csv --las=las-database.csv
 *
 * Both CSV files must be in the same folder as this script (scripts/),
 * OR you can give a full path.
 *
 * Requirements:
 *   - .env.local must exist with NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js'
import Papa from 'papaparse'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'

// Load environment variables from .env.local
dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('\n❌ Missing environment variables.')
  console.error('Make sure .env.local exists and contains:')
  console.error('  NEXT_PUBLIC_SUPABASE_URL=...')
  console.error('  SUPABASE_SERVICE_ROLE_KEY=...\n')
  process.exit(1)
}

// Service role bypasses RLS — only use server-side, never in the browser
const supabase = createClient(supabaseUrl, serviceRoleKey)

// ─── Parse command-line arguments ─────────────────────────────────────────────
const args = process.argv.slice(2)
function getArg(name: string): string | null {
  const arg = args.find((a) => a.startsWith(`--${name}=`))
  return arg ? arg.split('=').slice(1).join('=') : null
}

const ordFile = getArg('ord')
const lasFile = getArg('las')

// ─── Utilities ────────────────────────────────────────────────────────────────

function readCsv(filePath: string): unknown[] {
  const fullPath = path.isAbsolute(filePath)
    ? filePath
    : path.join(process.cwd(), filePath)

  if (!fs.existsSync(fullPath)) {
    throw new Error(`File not found: ${fullPath}`)
  }

  const content = fs.readFileSync(fullPath, 'utf-8')
  const result = Papa.parse(content, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
  })

  if (result.errors.length > 0) {
    console.warn(`⚠️  CSV parse warnings in ${filePath}:`)
    result.errors.slice(0, 3).forEach((e) => console.warn(`   Row ${e.row}: ${e.message}`))
  }

  return result.data as unknown[]
}

// Find all occurrences of a word in body text and return the first one's indices
// This is used so the app can highlight the word in the article text
function findWordInText(
  body: string,
  word: string
): { start_index: number; end_index: number } | null {
  // Try exact match first (case-insensitive)
  const lowerBody = body.toLowerCase()
  const lowerWord = word.toLowerCase()
  const idx = lowerBody.indexOf(lowerWord)
  if (idx !== -1) {
    return { start_index: idx, end_index: idx + word.length }
  }
  // Try without trailing/leading punctuation
  const stripped = lowerWord.replace(/[.,;:!?]$/, '').trim()
  const idx2 = lowerBody.indexOf(stripped)
  if (idx2 !== -1) {
    return { start_index: idx2, end_index: idx2 + stripped.length }
  }
  return null
}

// ─── ORD Seeding ──────────────────────────────────────────────────────────────

async function seedOrd(filePath: string) {
  console.log(`\n📚 Seeding ORD words from: ${filePath}`)
  const rows = readCsv(filePath) as Record<string, string>[]
  console.log(`   Found ${rows.length} words`)

  const words = rows.map((row) => ({
    // We use the CSV's integer id as a stable reference but let the DB generate UUIDs
    word: row.word?.trim(),
    pos: row.pos?.trim() || 'sb',
    correct_synonym: row.correct_synonym?.trim(),
    distractor_1: row.distractor_1?.trim(),
    distractor_2: row.distractor_2?.trim(),
    distractor_3: row.distractor_3?.trim(),
    distractor_4: row.distractor_4?.trim(),
    definition_sv: row.definition_sv?.trim(),
    example_sentence: row.example_sentence?.trim() || '',
    domain: row.domain?.trim() || 'allmän',
    difficulty: parseInt(row.difficulty || '2', 10),
    past_exams: row.past_exams
      ? row.past_exams.split(',').map((s: string) => s.trim()).filter(Boolean)
      : [],
    accepted_synonyms: row.accepted_synonyms?.trim() || null,
  }))

  // Validate — skip any row missing required fields
  const valid = words.filter((w) => {
    if (!w.word || !w.correct_synonym || !w.distractor_1) {
      console.warn(`   ⚠️  Skipping incomplete row: "${w.word || '(no word)'}"`)
      return false
    }
    return true
  })

  if (valid.length === 0) {
    console.log('   No valid words to insert.')
    return
  }

  // Upsert: if a word already exists, update it; otherwise insert
  const { error, count } = await supabase
    .from('words')
    .upsert(valid, { onConflict: 'word', count: 'exact' })

  if (error) {
    console.error('   ❌ Error inserting words:', error.message)
    console.error('   Detail:', error.details)
  } else {
    console.log(`   ✅ ${valid.length} words upserted successfully`)
  }
}

// ─── LÄS Seeding ──────────────────────────────────────────────────────────────

async function seedLas(filePath: string) {
  console.log(`\n📰 Seeding LÄS articles from: ${filePath}`)
  const rows = readCsv(filePath) as Record<string, string>[]
  console.log(`   Found ${rows.length} articles`)

  const articles = rows.map((row, i) => {
    // Parse questions JSON
    let questions: unknown[] = []
    if (row.questions) {
      try {
        questions = JSON.parse(row.questions)
      } catch {
        console.warn(`   ⚠️  Could not parse questions JSON for article "${row.title}" (row ${i + 2})`)
      }
    }

    // Parse vocab_highlights JSON and compute start/end indices in body text
    let vocab_highlights: unknown[] = []
    if (row.vocab_highlights && row.body) {
      try {
        const raw = JSON.parse(row.vocab_highlights) as Array<{
          word: string
          definition: string
          definition_sv?: string
        }>
        vocab_highlights = raw.map((vh) => {
          const position = findWordInText(row.body, vh.word)
          return {
            word: vh.word,
            definition_sv: vh.definition_sv ?? vh.definition,
            start_index: position?.start_index ?? -1,
            end_index: position?.end_index ?? -1,
          }
        })
        const notFound = vocab_highlights.filter((v: any) => v.start_index === -1)
        if (notFound.length > 0) {
          console.warn(
            `   ⚠️  Could not find ${notFound.length} highlight word(s) in body for "${row.title}":`,
            (notFound as any[]).map((v) => v.word).join(', ')
          )
        }
      } catch {
        console.warn(`   ⚠️  Could not parse vocab_highlights JSON for article "${row.title}" (row ${i + 2})`)
      }
    }

    // Step 17 — designed-content branding & flag
    // If source_name is blank, the article is designed pedagogical material:
    //   • Brand it as a Fattat original ("Fattat") so the UI doesn't show it as
    //     un-sourced or, worse, falsely attributed.
    //   • Mark is_designed_content TRUE for internal analytics.
    // If a real source is given, preserve it and mark FALSE.
    const rawSourceName = row.source_name?.trim() || ''
    const sourceName = rawSourceName === '' ? 'Fattat' : rawSourceName
    const isDesignedContent = rawSourceName === '' ? true : (
      row.is_designed_content?.trim().toLowerCase() === 'false' ? false : true
    )

    return {
      title: row.title?.trim(),
      body: row.body?.trim() || '',
      source_url: row.source_url?.trim() || null,
      source_name: sourceName,
      domain: row.domain?.trim() || 'allmän',
      genre: row.genre?.trim() || 'populärvetenskap',
      word_count: parseInt(row.word_count || '0', 10),
      difficulty: parseInt(row.difficulty || '2', 10),
      unit_position: row.unit_position?.trim() || 'lång',
      question_count: parseInt(row.question_count || '0', 10),
      questions,
      vocab_highlights,
      is_designed_content: isDesignedContent,
    }
  })

  // Validate
  const valid = articles.filter((a) => {
    if (!a.title || !a.body) {
      console.warn(`   ⚠️  Skipping incomplete article: "${a.title || '(no title)'}"`)
      return false
    }
    return true
  })

  if (valid.length === 0) {
    console.log('   No valid articles to insert.')
    return
  }

  // Articles don't have a natural unique key (title could repeat), so insert fresh
  // But to make it safe to re-run, check if article with same title+source already exists
  for (const article of valid) {
    const { data: existing } = await supabase
      .from('articles')
      .select('id')
      .eq('title', article.title)
      .maybeSingle()

    if (existing) {
      // Update existing
      const { error } = await supabase
        .from('articles')
        .update(article)
        .eq('id', existing.id)
      if (error) {
        console.error(`   ❌ Error updating "${article.title}":`, error.message)
      } else {
        console.log(`   ↻  Updated: "${article.title}"`)
      }
    } else {
      // Insert new
      const { error } = await supabase.from('articles').insert(article)
      if (error) {
        console.error(`   ❌ Error inserting "${article.title}":`, error.message)
        console.error('   Detail:', error.details)
      } else {
        console.log(`   ✅ Inserted: "${article.title}" (${article.unit_position}, ${article.question_count}q)`)
      }
    }
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Fattat Seed Script')
  console.log('━'.repeat(50))

  if (!ordFile && !lasFile) {
    console.log('\nNo CSV files specified. Usage:')
    console.log('  npm run seed -- --ord=ord-database.csv --las=las-database.csv\n')
    console.log('Both files should be in the project root, or provide full paths.')
    process.exit(0)
  }

  if (ordFile) {
    await seedOrd(ordFile)
  }

  if (lasFile) {
    await seedLas(lasFile)
  }

  // Print summary counts
  console.log('\n📊 Database counts after seeding:')
  const [{ count: wordCount }, { count: articleCount }] = await Promise.all([
    supabase.from('words').select('*', { count: 'exact', head: true }),
    supabase.from('articles').select('*', { count: 'exact', head: true }),
  ])
  console.log(`   Words:    ${wordCount ?? '?'}`)
  console.log(`   Articles: ${articleCount ?? '?'}`)
  console.log('\n✨ Done.\n')
}

main().catch((err) => {
  console.error('💥 Unexpected error:', err)
  process.exit(1)
})
