import type { IconName } from "../components/ui/Icon";

export type RouteId =
  | "home" | "now-playing" | "statistics"
  | "songs" | "albums" | "artists" | "genres" | "playlists"
  | "spotify" | "import" | "acquisition" | "masstamilan"
  | "audio-lab" | "together" | "devices"
  | "themes" | "settings";

export type RouteGroup = "Listen" | "Library" | "Sources" | "Studio" | "You";

export interface RouteMeta {
  id: RouteId;
  label: string;
  group: RouteGroup;
  icon: IconName;
  /** Roadmap phase in which the screen becomes functional. */
  phase: number;
  summary: string;
  /** What the finished screen will do. Shown on placeholder screens. */
  plan?: string[];
}

export const ROUTES: RouteMeta[] = [
  { id: "home", label: "Home", group: "Listen", icon: "home", phase: 1, summary: "Your listening at a glance." },
  { id: "now-playing", label: "Now Playing", group: "Listen", icon: "nowPlaying", phase: 4, summary: "Full-screen player with artwork, queue and visualiser.",
    plan: ["Large artwork and cinematic layout per theme", "Live queue with drag-to-reorder", "Audio-quality badge: codec, bitrate, sample rate, bit depth", "Mini and full-screen modes"] },
  { id: "statistics", label: "Statistics", group: "Listen", icon: "chart", phase: 10, summary: "Where your listening time goes.",
    plan: ["Top tracks, albums and artists by period", "Listening time by hour and weekday", "Skip rates and rediscoveries", "All computed locally — nothing leaves your device"] },

  { id: "songs", label: "Songs", group: "Library", icon: "music", phase: 2, summary: "Every track in your library.",
    plan: ["Virtualised list for 10,000+ tracks", "Instant search by title, artist, album, genre, year and format", "Grid, list and compact views", "Multi-select, bulk tag editing and bulk playlist actions"] },
  { id: "albums", label: "Albums", group: "Library", icon: "disc", phase: 2, summary: "Your collection, cover by cover.",
    plan: ["Cached artwork grid", "Disc-aware track listing", "Sort by artist, year or recently added"] },
  { id: "artists", label: "Artists", group: "Library", icon: "mic", phase: 2, summary: "Browse by the people behind the music.",
    plan: ["Primary and featured artists handled separately", "Discography by album and year"] },
  { id: "genres", label: "Genres", group: "Library", icon: "tag", phase: 2, summary: "Explore by style and mood.",
    plan: ["Genres from your tags, normalised and mergeable"] },
  { id: "playlists", label: "Playlist Studio", group: "Library", icon: "list", phase: 2, summary: "Create, curate and automate playlists.",
    plan: ["Manual playlists with drag-to-reorder", "Smart playlists by artist, album, genre, year, plays, format, favourites", "Turn any playlist into a radio station", "Backup, restore, import and export"] },

  { id: "spotify", label: "Spotify", group: "Sources", icon: "link", phase: 3, summary: "Import your Spotify library as metadata.",
    plan: ["Secure OAuth (PKCE) — no client secret on your device", "Imports saved tracks, albums, artists and playlists (metadata only)", "Matches every track against your local files", "Dashboard: available, missing, unmatched and duplicate tracks"] },
  { id: "import", label: "Import Music", group: "Sources", icon: "import", phase: 2, summary: "Add folders and files you own.",
    plan: ["Choose library folders; incremental background scanning", "Drag-and-drop file import", "Automatic identification and playlist association"] },
  { id: "acquisition", label: "Acquisition Centre", group: "Sources", icon: "download", phase: 8, summary: "What you have, what's missing, and what needs attention.",
    plan: ["Statuses: available, missing, multiple matches, needs verification, unsupported, below preferred quality", "Review and confirm ambiguous matches", "Honest quality reporting — upscaled files are flagged, never relabelled"] },
  { id: "masstamilan", label: "MassTamilan", group: "Sources", icon: "compass", phase: 8, summary: "Tamil music discovery via the official site.",
    plan: ["Opens the official website in your browser for manual discovery", "Import files you have separately obtained and are authorised to use", "Automatic identification and playlist matching after import", "No scraping, crawling or automated downloads — automated integration stays disabled unless written permission is recorded"] },

  { id: "audio-lab", label: "Audio Lab", group: "Studio", icon: "wave", phase: 5, summary: "Shape the sound — or leave it bit-perfect.",
    plan: ["10-band and parametric EQ with presets", "Bass, treble, balance, ReplayGain, limiter", "Output device, sample rate, buffer and exclusive mode", "Spectrum, waveform and audio-reactive visualisers"] },
  { id: "together", label: "Together Mode", group: "Studio", icon: "users", phase: 6, summary: "Two listeners, one song, perfectly in sync.",
    plan: ["Dual output: route to two devices with independent volume", "Splitter mode for a single shared output", "LAN sessions: host and guest with synchronised playback", "Honest hardware detection — no promises the OS can't keep"] },
  { id: "devices", label: "Device Studio", group: "Studio", icon: "usb", phase: 7, summary: "Your USB drives and Walkman, managed properly.",
    plan: ["Detects USB storage with capacity and filesystem", "Device profiles for codecs, folder rules and artwork limits", "Export playlists with Artist/Album, Playlist, Genre or flat layouts", "Hash-verified transfers; nothing is deleted without confirmation"] },

  { id: "themes", label: "Theme Gallery", group: "You", icon: "palette", phase: 1, summary: "Change how SONORA looks, moves and feels." },
  { id: "settings", label: "Settings", group: "You", icon: "settings", phase: 1, summary: "Preferences, privacy and data." },
];

export const ROUTE_GROUPS: RouteGroup[] = ["Listen", "Library", "Sources", "Studio", "You"];

export function routeMeta(id: RouteId): RouteMeta {
  const r = ROUTES.find((r) => r.id === id);
  if (!r) throw new Error(`unknown route ${id}`);
  return r;
}
