import type { SupabaseClient } from '@supabase/supabase-js'

// Single source of truth for writing rows into score_predictions.
// Called from every place the app produces a HP-band or verbal-accuracy
// prediction (diagnostic completion + dashboard render). The point of
// logging is so that — once we have students who've actually taken HP —
// we can plot predicted-vs-actual and calibrate the constants in
// scoring.ts and planner.ts. See migration 012_score_predictions.sql.

export interface PredictionLogInput {
  source: 'diagnostic_complete' | 'dashboard'

  // HP band shown to the user. All three are null in verbal-accuracy mode.
  predictedLow: number | null
  predictedMid: number | null
  predictedHigh: number | null

  // Always populated — survives the verbal-accuracy fallback.
  verbalAccuracy: number

  // Snapshotted model inputs.
  ordRetention: number
  lasAccuracy: number
  sessionCount: number

  // Priors at prediction time. Null when the user hasn't entered them.
  previousHpScore: number | null
  previousMekScore: number | null
  previousElfScore: number | null

  // Optional — diagnostic-source rows link to the session that produced them.
  sessionId?: string | null

  // Extension point for inputs we add later without a migration.
  meta?: Record<string, unknown>
}

// Fire-and-forget: failures are swallowed because a logging miss must never
// surface as a user-facing error. We accept the tradeoff that occasional rows
// may be lost — calibration is a statistical exercise, not a transactional one.
export async function logScorePrediction(
  supabase: SupabaseClient,
  userId: string,
  input: PredictionLogInput
): Promise<void> {
  await supabase.from('score_predictions').insert({
    user_id: userId,
    source: input.source,
    predicted_low: input.predictedLow,
    predicted_mid: input.predictedMid,
    predicted_high: input.predictedHigh,
    verbal_accuracy: input.verbalAccuracy,
    ord_retention: input.ordRetention,
    las_accuracy: input.lasAccuracy,
    session_count: input.sessionCount,
    previous_hp_score: input.previousHpScore,
    previous_mek_score: input.previousMekScore,
    previous_elf_score: input.previousElfScore,
    session_id: input.sessionId ?? null,
    meta: input.meta ?? {},
  })
}
