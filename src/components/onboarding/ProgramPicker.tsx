'use client'

import { cn } from '@/lib/utils/cn'
import { PROGRAMS, PROGRAM_CATEGORIES, programTargetScore } from '@/data/programs'

// '' = nothing picked yet, 'custom' = explicitly opted out of a program, otherwise a program slug
export type ProgramPickerValue = string | 'custom' | ''

type Props = {
  value: ProgramPickerValue
  onChange: (value: ProgramPickerValue) => void
  // When true, also offers a card that clears the pick and falls back to a custom score
  allowCustom?: boolean
}

export function ProgramPicker({ value, onChange, allowCustom = true }: Props) {
  return (
    <div className="flex flex-col gap-4">
      {PROGRAM_CATEGORIES.map((category) => (
        <div key={category} className="flex flex-col gap-2">
          <p className="text-xs font-bold uppercase tracking-wide text-dark/40 px-1">
            {category}
          </p>
          {PROGRAMS.filter((p) => p.category === category).map((program) => (
            <ProgramCard
              key={program.slug}
              name={program.name}
              hpScore={program.hpScore}
              targetScore={programTargetScore(program)}
              sourceNote={program.sourceNote}
              selected={value === program.slug}
              onSelect={() => onChange(program.slug)}
            />
          ))}
        </div>
      ))}

      {allowCustom && (
        <button
          type="button"
          onClick={() => onChange('custom')}
          className={cn(
            'w-full text-left rounded-card px-4 py-3 border transition-colors mt-1',
            value === 'custom'
              ? 'border-primary bg-primary/[0.04]'
              : 'border-dark/10 bg-white hover:border-dark/20'
          )}
        >
          <p className="text-sm font-bold text-dark">Inget program i åtanke</p>
          <p className="text-[12px] text-dark/55 mt-0.5">
            Sätt ett eget målresultat istället.
          </p>
        </button>
      )}
    </div>
  )
}

function ProgramCard({
  name,
  hpScore,
  targetScore,
  sourceNote,
  selected,
  onSelect,
}: {
  name: string
  hpScore: number
  targetScore: number
  sourceNote: string
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'w-full text-left rounded-card px-4 py-3 border transition-colors',
        selected
          ? 'border-primary bg-primary/[0.06]'
          : 'border-dark/10 bg-white hover:border-dark/20'
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col min-w-0">
          <p className="text-sm font-bold text-dark truncate">{name}</p>
          <p className="text-[12px] text-dark/50 mt-0.5">
            Antagningspoäng {hpScore.toFixed(2)} HP ({sourceNote}) → mål {targetScore.toFixed(2)} HP
          </p>
        </div>
        <div
          className={cn(
            'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors',
            selected ? 'border-primary' : 'border-dark/20'
          )}
        >
          {selected && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
        </div>
      </div>
    </button>
  )
}
