import { execFileSync, spawn, type ChildProcess } from 'node:child_process'
import { createRequire } from 'node:module'
import { connect } from 'node:net'
import { mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import sharp from 'sharp'
import { ADMIN, BASE_URL, EDITOR, TEST_PORT, loadTestEnv } from './env'

export type Fixtures = {
  adminId: number
  editorId: number
  /** Per-run upload directories (tests/.tmp/media-<pid>/{public,private}); the teardown removes `root`. */
  mediaDir: { private: string; public: string; root: string }
  privateMediaFilename: string
  privateMediaId: number
  publicMediaFilename: string
  publicMediaId: number
  unapprovedPublicMediaFilename: string
  unapprovedPublicMediaId: number
  projects: { draftOnly: number; privatePublished: number; publicPublished: number; unlistedPublished: number }
  serviceId: number
}

const TMP_DIR = resolve(process.cwd(), 'tests/.tmp')
let server: ChildProcess | undefined
let mediaRoot: string | undefined

async function png(width = 64, height = 48): Promise<Buffer> {
  return sharp({ create: { width, height, channels: 3, background: { r: 29, g: 104, b: 237 } } }).png().toBuffer()
}

/** True when something accepts TCP connections on the port (proxy-independent, unlike fetch). */
const portInUse = (port: number): Promise<boolean> =>
  new Promise((resolvePort) => {
    const socket = connect({ port, host: '127.0.0.1' })
    socket.once('connect', () => { socket.end(); resolvePort(true) })
    socket.once('error', () => resolvePort(false))
  })

async function waitForServer(url: string, attempts = 90): Promise<void> {
  for (let i = 0; i < attempts; i++) {
    if (await portInUse(TEST_PORT)) {
      try {
        const res = await fetch(url)
        if (res.status < 500) return
      } catch {
        // not up yet
      }
    }
    await new Promise((r) => setTimeout(r, 1000))
  }
  throw new Error(`Server at ${url} did not start`)
}

/** Resolves once nothing accepts connections on the port any more, so the next suite can bind it immediately. */
async function waitForPortFree(port: number, timeoutMs: number): Promise<void> {
  const deadline = Date.now() + timeoutMs
  while (await portInUse(port)) {
    if (Date.now() > deadline) throw new Error(`Port ${port} is still in use ${timeoutMs} ms after the test server was told to stop.`)
    await new Promise((r) => setTimeout(r, 250))
  }
}

/** SIGTERM, await the child's `exit` event, escalate to SIGKILL after `graceMs`, then fail loudly. */
async function stopServer(child: ChildProcess, graceMs = 15_000): Promise<void> {
  if (child.exitCode !== null || child.signalCode !== null) return
  const exited = new Promise<'exited'>((r) => child.once('exit', () => r('exited')))
  const timeout = (ms: number) => new Promise<'timeout'>((r) => setTimeout(r, ms, 'timeout').unref())
  child.kill('SIGTERM')
  if ((await Promise.race([exited, timeout(graceMs)])) === 'exited') return
  child.kill('SIGKILL')
  if ((await Promise.race([exited, timeout(5_000)])) !== 'exited') throw new Error('The test server did not exit after SIGKILL.')
}

/**
 * Per-run upload directories, so fixture and test uploads never land in (or accumulate under) the real uploads/
 * folders. The upload collections read PUBLIC_MEDIA_DIR / PRIVATE_MEDIA_DIR when payload.config is imported, so this
 * runs before that import; the spawned `next start` and the vitest workers inherit the variables. The port guard has
 * already established that no other test server is running, so any media-* directory left behind by a killed run
 * is stale and is removed here.
 */
function prepareMediaDirs(): Fixtures['mediaDir'] {
  mkdirSync(TMP_DIR, { recursive: true })
  for (const entry of readdirSync(TMP_DIR)) {
    if (entry.startsWith('media-')) rmSync(resolve(TMP_DIR, entry), { recursive: true, force: true })
  }
  const root = resolve(TMP_DIR, `media-${process.pid}`)
  const dirs = { root, public: resolve(root, 'public'), private: resolve(root, 'private') }
  mkdirSync(dirs.public, { recursive: true })
  mkdirSync(dirs.private, { recursive: true })
  process.env.PUBLIC_MEDIA_DIR = dirs.public
  process.env.PRIVATE_MEDIA_DIR = dirs.private
  return dirs
}

export default async function setup(): Promise<() => Promise<void>> {
  loadTestEnv()
  // A test server must own the port: refuse to run beside another instance (TCP probe; a fetch could be answered by a proxy).
  if (await portInUse(TEST_PORT)) throw new Error(`Port ${TEST_PORT} is already in use. Stop the other server before running integration tests.`)
  const mediaDir = prepareMediaDirs()
  mediaRoot = mediaDir.root

  // Fresh schema from the committed migrations.
  execFileSync('pnpm', ['exec', 'payload', 'migrate:fresh', '--forceAcceptWarning'], { env: process.env, stdio: 'pipe' })

  const { getPayload } = await import('payload')
  const { default: config } = await import('@payload-config')
  const { seedDemoContent } = await import('@/lib/demo-seed')
  const payload = await getPayload({ config })

  const admin = await payload.create({ collection: 'users', data: { ...ADMIN, role: 'admin' }, overrideAccess: true })
  const editor = await payload.create({ collection: 'users', data: { ...EDITOR, role: 'editor' }, overrideAccess: true })
  await seedDemoContent(payload, () => undefined)

  const service = (await payload.find({ collection: 'services', limit: 1, overrideAccess: true })).docs[0]!
  const publicProject = (await payload.find({ collection: 'projects', where: { slug: { equals: 'operations-monitoring-suite' } }, overrideAccess: true })).docs[0]!

  const publicBuf = await png()
  const publicMedia = await payload.create({
    collection: 'public-media', overrideAccess: true, locale: 'en',
    data: { alt: 'Fixture public image', approvedForPublic: true },
    file: { data: publicBuf, mimetype: 'image/png', name: 'fixture-public.png', size: publicBuf.length },
  })
  const unapprovedBuf = await png(72, 54)
  const unapprovedMedia = await payload.create({
    collection: 'public-media', overrideAccess: true, locale: 'en',
    data: { alt: 'Fixture unapproved image', approvedForPublic: false },
    file: { data: unapprovedBuf, mimetype: 'image/png', name: 'fixture-unapproved.png', size: unapprovedBuf.length },
  })
  const privateBuf = await png(80, 60)
  const privateMedia = await payload.create({
    collection: 'private-media', overrideAccess: true,
    data: { description: 'Fixture private screenshot' },
    file: { data: privateBuf, mimetype: 'image/png', name: 'fixture-private.png', size: privateBuf.length },
  })

  const bilingual = (slug: string, title: string) => ({
    slug, service: service.id, featured: false, order: 50, reviewStatus: 'approved' as const,
    title, summary: `${title} summary.`, challenge: `${title} challenge.`, solution: `${title} solution.`,
  })
  const createPublished = async (slug: string, title: string, visibility: 'private' | 'public' | 'unlisted', extra: Record<string, unknown> = {}) => {
    const doc = await payload.create({ collection: 'projects', locale: 'en', overrideAccess: true, data: { ...bilingual(slug, title), visibility, _status: 'draft', ...extra } })
    await payload.update({ collection: 'projects', id: doc.id, locale: 'ar', draft: true, overrideAccess: true, data: { title: `${title} (ar)`, summary: 'ملخص', challenge: 'التحدي', solution: 'الحل' } })
    await payload.update({ collection: 'projects', id: doc.id, locale: 'en', overrideAccess: true, data: { _status: 'published' } })
    return doc.id as number
  }
  const unlisted = await createPublished('fixture-unlisted', 'Fixture Unlisted', 'unlisted')
  const privateProject = await createPublished('fixture-private', 'Fixture Private', 'private', { privateGallery: [privateMedia.id] })
  const draftOnly = await payload.create({ collection: 'projects', locale: 'en', overrideAccess: true, data: { ...bilingual('fixture-draft', 'Fixture Draft Only'), visibility: 'public', _status: 'draft' } })

  const fixtures: Fixtures = {
    adminId: admin.id as number, editorId: editor.id as number,
    mediaDir,
    publicMediaId: publicMedia.id as number, publicMediaFilename: publicMedia.filename ?? 'fixture-public.png',
    unapprovedPublicMediaId: unapprovedMedia.id as number, unapprovedPublicMediaFilename: unapprovedMedia.filename ?? 'fixture-unapproved.png',
    privateMediaId: privateMedia.id as number, privateMediaFilename: privateMedia.filename ?? 'fixture-private.png',
    projects: { publicPublished: publicProject.id as number, unlistedPublished: unlisted, privatePublished: privateProject, draftOnly: draftOnly.id as number },
    serviceId: service.id as number,
  }
  writeFileSync(resolve(TMP_DIR, 'fixtures.json'), JSON.stringify(fixtures, null, 2))
  await payload.db.destroy?.()

  // The Next binary runs directly, not through `pnpm exec`: `next start` serves in-process, so this child *is* the
  // server. SIGTERM reaches it with no wrapper in between, and it stays in this process's group, so an abrupt end of
  // this process (Playwright stops its web server with SIGKILL on the group) takes the server down with it.
  const nextBin = createRequire(import.meta.url).resolve('next/dist/bin/next')
  server = spawn(process.execPath, [nextBin, 'start', '-p', String(TEST_PORT)], {
    // Includes DATABASE_URL (the test database) and the per-run media directories set above.
    env: { ...process.env, NODE_ENV: 'production' },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  server.stdout?.on('data', () => undefined)
  server.stderr?.on('data', (d) => process.stderr.write(`[next] ${d}`))
  try {
    await waitForServer(`${BASE_URL}/en`)
  } catch (err) {
    await stopServer(server).catch(() => undefined)
    throw err
  }

  return async () => {
    if (server) await stopServer(server)
    server = undefined
    // Only return once the port is actually free: `pnpm test:e2e` may start the moment this process exits.
    await waitForPortFree(TEST_PORT, 10_000)
    if (mediaRoot) rmSync(mediaRoot, { recursive: true, force: true })
    mediaRoot = undefined
  }
}
