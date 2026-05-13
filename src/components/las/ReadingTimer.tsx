'use client'

import { useEffect, useState } from 'react'
import { Clock } from 'lucide-react'

interface Props {
  wordCount: number
  running: boolean
  onElapsed?: (ms: number) => void
}

export function ReadingTimer({ wordCount, running, onElapsed }: Props) {
  const [seconds, setSeconds] = useState(0)

  useEffect(() => {
    if (!running) return
    const interval = setInterval(() => {
      setSeconds((s) => s + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [running])

  useEffect(() => {
    if (!running && seconds > 0) {
      onElapsed?.(seconds * 1000)
    }
  }, [running]) // eslint-disable-line react-hooks/exhaustive-deps

  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  const wpm = seconds > 0 ? Math.round((wordCount / seconds) * 60) : 0
  const timeStr = `${mins}:${String(secs).padStart(2, '0')}`

  return (
    <div className="flex items-center gap-1.5 text-dark/65">
      <Clock size={13} />
      <span className="text-xs tabular-nums">{timeStr}</span>
      {seconds > 10 && (
        <span className="text-xs text-dark/55">· {wpm} ord/min</span>
      )}
    </div>
  )
}
