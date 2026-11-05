import type { Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { User } from '@/payload-types'
import { useTestEnv } from './env'
import { fixtures, pngBuffer } from './helpers'

const f = fixtures()
let payload: Payload
let admin: User
let editor: User

beforeAll(async () => {
  useTestEnv()
  const { getPayload } = await import('payload')
  const { default: config } = await import('@payload-config')
  payload = await getPayload({ config })
  admin = await payload.findByID({ collection: 'users', id: f.adminId, overrideAccess: true })
  editor = await payload.findByID({ collection: 'users', id: f.editorId, overrideAccess: true })
})

afterAll(async () => {
  await payload?.db?.destroy?.()
})

const asEditor = { user: () => editor, overrideAccess: false as const }
const asAdmin = { user: () => admin, overrideAccess: false as const }

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
    for (const id of [f.projects.unlistedPublished, f.projects.privatePublished, f.projects.draftOnly]) {
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
  it('cannot publish on create', async () => {
    await expect(
      payload.create({
        collection: 'projects', locale: 'en', user: asEditor.user(), overrideAccess: false,
        data: { slug: 'editor-publish-attempt', service: f.serviceId, visibility: 'public', title: 'T', summary: 'S', challenge: 'C', solution: 'So', _status: 'published' },
      }),
    ).rejects.toThrow()
  })

  it('can create a draft and request review', async () => {
    const doc = await payload.create({
      collection: 'projects', locale: 'en', user: asEditor.user(), overrideAccess: false,
      data: { slug: 'editor-draft', service: f.serviceId, visibility: 'public', reviewStatus: 'in-review', title: 'Editor draft', summary: 'S', challenge: 'C', solution: 'So', _status: 'draft' },
    })
    expect(doc._status).toBe('draft')
    expect(doc.reviewStatus).toBe('in-review')
  })

  it('cannot approve, publish, live-write or unpublish a published project', async () => {
    const id = f.projects.publicPublished
    await expect(payload.update({ collection: 'projects', id, locale: 'en', ...asEditor, user: editor, data: { _status: 'published' } })).rejects.toThrow()
    await expect(payload.update({ collection: 'projects', id, locale: 'en', ...asEditor, user: editor, data: { title: 'Live write' } })).rejects.toThrow(/draft/i)
    await expect(payload.update({ collection: 'projects', id, locale: 'en', ...asEditor, user: editor, data: { _status: 'draft' } })).rejects.toThrow(/draft|admin/i)
    await payload.update({ collection: 'projects', id, locale: 'en', ...asEditor, user: editor, draft: true, context: { draftSave: true }, data: { reviewStatus: 'in-review' } })
    await expect(payload.update({ collection: 'projects', id, locale: 'en', ...asEditor, user: editor, draft: true, context: { draftSave: true }, data: { reviewStatus: 'approved' } })).rejects.toThrow(/admin/i)
    await expect(payload.update({ collection: 'projects', id, locale: 'en', ...asEditor, user: editor, draft: true, context: { draftSave: true }, data: { reviewStatus: 'changes-requested' } })).rejects.toThrow(/admin/i)
  })

  it('can revise a published project as a new draft without changing the live version', async () => {
    const id = f.projects.publicPublished
    await payload.update({ collection: 'projects', id, locale: 'en', ...asEditor, user: editor, draft: true, context: { draftSave: true }, data: { title: 'Editor revision (draft)', reviewStatus: 'in-review' } })
    const live = await payload.findByID({ collection: 'projects', id, locale: 'en', overrideAccess: false, depth: 0 })
    expect(live.title).toBe('Operations Monitoring Suite')
    const latest = await payload.findByID({ collection: 'projects', id, locale: 'en', ...asAdmin, user: admin, draft: true, depth: 0 })
    expect(latest.title).toBe('Editor revision (draft)')
    expect(latest.reviewStatus).toBe('in-review')
  })

  it('a newer draft never weakens protection of the live version (regression)', async () => {
    const id = f.projects.publicPublished
    // latest version is now the editor's draft; the live document is still published
    await expect(payload.update({ collection: 'projects', id, locale: 'en', ...asEditor, user: editor, data: { title: 'Live overwrite attempt' } })).rejects.toThrow(/draft|admin/i)
    await expect(payload.update({ collection: 'projects', id, locale: 'en', ...asEditor, user: editor, data: { _status: 'draft' } })).rejects.toThrow(/draft|admin/i)
    const live = await payload.findByID({ collection: 'projects', id, locale: 'en', overrideAccess: false, depth: 0 })
    expect(live._status).toBe('published')
    expect(live.title).toBe('Operations Monitoring Suite')
  })

  it('cannot restore a published version', async () => {
    const versions = await payload.findVersions({ collection: 'projects', ...asAdmin, user: admin, where: { and: [{ parent: { equals: f.projects.publicPublished } }, { 'version._status': { equals: 'published' } }] }, limit: 1 })
    const version = versions.docs[0]
    expect(version).toBeDefined()
    await expect(payload.restoreVersion({ collection: 'projects', id: version!.id, user: editor, overrideAccess: false })).rejects.toThrow()
  })

  it('cannot publish the homepage global but can save a draft of it', async () => {
    await expect(payload.updateGlobal({ slug: 'homepage', user: editor, overrideAccess: false, data: { _status: 'published' } })).rejects.toThrow()
    const saved = await payload.updateGlobal({ slug: 'homepage', user: editor, overrideAccess: false, draft: true, context: { draftSave: true }, locale: 'en', data: { _status: 'draft' } })
    expect(saved._status).toBe('draft')
    const live = await payload.findGlobal({ slug: 'homepage', overrideAccess: false, depth: 0 })
    expect(live._status).toBe('published')
  })
})

