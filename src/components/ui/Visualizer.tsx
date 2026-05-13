"use client";

import { useMemo } from "react";

type Props = {
  bars?: number;
  frozen?: boolean;
  height?: number | string;
  seed?: number;
};

export function Visualizer({ bars = 32, frozen = false, height = 70, seed = 0 }: Props) {
  const arr = useMemo(
    () =>
      Array.from({ length: bars }).map((_, i) => {
        const s = Math.sin((i + seed) * 0.6) * 0.5 + 0.5;
        const t = Math.cos((i + seed) * 0.9) * 0.3 + 0.7;
        return {
          delay: -((i * 0.07 + seed * 0.1) % 1.4) + "s",
          duration: 1.0 + t * 0.6 + "s",
          freezeH: 0.18 + s * 0.7,
        };
      }),
    [bars, seed],
  );

  return (
    <div className={"viz" + (frozen ? " frozen" : "")} style={{ height }}>
      {arr.map((b, i) => (
        <div
          key={i}
          className="vbar"
          style={{
            animationDelay: b.delay,
            animationDuration: b.duration,
            height: "100%",
            transform: frozen ? `scaleY(${b.freezeH})` : undefined,
          }}
        />
      ))}
    </div>
  );
}
