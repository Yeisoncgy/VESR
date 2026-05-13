type Props = {
  size?: number;
  tracking?: number;
};

export function VesrWordmark({ size = 68, tracking = 0.22 }: Props) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        fontWeight: 600,
        fontSize: size,
        letterSpacing: `${tracking}em`,
        lineHeight: 1,
        background:
          "linear-gradient(120deg, #00f0ff 0%, #ededed 45%, #ff2bb5 100%)",
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        color: "transparent",
        filter: `drop-shadow(0 0 ${size * 0.25}px rgba(0,240,255,0.35)) drop-shadow(0 0 ${
          size * 0.25
        }px rgba(255,43,181,0.35))`,
      }}
    >
      VESR
    </div>
  );
}

export function VesrWordmarkMono({ size = 18, tracking = 0.22 }: Props) {
  return (
    <span
      style={{
        fontWeight: 600,
        fontSize: size,
        letterSpacing: `${tracking}em`,
        color: "var(--foreground)",
        textShadow: `0 0 ${size * 0.4}px rgba(237,237,237,0.35), 0 0 ${size * 0.15}px rgba(237,237,237,0.5)`,
      }}
    >
      VESR
    </span>
  );
}
