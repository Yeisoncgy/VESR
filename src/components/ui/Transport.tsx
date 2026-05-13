"use client";

import type { ReactNode } from "react";

type RoundBtnProps = {
  children: ReactNode;
  size?: number;
  dim?: boolean;
  onClick?: () => void;
  ariaLabel?: string;
  disabled?: boolean;
};

export function RoundBtn({ children, size = 52, dim = false, onClick, ariaLabel, disabled = false }: RoundBtnProps) {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      disabled={disabled}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: "rgba(255,255,255,0.03)",
        border: "1px solid var(--border)",
        color: "var(--foreground)",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
        fontSize: 11,
        fontWeight: 500,
        opacity: dim || disabled ? 0.4 : 1,
        cursor: dim || disabled ? "not-allowed" : "pointer",
        transition: "all .15s",
      }}
      onMouseEnter={(e) => {
        if (!dim && !disabled) {
          e.currentTarget.style.borderColor = "rgba(0,240,255,0.4)";
          e.currentTarget.style.color = "var(--cyan)";
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--border)";
        e.currentTarget.style.color = "var(--foreground)";
      }}
    >
      {children}
    </button>
  );
}

type PlayButtonProps = {
  isPlaying: boolean;
  onClick: () => void;
  disabled?: boolean;
  ariaLabel?: string;
};

export function PlayButton({ isPlaying, onClick, disabled = false, ariaLabel }: PlayButtonProps) {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel ?? (isPlaying ? "Pausar" : "Reproducir")}
      disabled={disabled}
      style={{
        width: 76,
        height: 76,
        borderRadius: "50%",
        background: disabled
          ? "rgba(255,255,255,0.04)"
          : isPlaying
          ? "linear-gradient(180deg, #ff48c0 0%, #d61c97 100%)"
          : "linear-gradient(180deg, #00f0ff 0%, #00b8ff 100%)",
        border: disabled ? "1px solid var(--border)" : "1px solid rgba(255,255,255,0.18)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: disabled
          ? "none"
          : isPlaying
          ? "0 0 36px rgba(255,43,181,0.5), inset 0 1px 0 rgba(255,255,255,0.35)"
          : "0 0 36px rgba(0,240,255,0.55), inset 0 1px 0 rgba(255,255,255,0.35)",
        color: "#fff",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.4 : 1,
        transition: "all .2s",
      }}
    >
      {isPlaying ? (
        <svg width="26" height="26" viewBox="0 0 22 22" fill="currentColor">
          <rect x="6" y="4" width="4" height="14" rx="1" />
          <rect x="12" y="4" width="4" height="14" rx="1" />
        </svg>
      ) : (
        <svg width="26" height="26" viewBox="0 0 22 22" fill="currentColor">
          <path d="M7 4.5v13a0.5 0.5 0 0 0 0.78 0.41l10-6.5a0.5 0.5 0 0 0 0-0.84l-10-6.5A0.5 0.5 0 0 0 7 4.5z" />
        </svg>
      )}
    </button>
  );
}
