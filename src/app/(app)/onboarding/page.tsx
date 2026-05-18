'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase/client'
import { generateStudyPlan } from '@/lib/session/scoring'
import { calculateGap } from '@/lib/session/planner'
import { shuffleOptions } from '@/lib/fsrs/engine'
import { Button } from '@/components/ui/Button'
import { OrdQuestion } from '@/components/ord/OrdQuestion'
import { OrdFeedback } from '@/components/ord/OrdFeedback'
import { cn } from '@/lib/utils/cn'
import { useScrollToTop } from '@/hooks/useScrollToTop'
import { ExamDatePicker } from '@/components/onboarding/ExamDatePicker'
import type { Word } from '@/types/database'
import type { OrdOption } from '@/components/ord/OrdQuestion'

type Step =
  | 'welcome'
  | 'ord_question'
  | 'ord_feedback'
  | 'reveal'
  | 'fsrs'
  | 'intelligence_intro'
  | 'name'
  | 'exam'
  | 'previous_hp'
  | 'previous_subsections'
  | 'target'
  | 'intention'
  | 'summary'

const FORM_STEPS: Step[] = ['name', 'exam', 'previous_hp', 'target', 'intention']
const ORD_LABELS = ['A', 'B', 'C', 'D', 'E'] as const

// Used only if the database has no words yet
const FALLBACK_WORD: Word = {
  id: 'fallback',
  word: 'besynnerlig',
  pos: 'adj',
  correct_synonym: 'underlig',
  distractor_1: 'välkänd',
  distractor_2: 'vanlig',
  distractor_3: 'behaglig',
  distractor_4: 'tråkig',
  definition_sv: 'Ovanlig eller märklig på ett sätt som väcker uppmärksamhet.',
  example_sentence: 'Det var ett besynnerligt uppförande som ingen förstod sig på.',
  domain: 'allmän',
  difficulty: 1,
  past_exams: [],
  accepted_synonyms: null,
  created_at: new Date().toISOString(),
}

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('welcome')
  useScrollToTop([step])

  // ORD demo state
  const [word, setWord] = useState<Word | null>(null)
  const [options, setOptions] = useState<OrdOption[]>([])
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null)
  const [chosenLabel, setChosenLabel] = useState<string | null>(null)
  const [isCorrect, setIsCorrect] = useState(false)

  // Form state
  const [displayName, setDisplayName] = useState('')
  const [examDate, setExamDate] = useState('')
  const [targetScore, setTargetScore] = useState(1.3)
  const [previousHpScore, setPreviousHpScore] = useState<number | null>(null)
  const [previousHpInput, setPreviousHpInput] = useState(1.0)
  const [previousMekScore, setPreviousMekScore] = useState<number | null>(null)
  const [previousMekInput, setPreviousMekInput] = useState(1.0)
  const [previousElfScore, setPreviousElfScore] = useState<number | null>(null)
  const [previousElfInput, setPreviousElfInput] = useState(1.0)
  const [notifyAt, setNotifyAt] = useState('19:00')
  const [studyCue, setStudyCue] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Engine state — used by reactive previews
  const [wordCount, setWordCount] = useState(600)

  useEffect(() => {
    async function fetchData() {
      try {
        const supabase = createBrowserClient()
        const [wordsRes, countRes] = await Promise.all([
          supabase.from('words').select('*').limit(20),
          supabase.from('words').select('id', { count: 'exact', head: true }),
        ])
        if (countRes.count && countRes.count > 0) setWordCount(countRes.count)
        const data = wordsRes.data
        buildOptions(data && data.length > 0
          ? data[Math.floor(Math.random() * data.length)]
          : FALLBACK_WORD)
      } catch {
        buildOptions(FALLBACK_WORD)
      }
    }
    fetchData()
  }, [])

  function buildOptions(w: Word) {
    setWord(w)
    const raw = [
      { text: w.correct_synonym, isCorrect: true },
      { text: w.distractor_1, isCorrect: false },
      { text: w.distractor_2, isCorrect: false },
      { text: w.distractor_3, isCorrect: false },
      { text: w.distractor_4, isCorrect: false },
    ]
    setOptions(shuffleOptions(raw).map((o, i) => ({ ...o, label: ORD_LABELS[i] })))
  }

  function handleAnswer(label: string, correct: boolean) {
    setSelectedLabel(label)
    setChosenLabel(label)
    setIsCorrect(correct)
    setTimeout(() => setStep('ord_feedback'), 300)
  }

  // Branch from the previous_hp step:
  //  - "Ja" → set the score and go to MEK/ELF sub-step → target
  //  - "Hoppa över" → null → straight to target (skip MEK/ELF)
  function previousHpYes() {
    setPreviousHpScore(previousHpInput)
    setStep('previous_subsections')
  }
  function previousHpSkip() {
    setPreviousHpScore(null)
    setPreviousMekScore(null)
    setPreviousElfScore(null)
    setStep('target')
  }

  async function handleFinish() {
    setSaving(true)
    setError('')
    try {
      const supabase = createBrowserClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { error: profileError } = await supabase.from('user_profiles').update({
        display_name: displayName.trim() || null,
        exam_date: examDate || null,
        target_score: targetScore,
        previous_hp_score: previousHpScore,
        previous_mek_score: previousMekScore,
        previous_elf_score: previousElfScore,
        preferred_notify_at: notifyAt,
        study_cue: studyCue.trim() || null,
        onboarded_at: new Date().toISOString(),
      }).eq('id', user.id)

      if (profileError) throw new Error(profileError.message)

      if (examDate) {
        const plan = generateStudyPlan(0.9, targetScore, new Date(examDate))
        await supabase.from('study_plans').insert({
          user_id: user.id,
          exam_date: examDate,
          target_score: targetScore,
          baseline_score: 80,
          weekly_goals: plan,
          implementation_cue: studyCue.trim() || null,
        })
      }

      router.push('/diagnostic')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'försök igen'
      setError(`Något gick fel: ${msg}`)
      setSaving(false)
    }
  }

  // previous_subsections is a sub-step of previous_hp for the progress dots.
  const stepForProgress: Step = step === 'previous_subsections' ? 'previous_hp' : step
  const formStepIndex = FORM_STEPS.indexOf(stepForProgress)
  const showProgress = formStepIndex >= 0

  return (
    <div className="flex flex-col min-h-screen bg-cream">

      {showProgress && (
        <div className="flex items-center justify-center gap-2 pt-8 pb-4">
          {FORM_STEPS.map((s, i) => (
            <div
              key={s}
              className={cn(
                'h-2 rounded-full transition-all duration-300',
                step === s
                  ? 'bg-primary w-5'
                  : i < formStepIndex
                    ? 'bg-primary/40 w-2'
                    : 'bg-dark/15 w-2'
              )}
            />
          ))}
        </div>
      )}

      <div
        key={step}
        className="flex-1 px-6 py-4"
        style={{ animation: 'fadeInUp 0.35s ease both' }}
      >

        {/* ── WELCOME ── */}
        {step === 'welcome' && (
          <div className="flex flex-col items-center justify-center gap-8 py-20 max-w-xs mx-auto text-center">
            <div className="flex flex-col gap-3">
              <h1 className="text-6xl font-bold text-dark tracking-tight">Fattat</h1>
              <p className="text-dark/55 text-base leading-relaxed">
                Verbal HP. Byggd som en personlig modell — inte en quizapp.
              </p>
            </div>

            <div className="flex flex-col gap-2 w-full">
              <CredibilityChip label="FSRS-schemaläggning" hint="Forskningsbaserad repetition" />
              <CredibilityChip label="Personlig HP-prognos" hint="Uppdateras varje pass" />
              <CredibilityChip label="Smart artikelval" hint="Återkopplar dina senaste ord" />
            </div>

            <Button fullWidth onClick={() => setStep('ord_question')}>Börja</Button>
          </div>
        )}

        {/* ── ORD QUESTION ── */}
        {step === 'ord_question' && (
          word ? (
            <div className="flex flex-col">
              <p className="text-xs text-dark/40 text-center pt-4 pb-2">
                En riktig fråga — precis som i appen
              </p>
              <OrdQuestion
                word={word}
                options={options}
                selectedLabel={selectedLabel}
                onSelect={handleAnswer}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center min-h-[70vh]">
              <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )
        )}

        {/* ── ORD FEEDBACK ── */}
        {step === 'ord_feedback' && word && chosenLabel && (
          <div className="flex flex-col">
            <p className="text-xs text-dark/40 text-center pt-4 pb-2">
              En riktig fråga — precis som i appen
            </p>
            <OrdFeedback
              word={word}
              options={options}
              chosenLabel={chosenLabel}
              isCorrect={isCorrect}
              onNext={() => setStep('reveal')}
            />
          </div>
        )}

        {/* ── REVEAL ── */}
        {step === 'reveal' && <RevealStep onNext={() => setStep('fsrs')} />}

        {/* ── FSRS ── */}
        {step === 'fsrs' && <FsrsStep onNext={() => setStep('intelligence_intro')} />}

        {/* ── INTELLIGENCE INTRO ── */}
        {step === 'intelligence_intro' && (
          <IntelligenceIntroStep onNext={() => setStep('name')} />
        )}

        {/* ── NAME ── */}
        {step === 'name' && (
          <FormStep
            title="Vad ska vi kalla dig?"
            subtitle="Valfritt — används bara för hälsningar i appen."
          >
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Ditt namn (valfritt)"
              className="field-input"
            />
            <Button fullWidth onClick={() => setStep('exam')}>
              {displayName.trim() ? 'Fortsätt' : 'Hoppa över'}
            </Button>
          </FormStep>
        )}

        {/* ── EXAM DATE (REACTIVE) ── */}
        {step === 'exam' && (
          <FormStep
            title="När skriver du provet?"
            subtitle="Välj din provomgång — datumet styr nedräkningen och din dagliga kvot."
          >
            <ExamDatePicker value={examDate} onChange={setExamDate} />

            {examDate && <CountdownPanel examDate={examDate} />}

            <Button fullWidth onClick={() => setStep('previous_hp')}>
              {examDate ? 'Fortsätt' : 'Hoppa över'}
            </Button>
          </FormStep>
        )}

        {/* ── PREVIOUS HP (REACTIVE) ── */}
        {step === 'previous_hp' && (
          <FormStep
            title="Har du gjort HP förut?"
            subtitle="Vi använder ditt resultat för totalbetyget — och för att smalna av prognosen redan från start."
          >
            <div className="bg-white rounded-card p-4 border border-dark/8">
              <div className="flex items-baseline justify-between mb-2">
                <p className="text-xs text-dark/45 font-bold uppercase tracking-wide">
                  Tidigare resultat
                </p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-primary">{previousHpInput.toFixed(2)}</span>
                  <span className="text-xs text-dark/50">HP</span>
                </div>
              </div>
              <input
                type="range"
                min={0.1}
                max={2.0}
                step={0.05}
                value={previousHpInput}
                onChange={(e) => setPreviousHpInput(parseFloat(e.target.value))}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-[10px] text-dark/30 mt-0.5">
                <span>0.10</span>
                <span>0.90 snitt</span>
                <span>2.00</span>
              </div>
            </div>

            <PredictionBand
              previousHp={previousHpInput}
              hasMek={false}
              hasElf={false}
              caption="Startprognos om du anger detta"
            />

            <div className="flex flex-col gap-2">
              <Button fullWidth onClick={previousHpYes}>
                Använd {previousHpInput.toFixed(2)} HP som startpunkt
              </Button>
              <button
                onClick={previousHpSkip}
                className="text-sm text-dark/50 hover:text-dark/70 py-2 transition-colors"
              >
                Hoppa över — det är min första gång
              </button>
            </div>
          </FormStep>
        )}

        {/* ── PREVIOUS SUBSECTIONS (REACTIVE) ── */}
        {step === 'previous_subsections' && (
          <FormStep
            title="Vet du dina MEK och ELF-resultat?"
            subtitle="MEK (meningskomplettering) och ELF (engelsk läsförståelse) är de två delproven Fattat inte tränar. Anger du dem snävar prognosen ihop sig — annars gissar vi smart."
          >
            <PrecisionIndicator
              hasMek={previousMekScore !== null}
              hasElf={previousElfScore !== null}
            />

            <PredictionBand
              previousHp={previousHpScore ?? previousHpInput}
              hasMek={previousMekScore !== null}
              hasElf={previousElfScore !== null}
              caption="Din nuvarande prognos"
            />

            <div className="flex flex-col gap-3">
              <SubsectionSlider
                label="MEK"
                description="Meningskomplettering"
                value={previousMekScore}
                inputValue={previousMekInput}
                onChange={(v) => { setPreviousMekInput(v); setPreviousMekScore(v) }}
                onAdd={() => setPreviousMekScore(previousMekInput)}
                onRemove={() => setPreviousMekScore(null)}
              />
              <SubsectionSlider
                label="ELF"
                description="Engelsk läsförståelse"
                value={previousElfScore}
                inputValue={previousElfInput}
                onChange={(v) => { setPreviousElfInput(v); setPreviousElfScore(v) }}
                onAdd={() => setPreviousElfScore(previousElfInput)}
                onRemove={() => setPreviousElfScore(null)}
              />
            </div>
            <Button fullWidth onClick={() => setStep('target')}>
              {previousMekScore !== null || previousElfScore !== null ? 'Fortsätt' : 'Hoppa över'}
            </Button>
          </FormStep>
        )}

        {/* ── TARGET SCORE (REACTIVE) ── */}
        {step === 'target' && (
          <FormStep
            title="Vad är ditt målresultat?"
            subtitle="HP-resultatet går från 0.0 till 2.0. Genomsnittet är 0.9."
          >
            <div className="text-center mb-1">
              <span className="text-5xl font-bold text-dark">{targetScore.toFixed(2)}</span>
              <span className="text-xl text-dark/50 ml-1">HP</span>
            </div>
            <input
              type="range"
              min={0.5}
              max={2.0}
              step={0.05}
              value={targetScore}
              onChange={(e) => setTargetScore(parseFloat(e.target.value))}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-xs text-dark/40">
              <span>0.50</span>
              <span>0.90 snitt</span>
              <span>2.00</span>
            </div>

            <GapPreview
              targetScore={targetScore}
              examDate={examDate}
              previousHpScore={previousHpScore}
              totalWords={wordCount}
            />

            <Button fullWidth onClick={() => setStep('intention')}>Fortsätt</Button>
          </FormStep>
        )}

        {/* ── INTENTION ── */}
        {step === 'intention' && (
          <FormStep
            title="När och var ska du studera?"
            subtitle='Ett konkret "när och var" tredubblar sannolikheten att du faktiskt gör det. (Det heter implementation intention — och det är inbyggt i din plan.)'
          >
            <div>
              <label className="text-sm font-medium text-dark/70 block mb-1.5">
                Tid för daglig påminnelse
              </label>
              <input
                type="time"
                value={notifyAt}
                onChange={(e) => setNotifyAt(e.target.value)}
                className="field-input"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-dark/70 block mb-1.5">
                Konkret signal (valfritt)
              </label>
              <input
                type="text"
                value={studyCue}
                onChange={(e) => setStudyCue(e.target.value)}
                placeholder='T.ex. "efter middagen" eller "på bussen"'
                className="field-input"
              />
            </div>
            {studyCue && (
              <p className="text-sm text-primary/80 bg-primary/5 rounded-card px-3 py-2">
                &ldquo;Jag ska studera kl {notifyAt} {studyCue}.&rdquo;
              </p>
            )}
            <Button fullWidth onClick={() => setStep('summary')}>
              Se din modell
            </Button>
          </FormStep>
        )}

        {/* ── SUMMARY ── */}
        {step === 'summary' && (
          <SummaryStep
            displayName={displayName}
            examDate={examDate}
            targetScore={targetScore}
            previousHpScore={previousHpScore}
            previousMekScore={previousMekScore}
            previousElfScore={previousElfScore}
            wordCount={wordCount}
            saving={saving}
            error={error}
            onStart={handleFinish}
          />
        )}

      </div>
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────

function CredibilityChip({ label, hint }: { label: string; hint: string }) {
  return (
    <div className="flex items-center gap-3 bg-white border border-dark/8 rounded-card px-4 py-3 text-left">
      <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-dark leading-tight">{label}</p>
        <p className="text-xs text-dark/50 mt-0.5">{hint}</p>
      </div>
    </div>
  )
}

function RevealStep({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex flex-col gap-6 max-w-sm mx-auto pt-6 pb-6">
      <div className="text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-primary/50 mb-3">
          Varför det funkar
        </p>
        <h2 className="text-2xl font-bold text-dark leading-snug">
          Du testade dig — innan du visste svaret
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div
          className="bg-dark/5 rounded-card p-4 flex flex-col gap-2"
          style={{ animation: 'fadeInUp 0.4s ease both 0.1s' }}
        >
          <p className="text-xs font-bold text-dark/40 uppercase tracking-wide mb-1">
            Traditionellt
          </p>
          {['Läs', 'Läs igen', 'Läs igen', 'Läs igen'].map((t, i) => (
            <p key={i} className="text-sm text-dark/40">{t}</p>
          ))}
          <p className="text-xs text-dark/30 mt-2 border-t border-dark/10 pt-2">
            Glöms snabbt
          </p>
        </div>

        <div
          className="bg-primary/10 border border-primary/20 rounded-card p-4 flex flex-col gap-2"
          style={{ animation: 'fadeInUp 0.4s ease both 0.35s' }}
        >
          <p className="text-xs font-bold text-primary uppercase tracking-wide mb-1">
            Fattat
          </p>
          {['Testa →', 'Feedback', 'Testa →', 'Feedback'].map((t, i) => (
            <p key={i} className="text-sm text-primary/80">{t}</p>
          ))}
          <p className="text-xs text-primary/60 mt-2 border-t border-primary/20 pt-2">
            Fastnar
          </p>
        </div>
      </div>

      <p
        className="text-sm text-dark/55 text-center leading-relaxed"
        style={{ animation: 'fadeInUp 0.4s ease both 0.55s' }}
      >
        Det kallas{' '}
        <strong className="text-dark font-bold">retrieval practice</strong> — att
        hämta fram ett svar aktiverar minnet på ett sätt som passiv läsning aldrig kan.
      </p>

      <div style={{ animation: 'fadeInUp 0.4s ease both 0.7s' }}>
        <Button fullWidth onClick={onNext}>
          Och det är bara halva historien →
        </Button>
      </div>
    </div>
  )
}

function FsrsStep({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex flex-col gap-6 max-w-sm mx-auto pt-6 pb-6">
      <div className="text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-primary/50 mb-3">
          Minnets mekanik
        </p>
        <h2 className="text-2xl font-bold text-dark leading-snug">
          Vi repeterar varje ord vid exakt rätt tillfälle
        </h2>
      </div>

      {/* Animated memory curve */}
      <div className="bg-white rounded-card p-4 border border-dark/8">
        <svg viewBox="0 0 300 92" className="w-full" aria-hidden="true">
          <text x="2" y="9" fontSize="7" fill="rgb(31 41 55 / 0.3)">Minne</text>
          <text x="270" y="90" fontSize="7" fill="rgb(31 41 55 / 0.3)">Tid</text>

          <line x1="0" y1="83" x2="300" y2="83" stroke="rgb(31 41 55 / 0.07)" strokeWidth="1" />

          <path
            d="M 0,14 C 18,14 54,81 76,83 L 78,20 C 94,20 130,75 153,77 L 155,26 C 172,26 207,69 230,71 L 232,32 C 250,32 274,51 298,53 L 298,83 L 0,83 Z"
            fill="rgb(15 118 110 / 0.06)"
          />

          <path
            d="M 0,14 C 18,14 54,81 76,83 L 78,20 C 94,20 130,75 153,77 L 155,26 C 172,26 207,69 230,71 L 232,32 C 250,32 274,51 298,53"
            fill="none"
            stroke="#0F766E"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              strokeDasharray: 620,
              strokeDashoffset: 620,
              animation: 'draw 2.4s ease forwards 0.3s',
            }}
          />

          {[
            { cx: 77, labelX: 77, delay: '0.95s' },
            { cx: 154, labelX: 154, delay: '1.45s' },
            { cx: 231, labelX: 231, delay: '1.95s' },
          ].map(({ cx, labelX, delay }) => (
            <g key={cx} style={{ opacity: 0, animation: `fadeIn 0.35s ease forwards ${delay}` }}>
              <circle cx={cx} cy={52} r="5" fill="rgb(15 118 110 / 0.15)" />
              <circle cx={cx} cy={52} r="2.5" fill="#0F766E" />
              <text
                x={labelX}
                y="90"
                fontSize="6"
                fill="rgb(15 118 110 / 0.55)"
                textAnchor="middle"
              >
                Repetition
              </text>
            </g>
          ))}
        </svg>
      </div>

      <p className="text-sm text-dark/55 text-center leading-relaxed">
        Algoritmen heter{' '}
        <strong className="text-dark font-bold">FSRS</strong> — den schemalägger varje
        ord att dyka upp precis när minnet är på väg att försvinna. Varje minut i
        Fattat gör maximal skillnad.
      </p>

      <Button fullWidth onClick={onNext}>
        Skräddarsy för dig →
      </Button>
    </div>
  )
}

