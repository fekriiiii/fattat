'use client'

import { useMemo } from 'react'
import type { TrajectoryPoint } from '@/lib/session/scoring'

interface Props {
  points: TrajectoryPoint[]
  targetScore: number | null
  daysToExam: number
  examDateLabel: string  // e.g. "12 okt"
}

// SVG canvas dimensions
const W = 300
const H = 100
const ML = 30  // left margin (room for Y labels)
const MR = 6
const MT = 8
const MB = 26
const CW = W - ML - MR
const CH = H - MT - MB

export function ScoreTrajectory({ points, targetScore, daysToExam, examDateLabel }: Props) {
  const computed = useMemo(() => {
    if (!points.length || daysToExam <= 0) return null
    const scores = points.map((p) => p.score)
    const allValues = targetScore != null ? [...scores, targetScore] : scores
    const rawMin = Math.min(...allValues)
    const rawMax = Math.max(...allValues)

    // Tight Y range with padding
    const yMin = Math.max(0, Math.floor((rawMin - 0.15) * 10) / 10)
    const yMax = Math.min(2.0, Math.ceil((rawMax + 0.15) * 10) / 10)
    const yRange = Math.max(0.3, yMax - yMin)

    const xOf = (day: number) => ML + (day / daysToExam) * CW
    const yOf = (score: number) => MT + CH - ((score - yMin) / yRange) * CH

    const pathD = points
      .map((p, i) => `${i === 0 ? 'M' : 'L'}${xOf(p.day).toFixed(1)},${yOf(p.score).toFixed(1)}`)
      .join(' ')

    // Y axis tick marks at 0.25 or 0.5 intervals depending on range
    const tickStep = yRange <= 0.6 ? 0.25 : 0.5
    const firstTick = Math.ceil((yMin / tickStep)) * tickStep
    const ticks: number[] = []
    for (let t = firstTick; t <= yMax + 0.001; t = Math.round((t + tickStep) * 1000) / 1000) {
      ticks.push(t)
    }

    return {
      pathD,
      xOf,
      yOf,
      ticks,
      currentScore: scores[0],
      projectedScore: scores[scores.length - 1],
    }
  }, [points, targetScore, daysToExam])

  if (!computed) return null

  const { pathD, xOf, yOf, ticks, currentScore, projectedScore } = computed
  const targetY = targetScore != null ? yOf(targetScore) : null
  const gap = targetScore != null ? targetScore - projectedScore : 0
  const onTrack = gap <= 0.05
  const nearTrack = !onTrack && gap <= 0.25

  return (
    <div className="bg-white shadow-card rounded-card px-4 py-4">
      <p className="text-xs font-bold uppercase tracking-widest text-dark/55 mb-3">
        Prognos till tentadagen
      </p>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" aria-hidden="true">
        {/* Y axis grid lines + labels */}
        {ticks.map((t) => {
          const y = yOf(t)
          return (
            <g key={t}>
              <line
                x1={ML} y1={y} x2={ML + CW} y2={y}
                stroke="rgba(31,41,55,0.06)" strokeWidth="1"
              />
              <text
                x={ML - 4} y={y + 3.5} fontSize="7"
                fill="rgba(31,41,55,0.55)" textAnchor="end"
              >
                {t.toFixed(2)}
              </text>
            </g>
          )
        })}

        {/* Target dashed gold line */}
        {targetY != null && (
          <line
            x1={ML} y1={targetY} x2={ML + CW} y2={targetY}
            stroke="#D4A017" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.8"
          />
        )}

        {/* Trajectory line */}
        <path
          d={pathD}
          fill="none"
          stroke="#0F766E"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Today dot */}
        <circle cx={xOf(0)} cy={yOf(currentScore)} r="3" fill="#0F766E" />

        {/* Exam day dot — coloured by on-track status */}
        <circle
          cx={xOf(daysToExam)}
          cy={yOf(projectedScore)}
          r="3.5"
          fill={onTrack ? '#22c55e' : nearTrack ? '#f59e0b' : '#ef4444'}
        />

        {/* X axis labels */}
        <text
          x={xOf(0)} y={H - 5} fontSize="8"
          fill="rgba(31,41,55,0.65)" textAnchor="middle"
        >
          Idag
        </text>
        <text
          x={xOf(daysToExam)} y={H - 5} fontSize="8"
          fill="rgba(31,41,55,0.65)" textAnchor="middle"
        >
          {examDateLabel}
        </text>

        {/* Target score label on the right edge */}
        {targetY != null && targetScore != null && (
          <text
            x={ML + CW + 2} y={targetY + 3.5} fontSize="7"
            fill="#D4A017" textAnchor="start"
          >
            {targetScore.toFixed(2)}
          </text>
        )}
      </svg>

      {/* Summary row */}
      <div className="flex items-center justify-between mt-2">
        <p className="text-sm text-dark/60">
          <span className="font-bold text-dark">{currentScore.toFixed(2)}</span>
          <span className="mx-1.5 text-dark/55">→</span>
          <span className="font-bold text-dark">{projectedScore.toFixed(2)}</span>
          <span className="text-dark/65 text-xs ml-1">på tentadagen</span>
        </p>

        {targetScore != null && (
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
            onTrack
              ? 'bg-green-50 text-green-700'
              : nearTrack
              ? 'bg-amber-50 text-amber-700'
              : 'bg-red-50 text-red-600'
          }`}>
            {onTrack
              ? 'I fas'
              : `Mål: ${targetScore.toFixed(2)}`}
          </span>
        )}
      </div>

      {/* Nudge message when off track */}
      {!onTrack && targetScore != null && (
        <p className="text-xs text-dark/65 mt-1.5">
          {nearTrack
            ? 'Du är nära — öka studietempot lite för att nå ditt mål.'
            : 'Studera mer konsekvent varje dag för att stänga gapet.'}
        </p>
      )}
    </div>
  )
}
