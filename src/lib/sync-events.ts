/** Realtime broadcast event payloads for room sync. */

export type SyncEvent =
  | {
      type: "play";
      /** Server-time ms at which playback should resume. */
      serverStartAt: number;
      /** Track position in seconds at serverStartAt. */
      position: number;
      /** ID of the sender, to ignore our own echo. */
      from: string;
    }
  | {
      type: "pause";
      /** Server-time ms at which playback was paused. */
      serverAt: number;
      /** Track position in seconds. */
      position: number;
      from: string;
    }
  | {
      type: "seek";
      /** Server-time ms at which seek was applied. */
      serverAt: number;
      position: number;
      /** Whether the player was playing when the seek happened. */
      playing: boolean;
      from: string;
    }
  | {
      type: "state-request";
      from: string;
    }
  | {
      type: "state";
      playing: boolean;
      /** Server-time ms reference for the position. */
      serverAt: number;
      position: number;
      from: string;
    };

export const BROADCAST_EVENT = "sync";
export const ROOM_CHANNEL_PREFIX = "room:";
