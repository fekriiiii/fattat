import Link from 'next/link'
import { Button } from '@/components/ui/Button'

export function LockedDashboard({ displayName }: { displayName: string | null }) {
  const firstName = displayName?.split(' ')[0]
  return (
    <div className="flex flex-col gap-4 px-4 pt-5 pb-6">
      <div>
        <h1 className="text-[22px] font-bold text-dark leading-tight">
          Välkommen{firstName ? `, ${firstName}` : ''}
        </h1>
        <p className="text-[13px] text-dark/65 mt-1">Ett steg kvar innan vi kan bygga din modell.</p>
      </div>

      <div className="bg-white shadow-card rounded-card p-5 flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <span className="text-primary font-bold">1</span>
          </div>
          <div className="flex-1">
            <h2 className="text-[17px] font-bold text-dark leading-tight">Gör diagnostiken</h2>
            <p className="text-[13px] text-dark/65 mt-1 leading-relaxed">
              Ett kort prov (~20 min) som kalibrerar FSRS, sätter din baslinje och bygger din studieplan. Utan det kan vi inte rekommendera ord eller artiklar åt dig.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 text-[12px] text-dark/55 leading-relaxed pl-[52px]">
          <div className="flex gap-2">
            <span className="text-primary">•</span>
            <span>10 ORD-frågor + 1 läsförståelsetext</span>
          </div>
          <div className="flex gap-2">
            <span className="text-primary">•</span>
            <span>Resultatet visar var du står — ingen press</span>
          </div>
          <div className="flex gap-2">
            <span className="text-primary">•</span>
            <span>Du kan göra om den senare om du vill</span>
          </div>
        </div>

        <Link href="/diagnostic">
          <Button fullWidth size="lg">Starta diagnostiken</Button>
        </Link>
      </div>

      <div className="bg-dark/[0.03] rounded-card px-4 py-3">
        <p className="text-[12px] text-dark/55 leading-relaxed">
          <span className="font-bold text-dark/75">Studera</span> och <span className="font-bold text-dark/75">Plan</span> låses upp när diagnostiken är klar.
        </p>
      </div>
    </div>
  )
}
