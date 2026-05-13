"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ParsedSource } from "@/lib/sources";
import { YouTubePlayer, type PlayerHandle } from "@/components/players/YouTubePlayer";
import { SoundCloudPlayer } from "@/components/players/SoundCloudPlayer";
import { Visualizer } from "@/components/Visualizer";
import { CopyLinkButton } from "@/components/CopyLinkButton";
import { useRoomSync, type PlayerControls } from "@/lib/useRoomSync";

type PlaybackState = "loading" | "ready" | "playing" | "paused";

export function RoomView({
  roomId,
  source,
}: {
  roomId: string;
  source: ParsedSource;
}) {
  const playerRef = useRef<PlayerHandle | null>(null);
  const [state, setState] = useState<PlaybackState>("loading");
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [armed, setArmed] = useState(false);
  const stateRef = useRef<PlaybackState>("loading");

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const playerReady = state !== "loading";
  const isPlaying = state === "playing";

  // Stable PlayerControls wrapper for the sync hook.
  const controls = useMemo<PlayerControls | null>(() => {
    if (!playerReady) return null;
    return {
      play: async () => {
        const p = playerRef.current;
        if (p) await p.play();
      },
      pause: async () => {
        const p = playerRef.current;
        if (p) await p.pause();
      },
      seekTo: async (s: number) => {
        const p = playerRef.current;
        if (p) await p.seekTo(s);
        setPosition(s);
      },
      getCurrentTime: async () => {
        const p = playerRef.current;
        return p ? await p.getCurrentTime() : 0;
      },
      isPlaying: () => stateRef.current === "playing",
    };
  }, [playerReady]);

  const sync = useRoomSync({ roomId, controls, playerReady, armed });

  // Poll position for the progress bar once armed.
  useEffect(() => {
    if (!armed) return;
    const id = setInterval(async () => {
      const p = playerRef.current;
      if (!p) return;
      try {
        const pos = await p.getCurrentTime();
        const dur = await p.getDuration();
        if (Number.isFinite(pos)) setPosition(pos);
        if (Number.isFinite(dur) && dur > 0) setDuration(dur);
      } catch {
        /* ignore */
      }
    }, 500);
    return () => clearInterval(id);
  }, [armed]);

  const handleReady = useCallback(() => {
    setState("ready");
  }, []);

  const handleStateChange = useCallback(
    (next: "playing" | "paused" | "ended") => {
      if (next === "playing") setState("playing");
      else setState("paused");
    },
    [],
  );

  const ready = sync.peers.find((p) => p.id === sync.selfId)?.ready ?? false;
  const others = sync.peers.filter((p) => p.id !== sync.selfId);
  const otherReady = others.some((p) => p.ready);
  const bothPresent = others.length > 0;
  const bothReady = ready && otherReady;
  const canControl = !sync.configured ? armed : bothReady && armed;

  const handleArm = useCallback(async () => {
    setArmed(true);
    // Brief silent play+pause to satisfy autoplay gesture on mobile,
    // so future programmatic play() (e.g. when peer hits play) is allowed.
    const p = playerRef.current;
    if (p) {
      try {
        await p.play();
        await p.pause();
        await p.seekTo(0);
        setPosition(0);
      } catch {
        /* ignore */
      }
    }
    if (sync.configured) {
      await sync.setReady(true);
    }
  }, [sync]);

  const handlePlay = useCallback(async () => {
    const p = playerRef.current;
    if (!p) return;
    const pos = await p.getCurrentTime();
    if (sync.configured && bothReady) {
      // Broadcast: both peers schedule play at the same server time.
      await sync.broadcastPlay(pos, 1500);
      // Apply locally too with the same schedule.
      setTimeout(() => p.play(), 1500);
    } else {
      await p.play();
    }
  }, [sync, bothReady]);

  const handlePause = useCallback(async () => {
    const p = playerRef.current;
    if (!p) return;
    const pos = await p.getCurrentTime();
    if (sync.configured && bothReady) {
      await sync.broadcastPause(pos);
    }
    await p.pause();
  }, [sync, bothReady]);

  const handleSeek = useCallback(
    async (seconds: number) => {
      const p = playerRef.current;
      if (!p) return;
      await p.seekTo(seconds);
      setPosition(seconds);
      if (sync.configured && bothReady) {
        await sync.broadcastSeek(seconds, stateRef.current === "playing");
      }
    },
    [sync, bothReady],
  );

  return (
    <main className="flex flex-1 flex-col items-center px-4 sm:px-6 py-6 sm:py-10">
      <div className="w-full max-w-2xl">
        <header className="flex items-center justify-between mb-6">
          <a
            href="/"
            className="text-[10px] uppercase tracking-[0.25em] text-[var(--muted)] hover:text-[var(--cyan)] transition-colors"
          >
            ← SYNC
          </a>
          <div className="flex items-center gap-3">
            <PresenceDot sync={sync} bothPresent={bothPresent} otherReady={otherReady} />
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-[0.2em] text-[var(--muted)]">Sala</span>
              <span className="font-mono text-sm neon-text-cyan tracking-widest">{roomId}</span>
            </div>
          </div>
        </header>

        <div className="surface-card rounded-2xl p-5 sm:p-7">
          <div className="aspect-video rounded-xl overflow-hidden bg-black border border-[var(--border)] mb-5">
            {source.type === "youtube" ? (
              <YouTubePlayer
                videoId={source.youtubeId!}
                onReady={handleReady}
                onStateChange={handleStateChange}
                ref={playerRef as React.Ref<PlayerHandle>}
              />
            ) : (
              <SoundCloudPlayer
                url={source.url}
                onReady={handleReady}
                onStateChange={handleStateChange}
                ref={playerRef as React.Ref<PlayerHandle>}
              />
            )}
          </div>

          <ProgressBar
            position={position}
            duration={duration}
            onSeek={handleSeek}
            disabled={!canControl}
          />

          <div className="mt-5 flex items-center justify-center gap-3">
            <ControlButton
              onClick={() => handleSeek(Math.max(0, position - 10))}
              disabled={!canControl}
              aria-label="Atrás 10s"
            >
              <RewindIcon />
            </ControlButton>

            {!armed ? (
              <PrimaryButton onClick={handleArm} disabled={state === "loading"}>
                {state === "loading" ? "Cargando…" : "Estoy listo"}
              </PrimaryButton>
            ) : !bothReady && sync.configured ? (
              <PrimaryButton onClick={() => {}} disabled>
                {bothPresent ? "Esperando a tu compa" : "Esperando que se conecte"}
              </PrimaryButton>
            ) : isPlaying ? (
              <PrimaryButton onClick={handlePause}>Pausa</PrimaryButton>
            ) : (
              <PrimaryButton onClick={handlePlay}>Play</PrimaryButton>
            )}

            <ControlButton
              onClick={() => handleSeek(Math.min(duration, position + 10))}
              disabled={!canControl}
              aria-label="Adelante 10s"
            >
              <ForwardIcon />
            </ControlButton>
          </div>

          <div className="mt-6 pt-5 border-t border-[var(--border)]">
            <Visualizer active={isPlaying} />
          </div>
        </div>

        <div className="mt-5 surface-card rounded-2xl p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--muted)]">Invita a tu compa</p>
            {sync.configured && sync.connection === "joined" && sync.clockUncertainty < Infinity && (
              <span className="text-[9px] uppercase tracking-wider font-mono text-[var(--muted)]">
                ±{Math.round(sync.clockUncertainty)}ms
              </span>
            )}
          </div>
          <CopyLinkButton />
          {!sync.configured && (
            <p className="mt-3 text-[11px] text-[var(--magenta)]">
              ⚠ Falta configurar Supabase. La sincronización entre dispositivos está deshabilitada.
              Revisa el README.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}

function PresenceDot({
  sync,
  bothPresent,
  otherReady,
}: {
  sync: ReturnType<typeof useRoomSync>;
  bothPresent: boolean;
  otherReady: boolean;
}) {
  if (!sync.configured) {
    return (
      <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-[var(--muted)]">
        <span className="size-1.5 rounded-full bg-[var(--muted)]" />
        sin sync
      </span>
    );
  }
  if (sync.connection !== "joined") {
    return (
      <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-[var(--muted)]">
        <span className="size-1.5 rounded-full bg-[var(--muted)] animate-pulse" />
        conectando…
      </span>
    );
  }
  const label = !bothPresent ? "solo tú" : otherReady ? "compa listo" : "compa aquí";
  const color = !bothPresent ? "var(--muted)" : otherReady ? "var(--cyan)" : "var(--magenta)";
  return (
    <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider" style={{ color }}>
      <span
        className="size-1.5 rounded-full"
        style={{ background: color, boxShadow: `0 0 8px ${color}` }}
      />
      {label}
    </span>
  );
}

function PrimaryButton({
  onClick,
  disabled,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="rounded-full bg-[var(--cyan)] text-black font-bold px-8 py-4 text-sm uppercase tracking-wider transition-all hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed neon-border-cyan min-w-[180px]"
    >
      {children}
    </button>
  );
}

function ControlButton({
  onClick,
  disabled,
  children,
  ...rest
}: {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="size-12 rounded-full border border-[var(--border)] bg-[var(--surface-2)] text-[var(--foreground)] flex items-center justify-center hover:border-[var(--cyan)] hover:text-[var(--cyan)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      {...rest}
    >
      {children}
    </button>
  );
}

function ProgressBar({
  position,
  duration,
  onSeek,
  disabled,
}: {
  position: number;
  duration: number;
  onSeek: (s: number) => void;
  disabled: boolean;
}) {
  const pct = duration > 0 ? Math.min(100, (position / duration) * 100) : 0;
  return (
    <div className="space-y-2">
      <div
        className={`relative h-2 rounded-full bg-[var(--surface-2)] overflow-hidden ${
          disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
        }`}
        onClick={(e) => {
          if (disabled || duration <= 0) return;
          const rect = e.currentTarget.getBoundingClientRect();
          const ratio = (e.clientX - rect.left) / rect.width;
          onSeek(ratio * duration);
        }}
      >
        <div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            width: `${pct}%`,
            background: "linear-gradient(90deg, var(--cyan), var(--magenta))",
            boxShadow: "0 0 12px var(--cyan-dim)",
          }}
        />
      </div>
      <div className="flex justify-between text-[10px] font-mono tabular-nums text-[var(--muted)]">
        <span>{fmt(position)}</span>
        <span>{fmt(duration)}</span>
      </div>
    </div>
  );
}

function fmt(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const total = Math.floor(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function RewindIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="11 19 2 12 11 5 11 19" />
      <polygon points="22 19 13 12 22 5 22 19" />
    </svg>
  );
}

function ForwardIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="13 19 22 12 13 5 13 19" />
      <polygon points="2 19 11 12 2 5 2 19" />
    </svg>
  );
}