function IntelligenceIntroStep({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex flex-col gap-7 max-w-sm mx-auto pt-8 pb-6">
      <div className="text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-primary/50 mb-3">
          Steg 2 av 2
        </p>
        <h2 className="text-2xl font-bold text-dark leading-snug">
          Du har sett motorn.<br />
          Nu personaliserar vi den.
        </h2>
      </div>

      <p className="text-sm text-dark/55 text-center leading-relaxed">
        Fem snabba steg. Varje svar formar din plan — i realtid.
      </p>

      <div className="flex flex-col gap-2">
        {[
          { label: 'När du skriver provet', hint: 'Sätter din nedräkning och dagliga kvot' },
          { label: 'Var du står idag', hint: 'Smalnar HP-prognosen från start' },
          { label: 'Var du vill landa', hint: 'Dimensionerar antal ord per dag' },
        ].map((row, i) => (
          <div
            key={row.label}
            className="flex items-center gap-3 bg-white border border-dark/8 rounded-card px-4 py-3"
            style={{ animation: `fadeInUp 0.4s ease both ${0.15 + i * 0.12}s` }}
          >
            <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold flex-shrink-0">
              {i + 1}
            </div>
            <div>
              <p className="text-sm font-bold text-dark leading-tight">{row.label}</p>
              <p className="text-xs text-dark/50 mt-0.5">{row.hint}</p>
            </div>
          </div>
        ))}
      </div>

      <Button fullWidth onClick={onNext}>Fortsätt</Button>
    </div>
  )
}

