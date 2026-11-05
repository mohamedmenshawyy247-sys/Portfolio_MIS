import { beforeAll, describe, expect, it } from 'vitest'
import { ADMIN, BASE_URL, EDITOR } from './env'
import { api, fixtures, json, login, pngBuffer, uploadForm, type Session } from './helpers'

const f = fixtures()
let admin: Session
let editor: Session

beforeAll(async () => {
  admin = await login(ADMIN.email, ADMIN.password)
  editor = await login(EDITOR.email, EDITOR.password)
})

type Doc = Record<string, unknown> & { _status?: string; id: number; slug?: string; visibility?: string }

describe('SEC-01..05 anonymous REST exposure', () => {
  it('lists only public + published projects, with no private fields even at depth=2', async () => {
    const res = await api('/api/projects?depth=2&limit=100')
    expect(res.status).toBe(200)
    const body = await json<{ docs: Doc[] }>(res)
    const slugs = body.docs.map((d) => d.slug)
    for (const slug of ['operations-monitoring-suite', 'quality-management-hub', 'executive-reporting-suite']) expect(slugs).toContain(slug)
    for (const doc of body.docs) {
      expect(doc.visibility).toBe('public')
      expect(doc._status).toBe('published')
      expect(doc).not.toHaveProperty('privateGallery')
      expect(doc).not.toHaveProperty('demoURL')
    }
    const text = JSON.stringify(body)
    expect(text).not.toContain('fixture-unlisted')
    expect(text).not.toContain('fixture-private')
    expect(text).not.toContain('private-media')
  })

  it('cannot fetch unlisted, private or draft projects by id or by slug query, nor drafts via draft=true', async () => {
    for (const id of [f.projects.unlistedPublished, f.projects.privatePublished, f.projects.draftOnly]) {
      expect([403, 404]).toContain((await api(`/api/projects/${id}?depth=2`)).status)
    }
    const bySlug = await json<{ totalDocs: number }>(await api('/api/projects?where[slug][equals]=fixture-unlisted'))
    expect(bySlug.totalDocs).toBe(0)
    const drafts = await json<{ docs: Doc[] }>(await api('/api/projects?draft=true&limit=100'))
    expect(drafts.docs.some((d) => d._status !== 'published')).toBe(false)
  })

  it('denies versions, users, private media, leads and GraphQL', async () => {
    expect([401, 403]).toContain((await api('/api/projects/versions')).status)
    expect([401, 403]).toContain((await api('/api/users')).status)
    expect([401, 403]).toContain((await api('/api/private-media')).status)
    expect([401, 403, 404]).toContain((await api(`/api/private-media/${f.privateMediaId}`)).status)
    expect([401, 403]).toContain((await api('/api/leads', { body: { name: 'x', email: 'a@b.co', message: 'hello there' } })).status)
    expect([401, 403]).toContain((await api('/api/users', { body: { email: 'z@example.com', password: 'Passw0rd-123456', displayName: 'z', role: 'admin' } })).status)
    expect((await api('/api/graphql', { method: 'POST', body: { query: '{ __typename }' } })).status).toBe(404)
  })
})

