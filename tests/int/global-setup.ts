import { execFileSync, spawn, type ChildProcess } from 'node:child_process'
import { connect } from 'node:net'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import sharp from 'sharp'
import { ADMIN, BASE_URL, EDITOR, TEST_PORT, loadTestEnv } from './env'

export type Fixtures = {
  adminId: number
  editorId: number
  privateMediaFilename: string
  privateMediaId: number
  publicMediaFilename: string
  publicMediaId: number
  projects: { draftOnly: number; privatePublished: number; publicPublished: number; unlistedPublished: number }
  serviceId: number
}

let server: ChildProcess | undefined

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

export default async function setup(): Promise<() => Promise<void>> {
  loadTestEnv()
  // A test server must own the port: refuse to run beside another instance.
  if (await portInUse(TEST_PORT)) throw new Error(`Port ${TEST_PORT} is already in use. Stop the other server before running integration tests.`)

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
    publicMediaId: publicMedia.id as number, publicMediaFilename: publicMedia.filename ?? 'fixture-public.png',
    privateMediaId: privateMedia.id as number, privateMediaFilename: privateMedia.filename ?? 'fixture-private.png',
    projects: { publicPublished: publicProject.id as number, unlistedPublished: unlisted, privatePublished: privateProject, draftOnly: draftOnly.id as number },
    serviceId: service.id as number,
  }
  mkdirSync(resolve(process.cwd(), 'tests/.tmp'), { recursive: true })
  writeFileSync(resolve(process.cwd(), 'tests/.tmp/fixtures.json'), JSON.stringify(fixtures, null, 2))
  await payload.db.destroy?.()

  server = spawn('pnpm', ['exec', 'next', 'start', '-p', String(TEST_PORT)], { env: { ...process.env, NODE_ENV: 'production' }, stdio: ['ignore', 'pipe', 'pipe'] })
  server.stdout?.on('data', () => undefined)
  server.stderr?.on('data', (d) => process.stderr.write(`[next] ${d}`))
  await waitForServer(`${BASE_URL}/en`)

  return async () => {
    server?.kill('SIGTERM')
    await new Promise((r) => setTimeout(r, 500))
  }
}
