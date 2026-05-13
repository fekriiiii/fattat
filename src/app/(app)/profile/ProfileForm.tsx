'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase/client'
import { usePushNotifications } from '@/hooks/usePushNotifications'
import { Button } from '@/components/ui/Button'
import { Bell, BellOff } from 'lucide-react'
import { ExamDatePicker } from '@/components/onboarding/ExamDatePicker'
import type { UserProfile, UserStreak } from '@/types/database'

interface Props {
  profile: UserProfile | null
  email: string
  streak: UserStreak | null
}

export function ProfileForm({ profile, email }: Props) {
  const router = useRouter()
  const { permission, subscribed, subscribe } = usePushNotifications()
  const [notifLoading, setNotifLoading] = useState(false)
  const [displayName, setDisplayName] = useState(profile?.display_name ?? '')
  const [examDate, setExamDate] = useState(profile?.exam_date ?? '')
  const [targetScore, setTargetScore] = useState(profile?.target_score ?? 1.3)
  const [previousHpScore, setPreviousHpScore] = useState<number | null>(profile?.previous_hp_score ?? null)
  const [previousHpInput, setPreviousHpInput] = useState(profile?.previous_hp_score ?? 1.0)
  const [previousMekScore, setPreviousMekScore] = useState<number | null>(profile?.previous_mek_score ?? null)
  const [previousMekInput, setPreviousMekInput] = useState(profile?.previous_mek_score ?? 1.0)
  const [previousElfScore, setPreviousElfScore] = useState<number | null>(profile?.previous_elf_score ?? null)
  const [previousElfInput, setPreviousElfInput] = useState(profile?.previous_elf_score ?? 1.0)
  const [notifyAt, setNotifyAt] = useState(profile?.preferred_notify_at ?? '19:00')
  const [studyCue, setStudyCue] = useState(profile?.study_cue ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSave() {
    setSaving(true)
    const supabase = createBrowserClient()
    await supabase.from('user_profiles').update({
      display_name: displayName.trim() || null,
      exam_date: examDate || null,
      target_score: targetScore,
      previous_hp_score: previousHpScore,
      previous_mek_score: previousMekScore,
      previous_elf_score: previousElfScore,
      preferred_notify_at: notifyAt,
      study_cue: studyCue.trim() || null,
    }).eq('id', profile!.id)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function handleSignOut() {
    const supabase = createBrowserClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Form */}
      <div className="flex flex-col gap-4">
        <Field label="Namn">
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Ditt namn (valfritt)"
            className="field-input"
          />
        </Field>
        <Field label="E-post">
          <input type="email" value={email} disabled className="field-input opacity-50" />
        </Field>
        <Field label="Provomgång">
          <ExamDatePicker value={examDate} onChange={setExamDate} />
        </Field>
        <Field label={`Målresultat: ${targetScore.toFixed(2)} HP`}>
          <input
            type="range"
            min={0.5}
            max={2.0}
            step={0.05}
            value={targetScore}
            onChange={(e) => setTargetScore(parseFloat(e.target.value))}
            className="w-full accent-primary"
          />
          <div className="flex justify-between text-xs text-dark/35 mt-1">
            <span>0.50</span><span>2.00</span>
          </div>
        </Field>
        <Field label="Tidigare HP-resultat">
          <div className="flex flex-col gap-2">
            {previousHpScore !== null ? (
              <>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold text-dark">{previousHpInput.toFixed(2)}</span>
                  <span className="text-sm text-dark/50">HP</span>
                </div>
                <input
                  type="range"
                  min={0.1}
                  max={2.0}
                  step={0.05}
                  value={previousHpInput}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value)
                    setPreviousHpInput(v)
                    setPreviousHpScore(v)
                  }}
                  className="w-full accent-primary"
                />
                <div className="flex justify-between text-xs text-dark/35">
                  <span>0.10</span><span>2.00</span>
                </div>
                <button
                  onClick={() => setPreviousHpScore(null)}
                  className="text-xs text-dark/40 hover:text-dark/60 text-left transition-colors"
                >
                  Ta bort
                </button>
              </>
            ) : (
              <button
                onClick={() => setPreviousHpScore(previousHpInput)}
                className="w-full text-left px-4 py-3 rounded-card border-2 border-dashed border-dark/15 hover:border-primary/40 text-sm text-dark/50 hover:text-primary transition-colors"
              >
                + Lägg till tidigare HP-resultat
              </button>
            )}
          </div>
        </Field>
        <Field label="Tidigare MEK (meningskomplettering)">
          <SubsectionField
            value={previousMekScore}
            inputValue={previousMekInput}
            onChange={(v) => { setPreviousMekInput(v); setPreviousMekScore(v) }}
            onAdd={() => setPreviousMekScore(previousMekInput)}
            onRemove={() => setPreviousMekScore(null)}
          />
        </Field>
        <Field label="Tidigare ELF (engelsk läsförståelse)">
          <SubsectionField
            value={previousElfScore}
            inputValue={previousElfInput}
            onChange={(v) => { setPreviousElfInput(v); setPreviousElfScore(v) }}
            onAdd={() => setPreviousElfScore(previousElfInput)}
            onRemove={() => setPreviousElfScore(null)}
          />
        </Field>
        <Field label="Påminnelsetid">
          <input
            type="time"
            value={notifyAt}
            onChange={(e) => setNotifyAt(e.target.value)}
            className="field-input"
          />
        </Field>
        <Field label="Påminnelser">
          {permission === 'granted' || subscribed ? (
            <div className="flex items-center gap-2 px-4 py-3 bg-primary/5 rounded-card border border-primary/15">
              <Bell size={14} className="text-primary shrink-0" />
              <span className="text-sm text-primary font-bold">Aktiverade</span>
            </div>
          ) : permission === 'denied' ? (
            <div className="flex items-center gap-2 px-4 py-3 bg-dark/5 rounded-card border border-dark/10">
              <BellOff size={14} className="text-dark/40 shrink-0" />
              <span className="text-sm text-dark/50">Blockerade i webbläsaren — aktivera i inställningar</span>
            </div>
          ) : (
            <button
              type="button"
              disabled={notifLoading}
              onClick={async () => {
                setNotifLoading(true)
                await subscribe()
                setNotifLoading(false)
              }}
              className="w-full text-left px-4 py-3 rounded-card border-2 border-dashed border-dark/15 hover:border-primary/40 text-sm text-dark/50 hover:text-primary transition-colors disabled:opacity-50"
            >
              {notifLoading ? 'Aktiverar…' : '+ Aktivera dagliga påminnelser'}
            </button>
          )}
        </Field>
        <Field label="Signal för studiesession">
          <input
            type="text"
            value={studyCue}
            onChange={(e) => setStudyCue(e.target.value)}
            placeholder='T.ex. "efter middagen"'
            className="field-input"
          />
        </Field>
      </div>

      <Button fullWidth loading={saving} onClick={handleSave}>
        {saved ? '✓ Sparat' : 'Spara ändringar'}
      </Button>

      <button
        onClick={handleSignOut}
        className="w-full py-3.5 rounded-btn border border-dark/10 text-[14px] font-semibold text-dark/50 hover:text-dark/70 transition-colors"
      >
        Logga ut
      </button>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-sm font-medium text-dark/70 block mb-1.5">{label}</label>
      {children}
    </div>
  )
}

function SubsectionField({
  value,
  inputValue,
  onChange,
  onAdd,
  onRemove,
}: {
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
        className="w-full text-left px-4 py-3 rounded-card border-2 border-dashed border-dark/15 hover:border-primary/40 text-sm text-dark/50 hover:text-primary transition-colors"
      >
        + Lägg till resultat
      </button>
    )
  }
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl font-bold text-dark">{inputValue.toFixed(2)}</span>
        <span className="text-sm text-dark/50">HP</span>
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
      <div className="flex justify-between text-xs text-dark/35">
        <span>0.00</span><span>2.00</span>
      </div>
      <button
        onClick={onRemove}
        className="text-xs text-dark/40 hover:text-dark/60 text-left transition-colors"
      >
        Ta bort
      </button>
    </div>
  )
}