describe('SEC-06/07 private media delivery', () => {
  it('anonymous direct file URL never returns the file body', async () => {
    const res = await api(`/api/private-media/file/${f.privateMediaFilename}`)
    expect([401, 403, 404]).toContain(res.status)
    expect(res.headers.get('content-type') ?? '').not.toMatch(/^image\//)
  })

  it('staff can fetch the same file', async () => {
    const res = await api(`/api/private-media/file/${f.privateMediaFilename}`, { session: editor })
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toMatch(/^image\/png/)
  })

  it('the image optimizer refuses private media and serves public media', async () => {
    const priv = await fetch(`${BASE_URL}/_next/image?url=${encodeURIComponent(`/api/private-media/file/${f.privateMediaFilename}`)}&w=640&q=75`)
    expect(priv.status).toBe(400)
    const pub = await fetch(`${BASE_URL}/_next/image?url=${encodeURIComponent(`/api/public-media/file/${f.publicMediaFilename}`)}&w=64&q=75`)
    expect(pub.status).toBe(200)
    expect(pub.headers.get('content-type')).toMatch(/^image\//)
  })
})

describe('public media approval gate', () => {
  it('unapproved public assets are invisible to visitors but visible to staff', async () => {
    const list = await json<{ docs: { id: number }[] }>(await api('/api/public-media?limit=100'))
    expect(list.docs.map((d) => d.id)).not.toContain(f.unapprovedPublicMediaId)
    expect([403, 404]).toContain((await api(`/api/public-media/${f.unapprovedPublicMediaId}`)).status)
    const file = await api(`/api/public-media/file/${f.unapprovedPublicMediaFilename}`)
    expect([401, 403, 404]).toContain(file.status)
    expect(file.headers.get('content-type') ?? '').not.toMatch(/^image\//)
    const optimizer = await fetch(`${BASE_URL}/_next/image?url=${encodeURIComponent(`/api/public-media/file/${f.unapprovedPublicMediaFilename}`)}&w=64&q=75`)
    expect(optimizer.status).not.toBe(200)
    expect((await api(`/api/public-media/file/${f.unapprovedPublicMediaFilename}`, { session: editor })).status).toBe(200)
  })

  it('an unapproved cover is never rendered on the public page; an approved one is', async () => {
    const id = f.projects.publicPublished
    const setCover = (cover: null | number) => api(`/api/projects/${id}?locale=en`, { method: 'PATCH', session: admin, body: { cover, _status: 'published' } })
    expect((await setCover(f.unapprovedPublicMediaId)).status).toBe(200)
    const withUnapproved = await (await fetch(`${BASE_URL}/en/projects/operations-monitoring-suite`)).text()
    expect(withUnapproved).not.toContain(f.unapprovedPublicMediaFilename)
    expect((await setCover(f.publicMediaId)).status).toBe(200)
    const withApproved = await (await fetch(`${BASE_URL}/en/projects/operations-monitoring-suite`)).text()
    expect(withApproved).toContain(`/api/public-media/file/`)
    expect((await setCover(null)).status).toBe(200)
  })
})

describe('SEC-08 editor publication boundary over REST', () => {
  const id = () => f.projects.publicPublished

  it('cannot publish, live-write or unpublish a published project', async () => {
    expect((await api(`/api/projects/${id()}?locale=en`, { method: 'PATCH', session: editor, body: { _status: 'published' } })).status).toBe(403)
    expect((await api(`/api/projects/${id()}?locale=en`, { method: 'PATCH', session: editor, body: { title: 'live write' } })).status).toBe(403)
    expect((await api(`/api/projects/${id()}?locale=en`, { method: 'PATCH', session: editor, body: { _status: 'draft' } })).status).toBe(403)
    expect((await api(`/api/projects/${id()}?draft=true`, { method: 'PATCH', session: editor, body: { _status: 'published' } })).status).toBe(403)
    expect((await api('/api/projects', { method: 'POST', session: editor, body: { slug: 'rest-publish-attempt', service: f.serviceId, visibility: 'public', title: 'T', summary: 'S', challenge: 'C', solution: 'So', _status: 'published' } })).status).toBe(403)
  })

  it('can save a draft of a published project; the public page keeps the live title', async () => {
    const res = await api(`/api/projects/${id()}?draft=true&locale=en`, { method: 'PATCH', session: editor, body: { title: 'Editor REST draft', reviewStatus: 'in-review' } })
    expect(res.status).toBe(200)
    const live = await json<{ title: string }>(await api(`/api/projects/${id()}?locale=en`))
    expect(live.title).toBe('Operations Monitoring Suite')
    const html = await (await fetch(`${BASE_URL}/en/projects/operations-monitoring-suite`)).text()
    expect(html).toContain('Operations Monitoring Suite')
    expect(html).not.toContain('Editor REST draft')
  })

  it('cannot restore a published version, admin can publish', async () => {
    const versions = await json<{ docs: { id: number }[] }>(await api(`/api/projects/versions?where[parent][equals]=${id()}&where[version._status][equals]=published&limit=1`, { session: admin }))
    expect(versions.docs.length).toBe(1)
    expect((await api(`/api/projects/versions/${versions.docs[0]!.id}`, { method: 'POST', session: editor })).status).toBe(403)
    const publish = await api(`/api/projects/${id()}?locale=en`, { method: 'PATCH', session: admin, body: { _status: 'published' } })
    expect(publish.status).toBe(200)
    const after = await json<{ doc: { title: string; reviewStatus: string } }>(publish)
    expect(after.doc.title).toBe('Editor REST draft')
    expect(after.doc.reviewStatus).toBe('approved')
    // restore the original title so later tests and screenshots stay stable
    expect((await api(`/api/projects/${id()}?locale=en`, { method: 'PATCH', session: admin, body: { title: 'Operations Monitoring Suite', _status: 'published' } })).status).toBe(200)
  })
})

describe('adversarial review regressions', () => {
  it('exit-preview never redirects off-site (backslash / protocol-relative / scheme tricks)', async () => {
    // The last five normalise to the scheme-relative `//evil.com` once WHATWG dot-segment removal runs.
    for (const bad of ['/\\evil.com', '/\\/evil.com', '//evil.com', 'https://evil.com', '/%5Cevil.com', '/en/projects\u0000', '/.//evil.com', '/..//evil.com', '/%2e//evil.com', '/en/%2e%2e//evil.com?x=1', '/en/..//evil.com']) {
      const res = await api(`/exit-preview?path=${encodeURIComponent(bad)}`)
      expect([302, 307]).toContain(res.status)
      const location = res.headers.get('location') ?? ''
      // The property that matters: wherever the browser ends up, it is our own origin.
      expect(new URL(location, BASE_URL).origin, bad).toBe(new URL(BASE_URL).origin)
      expect(location, bad).toMatch(/^(\/|http:\/\/localhost:3000\/)$/)
    }
    const good = await api(`/exit-preview?path=${encodeURIComponent('/ar/projects?x=1')}`)
    expect(good.headers.get('location') ?? '').toMatch(/\/ar\/projects\?x=1$/)
  })

  it('system routes are never redirect targets, even percent-encoded or via dot segments', async () => {
    for (const bad of ['/admin', '/%61dmin', '/Admin/collections', '/en/../api/users/me', '/_next/static/x', '/exit-preview?path=/x', '/%zz']) {
      const res = await api(`/exit-preview?path=${encodeURIComponent(bad)}`)
      expect([302, 307]).toContain(res.status)
      expect(res.headers.get('location') ?? '', bad).toMatch(/^(\/|http:\/\/localhost:3000\/)$/)
    }
  })

  it('homepage drafts are never served to visitors, even with ?draft=true', async () => {
    const saved = await api('/api/globals/homepage?draft=true&locale=en', { method: 'POST', session: editor, body: { _status: 'draft', sections: [{ blockType: 'hero', headline: 'LEAKED-DRAFT-MARKER' }] } })
    expect(saved.status).toBe(200)
    const anonDraft = await api('/api/globals/homepage?draft=true&depth=0&locale=en')
    expect(JSON.stringify(await anonDraft.json())).not.toContain('LEAKED-DRAFT-MARKER')
    const anonLive = await api('/api/globals/homepage?depth=0&locale=en')
    expect(JSON.stringify(await anonLive.json())).not.toContain('LEAKED-DRAFT-MARKER')
    const html = await (await fetch(`${BASE_URL}/en`)).text()
    expect(html).not.toContain('LEAKED-DRAFT-MARKER')
    const staffDraft = await api('/api/globals/homepage?draft=true&depth=0&locale=en', { session: editor })
    expect(JSON.stringify(await staffDraft.json())).toContain('LEAKED-DRAFT-MARKER')
  })

  it('only admins can unlock accounts', async () => {
    expect([401, 403]).toContain((await api('/api/users/unlock', { session: editor, body: { email: ADMIN.email } })).status)
    expect([401, 403]).toContain((await api('/api/users/unlock', { body: { email: ADMIN.email } })).status)
    expect((await api('/api/users/unlock', { session: admin, body: { email: EDITOR.email } })).status).toBe(200)
  })

  it('non-canonical status values are rejected with 400, never 500, and never publish', async () => {
    const id = f.projects.draftOnly
    for (const body of [{ _status: ['published'] }, { _status: 'Published' }, { _status: { x: 'published' } }, { reviewStatus: ['approved'] }, { reviewStatus: 'Approved' }]) {
      const res = await api(`/api/projects/${id}?locale=en`, { method: 'PATCH', session: editor, body })
      expect([400, 403], JSON.stringify(body)).toContain(res.status)
    }
    const adminBad = await api(`/api/projects/${id}?locale=en`, { method: 'PATCH', session: admin, body: { _status: ['published'] } })
    expect(adminBad.status).toBe(400)
    expect([403, 404]).toContain((await api(`/api/projects/${id}`)).status)
  })
})

describe('access-control review regressions', () => {
  type Block = Record<string, unknown> & { blockType: string; id?: null | string }
  type HomepageDoc = { _status?: string; sections?: Block[] | null }
  const homepage = async (query: string, session: null | Session = null) => json<HomepageDoc>(await api(`/api/globals/homepage?depth=0&${query}`, { session }))
  const saveHomepage = (query: string, body: Record<string, unknown>, session: Session = admin) => api(`/api/globals/homepage?depth=0&${query}`, { method: 'POST', session, body })
  /** Drops null-valued keys so a document written back through REST compares equal to its snapshot. */
  const strip = <T>(value: T): T => JSON.parse(JSON.stringify(value, (_key, v: unknown) => (v === null ? undefined : v))) as T
  /** The live homepage in both languages, block ids included, so a test can put it back exactly as it found it. */
  const snapshotHomepage = async () => ({ en: (await homepage('locale=en', admin)).sections ?? [], ar: (await homepage('locale=ar', admin)).sections ?? [] })
  const restoreHomepage = async (snap: { ar: Block[]; en: Block[] }) => {
    expect((await saveHomepage('locale=en&draft=true', { sections: snap.en })).status).toBe(200)
    expect((await saveHomepage('locale=ar&draft=true', { sections: snap.ar })).status).toBe(200)
    expect((await saveHomepage('locale=en', { _status: 'published' })).status).toBe(200)
    expect(strip((await homepage('locale=en')).sections ?? [])).toEqual(strip(snap.en))
    expect(strip((await homepage('locale=ar')).sections ?? [])).toEqual(strip(snap.ar))
  }

  it('version history and version restore are admin-only, for globals and collections', async () => {
    for (const path of ['/api/globals/homepage/versions', '/api/projects/versions', '/api/services/versions']) {
      expect((await api(path, { session: editor })).status, path).toBe(403)
      expect((await api(path, { session: admin })).status, path).toBe(200)
    }
    const versions = await json<{ docs: { id: number }[] }>(await api('/api/globals/homepage/versions?limit=1', { session: admin }))
    expect(versions.docs.length).toBe(1)
    const versionId = versions.docs[0]!.id
    const before = await homepage('locale=en')
    expect(before._status).toBe('published')
    // Payload's global restore runs no beforeChange hooks; it must be stopped by readVersions.
    for (const query of ['', '?draft=true']) {
      expect((await api(`/api/globals/homepage/versions/${versionId}${query}`, { method: 'POST', session: editor })).status, query).toBe(403)
    }
    expect([403, 404]).toContain((await api(`/api/globals/homepage/versions/${versionId}`, { session: editor })).status)
    expect(await homepage('locale=en')).toEqual(before)
  })

  it('editors cannot approve public media or touch approved assets; admins can', async () => {
    const unapproved = `/api/public-media/${f.unapprovedPublicMediaId}`
    const approved = `/api/public-media/${f.publicMediaId}`
    // Payload drops the field for editors (field-level access): the save succeeds, the asset stays unapproved.
    const attempt = await api(`${unapproved}?locale=en`, { method: 'PATCH', session: editor, body: { approvedForPublic: true, caption: 'editor caption' } })
    expect(attempt.status).toBe(200)
    const attempted = await json<{ doc: { approvedForPublic: boolean; caption?: null | string } }>(attempt)
    expect(attempted.doc.approvedForPublic).toBe(false)
    expect(attempted.doc.caption).toBe('editor caption')
    expect([403, 404]).toContain((await api(unapproved)).status)
    // Approved assets may be in use on published pages: no edits and no file replacement by editors.
    expect([403, 404]).toContain((await api(`${approved}?locale=en`, { method: 'PATCH', session: editor, body: { alt: 'editor touch' } })).status)
    const png = await pngBuffer()
    expect([403, 404]).toContain((await api(`${approved}?locale=en`, { method: 'PATCH', session: editor, raw: uploadForm({ buffer: png, name: 'swap.png', type: 'image/png' }, { alt: 'swap' }) })).status)
    const asAdmin = await json<{ alt: string }>(await api(`${approved}?locale=en`, { session: admin }))
    expect(asAdmin.alt).toBe('Fixture public image')
    // Claiming approval on upload is dropped the same way.
    const upload = await api('/api/public-media?locale=en', { session: editor, raw: uploadForm({ buffer: png, name: 'claim.png', type: 'image/png' }, { alt: 'Claimed approval', approvedForPublic: true }) })
    expect(upload.status).toBe(201)
    const uploaded = await json<{ doc: { approvedForPublic: boolean; id: number } }>(upload)
    expect(uploaded.doc.approvedForPublic).toBe(false)
    expect([403, 404]).toContain((await api(`/api/public-media/${uploaded.doc.id}`)).status)
    // Admins approve; the fixture is then put back exactly as it was found.
    const approve = await api(`${unapproved}?locale=en`, { method: 'PATCH', session: admin, body: { approvedForPublic: true } })
    expect(approve.status).toBe(200)
    expect((await json<{ doc: { approvedForPublic: boolean } }>(approve)).doc.approvedForPublic).toBe(true)
    expect((await api(unapproved)).status).toBe(200)
    const revert = await api(`${unapproved}?locale=en`, { method: 'PATCH', session: admin, body: { approvedForPublic: false, caption: null } })
    expect(revert.status).toBe(200)
    expect((await json<{ doc: { approvedForPublic: boolean } }>(revert)).doc.approvedForPublic).toBe(false)
    expect([403, 404]).toContain((await api(unapproved)).status)
  })

  it('admins cannot delete their own account, by id or through the bulk route', async () => {
    expect((await api(`/api/users/${f.adminId}`, { method: 'DELETE', session: admin })).status).toBe(403)
    const bulk = await api(`/api/users?where[id][equals]=${f.adminId}`, { method: 'DELETE', session: admin })
    expect(bulk.status).toBe(200)
    const result = await json<{ docs: unknown[]; errors: unknown[] }>(bulk)
    expect(result.docs).toEqual([])
    expect(result.errors).toEqual([])
    const me = await api('/api/users/me', { session: admin })
    expect(me.status).toBe(200)
    expect((await json<{ user: null | { id: number } }>(me)).user?.id).toBe(f.adminId)
    expect((await api(`/api/users/${f.adminId}`, { session: admin })).status).toBe(200)
  })

  it('editors cannot publish or unpublish through the locale query flags; admins can', async () => {
    const id = f.projects.publicPublished
    for (const flag of ['draft=true&unpublishAllLocales=true', 'unpublishAllLocales=true', 'draft=true&publishAllLocales=true', 'publishSpecificLocale=en', 'draft=true&publishSpecificLocale=en']) {
      expect((await api(`/api/projects/${id}?locale=en&${flag}`, { method: 'PATCH', session: editor, body: { title: 'x' } })).status, flag).toBe(403)
      expect((await api(`/api/globals/homepage?locale=en&${flag}`, { method: 'POST', session: editor, body: {} })).status, flag).toBe(403)
    }
    const live = await json<Doc>(await api(`/api/projects/${id}?locale=en`))
    expect(live._status).toBe('published')
    expect(live.title).toBe('Operations Monitoring Suite')
    expect((await homepage('locale=en'))._status).toBe('published')
    const unlisted = f.projects.unlistedPublished
    const adminPublish = await api(`/api/projects/${unlisted}?locale=en&publishSpecificLocale=en`, { method: 'PATCH', session: admin, body: { _status: 'published' } })
    expect(adminPublish.status).toBe(200)
    expect((await json<{ doc: Doc }>(adminPublish)).doc._status).toBe('published')
    const after = await json<Doc & { title: string }>(await api(`/api/projects/${unlisted}?locale=en`, { session: editor }))
    expect(after._status).toBe('published')
    expect(after.title).toBe('Fixture Unlisted')
  })

  it('homepage CTA links must be safe internal paths or https:// URLs', async () => {
    const snap = await snapshotHomepage()
    // A CTA block that exists in both languages, so only the link decides whether publishing works.
    const cta = { blockType: 'cta', heading: 'اكتشف', label: 'اذهب', href: '/ar/projects' }
    expect((await saveHomepage('locale=ar&draft=true', { sections: [...snap.ar, cta] })).status).toBe(200)
    const arDraft = (await homepage('locale=ar&draft=true', admin)).sections ?? []
    const ctaId = arDraft[arDraft.length - 1]?.id
    expect(ctaId).toBeTruthy()
    const publishWith = (href: string) => saveHomepage('locale=en', { _status: 'published', sections: [...snap.en, { ...cta, id: ctaId, heading: 'Discover', label: 'Go', href }] })
    for (const bad of ['/\\evil.com', '/\\/evil.com', '//evil.com', '/.//evil.com', '/%5Cevil.com', 'javascript:alert(1)', 'http://example.org/x', '/admin']) {
      const res = await publishWith(bad)
      expect(res.status, bad).toBe(400)
      expect(JSON.stringify(await res.json()), bad).toMatch(/href|Link/)
    }
    expect(strip((await homepage('locale=en')).sections ?? [])).toEqual(strip(snap.en))
    for (const good of ['/en/projects', 'https://example.org/x']) {
      expect((await publishWith(good)).status, good).toBe(200)
      const live = (await homepage('locale=en')).sections ?? []
      expect(live[live.length - 1]?.href, good).toBe(good)
    }
    await restoreHomepage(snap)
  })

  it('the homepage cannot be published while a block lacks its text in one language', async () => {
    const snap = await snapshotHomepage()
    expect((await saveHomepage('locale=ar&draft=true', { sections: snap.ar })).status).toBe(200)
    const englishOnly = { blockType: 'introduction', heading: 'English-only heading', text: 'Still waiting for a translation.' }
    expect((await saveHomepage('locale=en&draft=true', { sections: [...snap.en, englishOnly] })).status).toBe(200)
    const publish = await saveHomepage('locale=en', { _status: 'published' })
    expect(publish.status).toBe(400)
    const message = JSON.stringify(await publish.json())
    expect(message).toMatch(/Arabic|\(ar\)/)
    expect(message).toContain(`sections[${snap.en.length}].heading (ar)`)
    expect(strip((await homepage('locale=en')).sections ?? [])).toEqual(strip(snap.en))
    // Add the Arabic heading to the same block (matched by id) and the publish goes through.
    const draft = (await homepage('locale=en&draft=true', admin)).sections ?? []
    const added = draft[snap.en.length]
    expect(added?.heading).toBe('English-only heading')
    expect((await saveHomepage('locale=ar&draft=true', { sections: [...snap.ar, { ...added, heading: 'عنوان بالعربية', text: 'نص عربي' }] })).status).toBe(200)
    expect((await saveHomepage('locale=en', { _status: 'published' })).status).toBe(200)
    expect(JSON.stringify(await homepage('locale=ar'))).toContain('عنوان بالعربية')
    // The other direction is refused too: an Arabic-only block cannot be published from the Arabic editor.
    const arLive = (await homepage('locale=ar', admin)).sections ?? []
    expect((await saveHomepage('locale=ar&draft=true', { sections: [...arLive, { blockType: 'cta', heading: 'عربي فقط', label: 'اذهب', href: '/ar/projects' }] })).status).toBe(200)
    const arPublish = await saveHomepage('locale=ar', { _status: 'published' })
    expect(arPublish.status).toBe(400)
    expect(JSON.stringify(await arPublish.json())).toContain(`sections[${arLive.length}].heading (en)`)
    await restoreHomepage(snap)
  })
})

describe('SEC-17 user management over REST', () => {
  it('editor cannot elevate their own role or touch other users', async () => {
    const self = await api(`/api/users/${f.editorId}`, { method: 'PATCH', session: editor, body: { role: 'admin' } })
    expect(self.status).toBe(200)
    const me = await json<{ user: { role: string } }>(await api('/api/users/me', { session: editor }))
    expect(me.user.role).toBe('editor')
    expect([403, 404]).toContain((await api(`/api/users/${f.adminId}`, { method: 'PATCH', session: editor, body: { displayName: 'pwned' } })).status)
    expect([401, 403]).toContain((await api('/api/users', { method: 'POST', session: editor, body: { email: 'e2@example.com', password: 'Passw0rd-123456', displayName: 'e2', role: 'editor' } })).status)
    expect([403, 404]).toContain((await api(`/api/users/${f.adminId}`, { method: 'DELETE', session: editor })).status)
    expect([401, 403, 404]).toContain((await api(`/api/users/${f.adminId}`, { session: editor })).status)
  })
})

describe('SEC-11 uploads over REST (multipart, as editor)', () => {
  it('rejects SVG, spoofed content, wrong extensions and oversize files; accepts a real PNG', async () => {
    const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>')
    expect((await api('/api/public-media', { session: editor, raw: uploadForm({ buffer: svg, name: 'x.svg', type: 'image/svg+xml' }, { alt: 'svg' }) })).status).toBe(400)
    const fake = Buffer.from('GIF89a this is not really an image payload but a text file')
    const fakeRes = await api('/api/public-media', { session: editor, raw: uploadForm({ buffer: fake, name: 'x.png', type: 'image/png' }, { alt: 'fake' }) })
    expect(fakeRes.status).toBeGreaterThanOrEqual(400)
    expect(fakeRes.status).toBeLessThan(500)
    const png = await pngBuffer()
    expect((await api('/api/public-media', { session: editor, raw: uploadForm({ buffer: png, name: 'x.jpg', type: 'image/png' }, { alt: 'ext' }) })).status).toBe(400)
    const big = Buffer.concat([png.subarray(0, 64), Buffer.alloc(9 * 1024 * 1024)])
    const bigRes = await api('/api/public-media', { session: editor, raw: uploadForm({ buffer: big, name: 'big.png', type: 'image/png' }, { alt: 'big' }) })
    expect(bigRes.status).toBeGreaterThanOrEqual(400)
    expect(bigRes.status).toBeLessThan(500)
    const ok = await api('/api/public-media?locale=en', { session: editor, raw: uploadForm({ buffer: png, name: 'good.png', type: 'image/png' }, { alt: 'Good image' }) })
    expect(ok.status).toBe(201)
  })
})

describe('SEC-09/18 authenticated draft preview', () => {
  const secret = process.env.PREVIEW_SECRET ?? ''
  const path = '/en/projects/fixture-draft'
  /** Browsers always send Sec-Fetch-Site; Payload only accepts cookie sessions when it (or an allowed Origin) is present. */
  const browser = (cookie: string) => ({ cookie, 'sec-fetch-site': 'same-origin' })

  it('ignores a session cookie that is not sent by a browser navigation (Payload CSRF rule)', async () => {
    expect((await api(`/preview?secret=${secret}&path=${encodeURIComponent(path)}`, { headers: { cookie: admin.cookie } })).status).toBe(403)
  })

  it('needs the secret and a staff session; non-relative paths are refused', async () => {
    expect((await api(`/preview?secret=wrong&path=${encodeURIComponent(path)}`)).status).toBe(403)
    expect((await api(`/preview?secret=${secret}&path=${encodeURIComponent(path)}`)).status).toBe(403)
    expect((await api(`/preview?secret=${secret}&path=${encodeURIComponent('https://evil.example/')}`, { headers: browser(admin.cookie) })).status).toBe(400)
    expect((await api(`/preview?secret=${secret}&path=${encodeURIComponent('/admin')}`, { headers: browser(admin.cookie) })).status).toBe(400)
  })

  it('shows drafts only while the Payload session is valid, and exit-preview ends it', async () => {
    // anonymous: draft project is a 404
    expect((await fetch(`${BASE_URL}${path}`)).status).toBe(404)
    const enter = await api(`/preview?secret=${secret}&path=${encodeURIComponent(path)}`, { headers: browser(admin.cookie) })
    expect([302, 307]).toContain(enter.status)
    expect(enter.headers.get('location')).toContain(path)
    const bypass = (enter.headers.getSetCookie?.() ?? []).map((c) => c.split(';')[0]).find((c) => c.startsWith('__prerender_bypass'))
    expect(bypass).toBeTruthy()
    const withSession = await fetch(`${BASE_URL}${path}`, { headers: browser(`${admin.cookie}; ${bypass}`) })
    expect(withSession.status).toBe(200)
    const html = await withSession.text()
    expect(html).toContain('Fixture Draft Only')
    expect(html).toContain('preview-bar')
    expect(html).toMatch(/<meta name="robots" content="noindex/)
    // draft-mode cookie alone (session gone / logged out): back to 404
    const cookieOnly = await fetch(`${BASE_URL}${path}`, { headers: browser(`${bypass}`) })
    expect(cookieOnly.status).toBe(404)
    // staff can also see private projects in preview
    const priv = await fetch(`${BASE_URL}/en/projects/fixture-private`, { headers: browser(`${editor.cookie}; ${bypass}`) })
    expect(priv.status).toBe(200)
    const exit = await api(`/exit-preview?path=${encodeURIComponent('/en')}`, { headers: browser(`${admin.cookie}; ${bypass}`) })
    expect([302, 307]).toContain(exit.status)
    expect((exit.headers.getSetCookie?.() ?? []).some((c) => c.startsWith('__prerender_bypass') && /Max-Age=0|Expires=/i.test(c))).toBe(true)
  })
})