// ── REACTIVE PREVIEW PANELS ────────────────────────────────────────────────

function CountdownPanel({ examDate }: { examDate: string }) {
  const days = Math.max(0, Math.floor((new Date(examDate).getTime() - Date.now()) / 86_400_000))
  const weeks = Math.max(1, Math.ceil(days / 7))
  const dotCount = Math.min(weeks, 26)

  return (
    <div
      className="bg-white rounded-card p-4 border border-dark/8"
      style={{ animation: 'fadeInUp 0.35s ease both' }}
    >
      <div className="flex items-baseline justify-between mb-3">
        <div>
          <span className="text-3xl font-bold text-primary">{days}</span>
          <span className="text-sm text-dark/55 ml-1.5">dagar kvar</span>
        </div>
        <span className="text-xs text-dark/40">≈ {weeks} veckor</span>
      </div>
      <div className="flex flex-wrap gap-1 mb-3">
        {Array.from({ length: dotCount }).map((_, i) => (
          <div
            key={i}
            className="h-2 w-2 rounded-full bg-primary/35"
            style={{ animation: `fadeIn 0.4s ease both ${0.05 * i}s` }}
          />
        ))}
        {weeks > 26 && (
          <span className="text-[10px] text-dark/40 ml-1">+{weeks - 26}</span>
        )}
      </div>
      <p className="text-xs text-dark/55 leading-relaxed">
        ~{days} träningspass om du studerar dagligen. Vi anpassar takten efter ditt mål.
      </p>
    </div>
  )
}

