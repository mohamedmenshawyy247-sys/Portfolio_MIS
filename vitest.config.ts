import { defineConfig } from 'vitest/config'

/**
 * Integration tests run against the disposable TEST_DATABASE_URL and a production server
 * (`next start`) started by tests/int/global-setup.ts. Run `pnpm build` first.
 */
export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    include: ['tests/int/**/*.int.spec.ts'],
    environment: 'node',
    globalSetup: ['./tests/int/global-setup.ts'],
    fileParallelism: false,
    testTimeout: 60_000,
    hookTimeout: 180_000,
  },
})
