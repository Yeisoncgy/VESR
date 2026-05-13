import { LandingForm } from "./LandingForm";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-12 sm:py-20">
      <div className="w-full max-w-xl">
        <header className="mb-10 sm:mb-14 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)]/60 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-[var(--muted)]">
            <span className="size-1.5 rounded-full bg-[var(--cyan)] pulse-glow" />
            beta · solo para yeison & jafet
          </div>
          <h1 className="text-5xl sm:text-7xl font-black tracking-tight">
            <span className="neon-text-cyan">SYNC</span>
            <span className="text-[var(--foreground)]">.</span>
          </h1>
          <p className="mt-4 text-[var(--muted)] text-sm sm:text-base leading-relaxed">
            Pega un link de YouTube o SoundCloud y comparte la sala.
            <br className="hidden sm:block" />
            Los dos le dan play al tiempo, automático.
          </p>
        </header>

        <LandingForm />

        <footer className="mt-14 text-center text-[10px] uppercase tracking-[0.25em] text-[var(--muted)]/70">
          tu sala · tu música · tu parche
        </footer>
      </div>
    </main>
  );
}
