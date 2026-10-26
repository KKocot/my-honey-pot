import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: "list",
  use: {
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        baseURL: "http://localhost:4326",
      },
    },
  ],
  webServer: [
    // --ignore-lock: Astro allows only one locked dev server per project root; a local `pnpm dev` may hold it
    {
      command: "npm run dev -- --ignore-lock",
      url: "http://localhost:4326",
      // Specs assert a user blog with real posts; without .env the site renders the setup notice
      env: { HIVE_USERNAME: process.env.HIVE_USERNAME || "barddev" },
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
    },
  ],
});
