import Link from 'next/link'
import Image from 'next/image'
import { WaitlistForm } from '@/components/landing/WaitlistForm'

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-cream text-dark overflow-x-hidden">
      {/* Top bar */}
      <header className="px-5 sm:px-8 py-5 flex items-center justify-between max-w-6xl mx-auto">
        <div className="flex items-center gap-2.5">
          <Image src="/Fattat_Logo.png" alt="Fattat" width={32} height={32} className="rounded-lg" />
          <span className="text-[17px] font-bold tracking-tight">Fattat</span>
        </div>
        <Link
          href="/login"
          className="text-sm font-semibold text-dark/55 hover:text-primary transition-colors"
        >
          Logga in
        </Link>
      </header>

      {/* HERO — form is above the fold */}
      <section className="px-5 sm:px-8 pt-6 sm:pt-16 pb-20 max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-[1.1fr,1fr] gap-12 lg:gap-16 items-center">
          {/* Left: pitch */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/15 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-[12px] font-bold uppercase tracking-[0.1em] text-primary">
                Bygger live · 140 dagar mot HP
              </span>
            </div>

            <h1 className="text-[44px] sm:text-[60px] lg:text-[68px] font-bold leading-[0.98] tracking-[-0.025em] mb-6">
              <span className="text-primary">Verbala delen</span>
              <br />drar ner ditt HP.
            </h1>

            <p className="text-[18px] sm:text-[20px] text-dark/70 leading-[1.45] max-w-xl">
              Du är stark på matten. Det är ORD och LÄS som äter upp poäng.
              Fattat är byggd för exakt det problemet — och bara det.
            </p>
          </div>

          {/* Right: form card */}
          <div className="lg:pl-4">
            <div className="bg-white rounded-2xl border border-dark/8 shadow-[0_4px_24px_-8px_rgba(31,41,55,0.08)] p-6 sm:p-7">
              <div className="mb-5">
                <h2 className="text-[20px] font-bold tracking-tight mb-1.5">
                  Få ett mejl när Fattat öppnar
                </h2>
                <p className="text-[13px] text-dark/55 leading-relaxed">
                  Du som står på listan får tillgång först — innan vi öppnar
                  för allmänheten i höst.
                </p>
              </div>
              <WaitlistForm />
            </div>
          </div>
        </div>
      </section>

      {/* PROBLEM — single bold statement */}
      <section className="px-5 sm:px-8 py-20 max-w-4xl mx-auto">
        <p className="text-[13px] font-bold uppercase tracking-[0.12em] text-dark/45 mb-5">
          Problemet
        </p>
        <h2 className="text-[28px] sm:text-[40px] font-bold leading-[1.1] tracking-[-0.02em] mb-5">
          Tusentals studenter kan matten utantill.<br />
          <span className="text-dark/55">HP-resultatet säger inte det.</span>
        </h2>
        <p className="text-[17px] sm:text-[19px] text-dark/70 leading-[1.55] max-w-2xl">
          När halva provet är ord du aldrig sett och texter du knappt hinner
          läsa — då drar verbala ner dig oavsett hur snabbt du räknar. Det är
          inte ett intelligensproblem. Det är ett träningsproblem.
        </p>
      </section>

      {/* FEATURES — cards, not bullets */}
      <section className="px-5 sm:px-8 py-20 max-w-6xl mx-auto">
        <p className="text-[13px] font-bold uppercase tracking-[0.12em] text-primary mb-5">
          Vad Fattat gör annorlunda
        </p>
        <h2 className="text-[28px] sm:text-[40px] font-bold leading-[1.1] tracking-[-0.02em] mb-12 max-w-3xl">
          Inga hint-knappar. Ingen passiv läsning. Bara träning som faktiskt fastnar.
        </h2>

        <div className="grid sm:grid-cols-2 gap-4 sm:gap-5">
          <FeatureCard
            number="01"
            title="Ordförråd som fastnar"
            body="FSRS — samma minnesteknik som högpresterande språkstudenter använder. Algoritmen bestämmer när du ser varje ord igen, inte slumpen."
          />
          <FeatureCard
            number="02"
            title="LÄS med direkt feedback"
            body="Efter varje fråga ser du varför rätt svar är rätt — och varför fel svar luras. Inga generiska förklaringar."
          />
          <FeatureCard
            number="03"
            title="Tvingar dig att tänka först"
            body="Hjärnan lär sig av att försöka komma ihåg — inte av att läsa om samma sak. Frågan kommer alltid före svaret."
          />
          <FeatureCard
            number="04"
            title="Byggd för bussen"
            body="Mobilt först. Sessionen är klar när du är klar — vanligtvis 15 minuter. Inget krångel att starta, inget att avsluta."
          />
        </div>
      </section>

      {/* DOGFOODING */}
      <section className="px-5 sm:px-8 py-20 max-w-6xl mx-auto">
        <div className="bg-dark text-cream rounded-3xl p-8 sm:p-12 lg:p-16">
          <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-primary mb-5">
            Följ resan
          </p>
          <h2 className="text-[28px] sm:text-[40px] lg:text-[48px] font-bold leading-[1.05] tracking-[-0.02em] mb-5 max-w-3xl">
            Jag bygger Fattat live — och pluggar HP samtidigt.
          </h2>
          <p className="text-[17px] sm:text-[19px] text-cream/65 leading-[1.55] mb-8 max-w-2xl">
            Skärminspelning varje dag i 140 dagar. Min verbala utveckling,
            mina svaga domäner, vad som funkar och vad som inte gör det.
          </p>
          <div className="flex flex-wrap gap-3">
            <SocialLink href="https://tiktok.com/@fattat.se" label="TikTok" />
            <SocialLink href="https://instagram.com/fattat.se" label="Instagram" />
            <SocialLink href="https://youtube.com/@fattathp" label="YouTube" />
          </div>
        </div>
      </section>

      {/* FINAL CTA — second waitlist surface for people who scrolled past */}
      <section className="px-5 sm:px-8 py-24 max-w-3xl mx-auto text-center">
        <h2 className="text-[32px] sm:text-[44px] font-bold leading-[1.05] tracking-[-0.02em] mb-4">
          Var med från början.
        </h2>
        <p className="text-[17px] text-dark/65 mb-8">
          Vi mejlar dig en gång — när Fattat öppnar.
        </p>
        <div className="max-w-md mx-auto text-left bg-white rounded-2xl border border-dark/8 shadow-[0_4px_24px_-8px_rgba(31,41,55,0.08)] p-6">
          <WaitlistForm />
        </div>
      </section>

      {/* Footer */}
      <footer className="px-5 sm:px-8 py-10 max-w-6xl mx-auto border-t border-dark/8 mt-8 text-sm text-dark/45 flex flex-col sm:flex-row gap-4 sm:gap-6 sm:items-center justify-between">
        <div className="flex items-center gap-2">
          <Image src="/Fattat_Logo.png" alt="Fattat" width={20} height={20} className="rounded-md" />
          <span>© Fattat 2026</span>
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          <Link href="/privacy" className="hover:text-dark/70 transition-colors">Integritetspolicy</Link>
          <Link href="/terms" className="hover:text-dark/70 transition-colors">Villkor</Link>
          <a href="mailto:hej@fattat.se" className="hover:text-dark/70 transition-colors">hej@fattat.se</a>
        </div>
      </footer>
    </main>
  )
}

function FeatureCard({ number, title, body }: { number: string; title: string; body: string }) {
  return (
    <div className="bg-white rounded-2xl border border-dark/8 p-6 sm:p-7 hover:border-primary/30 transition-colors">
      <p className="text-[12px] font-bold text-primary/70 mb-4 tracking-[0.1em]">{number}</p>
      <h3 className="text-[19px] font-bold tracking-tight mb-2.5">{title}</h3>
      <p className="text-[15px] text-dark/65 leading-relaxed">{body}</p>
    </div>
  )
}

function SocialLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-cream/10 hover:bg-cream/20 text-cream font-semibold text-sm transition-colors"
    >
      {label}
      <span className="text-cream/60">→</span>
    </a>
  )
}
