"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ParsedSource } from "@/lib/sources";
import { YouTubePlayer, type PlayerHandle } from "@/components/players/YouTubePlayer";
import { SoundCloudPlayer } from "@/components/players/SoundCloudPlayer";
import { useRoomSync, type PlayerControls } from "@/lib/useRoomSync";
import { Icon } from "@/components/ui/Icon";
import { PresenceDot } from "@/components/ui/PresenceDot";
import { Visualizer } from "@/components/ui/Visualizer";
import { ProgressBar, LcdReadout } from "@/components/ui/ProgressBar";
import { StatusPill, SourceBadge } from "@/components/ui/StatusPill";
import { RoundBtn, PlayButton } from "@/components/ui/Transport";
import { VesrWordmarkMono } from "@/components/ui/Wordmark";
import { Credit } from "@/components/ui/Credit";

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
  const [copied, setCopied] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);
  const stateRef = useRef<PlaybackState>("loading");

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const playerReady = state !== "loading";
  const isPlaying = state === "playing";

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

  const handleReady = useCallback(() => setState("ready"), []);
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
      await sync.broadcastPlay(pos, 1500);
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

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = window.location.href;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  }, []);

  // Atmos variant: solo, both-present, or dimmed
  const atmosClass = !sync.configured
    ? "atmos cyan-dom"
    : bothPresent
    ? "atmos both"
    : "atmos";

  // Ring around artwork
  const ring: "magenta" | "bi" | "none" =
    !bothPresent ? "magenta" : bothReady ? "bi" : "bi";

  // Status pill content
  const syncStatus = (() => {
    if (!sync.configured) return { tone: "muted" as const, text: "Sin sync · solo este dispositivo" };
    if (sync.connection !== "joined") return { tone: "warn" as const, text: "Conectando…" };
    if (isPlaying && bothReady) {
      const lat = Number.isFinite(sync.clockUncertainty) ? Math.round(sync.clockUncertainty) : 0;
      return { tone: "live" as const, text: `En sync · ±${lat}ms` };
    }
    if (state === "paused" && armed) return { tone: "muted" as const, text: "Pausado" };
    if (bothReady) return { tone: "ready" as const, text: "Ambos listos" };
    if (bothPresent) return { tone: "ready" as const, text: "Compa aquí" };
    return { tone: "muted" as const, text: "Esperando compañía" };
  })();

  const primaryCta = (() => {
    if (state === "loading") return { label: "Cargando…", action: undefined, disabled: true, variant: "magenta" as const };
    if (!armed) return { label: "Estoy listo", action: handleArm, disabled: false, variant: "magenta" as const };
    if (!sync.configured) return null;
    if (!bothPresent)
      return { label: "Esperando que entre tu compa", action: undefined, disabled: true, variant: "magenta" as const };
    if (!otherReady)
      return { label: "Esperando que esté listo", action: undefined, disabled: true, variant: "magenta" as const };
    return null;
  })();

  return (
    <main
      style={{
        flex: 1,
        position: "relative",
        display: "flex",
        flexDirection: "column",
        minHeight: "100dvh",
        overflow: "hidden",
      }}
    >
      <div className={atmosClass} />
      <div className="grain" />

      {/* ── Top bar ── */}
      <div
        style={{
          position: "relative",
          zIndex: 12,
          padding: "20px 22px 4px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <a
          href="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            color: "var(--muted)",
            textDecoration: "none",
            transition: "color .2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--cyan)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted)")}
        >
          <span style={{ fontSize: 16 }}>←</span>
          <VesrWordmarkMono size={14} tracking={0.22} />
        </a>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={handleCopy}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 10px 6px 12px",
              borderRadius: 999,
              border: "1px solid var(--border)",
              background: "rgba(14,14,19,0.6)",
              backdropFilter: "blur(10px)",
              cursor: "pointer",
              transition: "all .2s",
            }}
            aria-label={copied ? "Link copiado" : "Copiar link de la sala"}
          >
            <span
              className="mono"
              style={{
                fontSize: 11,
                color: "var(--foreground)",
                letterSpacing: "0.06em",
              }}
            >
              {roomId}
            </span>
            <span
              style={{
                width: 26,
                height: 22,
                borderRadius: 6,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                background: copied ? "rgba(0,240,255,0.15)" : "rgba(255,255,255,0.04)",
                color: copied ? "var(--cyan)" : "var(--muted)",
                transition: "all .2s",
              }}
            >
              {copied ? Icon.check : Icon.copy}
            </span>
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <PresenceDot color="cyan" pulse size={7} />
            <PresenceDot
              color={bothPresent ? (otherReady ? "magenta" : "magenta") : "muted"}
              pulse={bothPresent}
              size={7}
            />
          </div>
        </div>
      </div>

      {/* ── Main column ── */}
      <div
        style={{
          position: "relative",
          zIndex: 5,
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "24px 22px 80px",
          width: "100%",
          maxWidth: 560,
          margin: "0 auto",
        }}
      >
        {/* Player iframe — mounted once. Visibility toggles via CSS so the ref + sync stay alive. */}
        <div
          style={{
            width: "100%",
            maxWidth: 480,
            marginBottom: showPlayer ? 18 : 0,
            position: showPlayer ? "relative" : "absolute",
            opacity: showPlayer ? 1 : 0,
            pointerEvents: showPlayer ? "auto" : "none",
            height: showPlayer ? "auto" : 1,
            overflow: "hidden",
            zIndex: showPlayer ? 1 : -1,
          }}
          aria-hidden={!showPlayer}
        >
          <div
            style={{
              borderRadius: 14,
              overflow: "hidden",
              border: "1px solid var(--border)",
              background: "#000",
              aspectRatio: "16/9",
            }}
          >
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
        </div>

        {/* Hero artwork — visible when player is hidden */}
        {!showPlayer && (
          <ArtworkHero
            size={280}
            ring={ring}
            dim={!armed || state === "paused"}
            frozen={state === "paused"}
            sourceType={source.type}
          />
        )}

        {/* Track meta */}
        <div style={{ textAlign: "center", margin: "22px 0 18px" }}>
          <div
            style={{
              fontSize: 20,
              fontWeight: 500,
              letterSpacing: "-0.02em",
              color: "var(--foreground)",
            }}
          >
            {source.type === "youtube" ? "Set de YouTube" : "Set de SoundCloud"}
          </div>
          <div
            style={{
              fontSize: 12,
              color: "var(--muted)",
              marginTop: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
            }}
          >
            <SourceBadge source={source.type} />
            <button
              onClick={() => setShowPlayer((v) => !v)}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--muted)",
                fontSize: 11,
                cursor: "pointer",
                textDecoration: "underline",
                textUnderlineOffset: 3,
                textDecorationColor: "rgba(138,138,153,0.3)",
              }}
            >
              {showPlayer ? "Ocultar video" : "Mostrar video"}
            </button>
          </div>
        </div>

        {/* Visualizer */}
        <div style={{ width: "100%", height: 60, marginBottom: 16 }}>
          <Visualizer bars={32} frozen={!isPlaying} seed={3} height="100%" />
        </div>

        {/* Progress */}
        <div style={{ width: "100%", marginBottom: 8 }}>
          <ProgressBar
            position={position}
            duration={duration}
            onSeek={handleSeek}
            disabled={!canControl}
          />
        </div>
        <div
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 22,
          }}
        >
          <LcdReadout>{fmt(position)}</LcdReadout>
          <LcdReadout color="#ff8edb">{fmt(duration)}</LcdReadout>
        </div>

        {/* Transport */}
        {primaryCta ? (
          <button
            onClick={primaryCta.action}
            disabled={primaryCta.disabled}
            className={"btn " + (primaryCta.disabled ? "btn-disabled" : "btn-magenta-filled")}
            style={{
              width: "100%",
              maxWidth: 360,
              padding: "20px",
              borderRadius: 16,
              fontSize: 16,
              fontWeight: 500,
            }}
          >
            {primaryCta.label}
          </button>
        ) : (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 22,
              marginBottom: 4,
            }}
          >
            <RoundBtn
              size={52}
              dim={!canControl}
              onClick={() => handleSeek(Math.max(0, position - 10))}
              ariaLabel="Atrás 10 segundos"
              disabled={!canControl}
            >
              −10s
            </RoundBtn>
            <PlayButton
              isPlaying={isPlaying}
              onClick={isPlaying ? handlePause : handlePlay}
              disabled={!canControl}
            />
            <RoundBtn
              size={52}
              dim={!canControl}
              onClick={() => handleSeek(Math.min(duration, position + 10))}
              ariaLabel="Adelante 10 segundos"
              disabled={!canControl}
            >
              +10s
            </RoundBtn>
          </div>
        )}

        {/* Status pill */}
        <div style={{ marginTop: 22, display: "flex", justifyContent: "center" }}>
          <StatusPill tone={syncStatus.tone}>{syncStatus.text}</StatusPill>
        </div>

        {!sync.configured && (
          <p
            style={{
              marginTop: 14,
              fontSize: 11,
              color: "var(--magenta)",
              textAlign: "center",
              maxWidth: 360,
              lineHeight: 1.5,
            }}
          >
            ⚠ Falta configurar Supabase. La sincronización está deshabilitada.
          </p>
        )}
      </div>

      <Credit />
    </main>
  );
}

