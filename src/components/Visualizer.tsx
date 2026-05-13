"use client";

const BARS = 32;
// Pre-computed irregular delays so each bar dances on its own beat.
const DELAYS = Array.from({ length: BARS }, (_, i) =>
  (((i * 137) % 100) / 100).toFixed(2),
);
const DURATIONS = Array.from({ length: BARS }, (_, i) =>
  (0.6 + (((i * 61) % 50) / 100)).toFixed(2),
);

export function Visualizer({ active }: { active: boolean }) {
  return (
    <div className="flex items-end justify-center gap-[3px] h-16">
      {Array.from({ length: BARS }).map((_, i) => (
        <span
          key={i}
          className="bar"
          style={{
            height: "100%",
            animation: active
              ? `bar-wave ${DURATIONS[i]}s ease-in-out infinite ${DELAYS[i]}s`
              : "none",
            opacity: active ? 1 : 0.25,
            transition: "opacity 0.4s ease",
            transform: active ? undefined : "scaleY(0.15)",
          }}
        />
      ))}
    </div>
  );
}
