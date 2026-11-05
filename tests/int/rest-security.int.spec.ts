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
    for (const bad of ['/\\evil.com', '/\\/evil.com', '//evil.com', 'https://evil.com', '/%5Cevil.com', '/en/projects\u0000']) {
      const res = await api(`/exit-preview?path=${encodeURIComponent(bad)}`)
      expect([302, 307]).toContain(res.status)
      const location = res.headers.get('location') ?? ''
      expect(location, bad).not.toMatch(/evil/)
      expect(location, bad).toMatch(/^(\/|http:\/\/localhost:3000\/)$/)
    }
    const good = await api(`/exit-preview?path=${encodeURIComponent('/ar/projects?x=1')}`)
    expect(good.headers.get('location') ?? '').toMatch(/\/ar\/projects\?x=1$/)
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
