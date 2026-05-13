import Link from 'next/link'

interface Props {
  minutesPerDay: number
  dailyNewWords: number
  wordsLearned: number
  totalWords: number
  isHeavy: boolean
  noExamDate: boolean
}

export function StudyPlanCard({
  minutesPerDay,
  dailyNewWords,
  wordsLearned,
  totalWords,
  isHeavy,
  noExamDate,
}: Props) {
  const progressPct = totalWords > 0 ? Math.round((wordsLearned / totalWords) * 100) : 0

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

  return (
    <Link href="/plan" className="block">
      <div className={`rounded-card px-4 py-4 transition-colors ${isHeavy ? 'bg-amber-50 shadow-card' : 'bg-white shadow-card'}`}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold uppercase tracking-widest text-dark/55">Din plan</p>
          <span className="text-xs text-primary font-bold">Se allt →</span>
        </div>

        {/* Key numbers */}
        <div className="flex items-end gap-5 mb-4">
          <div>
            <p className="text-4xl font-bold text-dark leading-none">{minutesPerDay}</p>
            <p className="text-xs text-dark/65 mt-1">min per dag</p>
          </div>
          <div className="pb-0.5">
            <p className="text-lg font-bold text-dark leading-none">{dailyNewWords} nya ord</p>
            <p className="text-xs text-dark/65 mt-1">+ LÄS-artikel varje session</p>
          </div>
        </div>

        {/* Word progress */}
        {totalWords > 0 && (
          <div>
            <div className="flex justify-between text-xs text-dark/65 mb-1.5">
              <span>{wordsLearned} av {totalWords} ord påbörjade</span>
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

        {isHeavy && (
          <p className="text-xs text-amber-700 mt-3 leading-relaxed">
            Ambitiöst mål — se hela planen för ett alternativt tempo.
          </p>
        )}
      </div>
    </Link>
  )
}
