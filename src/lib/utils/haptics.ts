// Tactile confirmation for answer submissions. Feature-detected at call time
// so SSR and unsupported browsers (notably iOS Safari, which silently lacks
// navigator.vibrate) are no-ops without throwing.
//
// Patterns are intentionally short — a session has 20+ ORD answers and the
// device should never feel like it's buzzing through them.

function vibrate(pattern: number | number[]): void {
  if (typeof window === 'undefined') return
  const nav = window.navigator as Navigator & { vibrate?: (p: number | number[]) => boolean }
  if (typeof nav.vibrate !== 'function') return
  try {
    nav.vibrate(pattern)
  } catch {
    // some browsers throw if called outside a user gesture; safe to ignore
  }
}

export const haptics = {
  // Crisp double-tap for correct answers — celebratory but not loud.
  correct: () => vibrate([12, 40, 12]),
  // Single short tap for wrong answers — acknowledges the input without
  // feeling punitive.
  wrong: () => vibrate(22),
}