// Show the user's would-be HP prediction band, computed with the same
// uncertainty model as predictScore() but with sessionCount = 0 (onboarding).
function PredictionBand({
  previousHp,
  hasMek,
  hasElf,
  caption,
}: {
  previousHp: number
  hasMek: boolean
  hasElf: boolean
  caption: string
}) {
  // Mirrors predictScore() with sessionCount = 0:
  //   sessionUnc = 0.05 + 0.15 * exp(0) = 0.20
  // ELF uncertainty is halved when previousHp is available (it serves as a
  // proxy in estimateVerbalHp), matching buildScoreBand in scoring.ts.
  const sessionUnc = 0.20
  const mekUnc = hasMek ? 0 : 0.05
  const elfUnc = hasElf ? 0 : 0.04
  const uncertainty = sessionUnc + mekUnc + elfUnc

  const mid = previousHp
  const low = Math.max(0, mid - uncertainty)
  const high = Math.min(2, mid + uncertainty)

  const lowPct = (low / 2) * 100
  const highPct = (high / 2) * 100
  const midPct = (mid / 2) * 100

  return (
    <div className="bg-white rounded-card p-4 border border-dark/8">
      <div className="flex items-baseline justify-between mb-3">
        <p className="text-xs font-bold uppercase tracking-wide text-primary/55">
          {caption}
        </p>
        <p className="text-sm font-bold text-dark">
          {mid.toFixed(2)} <span className="text-dark/50 font-medium">±{uncertainty.toFixed(2)}</span>
        </p>
      </div>
      <div className="relative h-2.5 bg-dark/5 rounded-full overflow-visible">
        <div
          className="absolute h-2.5 bg-primary/25 rounded-full transition-all duration-300"
          style={{ left: `${lowPct}%`, width: `${highPct - lowPct}%` }}
        />
        <div
          className="absolute -top-1 w-0.5 bg-primary transition-all duration-300"
          style={{ left: `calc(${midPct}% - 1px)`, height: '18px' }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-dark/30 mt-1.5">
        <span>0.0</span>
        <span>1.0</span>
        <span>2.0</span>
      </div>
    </div>
  )
}

function PrecisionIndicator({
  hasMek,
  hasElf,
}: {
  hasMek: boolean
  hasElf: boolean
}) {
  const baseUnc = 0.20 + 0.05 + 0.08 // both missing
  const currentUnc = 0.20 + (hasMek ? 0 : 0.05) + (hasElf ? 0 : 0.08)
  const reduction = baseUnc - currentUnc
  const filled = (hasMek ? 1 : 0) + (hasElf ? 1 : 0)

  return (
    <div className="bg-white rounded-card p-4 border border-dark/8">
      <div className="flex items-baseline justify-between mb-2">
        <p className="text-xs font-bold uppercase tracking-wide text-primary/55">
          Prognosens precision
        </p>
        <p className="text-sm font-bold text-dark">
          ±{currentUnc.toFixed(2)} HP
        </p>
      </div>
      <div className="flex gap-1 mb-2">
        {[0, 1].map((i) => (
          <div
            key={i}
            className={cn(
              'h-1.5 flex-1 rounded-full transition-colors',
              i < filled ? 'bg-primary' : 'bg-dark/10'
            )}
          />
        ))}
      </div>
      <p className="text-xs text-dark/55 leading-relaxed">
        {filled === 0
          ? `Anger du MEK och ELF smalnar bandet med ${reduction.toFixed(2)} HP — mer trovärdig prognos från dag ett.`
          : filled === 1
            ? `Snart där — ${(baseUnc - currentUnc).toFixed(2)} HP smalare redan. Ett delprov till för full precision.`
            : `Maximal precision från start. Vi gissar inte på din nivå — vi vet.`}
      </p>
    </div>
  )
}

function GapPreview({
  targetScore,
  examDate,
  previousHpScore,
  totalWords,
}: {
  targetScore: number
  examDate: string
  previousHpScore: number | null
  totalWords: number
}) {
  // Estimate ORD/LÄS baseline accuracy from previous HP (HP ≈ acc × 2),
  // or use the national-average baseline if the user skipped it.
  const baseline = previousHpScore !== null ? Math.min(1, previousHpScore / 2) : 0.45
  const examDateObj = examDate
    ? new Date(examDate)
    : new Date(Date.now() + 84 * 86_400_000)

  const gap = calculateGap({
    baselineOrdAcc: baseline,
    baselineLasAcc: baseline,
    targetHp: targetScore,
    examDate: examDateObj,
    totalWords,
  })

  const noExam = !examDate
  const alreadyThere = gap.newWordsNeeded === 0

  return (
    <div
      className="bg-white rounded-card p-4 border border-dark/8"
      style={{ animation: 'fadeInUp 0.3s ease both' }}
    >
      <p className="text-xs font-bold uppercase tracking-wide text-primary/55 mb-3">
        Plan i realtid
      </p>

      {alreadyThere ? (
        <p className="text-sm text-dark/70 leading-relaxed">
          Du är redan på rätt nivå. Dagliga sessioner håller dig i form inför provet.
        </p>
      ) : (
        <p className={`text-sm leading-relaxed ${gap.isHeavy ? 'text-dark/70' : 'text-dark/70'}`}>
          {gap.isHeavy
            ? `${gap.newWordsNeeded} ord att lära sig på ${gap.daysLeft} dagar — ett ambitiöst mål som kräver daglig träning utan längre avbrott.`
            : `${gap.newWordsNeeded} ord att lära sig på ${gap.daysLeft} dagar. Ett realistiskt tempo om du studerar varje dag.`}
        </p>
      )}

      {noExam && (
        <p className="text-[10px] text-dark/40 mt-3">
          Provdatum hoppades över — vi räknar med 12 veckor som standard.
        </p>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-dark/40 font-bold">{label}</p>
      <p className="text-base font-bold text-dark">{value}</p>
    </div>
  )
}

// ── SUMMARY (model reveal before diagnostic) ───────────────────────────────

function SummaryStep({
  displayName,
  examDate,
  targetScore,
  previousHpScore,
  previousMekScore,
  previousElfScore,
  wordCount,
  saving,
  error,
  onStart,
}: {
  displayName: string
  examDate: string
  targetScore: number
  previousHpScore: number | null
  previousMekScore: number | null
  previousElfScore: number | null
  wordCount: number
  saving: boolean
  error: string
  onStart: () => void
}) {
  const router = useRouter()
  const days = examDate
    ? Math.max(0, Math.floor((new Date(examDate).getTime() - Date.now()) / 86_400_000))
    : null

  const baseline = previousHpScore !== null ? Math.min(1, previousHpScore / 2) : 0.45
  const examDateObj = examDate
    ? new Date(examDate)
    : new Date(Date.now() + 84 * 86_400_000)
  const gap = calculateGap({
    baselineOrdAcc: baseline,
    baselineLasAcc: baseline,
    targetHp: targetScore,
    examDate: examDateObj,
    totalWords: wordCount,
  })

  const sessionUnc = 0.20
  const mekUnc = previousMekScore !== null ? 0 : 0.05
  const elfUnc = previousElfScore !== null ? 0 : 0.08
  const uncertainty = sessionUnc + mekUnc + elfUnc

  const examLabel = examDate
    ? new Date(examDate).toLocaleDateString('sv-SE', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'Inte angivet'

  const greeting = displayName.trim() ? `${displayName.trim()}, ` : ''

  return (
    <div className="flex flex-col gap-5 max-w-sm mx-auto pt-2 pb-8">
      <div className="text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-primary/55 mb-2">
          ✓ Modell byggd
        </p>
        <h1 className="text-2xl font-bold text-dark leading-snug">
          {greeting}din personliga<br />träningsmodell är redo.
        </h1>
        <p className="text-sm text-dark/55 mt-2">
          Det här är vad algoritmen vet om dig — innan du gjort ett enda pass.
        </p>
      </div>

      <div className="bg-white rounded-card border border-dark/8 divide-y divide-dark/8">
        <SummaryRow label="Provdatum" value={examLabel} sub={days !== null ? `${days} dagar kvar` : undefined} />
        <SummaryRow
          label="Startnivå"
          value={previousHpScore !== null ? `${previousHpScore.toFixed(2)} HP` : 'Kalibreras i diagnosprovet'}
          sub={previousHpScore !== null ? `± ${uncertainty.toFixed(2)} HP osäkerhet` : undefined}
        />
        <SummaryRow
          label="Mål"
          value={`${targetScore.toFixed(2)} HP`}
          sub={previousHpScore !== null
            ? `+${(targetScore - previousHpScore).toFixed(2)} HP att klättra`
            : undefined
          }
        />
        <SummaryRow
          label="Ord att lära sig"
          value={`${gap.newWordsNeeded} ord`}
          sub={`på ${gap.daysLeft} dagar`}
        />
      </div>

      <div className="bg-primary/5 border border-primary/15 rounded-card p-4">
        <p className="text-xs font-bold uppercase tracking-wide text-primary/70 mb-2">
          Nästa steg → Diagnosprov
        </p>
        <p className="text-sm text-dark/70 leading-relaxed mb-3">
          Ett kort kalibreringspass på <strong>~30 minuter</strong>. 20 ordfrågor + 2 läsförståelsetexter.
          Algoritmen lär sig dig — och din prognos låser sig till verkligheten.
        </p>
        <ul className="text-xs text-dark/60 space-y-1">
          <li>• Inga rätt-eller-fel poäng — bara kalibrering</li>
          <li>• Resultatet syns i din dashboard direkt efteråt</li>
          <li>• FSRS-kön startar utifrån vad du svarade</li>
        </ul>
      </div>

      <div className="bg-dark/[0.04] rounded-card px-4 py-3">
        <p className="text-xs text-dark/60 leading-relaxed text-center">
          Texterna i Fattat är skrivna i HP-stil för läsförståelseträning. Namn, personer, statistik och händelser är påhittade och används enbart i övningssyfte.
        </p>
      </div>

      {error && <p className="text-sm text-red-600 text-center">{error}</p>}

      <Button fullWidth loading={saving} onClick={onStart}>
        Starta diagnosprov
      </Button>

      <button
        onClick={() => router.push('/dashboard')}
        className="text-sm text-dark/40 underline underline-offset-2 text-center w-full"
      >
        Gör det senare
      </button>
    </div>
  )
}

function SummaryRow({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3.5">
      <p className="text-xs uppercase tracking-wide text-dark/45 font-bold">{label}</p>
      <div className="text-right">
        <p className="text-sm font-bold text-dark leading-tight">{value}</p>
        {sub && <p className="text-[10px] text-dark/45 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

function SubsectionSlider({
  label,
  description,
  value,
  inputValue,
  onChange,
  onAdd,
  onRemove,
}: {
  label: string
  description: string
  value: number | null
  inputValue: number
  onChange: (v: number) => void
  onAdd: () => void
  onRemove: () => void
}) {
  if (value === null) {
    return (
      <button
        onClick={onAdd}
        className="w-full text-left px-4 py-3 rounded-card border-2 border-dashed border-dark/15 hover:border-primary/40 transition-colors"
      >
        <p className="text-sm font-bold text-dark/60 hover:text-primary">+ Lägg till {label}</p>
        <p className="text-xs text-dark/40 mt-0.5">{description}</p>
      </button>
    )
  }
  return (
    <div className="px-4 py-3 rounded-card border-2 border-primary/30 bg-white">
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-sm font-bold text-dark">{label}</p>
          <p className="text-xs text-dark/40">{description}</p>
        </div>
        <button
          onClick={onRemove}
          className="text-xs text-dark/40 hover:text-dark/60 transition-colors"
        >
          Ta bort
        </button>
      </div>
      <div className="flex items-baseline gap-1.5 mb-1">
        <span className="text-2xl font-bold text-primary">{inputValue.toFixed(2)}</span>
        <span className="text-xs text-dark/50">HP</span>
      </div>
      <input
        type="range"
        min={0.0}
        max={2.0}
        step={0.05}
        value={inputValue}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-primary"
      />
      <div className="flex justify-between text-[10px] text-dark/30 mt-0.5">
        <span>0.00</span>
        <span>2.00</span>
      </div>
    </div>
  )
}

function FormStep({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-5 max-w-sm mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-dark leading-tight">{title}</h1>
        <p className="text-sm text-dark/55 mt-2 leading-relaxed">{subtitle}</p>
      </div>
      {children}
    </div>
  )
}
