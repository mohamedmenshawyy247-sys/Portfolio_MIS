/**
 * Loads the illustrative DEMO_ONLY catalogue into Payload in both locales and publishes it.
 * Idempotent. Runs as the system (no user); the same hooks still enforce the bilingual-publish rule.
 *   pnpm seed:demo
 */
import { getPayload } from 'payload'
import config from '../payload.config'
import { seedDemoContent } from '../src/lib/demo-seed'

const payload = await getPayload({ config })
await seedDemoContent(payload)
process.exit(0)
