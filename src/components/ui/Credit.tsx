export function Credit({ position = "bottom" }: { position?: "bottom" | "inline" }) {
  if (position === "inline") {
    return (
      <span
        style={{
          fontSize: 9,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: "var(--muted)",
          opacity: 0.55,
        }}
      >
        <span style={{ opacity: 0.7 }}>Por</span>{" "}
        <span style={{ color: "var(--foreground)", opacity: 0.85 }}>Yeison Moreno</span>
      </span>
    );
  }
  return (
    <div
      style={{
        position: "absolute",
        bottom: 14,
        left: 0,
        right: 0,
        textAlign: "center",
        fontSize: 9,
        letterSpacing: "0.16em",
        textTransform: "uppercase",
        color: "var(--muted)",
        zIndex: 10,
        pointerEvents: "none",
        opacity: 0.55,
      }}
    >
      <span style={{ opacity: 0.7 }}>Desarrollado por</span>{" "}
      <span style={{ color: "var(--foreground)", opacity: 0.9 }}>Yeison Moreno</span>
    </div>
  );
}
