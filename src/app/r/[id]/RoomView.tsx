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

  const handleShareWhatsApp = useCallback(() => {
    const url = window.location.href;
    const text = `¡Vamos a escuchar esto juntos en VESR! 🎧\n\n${url}\n\nAbrí el link y dale a "Estoy listo". Cuando los dos estemos listos, le doy play y arrancamos al mismo tiempo.`;
    const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(waUrl, "_blank", "noopener,noreferrer");
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

        {/* ── Share card — visible mientras estés solo ── */}
        {!bothPresent && sync.configured && (
          <div
            style={{
              width: "100%",
              maxWidth: 420,
              padding: "18px 18px 16px",
              borderRadius: 16,
              background: "linear-gradient(180deg, rgba(0,240,255,0.06), rgba(255,43,181,0.04))",
              border: "1px solid rgba(0,240,255,0.25)",
              boxShadow: "0 0 40px -10px rgba(0,240,255,0.3)",
              marginBottom: 22,
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: 11,
                color: "var(--muted)",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                marginBottom: 4,
              }}
            >
              Comparte con tu compa
            </div>
            <div
              style={{
                fontSize: 14,
                color: "var(--foreground)",
                marginBottom: 14,
                lineHeight: 1.4,
              }}
            >
              Tu amigo entra al mismo link y arrancan juntos
            </div>

            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              <button
                onClick={handleShareWhatsApp}
                className="btn"
                style={{
                  flex: 1,
                  padding: "14px",
                  borderRadius: 12,
                  fontSize: 14,
                  fontWeight: 500,
                  background: "linear-gradient(180deg, #25D366 0%, #128C7E 100%)",
                  color: "#fff",
                  border: "1px solid rgba(255,255,255,0.18)",
                  boxShadow: "0 0 20px rgba(37, 211, 102, 0.35), inset 0 1px 0 rgba(255,255,255,0.25)",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  cursor: "pointer",
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                Compartir por WhatsApp
              </button>
            </div>

            <button
              onClick={handleCopy}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 10,
                background: "rgba(255,255,255,0.03)",
                border: "1px solid var(--border)",
                color: copied ? "var(--cyan)" : "var(--muted)",
                fontSize: 12,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                transition: "all .2s",
              }}
            >
              {copied ? Icon.check : Icon.copy}
              {copied ? "¡Link copiado!" : "Copiar link"}
            </button>
          </div>
        )}

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

        {/* ── Diagnóstico ── */}
        <div
          style={{
            marginTop: 14,
            padding: "10px 14px",
            borderRadius: 10,
            background: "rgba(14,14,19,0.5)",
            border: "1px solid var(--border)",
            fontSize: 10,
            color: "var(--muted)",
            fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
            letterSpacing: "0.04em",
            display: "flex",
            gap: 14,
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          <span>
            supabase:{" "}
            <span style={{ color: sync.configured ? "var(--cyan)" : "var(--magenta)" }}>
              {sync.configured ? "ok" : "off"}
            </span>
          </span>
          <span>
            canal:{" "}
            <span
              style={{
                color:
                  sync.connection === "joined"
                    ? "var(--cyan)"
                    : sync.connection === "error"
                    ? "var(--magenta)"
                    : "#ffd47a",
              }}
            >
              {sync.connection}
            </span>
          </span>
          <span>
            peers: <span style={{ color: "var(--foreground)" }}>{sync.peers.length}</span>
          </span>
          <span>
            yo: <span style={{ color: "var(--foreground)" }}>{sync.selfId.slice(0, 6)}</span>
          </span>
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

        {sync.configured && sync.connection === "error" && (
          <p
            style={{
              marginTop: 12,
              fontSize: 11,
              color: "#ff9090",
              textAlign: "center",
              maxWidth: 360,
              lineHeight: 1.5,
            }}
          >
            ⚠ Realtime no conectó. Posibles causas:
            <br />
            1) Realtime deshabilitado en el proyecto Supabase.
            <br />
            2) Política de WebSocket bloqueada (CSP / red).
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
