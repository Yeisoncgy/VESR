type Props = {
  size?: number;
  ring?: "magenta" | "bi" | "none";
  dim?: boolean;
  frozen?: boolean;
  label?: string;
};

export function Artwork({ size = 240, ring = "magenta", dim = false, frozen = false, label }: Props) {
  const ringCls =
    ring === "magenta" ? "ring-pulse-m" : ring === "bi" ? "ring-pulse-bi" : "";
  return (
    <div style={{ width: size, height: size, position: "relative", borderRadius: 16 }}>
      <div
        className={"artwork " + ringCls}
        style={{
          width: "100%",
          height: "100%",
          opacity: dim ? 0.55 : 1,
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
        {label && (
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
              fontWeight: 700,
              fontSize: size * 0.055,
              letterSpacing: "0.3em",
              color: "rgba(255,255,255,0.85)",
              textShadow: "0 0 12px rgba(255,255,255,0.6)",
              textTransform: "uppercase",
              whiteSpace: "nowrap",
            }}
          >
            {label}
          </div>
        )}
      </div>
    </div>
  );
}
