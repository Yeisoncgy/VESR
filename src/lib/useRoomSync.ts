"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { customAlphabet } from "nanoid";
import { getSupabase, isSupabaseConfigured } from "./supabase";
import { measureClock, nowServer, type ClockSync } from "./clock";
import {
  BROADCAST_EVENT,
  ROOM_CHANNEL_PREFIX,
  type SyncEvent,
} from "./sync-events";

const peerId = customAlphabet("abcdefghjkmnpqrstuvwxyz23456789", 8)();

export interface RoomPeer {
  /** Peer id (random per browser tab). */
  id: string;
  ready: boolean;
  joinedAt: number;
}

export interface PlayerControls {
  play: () => Promise<void>;
  pause: () => Promise<void>;
  seekTo: (seconds: number) => Promise<void>;
  getCurrentTime: () => Promise<number>;
  isPlaying: () => boolean;
}

export interface UseRoomSyncOptions {
  roomId: string;
  controls: PlayerControls | null;
  /** True once the player has loaded and is ready to receive commands. */
  playerReady: boolean;
  /** True once the local user has tapped "Listo" (gesture for mobile autoplay). */
  armed: boolean;
}

export interface UseRoomSyncResult {
  configured: boolean;
  /** Connection lifecycle. */
  connection: "idle" | "connecting" | "joined" | "error";
  /** All peers currently in the room, including self. */
  peers: RoomPeer[];
  /** Self peer id. */
  selfId: string;
  /** Round-trip uncertainty (ms) — confidence of clock sync. */
  clockUncertainty: number;
  /** Broadcast a play action — schedules play in `delayMs` server-ms. */
  broadcastPlay: (positionSeconds: number, delayMs?: number) => Promise<void>;
  broadcastPause: (positionSeconds: number) => Promise<void>;
  broadcastSeek: (positionSeconds: number, playing: boolean) => Promise<void>;
  /** Set self ready / unready. */
  setReady: (ready: boolean) => Promise<void>;
}

