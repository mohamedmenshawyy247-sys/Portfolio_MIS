import { defineConfig, devices } from '@playwright/test'

/**
 * Browser QA against a production build. The web server is a seeded test instance started by tests/e2e/serve.ts
 * (TCP port guard on :3000, fresh TEST_DATABASE_URL schema, demo content, test accounts, per-run upload directories).
 * `reuseExistingServer` stays off on purpose: a server that already listens on :3000 (for example `pnpm dev` on the
 * real DATABASE_URL) must never become the target of the admin flows, so Playwright fails fast instead of reusing it.
 * `gracefulShutdown` sends SIGTERM to the server's process group at the end of the run (the default is SIGKILL), so
 * serve.ts can wait for `next start` to exit, confirm the port is free and remove the per-run upload directory.
 */
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  outputDir: 'test-results',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    locale: 'en-US',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'pnpm exec tsx tests/e2e/serve.ts',
    url: 'http://localhost:3000/en',
    reuseExistingServer: false,
    gracefulShutdown: { signal: 'SIGTERM', timeout: 30_000 },
    timeout: 240_000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
})
