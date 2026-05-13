"use client";

type Props = {
  position: number;
  duration: number;
  onSeek?: (s: number) => void;
  disabled?: boolean;
  glow?: boolean;
};

export function ProgressBar({ position, duration, onSeek, disabled = false, glow = true }: Props) {
  const pct = duration > 0 ? Math.min(100, (position / duration) * 100) : 0;
  return (
    <div
      role="slider"
      aria-valuemin={0}
      aria-valuemax={duration}
      aria-valuenow={position}
      tabIndex={disabled ? -1 : 0}
      onClick={(e) => {
        if (disabled || duration <= 0 || !onSeek) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const ratio = (e.clientX - rect.left) / rect.width;
        onSeek(ratio * duration);
      }}
      style={{
        position: "relative",
        height: 3,
        width: "100%",
        background: "rgba(255,255,255,0.06)",
        borderRadius: 2,
        overflow: "visible",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: pct + "%",
          background: "linear-gradient(90deg, #00f0ff 0%, #ff2bb5 100%)",
          borderRadius: 2,
          boxShadow: glow ? "0 0 12px rgba(0,240,255,0.6), 0 0 6px rgba(255,43,181,0.6)" : "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: pct + "%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          width: 10,
          height: 10,
          borderRadius: 5,
          background: "#fff",
          boxShadow: "0 0 12px rgba(255,255,255,0.9), 0 0 4px #ff2bb5",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}

type LcdProps = {
  children: React.ReactNode;
  color?: string;
  size?: number;
};

export function LcdReadout({ children, color = "#5cffea", size = 11 }: LcdProps) {
  return (
    <span
      className="mono"
      style={{
        fontSize: size,
        color,
        letterSpacing: "0.06em",
        textShadow: `0 0 6px ${color}88`,
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {children}
    </span>
  );
}
