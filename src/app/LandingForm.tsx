"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { parseSourceUrl } from "@/lib/sources";
import { newRoomId } from "@/lib/room-id";
import { Icon } from "@/components/ui/Icon";
import { SourceBadge } from "@/components/ui/StatusPill";

export function LandingForm() {
  const [value, setValue] = useState("");
  const [touched, setTouched] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const parsed = useMemo(() => (value.trim() ? parseSourceUrl(value) : null), [value]);
  const isInvalid = touched && value.trim().length > 0 && !parsed;
  const isValid = !!parsed;

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!parsed) return;
    const id = newRoomId();
    const params = new URLSearchParams({ src: parsed.url, t: parsed.type });
    startTransition(() => {
      router.push(`/r/${id}?${params.toString()}`);
    });
  }

  return (
    <form onSubmit={onSubmit}>
      <div style={{ position: "relative", marginBottom: 12 }}>
        <div
          style={{
            position: "absolute",
            left: 18,
            top: "50%",
            transform: "translateY(-50%)",
            color: isValid ? "var(--cyan)" : isInvalid ? "#ff5050" : "var(--muted)",
            zIndex: 2,
            transition: "color .2s",
            pointerEvents: "none",
          }}
        >
          {Icon.link}
        </div>
        <input
          type="url"
          inputMode="url"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          placeholder="Pega un link de YouTube o SoundCloud"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            if (touched) setTouched(false);
          }}
          onBlur={() => setTouched(true)}
          className={"vesr-input" + (isValid ? " valid" : isInvalid ? " invalid" : "")}
          style={{ paddingRight: isValid ? 56 : 18 }}
        />
        {isValid && (
          <div
            style={{
              position: "absolute",
              right: 14,
              top: "50%",
              transform: "translateY(-50%)",
              width: 28,
              height: 28,
              borderRadius: 8,
              background: "rgba(0,240,255,0.12)",
              color: "var(--cyan)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {Icon.check}
          </div>
        )}
      </div>

      {isValid && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: 12,
            borderRadius: 12,
            background: "rgba(14,14,19,0.5)",
            border: "1px solid var(--border)",
            marginBottom: 18,
            animation: "fadein .2s ease-out",
          }}
        >
          <div
            className={parsed!.type === "youtube" ? "artwork" : "artwork artwork-alt"}
            style={{ width: 44, height: 44, borderRadius: 8, flexShrink: 0 }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: "var(--foreground)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              Listo para sincronizar
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
              <SourceBadge source={parsed!.type} />
              <span className="mono" style={{ fontSize: 10, color: "var(--muted)" }}>
                listo
              </span>
            </div>
          </div>
        </div>
      )}

      {isInvalid && (
        <div
          style={{
            fontSize: 12,
            color: "#ff8080",
            paddingLeft: 4,
            marginBottom: 18,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span style={{ color: "#ff5050" }}>{Icon.warn}</span>
          No reconozco este link. Probá con YouTube o SoundCloud.
        </div>
      )}

      <button
        type="submit"
        disabled={isPending || !parsed}
        className={"btn " + (parsed ? "btn-primary" : "btn-disabled")}
        style={{
          padding: "20px",
          borderRadius: 16,
          fontSize: 16,
          fontWeight: 500,
          width: "100%",
        }}
      >
        {isPending ? "Creando sala…" : "Crear sala"}
        {parsed && !isPending && (
          <span style={{ marginLeft: 4, opacity: 0.85 }}>{Icon.arrow}</span>
        )}
      </button>

      <p
        style={{
          marginTop: 18,
          fontSize: 11,
          color: "var(--muted)",
          lineHeight: 1.6,
        }}
      >
        Tip: en celular deja la app abierta y la pantalla prendida mientras escuchan.
        Bloquearla pausa el reproductor (límite del navegador).
      </p>
    </form>
  );
}
