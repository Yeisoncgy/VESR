"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import type { PlayerHandle } from "./YouTubePlayer";

interface SoundCloudPlayerProps {
  url: string;
  onReady?: () => void;
  onStateChange?: (state: "playing" | "paused" | "ended") => void;
}

interface ScWidget {
  bind: (event: string, cb: () => void) => void;
  play: () => void;
  pause: () => void;
  seekTo: (ms: number) => void;
  getPosition: (cb: (ms: number) => void) => void;
  getDuration: (cb: (ms: number) => void) => void;
}

interface ScNamespace {
  Widget: ((el: HTMLIFrameElement) => ScWidget) & {
    Events: {
      READY: string;
      PLAY: string;
      PAUSE: string;
      FINISH: string;
    };
  };
}

declare global {
  interface Window {
    SC?: ScNamespace;
    __scApiLoading?: Promise<void>;
  }
}

function loadScApi(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.SC) return Promise.resolve();
  if (window.__scApiLoading) return window.__scApiLoading;

  window.__scApiLoading = new Promise<void>((resolve) => {
    const tag = document.createElement("script");
    tag.src = "https://w.soundcloud.com/player/api.js";
    tag.onload = () => resolve();
    document.body.appendChild(tag);
  });
  return window.__scApiLoading;
}

export const SoundCloudPlayer = forwardRef<PlayerHandle, SoundCloudPlayerProps>(
  function SoundCloudPlayer({ url, onReady, onStateChange }, ref) {
    const iframeRef = useRef<HTMLIFrameElement | null>(null);
    const widgetRef = useRef<ScWidget | null>(null);
    const [, setIsReady] = useState(false);

    useEffect(() => {
      let cancelled = false;
      (async () => {
        await loadScApi();
        if (cancelled || !iframeRef.current || !window.SC) return;
        const widget = window.SC.Widget(iframeRef.current);
        widgetRef.current = widget;
        const E = window.SC.Widget.Events;
        widget.bind(E.READY, () => {
          setIsReady(true);
          onReady?.();
        });
        widget.bind(E.PLAY, () => onStateChange?.("playing"));
        widget.bind(E.PAUSE, () => onStateChange?.("paused"));
        widget.bind(E.FINISH, () => onStateChange?.("ended"));
      })();

      return () => {
        cancelled = true;
        widgetRef.current = null;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [url]);

    useImperativeHandle(
      ref,
      (): PlayerHandle => ({
        play: async () => widgetRef.current?.play(),
        pause: async () => widgetRef.current?.pause(),
        seekTo: async (seconds: number) => widgetRef.current?.seekTo(seconds * 1000),
        getCurrentTime: () =>
          new Promise<number>((resolve) => {
            const w = widgetRef.current;
            if (!w) return resolve(0);
            w.getPosition((ms) => resolve(ms / 1000));
          }),
        getDuration: () =>
          new Promise<number>((resolve) => {
            const w = widgetRef.current;
            if (!w) return resolve(0);
            w.getDuration((ms) => resolve(ms / 1000));
          }),
      }),
      [],
    );

    const embedUrl = `https://w.soundcloud.com/player/?url=${encodeURIComponent(
      url,
    )}&auto_play=false&hide_related=true&show_comments=false&show_user=false&show_reposts=false&visual=true&color=00f0ff`;

    return (
      <iframe
        ref={iframeRef}
        src={embedUrl}
        allow="autoplay"
        className="size-full border-0"
        title="SoundCloud player"
      />
    );
  },
);
