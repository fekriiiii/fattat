// Static table for program-first onboarding: "Vilket program siktar du på?"
//
// hpScore is the HP admission cutoff (urvalsgräns) for the named university,
// sourced directly from UHR's (Universitets- och högskolerådet) official
// antagningsstatistik tool, urval 2 (final selection) för hösten 2026 —
// the most recent published intake as of 2026-07-25. UHR's search UI is
// JS-driven so this was pulled via a driven browser session, not scraped
// from a static page; every figure traces to a specific UHR program code.
//
// This replaces an earlier version sourced from the third-party aggregator
// ednia.se (2025 intake). 9 of 16 scores shifted when re-sourced from UHR —
// some up, some down, none huge except Socionomprogrammet (Marie
// Cederschiöld Högskola: 1.1 → 1.4, ednia's figure looks stale) and
// Arkitektprogrammet (Chalmers: 1.5 → 1.35). UHR doesn't report an HP figure
// for every university/program, so hpScore is "the best HP-reporting
// university for this program", not necessarily the single hardest one to
// get into — an anchor for a target, not a promise.
//
// Programs left out deliberately (sjuksköterska, grundlärare, systemvetenskap,
// polis): no usable HP figure at any well-known university. HP genuinely
// isn't the differentiator for admission to those.
//
// Update this table each intake by re-running the same UHR lookup — search
// https://www.uhr.se/studier-och-antagning/antagningsstatistik/ for each
// program name (some need the exact official program name, e.g. "Arkitektur"
// not "Arkitektprogrammet" — see agent notes in git history for the ones
// that needed correcting) with the HT-term selector on the current intake.

export interface Program {
  slug: string
  name: string
  category: string
  hpScore: number
  sourceNote: string
}

export const PROGRAM_CATEGORIES = [
  'Medicin & vård',
  'Juridik & samhälle',
  'Ekonomi & teknik',
] as const

export const PROGRAMS: Program[] = [
  // Medicin & vård
  { slug: 'lakare', name: 'Läkarprogrammet', category: 'Medicin & vård', hpScore: 1.75, sourceNote: 'Uppsala' },
  { slug: 'tandlakare', name: 'Tandläkarprogrammet', category: 'Medicin & vård', hpScore: 1.45, sourceNote: 'Göteborg' },
  { slug: 'veterinar', name: 'Veterinärprogrammet', category: 'Medicin & vård', hpScore: 1.5, sourceNote: 'SLU' },
  { slug: 'psykolog', name: 'Psykologprogrammet', category: 'Medicin & vård', hpScore: 1.6, sourceNote: 'Göteborg' },
  { slug: 'apotekare', name: 'Apotekarprogrammet', category: 'Medicin & vård', hpScore: 1.2, sourceNote: 'Göteborg' },
  { slug: 'fysioterapeut', name: 'Fysioterapeutprogrammet', category: 'Medicin & vård', hpScore: 1.2, sourceNote: 'Lund' },
  { slug: 'logoped', name: 'Logopedprogrammet', category: 'Medicin & vård', hpScore: 0.55, sourceNote: 'Göteborg' },

  // Juridik & samhälle
  { slug: 'jurist', name: 'Juristprogrammet', category: 'Juridik & samhälle', hpScore: 1.6, sourceNote: 'Lund' },
  { slug: 'socionom', name: 'Socionomprogrammet', category: 'Juridik & samhälle', hpScore: 1.4, sourceNote: 'Marie Cederschiöld Högskola' },
  { slug: 'statsvetenskap', name: 'Statsvetenskapligt program', category: 'Juridik & samhälle', hpScore: 1.4, sourceNote: 'Försvarshögskolan' },
  { slug: 'journalist', name: 'Journalistprogrammet', category: 'Juridik & samhälle', hpScore: 1.15, sourceNote: 'Göteborg' },

  // Ekonomi & teknik
  { slug: 'civilekonom', name: 'Civilekonomprogrammet', category: 'Ekonomi & teknik', hpScore: 1.35, sourceNote: 'Linköping' },
  { slug: 'civing-data', name: 'Civilingenjör Datateknik', category: 'Ekonomi & teknik', hpScore: 1.45, sourceNote: 'Lund' },
  { slug: 'civing-maskin', name: 'Civilingenjör Maskinteknik', category: 'Ekonomi & teknik', hpScore: 1.55, sourceNote: 'Linköping' },
  { slug: 'civing-industriell', name: 'Civilingenjör Industriell ekonomi', category: 'Ekonomi & teknik', hpScore: 1.85, sourceNote: 'Lund' },
  { slug: 'arkitekt', name: 'Arkitektprogrammet', category: 'Ekonomi & teknik', hpScore: 1.35, sourceNote: 'Chalmers' },
]

// Safety margin above the raw cutoff: antagningspoäng vary year to year and
// landing exactly on last year's line is a coin flip, not a plan.
export const PROGRAM_TARGET_MARGIN = 0.1

export function programTargetScore(program: Program): number {
  return Math.min(2.0, Math.round((program.hpScore + PROGRAM_TARGET_MARGIN) * 20) / 20)
}
