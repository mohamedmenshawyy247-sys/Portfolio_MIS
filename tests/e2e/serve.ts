/**
 * Starts the seeded test server used by Playwright and keeps it alive until this process is terminated. It reuses
 * the integration global setup, so it has the same guards: a TCP probe refuses to start when :3000 is in use, the
 * schema is rebuilt from TEST_DATABASE_URL (never DATABASE_URL), demo content and test accounts are seeded, and
 * uploads go to a per-run tests/.tmp/media-<pid> directory.
 *
 * On SIGTERM / SIGINT the server is stopped, its exit is awaited (SIGKILL fallback), the port is confirmed free and
 * the per-run upload directory is removed before this process exits. Playwright sends SIGTERM to this process group
 * at the end of a run (webServer.gracefulShutdown in playwright.config.ts) and falls back to SIGKILL on the group
 * after its timeout, in which case the next run's setup removes the stale media-* directory.
 */
import setup from '../int/global-setup'

const teardown = await setup()
console.log('[e2e] seeded test server ready on http://localhost:3000')
let stopping = false
const stop = async (signal: NodeJS.Signals) => {
  if (stopping) return
  stopping = true
  try {
    await teardown()
    process.exit(0)
  } catch (err) {
    console.error(`[e2e] teardown after ${signal} failed:`, err)
    process.exit(1)
  }
}
process.on('SIGTERM', () => void stop('SIGTERM'))
process.on('SIGINT', () => void stop('SIGINT'))
setInterval(() => undefined, 60_000)
