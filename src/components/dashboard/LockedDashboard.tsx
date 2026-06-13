import Link from 'next/link'
import { Button } from '@/components/ui/Button'

export function LockedDashboard({ displayName }: { displayName: string | null }) {
  const firstName = displayName?.split(' ')[0]
  return (
    <div className="flex flex-col gap-4 px-4 pt-6 pb-6">
      <div className="motion-safe:animate-fade-up">
        <h1 className="text-[26px] font-bold text-dark leading-tight tracking-tight">
          Välkommen{firstName ? `, ${firstName}` : ''}
        </h1>
        <p className="text-sm text-dark/60 mt-1">Ett steg kvar innan vi kan bygga din modell.</p>
      </div>

      <div className="surface-ink text-cream rounded-card p-6 shadow-raised flex flex-col gap-4 motion-safe:animate-fade-up motion-safe:[animation-delay:80ms]">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-full bg-primary/25 ring-1 ring-inset ring-primary-300/30 flex items-center justify-center shrink-0">
            <span className="text-primary-200 font-bold">1</span>
          </div>
          <div className="flex-1">
            <h2 className="text-[18px] font-bold leading-tight">Gör diagnostiken</h2>
            <p className="text-[13px] text-cream/65 mt-1.5 leading-relaxed">
              Ett kort prov (~30 min) som kalibrerar FSRS, sätter din baslinje och bygger din studieplan. Utan det kan vi inte rekommendera ord eller artiklar åt dig.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2.5 text-[12px] text-cream/60 leading-relaxed pl-[54px]">
          <div className="flex gap-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary-300 mt-[6px] shrink-0" />
            <span>20 ORD-frågor + 2 läsförståelsetexter</span>
          </div>
          <div className="flex gap-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary-300 mt-[6px] shrink-0" />
            <span>Resultatet visar var du står, ingen press</span>
          </div>
          <div className="flex gap-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary-300 mt-[6px] shrink-0" />
            <span>Det spelar ingen roll om du gissar, svara bara ärligt</span>
          </div>
        </div>

        <Link href="/diagnostic">
          <Button fullWidth size="lg">Starta diagnostiken</Button>
        </Link>
      </div>

      <div className="bg-white/60 border border-dark/[0.05] rounded-card px-4 py-3 motion-safe:animate-fade-up motion-safe:[animation-delay:160ms]">
        <p className="text-[12px] text-dark/55 leading-relaxed">
          <span className="font-bold text-dark/75">Studera</span> och <span className="font-bold text-dark/75">Plan</span> låses upp när diagnostiken är klar.
        </p>
      </div>
    </div>
  )
}
