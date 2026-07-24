import Link from 'next/link'

interface Props {
  newWordsNeeded: number
  daysLeft: number
  wordsLearned: number
  totalWords: number
  isHeavy: boolean
  noExamDate: boolean
  goalWords?: number
}

export function StudyPlanCard({
  newWordsNeeded,
  daysLeft,
  wordsLearned,
  totalWords,
  isHeavy,
  noExamDate,
  goalWords,
}: Props) {
  const displayTotal = goalWords ?? totalWords
  const progressPct = displayTotal > 0 ? Math.round((wordsLearned / displayTotal) * 100) : 0

  if (noExamDate) {
    return (
      <div className="bg-white shadow-card border border-dark/[0.05] rounded-card px-5 py-5">
        <div className="flex items-center justify-between mb-2">
          <p className="card-label">Din plan</p>
          <Link href="/profile" className="text-xs text-primary font-bold">
            Sätt provdatum →
          </Link>
        </div>
        <p className="text-sm text-dark/55 leading-relaxed">
          Lägg till ditt provdatum i profilen så beräknar vi hur mycket du behöver studera per dag.
        </p>
      </div>
    )
  }

  const message = newWordsNeeded === 0
    ? 'Du är på rätt nivå. Håll tempot.'
    : isHeavy
      ? `${newWordsNeeded} ord kvar på ${daysLeft} dagar. Ambitiöst mål.`
      : `${newWordsNeeded} ord kvar på ${daysLeft} dagar.`

  return (
    <Link href="/plan" className="block group">
      <div className={`rounded-card px-5 py-5 shadow-card border transition-all duration-200 group-hover:shadow-card-hover group-active:scale-[0.99] ${isHeavy ? 'bg-amber-50 border-amber-200/60' : 'bg-white border-dark/[0.05]'}`}>
        <div className="flex items-center justify-between mb-3">
          <p className="card-label">Din plan</p>
          <span className="text-xs text-primary font-bold">Se allt →</span>
        </div>

        <p className="text-sm font-bold text-dark mb-3">{message}</p>

        {displayTotal > 0 && (
          <div>
            <div className="flex justify-between text-xs text-dark/60 mb-1.5">
              <span>{wordsLearned} av {displayTotal} {goalWords ? 'målet' : 'ord'}</span>
              <span className="font-bold tabular-nums">{progressPct}%</span>
            </div>
            <div className="w-full h-2 bg-dark/[0.05] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary-600 to-primary rounded-full transition-all duration-700 ease-out"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </Link>
  )
}
