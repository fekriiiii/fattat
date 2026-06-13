'use client'

import { useEffect, useState } from 'react'

// Animates a number from 0 to `target` once `start` flips true. Skips straight
// to the target when the user prefers reduced motion. Used on result screens
// (session complete, diagnostic results) so the score lands with weight.
export function useCountUp(target: number, start: boolean, duration = 700): number {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (!start) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setValue(target)
      return
    }
    let raf: number
    const t0 = performance.now()
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / duration)
      const eased = 1 - Math.pow(1 - p, 3)
      setValue(Math.round(eased * target))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [start, target, duration])
  return value
}
