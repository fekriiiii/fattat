import Link from 'next/link'

export const metadata = { title: 'Integritetspolicy — Fattat' }

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-cream text-dark px-6 py-12">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="text-sm font-semibold text-primary hover:underline">← Tillbaka</Link>
        <h1 className="text-3xl font-bold tracking-tight mt-6 mb-2">Integritetspolicy</h1>
        <p className="text-sm text-dark/50 mb-8">Senast uppdaterad: 2026-05-16</p>

        <div className="flex flex-col gap-6 text-[15px] leading-relaxed text-dark/75">
          <Section title="Vem är ansvarig">
            <p>
              Fattat drivs av Ahmed Mufti (personuppgiftsansvarig under
              uppbyggnadsfasen, fram tills enskild firma registreras). Du når
              oss på <a href="mailto:hej@fattat.se" className="underline">hej@fattat.se</a>.
            </p>
          </Section>

          <Section title="Vad vi samlar in">
            <p>
              <strong>Väntelista:</strong> e-postadress och vilken kanal du
              hörde talas om Fattat via (TikTok, Instagram, YouTube, vän/skola
              eller annat). Vi lagrar även en anonymiserad IP-hash för att
              förhindra spam.
            </p>
            <p>
              <strong>Appen (när öppen):</strong> ditt konto, dina svar i
              studiesessioner, FSRS-data och inställningar du själv anger.
            </p>
          </Section>

          <Section title="Hur vi använder det">
            <p>
              Vi skickar dig ett mejl när Fattat öppnar. Vi använder
              kanaldatan internt för att förstå vilka plattformar som leder
              till intresse — aggregerat, inte kopplat till dig personligen.
            </p>
          </Section>

          <Section title="Tredjepartstjänster">
            <p>
              Vi använder Supabase (databas + autentisering, EU-region),
              Vercel (hosting) och Resend (e-postutskick). Inga uppgifter
              säljs eller delas vidare i marknadsföringssyfte.
            </p>
          </Section>

          <Section title="Dina rättigheter (GDPR)">
            <p>
              Du har rätt att begära ut, rätta eller radera dina uppgifter.
              Mejla <a href="mailto:hej@fattat.se" className="underline">hej@fattat.se</a> så
              svarar vi inom 30 dagar.
            </p>
          </Section>

          <Section title="Lagringstid">
            <p>
              Väntelisteposter raderas när Phase 2 är avslutad och alla har
              fått sin inbjudan, senast 12 månader efter lansering. Du kan
              be att bli borttagen tidigare när som helst.
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
