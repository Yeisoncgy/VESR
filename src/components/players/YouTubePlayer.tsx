"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";

export interface PlayerHandle {
  play: () => Promise<void>;
  pause: () => Promise<void>;
  seekTo: (seconds: number) => Promise<void>;
  getCurrentTime: () => Promise<number>;
  getDuration: () => Promise<number>;
}

interface YouTubePlayerProps {
  videoId: string;
  onReady?: () => void;
  onStateChange?: (state: "playing" | "paused" | "ended") => void;
}

// Minimal typing for the YT IFrame API we use.
interface YtPlayer {
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  destroy: () => void;
}
interface YtNamespace {
  Player: new (
    el: HTMLElement,
    options: {
      videoId: string;
      host?: string;
      playerVars?: Record<string, unknown>;
      events?: {
        onReady?: () => void;
        onStateChange?: (e: { data: number }) => void;
      };
    },
  ) => YtPlayer;
  PlayerState: { PLAYING: number; PAUSED: number; ENDED: number };
}

declare global {
  interface Window {
    YT?: YtNamespace;
    onYouTubeIframeAPIReady?: () => void;
    __ytApiLoading?: Promise<void>;
  }
}

function loadYtApi(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.YT && window.YT.Player) return Promise.resolve();
  if (window.__ytApiLoading) return window.__ytApiLoading;

  window.__ytApiLoading = new Promise<void>((resolve) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve();
    };
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.body.appendChild(tag);
  });
  return window.__ytApiLoading;
}

export const YouTubePlayer = forwardRef<PlayerHandle, YouTubePlayerProps>(
  function YouTubePlayer({ videoId, onReady, onStateChange }, ref) {
    const hostRef = useRef<HTMLDivElement | null>(null);
    const playerRef = useRef<YtPlayer | null>(null);
    const [, setIsReady] = useState(false);

    useEffect(() => {
      let cancelled = false;

      (async () => {
        await loadYtApi();
        if (cancelled || !hostRef.current || !window.YT) return;
        playerRef.current = new window.YT.Player(hostRef.current, {
          videoId,
          host: "https://www.youtube-nocookie.com",
          playerVars: {
            playsinline: 1,
            modestbranding: 1,
            rel: 0,
            controls: 0,
            disablekb: 1,
            iv_load_policy: 3,
            fs: 0,
          },
          events: {
            onReady: () => {
              setIsReady(true);
              onReady?.();
            },
            onStateChange: (e) => {
              if (!window.YT) return;
              const s = e.data;
              if (s === window.YT.PlayerState.PLAYING) onStateChange?.("playing");
              else if (s === window.YT.PlayerState.PAUSED) onStateChange?.("paused");
              else if (s === window.YT.PlayerState.ENDED) onStateChange?.("ended");
            },
          },
        });
      })();

      return () => {
        cancelled = true;
        try {
          playerRef.current?.destroy();
        } catch {
          /* ignore */
        }
        playerRef.current = null;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [videoId]);

    useImperativeHandle(
      ref,
      (): PlayerHandle => ({
        play: async () => {
          playerRef.current?.playVideo();
        },
        pause: async () => {
          playerRef.current?.pauseVideo();
        },
        seekTo: async (seconds: number) => {
          playerRef.current?.seekTo(seconds, true);
        },
        getCurrentTime: async () => playerRef.current?.getCurrentTime() ?? 0,
        getDuration: async () => playerRef.current?.getDuration() ?? 0,
      }),
      [],
    );

    return <div ref={hostRef} className="size-full" />;
  },
);