function ArtworkHero({
  size,
  ring,
  dim,
  frozen,
  sourceType,
}: {
  size: number;
  ring: "magenta" | "bi" | "none";
  dim: boolean;
  frozen: boolean;
  sourceType: "youtube" | "soundcloud";
}) {
  const ringCls = ring === "magenta" ? "ring-pulse-m" : ring === "bi" ? "ring-pulse-bi" : "";
  return (
    <div style={{ width: size, height: size, position: "relative", borderRadius: 16 }}>
      <div
        className={"artwork " + (sourceType === "soundcloud" ? "artwork-alt " : "") + ringCls}
        style={{
          width: "100%",
          height: "100%",
          opacity: dim ? 0.6 : 1,
          filter: frozen ? "saturate(0.7) brightness(0.85)" : "none",
          transition: "all .4s",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: "18%",
            borderRadius: "50%",
            border: "1px solid rgba(255,255,255,0.15)",
            boxShadow: "inset 0 0 40px rgba(255,255,255,0.04)",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: "32%",
            borderRadius: "50%",
            background: "rgba(255,255,255,0.06)",
            backdropFilter: "blur(20px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            fontWeight: 700,
            fontSize: size * 0.06,
            letterSpacing: "0.3em",
            color: "rgba(255,255,255,0.9)",
            textShadow: "0 0 12px rgba(255,255,255,0.6)",
          }}
        >
          VESR
        </div>
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
