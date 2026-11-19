import { defineConfig, devices } from "@playwright/test";

// UI smoke tests against the built frontend (no Rust backend: the UI must
// degrade honestly with NO_BACKEND). Desktop-in-Tauri E2E arrives with
// tauri-driver in Phase 11.
export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  reporter: "list",
  use: {
    ...devices["Desktop Chrome"],
    baseURL: "http://localhost:4173",
    viewport: { width: 1380, height: 880 },
  },
  webServer: {
    command: "npm run build && npx vite preview --port 4173 --strictPort",
    url: "http://localhost:4173",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
