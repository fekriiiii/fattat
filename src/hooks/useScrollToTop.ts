'use client'

import { useEffect } from 'react'

// Scrolls window to top whenever any of `deps` change.
// Used on multi-step screens (onboarding, sessions, diagnostic, övningsprov)
// where each step swap leaves scroll wherever the previous step ended —
// frustrating when going from a short ORD card to a long article, or between
// onboarding form steps.
export function useScrollToTop(deps: ReadonlyArray<unknown>) {
  useEffect(() => {
    if (typeof window === 'undefined') return
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}
