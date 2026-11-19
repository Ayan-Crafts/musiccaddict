/**
 * Signature themes planned for Phase 9. Listed in the Theme Gallery as "planned"
 * — they are NOT installed and cannot be applied yet.
 *
 * All will use original artwork, generated textures and open-licensed fonts:
 * no logos, film stills, soundtracks or extracted game assets.
 */
export interface PlannedTheme {
  id: string;
  name: string;
  family: "Cinema" | "Games";
  idea: string;
  swatch: [string, string, string];
}

export const PLANNED_THEMES: PlannedTheme[] = [
  { id: "web-slinger", name: "Spider-Man", family: "Cinema", idea: "Halftone comic textures, web-line transitions, red/blue kinetic energy.", swatch: ["#d01f2e", "#1b3a8f", "#f4f0e6"] },
  { id: "arc-reactor", name: "Iron Man", family: "Cinema", idea: "Metallic red and gold, HUD scanlines, reactive targeting visualiser.", swatch: ["#8f1414", "#d4a640", "#7fe3ff"] },
  { id: "endgame", name: "Avengers Endgame", family: "Cinema", idea: "Dark metal, cosmic nebula accents, cinematic full-screen player.", swatch: ["#14121c", "#6b3fd6", "#e3b04b"] },
  { id: "trinity", name: "Oppenheimer", family: "Cinema", idea: "Black and ivory, film grain, restrained cuts, a single muted-orange flare.", swatch: ["#0b0a09", "#efe8d8", "#c46a2c"] },
  { id: "inversion", name: "Tenet", family: "Cinema", idea: "Inverted spatial flow: right-to-left progress, reversed transitions, mirrored controls.", swatch: ["#0c0d0f", "#e9ecef", "#c21f3a"] },
  { id: "ayan", name: "Ayan (2009)", family: "Cinema", idea: "High-energy action palette, sharp slashes, bold kinetic player.", swatch: ["#1a1410", "#f2a516", "#d8352a"] },
  { id: "vice-neon", name: "GTA VI", family: "Games", idea: "Neon Miami dusk: pink and cyan light, ambient gradients, glow transitions.", swatch: ["#ff3ea5", "#28d7ff", "#1b0b2e"] },
  { id: "los-santos", name: "GTA V", family: "Games", idea: "Urban dark surfaces and a radio-dial player for playlist stations.", swatch: ["#101418", "#5fb85a", "#f2f2f2"] },
  { id: "grove-sunset", name: "GTA San Andreas", family: "Games", idea: "Orange sunset retro palette, chunky type, vintage wipes.", swatch: ["#f08a24", "#3b2a1a", "#7bc043"] },
  { id: "strand", name: "Death Stranding", family: "Games", idea: "Muted landscapes, timefall haze, minimalist controls.", swatch: ["#2b2f33", "#c9c4b7", "#e2b23b"] },
  { id: "strand-2", name: "Death Stranding 2", family: "Games", idea: "Futuristic exploration UI, shifting atmospheric backdrops.", swatch: ["#0f1720", "#7aa7c7", "#e8dcc2"] },
  { id: "fortune-hunter", name: "Uncharted", family: "Games", idea: "Weathered map textures, compass navigation, cinematic reveals.", swatch: ["#3d2b1f", "#d9b77e", "#2f6f73"] },
];
