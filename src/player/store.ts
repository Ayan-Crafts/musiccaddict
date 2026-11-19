import { create } from "zustand";

/**
 * Mirror of the Rust audio engine's state. The engine arrives in Phase 4; until
 * then this store stays idle and no control pretends to work. When the engine
 * exists, this store is updated only from `player://state` events.
 */
export interface NowPlaying {
  trackId: number;
  title: string;
  artist: string;
  album: string;
  artworkKey: string | null;
  codec: string | null;
  bitrateKbps: number | null;
  sampleRateHz: number | null;
  bitDepth: number | null;
}

export interface PlayerState {
  engineAvailable: boolean;
  status: "idle" | "playing" | "paused" | "buffering";
  track: NowPlaying | null;
  positionMs: number;
  durationMs: number;
  volume: number;
  shuffle: boolean;
  repeat: "off" | "all" | "one";
  outputDevice: string | null;
}

export const usePlayer = create<PlayerState>(() => ({
  engineAvailable: false,
  status: "idle",
  track: null,
  positionMs: 0,
  durationMs: 0,
  volume: 1,
  shuffle: false,
  repeat: "off",
  outputDevice: null,
}));
