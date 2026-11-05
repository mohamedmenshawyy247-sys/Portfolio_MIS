import { defineConfig, devices } from '@playwright/test'

/**
 * Browser QA against a production build. The web server is a seeded test instance started by
 * tests/e2e/serve.ts (fresh TEST_DATABASE_URL schema, demo content, test accounts). If a server
 * is already listening on :3000 it is reused, so make sure it is the one you mean to test.
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
    reuseExistingServer: true,
    timeout: 240_000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
})
