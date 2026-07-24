'use client'

import { cn } from '@/lib/utils/cn'
import { Button } from '@/components/ui/Button'
import type { LasQuestion } from '@/types/database'
import type { AnswerConfidence } from '@/types/session'
import type { LasOption } from './LasQuestion'

interface Props {
  question: LasQuestion
  options: LasOption[]
  chosenLabel: string
  isCorrect: boolean
  isLastQuestion: boolean
  onNext: () => void
  onReadAgain: () => void
  // Daily sessions only — the user's confidence judgment for this answer.
  // "Säker men fel" is the highest-value learning moment in the session:
  // it's where the user's model of the text and the text itself diverge.
  confidence?: AnswerConfidence
  // Daily sessions only — the one-sentence huvudtanke the user wrote after
  // reading (gist-retrieval gate). Shown back on huvudtanke questions so the
  // user can compare their own summary against the correct answer.
  gistText?: string | null
}

const TYPE_LABELS: Record<string, string> = {
  huvudtanke:    'Huvudtanke',
  detalj_fakta:  'Detalj',
  detalj_kausal: 'Detalj',
  syfte_funktion:'Syfte',
  slutledning:   'Slutledning',
  jämförande:    'Jämförande',
  ståndpunkt:    'Ståndpunkt',
}

const DISTRACTOR_HINTS: Record<string, string> = {
  går_för_långt:        'Ditt svar gick längre än vad texten faktiskt säger.',
  ytlig_läsning:        'Svaret låter rimligt vid en snabb läsning, men stämmer inte riktigt med texten.',
  rätt_fakta_fel_fråga: 'Det du valde stämmer med texten, men svarar inte på just den här frågan.',
  nära_men_inte_riktigt:'Nära! Men svaret missar något viktigt.',
}

// Strategy instruction per question type, shown on wrong answers. Teaches the
// transferable move for the *category*, not just this question — strategy
// instruction is one of the few reading-comprehension interventions with
// consistent meta-analytic support.
const TYPE_STRATEGIES: Record<string, string> = {
  huvudtanke:    'Strategi: huvudtanken ska täcka hela texten, inte bara ett stycke. Fel svar är ofta sant, men för smalt.',
  detalj_fakta:  'Strategi: detaljfrågor avgörs av exakta formuleringar. Hitta raden i texten. Lita inte på minnesbilden av den.',
  detalj_kausal: 'Strategi: frågan gäller varför något händer. Leta efter orsaksord i texten: eftersom, därför, leder till.',
  syfte_funktion:'Strategi: syftesfrågor handlar om varför författaren skrev något, inte vad som står. Vilken roll spelar stycket i helheten?',
  slutledning:   'Strategi: en korrekt slutledning ska gå att försvara med textens egna ord. Kan du peka på raden som tvingar fram slutsatsen?',
  jämförande:    'Strategi: vid jämförelser måste båda leden stämma. Kontrollera varje halva av svaret för sig.',
  ståndpunkt:    'Strategi: skilj på vad författaren själv tycker och vad som bara refereras. Värdeladdade ord avslöjar hållningen.',
}

