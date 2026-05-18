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
      <div className="bg-white shadow-card rounded-card px-4 py-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-bold uppercase tracking-widest text-dark/55">Din plan</p>
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
    ? 'Du är på rätt nivå — håll tempot.'
    : isHeavy
      ? `${newWordsNeeded} ord kvar på ${daysLeft} dagar — ambitiöst mål.`
      : `${newWordsNeeded} ord kvar på ${daysLeft} dagar.`

  return (
    <Link href="/plan" className="block">
      <div className={`rounded-card px-4 py-4 transition-colors ${isHeavy ? 'bg-amber-50 shadow-card' : 'bg-white shadow-card'}`}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold uppercase tracking-widest text-dark/55">Din plan</p>
          <span className="text-xs text-primary font-bold">Se allt →</span>
        </div>

        <p className="text-sm font-bold text-dark mb-3">{message}</p>

        {displayTotal > 0 && (
          <div>
            <div className="flex justify-between text-xs text-dark/65 mb-1.5">
              <span>{wordsLearned} av {displayTotal} {goalWords ? 'målet' : 'ord'}</span>
              <span>{progressPct}%</span>
            </div>
            <div className="w-full h-[5px] bg-dark/[0.06] rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </Link>
  )
}
