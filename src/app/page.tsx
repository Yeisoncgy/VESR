import { LandingForm } from "./LandingForm";
import { VesrWordmark } from "@/components/ui/Wordmark";
import { Credit } from "@/components/ui/Credit";

export default function Home() {
  return (
    <main
      style={{
        flex: 1,
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "80px 24px 60px",
        minHeight: "100dvh",
        overflow: "hidden",
      }}
    >
      <div className="atmos" />
      <div className="grain" />

      <div style={{ position: "relative", zIndex: 5, width: "100%", maxWidth: 460 }}>
        <header
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginBottom: 40,
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              width: 320,
              height: 320,
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(0,240,255,0.22) 0%, transparent 50%), radial-gradient(circle at 70% 70%, rgba(255,43,181,0.2) 0%, transparent 60%)",
              filter: "blur(20px)",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              pointerEvents: "none",
            }}
          />

          <div className="pill" style={{ marginBottom: 18, position: "relative" }}>
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                background: "var(--cyan)",
                boxShadow: "0 0 10px var(--cyan)",
              }}
            />
            beta · solo para yeison & jafet
          </div>

          <div style={{ position: "relative" }}>
            <VesrWordmark size={72} tracking={0.22} />
          </div>

          <div
            style={{
              marginTop: 16,
              fontSize: 13,
              color: "var(--muted)",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              textAlign: "center",
            }}
          >
            Mismo kick · diferente cuarto
          </div>

          <p
            style={{
              marginTop: 18,
              fontSize: 14,
              color: "var(--muted)",
              lineHeight: 1.6,
              textAlign: "center",
              maxWidth: 360,
            }}
          >
            Pega un link de YouTube o SoundCloud. Comparte la sala. Los dos le dan play
            al tiempo, automático.
          </p>
        </header>

        <LandingForm />
      </div>

      <Credit />
    </main>
  );
}
