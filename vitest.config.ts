import { defineConfig } from 'vitest/config'
import { BaseSequencer, type TestSpecification } from 'vitest/node'

/**
 * Deterministic file order. Vitest's default sequencer orders files by their cached results (failed first, then
 * slowest first) and falls back to file size only when no cache exists, so the order could change between runs.
 * Every integration file is independent of the others (each creates and removes its own documents); this sequencer
 * only makes a run reproducible: with `fileParallelism: false` the files run one at a time, in code-point order of
 * their paths (local-api -> rest-security -> site), whatever the cache holds.
 */
class PathOrderSequencer extends BaseSequencer {
  override async sort(files: TestSpecification[]): Promise<TestSpecification[]> {
    return [...files].sort((a, b) => (a.moduleId < b.moduleId ? -1 : a.moduleId > b.moduleId ? 1 : 0))
  }
}

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
    sequence: { sequencer: PathOrderSequencer },
    testTimeout: 60_000,
    hookTimeout: 180_000,
  },
})
