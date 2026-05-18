import Link from 'next/link'

export const metadata = { title: 'Villkor — Fattat' }

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-cream text-dark px-6 py-12">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="text-sm font-semibold text-primary hover:underline">← Tillbaka</Link>
        <h1 className="text-3xl font-bold tracking-tight mt-6 mb-2">Användarvillkor</h1>
        <p className="text-sm text-dark/50 mb-8">Senast uppdaterad: 2026-05-16</p>

        <div className="flex flex-col gap-6 text-[15px] leading-relaxed text-dark/75">
          <Section title="Om Fattat">
            <p>
              Fattat är en app under utveckling för förberedelse inför
              Högskoleprovets verbala del (ORD och LÄS). Tjänsten är ännu
              inte öppen för allmänheten — denna sida driver en väntelista.
            </p>
          </Section>

          <Section title="Väntelistan">
            <p>
              När du anmäler dig till väntelistan godkänner du att vi sparar
              din e-postadress för att kontakta dig en gång när Fattat
              öppnar, plus eventuella enstaka uppdateringar om lanseringen.
              Du kan avregistrera dig när som helst via länken i mejlet
              eller genom att mejla <a href="mailto:hej@fattat.se" className="underline">hej@fattat.se</a>.
            </p>
          </Section>

          <Section title="Inga garantier om resultat">
            <p>
              Fattat är ett träningsverktyg. Vi gör inga garantier om
              specifika HP-resultat eller poängförbättringar. Ditt
              slutresultat beror på många faktorer utanför appens kontroll.
            </p>
          </Section>

          <Section title="Innehåll och upphovsrätt">
            <p>
              Innehållet i Fattat — ord, definitioner, läsartiklar och
              frågor — är skapat av oss eller licensierat. Du får använda
              materialet för egen studie men inte kopiera eller
              vidaredistribuera det.
            </p>
          </Section>

          <Section title="Ändringar">
            <p>
              Villkoren kan komma att uppdateras innan Fattat öppnar för
              allmänheten. Större ändringar meddelas via mejl till
              väntelistan.
            </p>
          </Section>

          <Section title="Kontakt">
            <p>
              Frågor? <a href="mailto:hej@fattat.se" className="underline">hej@fattat.se</a>
            </p>
          </Section>
        </div>
      </div>
    </main>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-bold tracking-tight mb-2">{title}</h2>
      <div className="flex flex-col gap-2">{children}</div>
    </section>
  )
}
