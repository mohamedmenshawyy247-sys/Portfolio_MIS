import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { config as loadDotenv, parse as parseDotenv } from 'dotenv'
import { readFileSync } from 'node:fs'

export const TEST_PORT = 3000
export const BASE_URL = `http://localhost:${TEST_PORT}`

/** Test-only accounts that exist solely in the disposable test database. */
export const ADMIN = { email: 'admin.test@example.com', password: 'Admin-Test-Passw0rd!', displayName: 'Test Admin' }
export const EDITOR = { email: 'editor.test@example.com', password: 'Editor-Test-Passw0rd!', displayName: 'Test Editor' }

/**
 * Points the process at the test database. Refuses to run against DATABASE_URL and requires the
 * word "test" in the database name, because the suite wipes the schema.
 */
export function useTestEnv(): void {
  const envFile = resolve(process.cwd(), '.env')
  const fromFile = existsSync(envFile) ? parseDotenv(readFileSync(envFile, 'utf8')) : {}
  if (existsSync(envFile)) loadDotenv({ path: envFile, quiet: true })
  const testUrl = process.env.TEST_DATABASE_URL
  if (!testUrl) throw new Error('TEST_DATABASE_URL is not set. Point it at an empty, disposable Postgres database.')
  const realUrl = fromFile.DATABASE_URL ?? (process.env.MIS_TEST_ENV === '1' ? undefined : process.env.DATABASE_URL)
  if (realUrl && testUrl === realUrl) throw new Error('TEST_DATABASE_URL must differ from DATABASE_URL.')
  process.env.MIS_TEST_ENV = '1'
  const dbName = new URL(testUrl).pathname.replace(/^\//, '')
  if (!/test/i.test(dbName)) throw new Error(`Refusing to wipe "${dbName}": the test database name must contain "test".`)
  process.env.DATABASE_URL = testUrl
  process.env.NEXT_PUBLIC_SITE_URL = BASE_URL
  process.env.PAYLOAD_SECRET ||= 'integration-test-secret-not-for-production-0123456789'
  process.env.PREVIEW_SECRET ||= 'integration-test-preview-secret'
}
