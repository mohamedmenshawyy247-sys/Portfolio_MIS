import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { config as loadDotenv, parse as parseDotenv } from 'dotenv'

export const TEST_PORT = 3000
export const BASE_URL = `http://localhost:${TEST_PORT}`

/** Test-only accounts that exist solely in the disposable test database. */
export const ADMIN = { email: 'admin.test@example.com', password: 'Admin-Test-Passw0rd!', displayName: 'Test Admin' }
export const EDITOR = { email: 'editor.test@example.com', password: 'Editor-Test-Passw0rd!', displayName: 'Test Editor' }

/**
 * "test" must be a whole token of the database name, delimited by `_`, `-` or the ends of the name:
 * `mis_portfolio_test`, `test`, `test-db` pass; `mis_portfolio_latest`, `contest`, `testing` do not.
 */
export const TEST_DATABASE_NAME = /(^|[_-])test($|[_-])/i

/** `host:port/database` of a Postgres URL, so two URLs for the same database compare equal whatever their credentials or query string. */
function databaseIdentity(url: string): string | undefined {
  try {
    const parsed = new URL(url)
    return `${parsed.hostname.toLowerCase()}:${parsed.port || '5432'}${parsed.pathname}`
  } catch {
    return undefined
  }
}

/**
 * Points the process at the test database. The suite wipes that schema (`migrate:fresh --forceAcceptWarning`), so it
 * refuses to run when TEST_DATABASE_URL is missing, names the same database as DATABASE_URL (exact string or same
 * host, port and database name), or has a database name without the whole word "test".
 */
export function loadTestEnv(): void {
  const envFile = resolve(process.cwd(), '.env')
  const fromFile = existsSync(envFile) ? parseDotenv(readFileSync(envFile, 'utf8')) : {}
  if (existsSync(envFile)) loadDotenv({ path: envFile, quiet: true })
  const testUrl = process.env.TEST_DATABASE_URL
  if (!testUrl) throw new Error('TEST_DATABASE_URL is not set. Point it at an empty, disposable Postgres database.')
  // The first call (global setup) compares against the real DATABASE_URL, then replaces it with the test URL and marks
  // the process. Vitest workers inherit that environment, so later calls only compare against the .env file.
  const realUrl = fromFile.DATABASE_URL ?? (process.env.MIS_TEST_ENV === '1' ? undefined : process.env.DATABASE_URL)
  const testIdentity = databaseIdentity(testUrl)
  if (realUrl && (testUrl === realUrl || (testIdentity !== undefined && testIdentity === databaseIdentity(realUrl)))) {
    throw new Error('TEST_DATABASE_URL must point at a different database than DATABASE_URL.')
  }
  const dbName = new URL(testUrl).pathname.replace(/^\//, '')
  if (!TEST_DATABASE_NAME.test(dbName)) {
    throw new Error(`Refusing to wipe "${dbName}": the test database name must contain "test" as a whole word, for example mis_portfolio_test.`)
  }
  process.env.MIS_TEST_ENV = '1'
  process.env.DATABASE_URL = testUrl
  process.env.NEXT_PUBLIC_SITE_URL = BASE_URL
  process.env.SITE_URL = BASE_URL
  process.env.PAYLOAD_SECRET ||= 'integration-test-secret-not-for-production-0123456789'
  process.env.PREVIEW_SECRET ||= 'integration-test-preview-secret'
}
