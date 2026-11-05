/**
 * Loads the illustrative DEMO_ONLY catalogue into Payload in both locales and publishes it.
 * Idempotent: existing services, projects and homepage blocks are left alone, and site settings are only filled
 * where a value is still empty (never overwritten). Runs as the system (no user); the same hooks still enforce the
 * bilingual-publish rule.
 *   pnpm seed:demo
 */
import { getPayload } from 'payload'
import config from '../payload.config'
import { seedDemoContent } from '../src/lib/demo-seed'

const payload = await getPayload({ config })
await seedDemoContent(payload)
process.exit(0)