describe('users', () => {
  it('editor cannot elevate their own role (field silently discarded)', async () => {
    const updated = await payload.update({ collection: 'users', id: f.editorId, user: editor, overrideAccess: false, data: { role: 'admin', displayName: 'Renamed Editor' } })
    expect(updated.role).toBe('editor')
    expect(updated.displayName).toBe('Renamed Editor')
    const reread = await payload.findByID({ collection: 'users', id: f.editorId, overrideAccess: true })
    expect(reread.role).toBe('editor')
  })

  it('editor cannot read, update, create or delete other users', async () => {
    await expect(payload.findByID({ collection: 'users', id: f.adminId, user: editor, overrideAccess: false })).rejects.toThrow()
    await expect(payload.update({ collection: 'users', id: f.adminId, user: editor, overrideAccess: false, data: { displayName: 'x' } })).rejects.toThrow()
    await expect(payload.create({ collection: 'users', user: editor, overrideAccess: false, data: { email: 'new@example.com', password: 'Some-Passw0rd!!', displayName: 'New', role: 'editor' } })).rejects.toThrow()
    await expect(payload.delete({ collection: 'users', id: f.adminId, user: editor, overrideAccess: false })).rejects.toThrow()
  })

  it('admin cannot delete their own account', async () => {
    await expect(payload.delete({ collection: 'users', id: f.adminId, user: admin, overrideAccess: false })).rejects.toThrow()
  })
})

describe('content rules', () => {
  it('publishing requires both English and Arabic', async () => {
    const doc = await payload.create({ collection: 'projects', locale: 'en', user: admin, overrideAccess: false, data: { slug: 'needs-arabic', service: f.serviceId, visibility: 'private', title: 'Needs Arabic', summary: 'S', challenge: 'C', solution: 'So', _status: 'draft' } })
    await expect(payload.update({ collection: 'projects', id: doc.id, locale: 'en', user: admin, overrideAccess: false, data: { _status: 'published' } })).rejects.toThrow(/Arabic|\(ar\)/)
    await payload.update({ collection: 'projects', id: doc.id, locale: 'ar', user: admin, overrideAccess: false, draft: true, context: { draftSave: true }, data: { title: 'عنوان', summary: 'ملخص', challenge: 'التحدي', solution: 'الحل' } })
    const published = await payload.update({ collection: 'projects', id: doc.id, locale: 'en', user: admin, overrideAccess: false, data: { _status: 'published' } })
    expect(published._status).toBe('published')
    expect(published.reviewStatus).toBe('approved')
  })

  it('private galleries are only allowed on private projects', async () => {
    await expect(payload.update({ collection: 'projects', id: f.projects.publicPublished, locale: 'en', user: admin, overrideAccess: false, draft: true, data: { privateGallery: [f.privateMediaId] } })).rejects.toThrow(/private/i)
  })

  it('demo links must be https and not internal', async () => {
    for (const bad of ['http://demo.example.com', 'https://localhost/dash', 'https://10.0.0.5/x', 'javascript:alert(1)']) {
      await expect(payload.update({ collection: 'projects', id: f.projects.publicPublished, locale: 'en', user: admin, overrideAccess: false, draft: true, data: { demoURL: bad } })).rejects.toThrow()
    }
  })

  it('uploads are validated by content, not by declared type', async () => {
    const text = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>')
    await expect(payload.create({ collection: 'public-media', user: admin, overrideAccess: false, data: { alt: 'svg' }, file: { data: text, mimetype: 'image/svg+xml', name: 'evil.svg', size: text.length } })).rejects.toThrow()
    const fake = Buffer.from('definitely not an image')
    await expect(payload.create({ collection: 'public-media', user: admin, overrideAccess: false, data: { alt: 'fake' }, file: { data: fake, mimetype: 'image/png', name: 'fake.png', size: fake.length } })).rejects.toThrow()
    const png = await pngBuffer()
    await expect(payload.create({ collection: 'public-media', user: admin, overrideAccess: false, data: { alt: 'wrong ext' }, file: { data: png, mimetype: 'image/png', name: 'image.jpg', size: png.length } })).rejects.toThrow(/extension/i)
    const ok = await payload.create({ collection: 'public-media', user: editor, overrideAccess: false, locale: 'en', data: { alt: 'Valid png' }, file: { data: png, mimetype: 'image/png', name: 'valid.png', size: png.length } })
    expect(ok.mimeType).toBe('image/png')
  })
})
