// Static table for program-first onboarding: "Vad drömmer du om?"
//
// hpScore is the latest HP admission cutoff (urvalsgräns) for the named
// university, sourced from ednia.se antagningsstatistik (2025/2026 intake).
// ednia.se's per-program tables are sparse — most universities only report
// the grades-based (BI) cutoff, not HP — so hpScore is "the best HP-reporting
// university for this program", not necessarily the single hardest one to
// get into. It's an anchor for a target, not a promise.
//
// Programs where ednia.se reports no usable HP figure (sjuksköterska,
// grundlärare, systemvetenskap, polis) are deliberately left out rather than
// filled with a guessed number — HP genuinely isn't the differentiator for
// admission to those. Update this table whenever antagningsstatistik.se /
// ednia.se publish a new intake's numbers.

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
  { slug: 'tandlakare', name: 'Tandläkarprogrammet', category: 'Medicin & vård', hpScore: 1.4, sourceNote: 'Göteborg' },
  { slug: 'veterinar', name: 'Veterinärprogrammet', category: 'Medicin & vård', hpScore: 1.5, sourceNote: 'SLU' },
  { slug: 'psykolog', name: 'Psykologprogrammet', category: 'Medicin & vård', hpScore: 1.65, sourceNote: 'Göteborg' },
  { slug: 'apotekare', name: 'Apotekarprogrammet', category: 'Medicin & vård', hpScore: 1.1, sourceNote: 'Göteborg' },
  { slug: 'fysioterapeut', name: 'Fysioterapeutprogrammet', category: 'Medicin & vård', hpScore: 1.2, sourceNote: 'Lund' },
  { slug: 'logoped', name: 'Logopedprogrammet', category: 'Medicin & vård', hpScore: 0.6, sourceNote: 'Göteborg' },

  // Juridik & samhälle
  { slug: 'jurist', name: 'Juristprogrammet', category: 'Juridik & samhälle', hpScore: 1.55, sourceNote: 'Lund' },
  { slug: 'socionom', name: 'Socionomprogrammet', category: 'Juridik & samhälle', hpScore: 1.1, sourceNote: 'Marie Cederschiöld Högskola' },
  { slug: 'statsvetenskap', name: 'Statsvetenskapligt program', category: 'Juridik & samhälle', hpScore: 1.4, sourceNote: 'Försvarshögskolan' },
  { slug: 'journalist', name: 'Journalistprogrammet', category: 'Juridik & samhälle', hpScore: 1.2, sourceNote: 'Göteborg' },

  // Ekonomi & teknik
  { slug: 'civilekonom', name: 'Civilekonomprogrammet', category: 'Ekonomi & teknik', hpScore: 1.3, sourceNote: 'Linköping' },
  { slug: 'civing-data', name: 'Civilingenjör Datateknik', category: 'Ekonomi & teknik', hpScore: 1.45, sourceNote: 'Lund' },
  { slug: 'civing-maskin', name: 'Civilingenjör Maskinteknik', category: 'Ekonomi & teknik', hpScore: 1.45, sourceNote: 'Linköping' },
  { slug: 'civing-industriell', name: 'Civilingenjör Industriell ekonomi', category: 'Ekonomi & teknik', hpScore: 1.75, sourceNote: 'Lund' },
  { slug: 'arkitekt', name: 'Arkitektprogrammet', category: 'Ekonomi & teknik', hpScore: 1.5, sourceNote: 'Chalmers' },
]

// Safety margin above the raw cutoff: antagningspoäng vary year to year and
// landing exactly on last year's line is a coin flip, not a plan.
export const PROGRAM_TARGET_MARGIN = 0.1

export function programTargetScore(program: Program): number {
  return Math.min(2.0, Math.round((program.hpScore + PROGRAM_TARGET_MARGIN) * 20) / 20)
}
