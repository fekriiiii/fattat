import type { SupabaseClient } from '@supabase/supabase-js'
import { todayInStockholm, yesterdayInStockholm } from '@/lib/utils/date'

export interface StreakResult {
  currentStreak: number
  longestStreak: number
  totalDaysStudied: number
  freezeUsed: boolean
}

export async function updateStreak(
  supabase: SupabaseClient,
  userId: string
): Promise<StreakResult> {
  const { data: streakRow } = await supabase
    .from('user_streaks')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (!streakRow) throw new Error('Streak row not found')

  const today = todayInStockholm()
  const yesterday = yesterdayInStockholm()
  const last = streakRow.last_activity_date

  // Already counted today — no change
  if (last === today) {
    return {
      currentStreak: streakRow.current_streak,
      longestStreak: streakRow.longest_streak,
      totalDaysStudied: streakRow.total_days_studied,
      freezeUsed: false,
    }
  }

  let newStreak = streakRow.current_streak
  let freezeUsed = false

  if (last === yesterday) {
    // Consecutive day
    newStreak = streakRow.current_streak + 1
  } else if (
    last &&
    daysBetween(last, today) === 2 &&
    streakRow.freeze_available &&
    !streakRow.freeze_used_this_week
  ) {
    // Missed exactly one day — auto-apply freeze
    newStreak = streakRow.current_streak + 1
    freezeUsed = true
  } else {
    // Streak broken
    newStreak = 1
  }

  const newLongest = Math.max(newStreak, streakRow.longest_streak)
  const newTotal = streakRow.total_days_studied + 1

  await supabase
    .from('user_streaks')
    .update({
      current_streak: newStreak,
      longest_streak: newLongest,
      last_activity_date: today,
      total_days_studied: newTotal,
      freeze_used_this_week: freezeUsed ? true : streakRow.freeze_used_this_week,
      freeze_available: freezeUsed ? false : streakRow.freeze_available,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)

  return {
    currentStreak: newStreak,
    longestStreak: newLongest,
    totalDaysStudied: newTotal,
    freezeUsed,
  }
}

function daysBetween(dateStr1: string, dateStr2: string): number {
  const d1 = new Date(dateStr1 + 'T00:00:00Z')
  const d2 = new Date(dateStr2 + 'T00:00:00Z')
  return Math.round(Math.abs(d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24))
}