export function LasFeedback({ question, options, chosenLabel, isCorrect, isLastQuestion, onNext, onReadAgain, confidence, gistText }: Props) {
  const correctLabel = options.find((o) => o.isCorrect)?.label ?? ''
  const distractorHint = !isCorrect && chosenLabel
    ? DISTRACTOR_HINTS[question.distractor_types?.[chosenLabel as 'A'|'B'|'C'|'D'] ?? ''] ?? null
    : null
  const strategyTip = !isCorrect ? TYPE_STRATEGIES[question.type] ?? null : null
  const confidentButWrong = !isCorrect && confidence === 'sure'
  const guessedRight = isCorrect && confidence === 'guess'

  return (
    <div className="flex flex-col gap-4 px-5 py-6">
      {/* Result indicator */}
      <div className="flex items-center justify-between">
        <span className={cn(
          'text-[11px] font-bold uppercase tracking-[0.08em] px-[14px] py-1.5 rounded-full ring-1 ring-inset motion-safe:animate-pop-in',
          isCorrect ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/15' : 'bg-rose-50 text-rose-600 ring-rose-600/15'
        )}>
          {isCorrect ? 'Rätt' : `Rätt svar: ${correctLabel}`}
        </span>
        {question.type && (
          <span className="text-[11px] text-dark/60 font-medium">{TYPE_LABELS[question.type]}</span>
        )}
      </div>

      {/* Calibration callouts — confidence vs outcome mismatch is the signal */}
      {confidentButWrong && (
        <div className="bg-amber-50 ring-1 ring-inset ring-amber-600/15 rounded-[14px] px-4 py-3">
          <p className="text-[13px] text-amber-800 leading-snug font-medium">
            Du var säker, men texten säger något annat. Det här är dagens viktigaste förklaring att läsa: när din känsla och texten pekar åt olika håll vinner alltid texten.
          </p>
        </div>
      )}
      {guessedRight && (
        <p className="text-[13px] text-dark/55 leading-snug">
          Rätt, men du gissade. Läs förklaringen så att det sitter av rätt anledning nästa gång.
        </p>
      )}

      {/* Distractor hint — only on wrong answers */}
      {distractorHint && (
        <p className="text-[13px] text-dark/55 leading-snug">{distractorHint}</p>
      )}

      {/* Explanation card */}
      {question.explanation && (
        <div className="bg-white rounded-card shadow-card border border-dark/[0.05] px-5 py-5 relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary-400 to-primary" />
          <p className="text-[14px] text-dark leading-[1.65]">{question.explanation}</p>
          {question.passage_anchor && (
            <div className="border-t border-dark/[0.06] mt-3.5 pt-3.5">
              <p className="text-[13px] text-dark/65 italic leading-relaxed">
                &ldquo;{question.passage_anchor}&rdquo;
              </p>
            </div>
          )}
        </div>
      )}

      {/* Strategy tip for the question category — wrong answers only */}
      {strategyTip && (
        <p className="text-[13px] text-primary/80 leading-snug font-medium">{strategyTip}</p>
      )}

      {/* Gist comparison — huvudtanke questions where the user wrote a summary */}
      {question.type === 'huvudtanke' && gistText && (
        <div className="bg-primary/[0.06] rounded-[12px] px-4 py-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-primary/60 mb-1">Din sammanfattning</p>
          <p className="text-[13px] text-dark/75 leading-snug italic">&ldquo;{gistText}&rdquo;</p>
          <p className="text-[12px] text-dark/50 leading-snug mt-1.5">Jämför med rätt svar: fångade din mening samma kärna?</p>
        </div>
      )}

      {/* Options — minimal color-coding */}
      <div className="flex flex-col gap-1.5">
        {options.map((opt) => {
          const isRight = opt.label === correctLabel
          const isWrong = opt.label === chosenLabel && !isCorrect
          return (
            <div
              key={opt.label}
              className={cn(
                'px-4 py-3 rounded-[12px] text-[13px] font-medium flex items-start gap-2 leading-snug',
                isRight && 'bg-emerald-50 text-emerald-800',
                isWrong && 'bg-rose-50 text-rose-700',
                !isRight && !isWrong && 'text-dark/20'
              )}
            >
              <span className={cn(
                'text-[10px] font-bold pt-0.5 shrink-0',
                isRight ? 'text-emerald-500' : isWrong ? 'text-rose-400' : 'text-dark/20'
              )}>
                {opt.label}
              </span>
              <span>{opt.text}</span>
            </div>
          )
        })}
      </div>

      <Button fullWidth size="lg" onClick={onNext}>
        {isLastQuestion ? 'Fortsätt' : 'Nästa fråga'}
      </Button>

      <button
        onClick={onReadAgain}
        className="flex items-center justify-center gap-1.5 text-[13px] text-dark/55 hover:text-dark/75 transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/>
          <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/>
        </svg>
        Läs om artikeln
      </button>
    </div>
  )
}
