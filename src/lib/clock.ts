/**
 * NTP-like clock offset between this client and our /api/time endpoint.
 * Both clients calibrate against the same endpoint, so they can exchange
 * "server-time" timestamps and convert them back to their local clocks
 * with consistent precision.
 */

const SAMPLES = 5;

export interface ClockSync {
  /** serverTime = localTime + offset */
  offset: number;
  /** Estimated round-trip-time / 2 in ms — useful as confidence indicator. */
  uncertainty: number;
}

async function sampleOnce(): Promise<{ offset: number; rttHalf: number } | null> {
  const t0 = Date.now();
  let res: Response;
  try {
    res = await fetch("/api/time", { cache: "no-store" });
  } catch {
    return null;
  }
  const t2 = Date.now();
  if (!res.ok) return null;
  const { t: t1 } = (await res.json()) as { t: number };
  // Assume symmetric latency: server time at midpoint of t0..t2 was t1.
  const offset = t1 - (t0 + t2) / 2;
  const rttHalf = (t2 - t0) / 2;
  return { offset, rttHalf };
}

export async function measureClock(): Promise<ClockSync> {
  const samples: Array<{ offset: number; rttHalf: number }> = [];
  for (let i = 0; i < SAMPLES; i++) {
    const s = await sampleOnce();
    if (s) samples.push(s);
  }
  if (samples.length === 0) {
    return { offset: 0, uncertainty: Infinity };
  }
  // Pick the sample with the smallest RTT — it has the least asymmetry error.
  samples.sort((a, b) => a.rttHalf - b.rttHalf);
  const best = samples[0];
  return { offset: best.offset, uncertainty: best.rttHalf };
}

/** Convert a server-time timestamp to local milliseconds-since-epoch. */
export function serverToLocal(serverMs: number, sync: ClockSync): number {
  return serverMs - sync.offset;
}

/** Current server time in ms, derived from our local clock + offset. */
export function nowServer(sync: ClockSync): number {
  return Date.now() + sync.offset;
}
