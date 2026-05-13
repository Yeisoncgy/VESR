export type SourceType = "youtube" | "soundcloud";

export interface ParsedSource {
  type: SourceType;
  /** Canonical URL we'll feed to the embed player. */
  url: string;
  /** YouTube video ID; undefined for SoundCloud. */
  youtubeId?: string;
  /** Display title fallback derived from the URL. */
  label: string;
}

const YT_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "music.youtube.com",
  "youtu.be",
]);

const SC_HOSTS = new Set([
  "soundcloud.com",
  "www.soundcloud.com",
  "m.soundcloud.com",
  "on.soundcloud.com",
]);

/** Returns a ParsedSource or null if the URL is not a recognized YT/SC link. */
export function parseSourceUrl(raw: string): ParsedSource | null {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return null;
  }

  const host = url.hostname.toLowerCase();

  if (YT_HOSTS.has(host)) {
    const id = extractYouTubeId(url);
    if (!id) return null;
    return {
      type: "youtube",
      url: `https://www.youtube.com/watch?v=${id}`,
      youtubeId: id,
      label: `YouTube · ${id}`,
    };
  }

  if (SC_HOSTS.has(host)) {
    return {
      type: "soundcloud",
      url: url.toString(),
      label: soundcloudLabel(url),
    };
  }

  return null;
}

function extractYouTubeId(url: URL): string | null {
  if (url.hostname === "youtu.be") {
    const id = url.pathname.replace(/^\//, "").split("/")[0];
    return isLikelyYtId(id) ? id : null;
  }
  // /watch?v=ID
  const v = url.searchParams.get("v");
  if (v && isLikelyYtId(v)) return v;
  // /embed/ID, /shorts/ID, /live/ID, /v/ID
  const m = url.pathname.match(/\/(?:embed|shorts|live|v)\/([^/?#]+)/);
  if (m && isLikelyYtId(m[1])) return m[1];
  return null;
}

function isLikelyYtId(id: string | undefined | null): id is string {
  return !!id && /^[A-Za-z0-9_-]{6,15}$/.test(id);
}

function soundcloudLabel(url: URL): string {
  const parts = url.pathname.split("/").filter(Boolean);
  if (parts.length >= 2) return `SoundCloud · ${parts[0]} / ${parts[1]}`;
  return `SoundCloud · ${url.pathname}`;
}
