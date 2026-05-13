"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { parseSourceUrl } from "@/lib/sources";
import { newRoomId } from "@/lib/room-id";

export function LandingForm() {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const parsed = useMemo(() => (value.trim() ? parseSourceUrl(value) : null), [value]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!value.trim()) {
      setError("Pega primero un link.");
      return;
    }
    const src = parseSourceUrl(value);
    if (!src) {
      setError("Link no reconocido. Solo YouTube y SoundCloud por ahora.");
      return;
    }
    const id = newRoomId();
    const params = new URLSearchParams({ src: src.url, t: src.type });
    startTransition(() => {
      router.push(`/r/${id}?${params.toString()}`);
    });
  }

  return (
    <form onSubmit={onSubmit} className="surface-card rounded-2xl p-5 sm:p-6">
      <label className="block text-[10px] uppercase tracking-[0.2em] text-[var(--muted)] mb-2">
        Link del set
      </label>
      <div className="relative">
        <input
          type="url"
          inputMode="url"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          placeholder="https://youtube.com/watch?v=... o https://soundcloud.com/..."
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-full rounded-xl bg-[var(--surface-2)] border border-[var(--border)] px-4 py-3.5 pr-28 text-sm sm:text-base text-[var(--foreground)] placeholder:text-[var(--muted)]/70 outline-none transition-all focus:border-[var(--cyan)] focus:shadow-[0_0_0_3px_rgba(0,240,255,0.18)]"
        />
        <SourceBadge parsed={parsed} />
      </div>

      {error && (
        <p className="mt-3 text-xs text-[var(--magenta)]">{error}</p>
      )}

      <button
        type="submit"
        disabled={isPending || !parsed}
        className="mt-5 w-full rounded-xl bg-[var(--cyan)] text-black font-semibold py-3.5 text-sm tracking-wide uppercase transition-all hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed neon-border-cyan"
      >
        {isPending ? "Creando sala…" : "Crear sala"}
      </button>

      <p className="mt-4 text-[11px] leading-relaxed text-[var(--muted)]">
        Tip: en celular dejá la app abierta y la pantalla prendida mientras escuchan. Bloquearla pausa el reproductor (límite del navegador).
      </p>
    </form>
  );
}

function SourceBadge({ parsed }: { parsed: ReturnType<typeof parseSourceUrl> }) {
  if (!parsed) return null;
  const isYt = parsed.type === "youtube";
  return (
    <div
      className={`absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-[10px] font-semibold uppercase tracking-wider ${
        isYt
          ? "bg-[var(--magenta)]/15 text-[var(--magenta)] border border-[var(--magenta)]/40"
          : "bg-[var(--cyan)]/15 text-[var(--cyan)] border border-[var(--cyan)]/40"
      }`}
    >
      {isYt ? "YouTube" : "SoundCloud"}
    </div>
  );
}
