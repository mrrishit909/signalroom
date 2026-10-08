import { defineConfig } from "@playwright/test";

// Runs against a built production bundle served at the real base path
// (vite.config.ts: base: '/signalroom/'), per the hard requirements:
// zero non-origin network requests, self-hosted fonts, reduced motion, and
// the keyboard map.
export default defineConfig({
  testDir: "./tests/playwright",
  fullyParallel: true,
  reporter: "list",
  use: {
    baseURL: "http://localhost:4173/signalroom/",
  },
  webServer: {
    command: "npm run preview -- --port 4173",
    url: "http://localhost:4173/signalroom/",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