export function useRoomSync({
  roomId,
  controls,
  playerReady,
  armed,
}: UseRoomSyncOptions): UseRoomSyncResult {
  const [connection, setConnection] = useState<UseRoomSyncResult["connection"]>("idle");
  const [peers, setPeers] = useState<RoomPeer[]>([]);
  const [clockSync, setClockSync] = useState<ClockSync>({ offset: 0, uncertainty: Infinity });

  const channelRef = useRef<RealtimeChannel | null>(null);
  const controlsRef = useRef<PlayerControls | null>(null);
  const armedRef = useRef(armed);
  const clockRef = useRef<ClockSync>({ offset: 0, uncertainty: Infinity });
  const scheduledTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep refs in sync.
  useEffect(() => {
    controlsRef.current = controls;
  }, [controls]);
  useEffect(() => {
    armedRef.current = armed;
  }, [armed]);
  useEffect(() => {
    clockRef.current = clockSync;
  }, [clockSync]);

  // Calibrate clock once player is ready (and every ~60s).
  useEffect(() => {
    if (!playerReady || !isSupabaseConfigured) return;
    let cancelled = false;
    const run = async () => {
      const sync = await measureClock();
      if (!cancelled) setClockSync(sync);
    };
    run();
    const id = setInterval(run, 60_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [playerReady]);

  // Apply an incoming sync event to the local player.
  const applyEvent = useCallback(async (evt: SyncEvent) => {
    if (evt.from === peerId) return;
    const ctrl = controlsRef.current;
    if (!ctrl) return;
    if (!armedRef.current) {
      // We haven't received user gesture yet. Mobile browsers will reject
      // programmatic play(). We still apply pause/seek which don't need gestures.
      if (evt.type === "pause") {
        await ctrl.pause();
        await ctrl.seekTo(evt.position);
      } else if (evt.type === "seek") {
        await ctrl.seekTo(evt.position);
      }
      return;
    }

    const offset = clockRef.current.offset;
    const localNow = Date.now();

    switch (evt.type) {
      case "play": {
        const localStartAt = evt.serverStartAt - offset;
        const delay = localStartAt - localNow;
        await ctrl.seekTo(evt.position);
        if (scheduledTimeoutRef.current) clearTimeout(scheduledTimeoutRef.current);
        const fire = () => ctrl.play();
        if (delay <= 0) {
          // Late — compensate by seeking forward.
          const compensation = -delay / 1000;
          await ctrl.seekTo(evt.position + compensation);
          fire();
        } else {
          scheduledTimeoutRef.current = setTimeout(fire, delay);
        }
        break;
      }
      case "pause": {
        await ctrl.pause();
        await ctrl.seekTo(evt.position);
        break;
      }
      case "seek": {
        await ctrl.seekTo(evt.position);
        if (evt.playing && !ctrl.isPlaying()) {
          await ctrl.play();
        } else if (!evt.playing && ctrl.isPlaying()) {
          await ctrl.pause();
        }
        break;
      }
      case "state": {
        // Late-join sync — match host's current position and play state.
        const elapsedServer = nowServer(clockRef.current) - evt.serverAt;
        const targetPosition = evt.position + (evt.playing ? elapsedServer / 1000 : 0);
        await ctrl.seekTo(Math.max(0, targetPosition));
        if (evt.playing) await ctrl.play();
        else await ctrl.pause();
        break;
      }
      case "state-request": {
        // Another peer asked for current state. Respond if we're playing.
        if (!controlsRef.current) return;
        const pos = await controlsRef.current.getCurrentTime();
        const channel = channelRef.current;
        if (!channel) return;
        const payload: SyncEvent = {
          type: "state",
          playing: controlsRef.current.isPlaying(),
          serverAt: nowServer(clockRef.current),
          position: pos,
          from: peerId,
        };
        channel.send({ type: "broadcast", event: BROADCAST_EVENT, payload });
        break;
      }
    }
  }, []);

  // Connect to the Supabase channel.
  useEffect(() => {
    if (!isSupabaseConfigured) {
      setConnection("idle");
      return;
    }
    const supabase = getSupabase();
    if (!supabase) return;

    setConnection("connecting");
    const channel = supabase.channel(`${ROOM_CHANNEL_PREFIX}${roomId}`, {
      config: {
        broadcast: { self: false, ack: false },
        presence: { key: peerId },
      },
    });

    channel.on("broadcast", { event: BROADCAST_EVENT }, ({ payload }) => {
      applyEvent(payload as SyncEvent);
    });

    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState() as Record<
        string,
        Array<{ ready?: boolean; joinedAt?: number }>
      >;
      const list: RoomPeer[] = Object.entries(state).map(([id, metas]) => {
        const meta = metas[0] ?? {};
        return {
          id,
          ready: Boolean(meta.ready),
          joinedAt: meta.joinedAt ?? Date.now(),
        };
      });
      setPeers(list);
    });

    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        setConnection("joined");
        await channel.track({ ready: false, joinedAt: Date.now() });
        // Ask whoever was here first for current state.
        const req: SyncEvent = { type: "state-request", from: peerId };
        channel.send({ type: "broadcast", event: BROADCAST_EVENT, payload: req });
      } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        setConnection("error");
      }
    });

    channelRef.current = channel;

    return () => {
      channelRef.current = null;
      supabase.removeChannel(channel);
      if (scheduledTimeoutRef.current) clearTimeout(scheduledTimeoutRef.current);
    };
  }, [roomId, applyEvent]);

  const broadcastPlay = useCallback(async (positionSeconds: number, delayMs = 1500) => {
    const channel = channelRef.current;
    if (!channel) return;
    const serverStartAt = nowServer(clockRef.current) + delayMs;
    const payload: SyncEvent = {
      type: "play",
      serverStartAt,
      position: positionSeconds,
      from: peerId,
    };
    await channel.send({ type: "broadcast", event: BROADCAST_EVENT, payload });
  }, []);

  const broadcastPause = useCallback(async (positionSeconds: number) => {
    const channel = channelRef.current;
    if (!channel) return;
    const payload: SyncEvent = {
      type: "pause",
      serverAt: nowServer(clockRef.current),
      position: positionSeconds,
      from: peerId,
    };
    await channel.send({ type: "broadcast", event: BROADCAST_EVENT, payload });
  }, []);

  const broadcastSeek = useCallback(async (positionSeconds: number, playing: boolean) => {
    const channel = channelRef.current;
    if (!channel) return;
    const payload: SyncEvent = {
      type: "seek",
      serverAt: nowServer(clockRef.current),
      position: positionSeconds,
      playing,
      from: peerId,
    };
    await channel.send({ type: "broadcast", event: BROADCAST_EVENT, payload });
  }, []);

  const setReady = useCallback(async (ready: boolean) => {
    const channel = channelRef.current;
    if (!channel) return;
    await channel.track({ ready, joinedAt: Date.now() });
  }, []);

  return {
    configured: isSupabaseConfigured,
    connection,
    peers,
    selfId: peerId,
    clockUncertainty: clockSync.uncertainty,
    broadcastPlay,
    broadcastPause,
    broadcastSeek,
    setReady,
  };
}
