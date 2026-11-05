/**
 * Starts the seeded test server used by Playwright (same setup as the integration tests) and
 * keeps it alive until this process is terminated.
 */
import setup from '../int/global-setup'

const teardown = await setup()
console.log('[e2e] seeded test server ready on http://localhost:3000')
const stop = async () => {
  await teardown()
  process.exit(0)
}
process.on('SIGTERM', () => void stop())
process.on('SIGINT', () => void stop())
setInterval(() => undefined, 60_000)
