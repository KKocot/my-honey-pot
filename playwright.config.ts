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
    // Default project: uses .env as-is (user mode with HIVE_USERNAME=barddev)
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        baseURL: "http://localhost:4326",
      },
      testIgnore: [
        "**/community-*.spec.ts",
        "**/user-mode-community-disabled.spec.ts",
      ],
    },
    // Community mode: HIVE_USERNAME=hive-123456, port 4327
    {
      name: "community-mode",
      use: {
        ...devices["Desktop Chrome"],
        baseURL: "http://localhost:4327",
      },
      testMatch: "**/community-*.spec.ts",
    },
    // User mode (explicit): HIVE_USERNAME=barddev, port 4326
    // Tests that verify community features are disabled in user mode
    {
      name: "user-mode",
      use: {
        ...devices["Desktop Chrome"],
        baseURL: "http://localhost:4326",
      },
      testMatch: "**/user-mode-community-disabled.spec.ts",
    },
  ],
  webServer: [
    // Default user mode server (port 4326)
    {
      command: "npm run dev",
      url: "http://localhost:4326",
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
    },
    // Community mode server (port 4327, overrides HIVE_USERNAME)
    {
      command: "HIVE_USERNAME=hive-123456 astro dev --port 4327",
      url: "http://localhost:4327",
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
    },
  ],
});
