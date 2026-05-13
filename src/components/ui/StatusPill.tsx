type Props = {
  children: React.ReactNode;
  tone?: "live" | "ready" | "warn" | "muted";
};

const TONES = {
  live: { c: "#5cffea", border: "rgba(0,240,255,0.4)", bg: "rgba(0,240,255,0.06)", dot: "#00f0ff" },
  ready: { c: "#ffb3e3", border: "rgba(255,43,181,0.4)", bg: "rgba(255,43,181,0.06)", dot: "#ff2bb5" },
  warn: { c: "#ffd47a", border: "rgba(255,200,80,0.4)", bg: "rgba(255,200,80,0.05)", dot: "#ffc850" },
  muted: { c: "#8a8a99", border: "var(--border)", bg: "rgba(255,255,255,0.02)", dot: "#3a3a4a" },
} as const;

export function StatusPill({ children, tone = "live" }: Props) {
  const t = TONES[tone];
  return (
    <span
      className="mono"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        padding: "5px 10px",
        borderRadius: 999,
        border: `1px solid ${t.border}`,
        background: t.bg,
        color: t.c,
        fontSize: 10,
        letterSpacing: "0.06em",
        textShadow: `0 0 8px ${t.c}55`,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: 3,
          background: t.dot,
          boxShadow: `0 0 8px ${t.dot}`,
        }}
      />
      {children}
    </span>
  );
}

type SourceBadgeProps = { source: "youtube" | "soundcloud" };

export function SourceBadge({ source }: SourceBadgeProps) {
  const color = source === "youtube" ? "#ff3939" : "#ff7700";
  const label = source === "youtube" ? "YouTube" : "SoundCloud";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "3px 8px",
        borderRadius: 999,
        background: "rgba(255,255,255,0.04)",
        border: "1px solid var(--border)",
        fontSize: 10,
        color: "var(--muted)",
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        fontWeight: 500,
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: 1, background: color }} />
      {label}
    </span>
  );
}
