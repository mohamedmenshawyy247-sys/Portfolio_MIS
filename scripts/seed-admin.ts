/**
 * Creates the first admin account. Refuses to run if any user already exists, so it can never be
 * used to add a back-door account later. Credentials come from the environment only:
 *   SEED_ADMIN_EMAIL=... SEED_ADMIN_PASSWORD=... [SEED_ADMIN_NAME=...] pnpm seed:admin
 */
import { getPayload } from 'payload'
import config from '../payload.config'

const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase()
const password = process.env.SEED_ADMIN_PASSWORD
const displayName = process.env.SEED_ADMIN_NAME?.trim() || 'MIS Administrator'

if (!email || !password) {
  console.error('Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD in the environment (never commit them).')
  process.exit(1)
}
if (password.length < 12 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
  console.error('SEED_ADMIN_PASSWORD must be at least 12 characters and contain letters and digits.')
  process.exit(1)
}

const payload = await getPayload({ config })
const { totalDocs } = await payload.count({ collection: 'users', overrideAccess: true })
if (totalDocs > 0) {
  console.log(`Refusing to bootstrap: ${totalDocs} user(s) already exist. Manage accounts from /admin.`)
  process.exit(0)
}
await payload.create({ collection: 'users', data: { email, password, displayName, role: 'admin' }, overrideAccess: true })
console.log(`Created the first admin account for ${email}.`)
process.exit(0)
