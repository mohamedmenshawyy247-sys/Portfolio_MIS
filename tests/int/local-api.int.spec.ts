import type { Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { User } from '@/payload-types'
import { EDITOR, loadTestEnv } from './env'
import { fixtures, pngBuffer } from './helpers'

/**
 * Local API rules (`overrideAccess: false` plus a user). This file is independent of the other integration files and
 * of the order vitest runs them in: the shared fixtures from global-setup are only read, every write targets a
 * document created here (`own`), and afterAll deletes those documents again. The same rules over HTTP, on the shared
 * public fixture, live in rest-security.int.spec.ts.
 */
const f = fixtures()
let payload: Payload
let admin: User
let editor: User

type Visibility = 'private' | 'public' | 'unlisted'
const AR = { title: 'عنوان', summary: 'ملخص', challenge: 'التحدي', solution: 'الحل' }
/** Documents created by this file; deleted in afterAll so the database is left as this file found it. */
const own = { media: [] as number[], projects: [] as number[], services: [] as number[] }
/** Published, bilingual and `unlisted` (never listed publicly nor in the sitemap): the target of the editor revision tests. */
let revisionTarget = 0
const LIVE_TITLE = 'Local API Revision Target'

const asAdmin = () => ({ user: admin, overrideAccess: false as const })
const asEditor = () => ({ user: editor, overrideAccess: false as const })

const projectData = (slug: string, title: string, visibility: Visibility) => ({
  slug, service: f.serviceId, visibility, featured: false, order: 90,
  title, summary: `${title} summary.`, challenge: `${title} challenge.`, solution: `${title} solution.`,
})

/** As the system (like the seed): English draft, Arabic draft, publish. */
async function createPublishedProject(slug: string, title: string, visibility: Visibility): Promise<number> {
  const doc = await payload.create({ collection: 'projects', locale: 'en', overrideAccess: true, data: { ...projectData(slug, title, visibility), reviewStatus: 'approved', _status: 'draft' } })
  own.projects.push(doc.id)
  await payload.update({ collection: 'projects', id: doc.id, locale: 'ar', draft: true, overrideAccess: true, data: AR })
  await payload.update({ collection: 'projects', id: doc.id, locale: 'en', overrideAccess: true, data: { _status: 'published' } })
  return doc.id
}

beforeAll(async () => {
  loadTestEnv()
  // Uploads made from this worker must land in the run's media directory, like the server's. global-setup exports the
  // directories through the environment (workers inherit it) and through fixtures.json as a fallback; the upload
  // collections read the variables when payload.config is imported, so this comes first.
  process.env.PUBLIC_MEDIA_DIR ||= f.mediaDir.public
  process.env.PRIVATE_MEDIA_DIR ||= f.mediaDir.private
  const { getPayload } = await import('payload')
  const { default: config } = await import('@payload-config')
  payload = await getPayload({ config })
  admin = await payload.findByID({ collection: 'users', id: f.adminId, overrideAccess: true })
  editor = await payload.findByID({ collection: 'users', id: f.editorId, overrideAccess: true })
  revisionTarget = await createPublishedProject('local-api-revision-target', LIVE_TITLE, 'unlisted')
})

afterAll(async () => {
  if (!payload) return
  const quietly = (operation: Promise<unknown>) => operation.catch(() => undefined)
  for (const id of own.projects) await quietly(payload.delete({ collection: 'projects', id, overrideAccess: true }))
  for (const id of own.services) await quietly(payload.delete({ collection: 'services', id, overrideAccess: true }))
  for (const id of own.media) await quietly(payload.delete({ collection: 'public-media', id, overrideAccess: true }))
  // The users describe renames the editor; put the fixture account back.
  await quietly(payload.update({ collection: 'users', id: f.editorId, overrideAccess: true, data: { displayName: EDITOR.displayName } }))
  await payload.db?.destroy?.()
})

describe('anonymous Local API reads (overrideAccess: false, no user)', () => {
  it('lists only public + published projects', async () => {
    const res = await payload.find({ collection: 'projects', overrideAccess: false, limit: 100, depth: 0 })
    const slugs = res.docs.map((d) => d.slug).sort()
    expect(slugs).toEqual(['executive-reporting-suite', 'operations-monitoring-suite', 'quality-management-hub'])
    expect(res.docs.every((d) => d.visibility === 'public' && d._status === 'published')).toBe(true)
  })

  it('does not reveal drafts even when draft:true is requested', async () => {
    const res = await payload.find({ collection: 'projects', overrideAccess: false, draft: true, limit: 100, depth: 0 })
    expect(res.docs.some((d) => d.slug === 'fixture-draft' || d._status === 'draft')).toBe(false)
  })

  it('cannot read unlisted, private or draft projects by id', async () => {
    for (const id of [f.projects.unlistedPublished, f.projects.privatePublished, f.projects.draftOnly, revisionTarget]) {
      await expect(payload.findByID({ collection: 'projects', id, overrideAccess: false, depth: 0 })).rejects.toThrow()
    }
  })

  it('cannot read private media documents', async () => {
    await expect(payload.find({ collection: 'private-media', overrideAccess: false })).rejects.toThrow()
  })

  it('cannot read users or versions', async () => {
    await expect(payload.find({ collection: 'users', overrideAccess: false })).rejects.toThrow()
    await expect(payload.findVersions({ collection: 'projects', overrideAccess: false })).rejects.toThrow()
  })
})

describe('editor publication boundary (Local API with access control)', () => {
  it('cannot publish on create: rejected by the editor rule, not by the bilingual rule', async () => {
    // English-only data would also fail the bilingual rule, so the assertion names the rule under test.
    await expect(
      payload.create({ collection: 'projects', locale: 'en', ...asEditor(), data: { ...projectData('editor-publish-attempt', 'Editor publish attempt', 'public'), _status: 'published' } }),
    ).rejects.toThrow(/only admins may publish/i)
  })

  it('cannot publish a complete bilingual draft either; an admin can publish the same document', async () => {
    const doc = await payload.create({ collection: 'projects', locale: 'en', ...asEditor(), data: { ...projectData('editor-bilingual-draft', 'Editor bilingual draft', 'private'), _status: 'draft' } })
    own.projects.push(doc.id)
    await payload.update({ collection: 'projects', id: doc.id, locale: 'ar', ...asEditor(), draft: true, context: { draftSave: true }, data: AR })
    // Both locales are complete: the only thing between the editor and publication is the update access rule.
    await expect(payload.update({ collection: 'projects', id: doc.id, locale: 'en', ...asEditor(), data: { _status: 'published' } })).rejects.toThrow(/not allowed|forbidden/i)
    const published = await payload.update({ collection: 'projects', id: doc.id, locale: 'en', ...asAdmin(), data: { _status: 'published' } })
    expect(published._status).toBe('published')
    expect(published.reviewStatus).toBe('approved')
  })

  it('can create a draft and request review', async () => {
    const doc = await payload.create({ collection: 'projects', locale: 'en', ...asEditor(), data: { ...projectData('editor-draft', 'Editor draft', 'public'), reviewStatus: 'in-review', _status: 'draft' } })
    own.projects.push(doc.id)
    expect(doc._status).toBe('draft')
    expect(doc.reviewStatus).toBe('in-review')
  })

  it('cannot approve, publish, live-write or unpublish a published project', async () => {
    const id = revisionTarget
    await expect(payload.update({ collection: 'projects', id, locale: 'en', ...asEditor(), data: { _status: 'published' } })).rejects.toThrow(/not allowed|forbidden/i)
    await expect(payload.update({ collection: 'projects', id, locale: 'en', ...asEditor(), data: { title: 'Live write' } })).rejects.toThrow(/draft/i)
    await expect(payload.update({ collection: 'projects', id, locale: 'en', ...asEditor(), data: { _status: 'draft' } })).rejects.toThrow(/draft|admin/i)
    await payload.update({ collection: 'projects', id, locale: 'en', ...asEditor(), draft: true, context: { draftSave: true }, data: { reviewStatus: 'in-review' } })
    await expect(payload.update({ collection: 'projects', id, locale: 'en', ...asEditor(), draft: true, context: { draftSave: true }, data: { reviewStatus: 'approved' } })).rejects.toThrow(/admin/i)
    await expect(payload.update({ collection: 'projects', id, locale: 'en', ...asEditor(), draft: true, context: { draftSave: true }, data: { reviewStatus: 'changes-requested' } })).rejects.toThrow(/admin/i)
  })

  it('can revise a published project as a new draft without changing the live version', async () => {
    const id = revisionTarget
    await payload.update({ collection: 'projects', id, locale: 'en', ...asEditor(), draft: true, context: { draftSave: true }, data: { title: 'Editor revision (draft)', reviewStatus: 'in-review' } })
    // draft:false reads the live (published) document, draft:true the newest version.
    const live = await payload.findByID({ collection: 'projects', id, locale: 'en', ...asAdmin(), draft: false, depth: 0 })
    expect(live._status).toBe('published')
    expect(live.title).toBe(LIVE_TITLE)
    const latest = await payload.findByID({ collection: 'projects', id, locale: 'en', ...asAdmin(), draft: true, depth: 0 })
    expect(latest.title).toBe('Editor revision (draft)')
    expect(latest.reviewStatus).toBe('in-review')
  })

  it('a newer draft never weakens protection of the live version (regression)', async () => {
    const id = revisionTarget
    // The latest version is now the editor's draft; the live document is still published.
    await expect(payload.update({ collection: 'projects', id, locale: 'en', ...asEditor(), data: { title: 'Live overwrite attempt' } })).rejects.toThrow(/draft|admin/i)
    await expect(payload.update({ collection: 'projects', id, locale: 'en', ...asEditor(), data: { _status: 'draft' } })).rejects.toThrow(/draft|admin/i)
    const live = await payload.findByID({ collection: 'projects', id, locale: 'en', ...asAdmin(), draft: false, depth: 0 })
    expect(live._status).toBe('published')
    expect(live.title).toBe(LIVE_TITLE)
  })

  it('cannot restore a published version', async () => {
    const versions = await payload.findVersions({ collection: 'projects', ...asAdmin(), where: { and: [{ parent: { equals: revisionTarget } }, { 'version._status': { equals: 'published' } }] }, limit: 1 })
    const version = versions.docs[0]
    expect(version).toBeDefined()
    await expect(payload.restoreVersion({ collection: 'projects', id: version!.id, ...asEditor() })).rejects.toThrow()
  })

  it('cannot publish the homepage global but can save a draft of it', async () => {
    await expect(payload.updateGlobal({ slug: 'homepage', ...asEditor(), data: { _status: 'published' } })).rejects.toThrow()
    const saved = await payload.updateGlobal({ slug: 'homepage', ...asEditor(), draft: true, context: { draftSave: true }, locale: 'en', data: { _status: 'draft' } })
    expect(saved._status).toBe('draft')
    const live = await payload.findGlobal({ slug: 'homepage', overrideAccess: false, depth: 0 })
    expect(live._status).toBe('published')
  })
})

describe('users', () => {
  it('editor cannot elevate their own role (field silently discarded)', async () => {
    const updated = await payload.update({ collection: 'users', id: f.editorId, ...asEditor(), data: { role: 'admin', displayName: 'Renamed Editor' } })
    expect(updated.role).toBe('editor')
    expect(updated.displayName).toBe('Renamed Editor')
    const reread = await payload.findByID({ collection: 'users', id: f.editorId, overrideAccess: true })
    expect(reread.role).toBe('editor')
  })

  it('editor cannot read, update, create or delete other users', async () => {
    await expect(payload.findByID({ collection: 'users', id: f.adminId, ...asEditor() })).rejects.toThrow()
    await expect(payload.update({ collection: 'users', id: f.adminId, ...asEditor(), data: { displayName: 'x' } })).rejects.toThrow()
    await expect(payload.create({ collection: 'users', ...asEditor(), data: { email: 'new@example.com', password: 'Some-Passw0rd!!', displayName: 'New', role: 'editor' } })).rejects.toThrow()
    await expect(payload.delete({ collection: 'users', id: f.adminId, ...asEditor() })).rejects.toThrow()
  })

  it('admin cannot delete their own account', async () => {
    await expect(payload.delete({ collection: 'users', id: f.adminId, ...asAdmin() })).rejects.toThrow()
  })
})

describe('content rules', () => {
  it('publishing a project requires both English and Arabic', async () => {
    const doc = await payload.create({ collection: 'projects', locale: 'en', ...asAdmin(), data: { ...projectData('needs-arabic', 'Needs Arabic', 'private'), _status: 'draft' } })
    own.projects.push(doc.id)
    await expect(payload.update({ collection: 'projects', id: doc.id, locale: 'en', ...asAdmin(), data: { _status: 'published' } })).rejects.toThrow(/Arabic|\(ar\)/)
    await payload.update({ collection: 'projects', id: doc.id, locale: 'ar', ...asAdmin(), draft: true, context: { draftSave: true }, data: AR })
    const published = await payload.update({ collection: 'projects', id: doc.id, locale: 'en', ...asAdmin(), data: { _status: 'published' } })
    expect(published._status).toBe('published')
    expect(published.reviewStatus).toBe('approved')
  })

  it('publishing a service requires both English and Arabic', async () => {
    // `active: false` keeps the service off the public services section even while published; afterAll deletes it.
    const service = await payload.create({
      collection: 'services', locale: 'en', ...asAdmin(),
      data: { key: 'local-api-service', icon: 'activity', active: false, order: 99, title: 'Local API service', summary: 'English only.', _status: 'draft' },
    })
    own.services.push(service.id)
    await expect(payload.update({ collection: 'services', id: service.id, locale: 'en', ...asAdmin(), data: { _status: 'published' } })).rejects.toThrow(/Arabic|\(ar\)/)
    await payload.update({ collection: 'services', id: service.id, locale: 'ar', ...asAdmin(), draft: true, context: { draftSave: true }, data: { title: 'خدمة', summary: 'ملخص' } })
    const published = await payload.update({ collection: 'services', id: service.id, locale: 'en', ...asAdmin(), data: { _status: 'published' } })
    expect(published._status).toBe('published')
  })

  it('private galleries are only allowed on private projects', async () => {
    await expect(payload.update({ collection: 'projects', id: revisionTarget, locale: 'en', ...asAdmin(), draft: true, data: { privateGallery: [f.privateMediaId] } })).rejects.toThrow(/private/i)
  })

  it('demo links must be https and not internal', async () => {
    for (const bad of ['http://demo.example.com', 'https://localhost/dash', 'https://10.0.0.5/x', 'javascript:alert(1)']) {
      await expect(payload.update({ collection: 'projects', id: revisionTarget, locale: 'en', ...asAdmin(), draft: true, data: { demoURL: bad } })).rejects.toThrow()
    }
  })

  it('uploads are validated by content, not by declared type', async () => {
    const text = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>')
    await expect(payload.create({ collection: 'public-media', ...asAdmin(), data: { alt: 'svg' }, file: { data: text, mimetype: 'image/svg+xml', name: 'evil.svg', size: text.length } })).rejects.toThrow()
    const fake = Buffer.from('definitely not an image')
    await expect(payload.create({ collection: 'public-media', ...asAdmin(), data: { alt: 'fake' }, file: { data: fake, mimetype: 'image/png', name: 'fake.png', size: fake.length } })).rejects.toThrow()
    const png = await pngBuffer()
    await expect(payload.create({ collection: 'public-media', ...asAdmin(), data: { alt: 'wrong ext' }, file: { data: png, mimetype: 'image/png', name: 'image.jpg', size: png.length } })).rejects.toThrow(/extension/i)
    const ok = await payload.create({ collection: 'public-media', ...asEditor(), locale: 'en', data: { alt: 'Valid png' }, file: { data: png, mimetype: 'image/png', name: 'valid.png', size: png.length } })
    own.media.push(ok.id)
    expect(ok.mimeType).toBe('image/png')
  })
})
