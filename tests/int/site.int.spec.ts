import { describe, expect, it } from 'vitest'
import { BASE_URL } from './env'
import { fixtures } from './helpers'

const get = (path: string) => fetch(`${BASE_URL}${path}`, { redirect: 'manual' })
const f = fixtures()

describe('public site', () => {
  it('serves both locales with the right direction and CMS homepage blocks', async () => {
    const en = await (await get('/en')).text()
    expect(en).toContain('<html lang="en" dir="ltr">')
    // The accent span is presentation only; the sentence must still read as one headline.
    expect(en).toMatch(/Operational (<span class="accent">)?Intelligence(<\/span>)? That Drives Decisions\./)
    expect(en).toContain('Collect')
    const ar = await (await get('/ar')).text()
    expect(ar).toContain('<html lang="ar" dir="rtl">')
    expect(ar).toContain('ذكاء تشغيلي')
  })

  it('redirects / to the SiteSettings default locale (/en for the seeded settings)', async () => {
    const root = await get('/')
    expect([307, 308]).toContain(root.status)
    expect(root.headers.get('location')).toMatch(/\/en$/)
  })

  it('404s unknown locales, slugs and traversal attempts', async () => {
    for (const p of ['/xx', '/en/projects/does-not-exist', '/en/projects/..%2Fadmin', '/en/projects/UPPER', '/fr/about']) {
      const res = await get(p)
      expect(res.status, p).toBe(404)
    }
    expect(await (await get('/en/projects/does-not-exist')).text()).toContain('Page not found')
  })

  it('404s are styled and bilingual: unmatched paths server-rendered, page-level notFound() with the same page', async () => {
    const strip = (html: string) => html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, '')
    // URLs that match no route: src/app/global-not-found.tsx is a complete server-rendered document.
    for (const path of ['/en/nope', '/ar/x/y']) {
      const res = await get(path)
      expect(res.status, path).toBe(404)
      const body = strip(await res.text())
      expect(body, path).toContain('<html lang="en" dir="ltr">')
      expect(body, path).toMatch(/<link[^>]+rel="stylesheet"/)
      expect(body, path).toContain('page-hero not-found')
      expect(body, path).toContain('Page not found')
      expect(body, path).toContain('الصفحة غير موجودة')
      expect(body, path).not.toContain('This page could not be found')
    }
    // notFound() from a dynamic page (unknown locale, missing slug) and paths outside any locale: Next answers
    // 404 + noindex with its minimal document and renders the self-styled [locale]/not-found.tsx from the
    // payload on the client (the browser test '404 page renders styled' covers what visitors see).
    for (const path of ['/xx', '/en/projects/does-not-exist', '/nope']) {
      const res = await get(path)
      expect(res.status, path).toBe(404)
      const html = await res.text()
      expect(html, path).toMatch(/<meta name="robots" content="noindex"/)
      expect(html, path).toContain('page-hero not-found')
      expect(html, path).toContain('الصفحة غير موجودة')
      expect(html, path).toContain('.nf a.button{')
    }
  })

  it('lists only public projects; unlisted is reachable by exact link with noindex; private/draft are 404', async () => {
    const list = await (await get('/en/projects')).text()
    expect(list).toContain('Operations Monitoring Suite')
    expect(list).not.toContain('Fixture Unlisted')
    expect(list).not.toContain('Fixture Private')
    expect(list).not.toContain('Fixture Draft Only')
    const unlisted = await get('/en/projects/fixture-unlisted')
    expect(unlisted.status).toBe(200)
    const html = await unlisted.text()
    expect(html).toContain('Fixture Unlisted')
    expect(html).toMatch(/<meta name="robots" content="noindex/)
    expect((await get('/en/projects/fixture-private')).status).toBe(404)
    expect((await get('/en/projects/fixture-draft')).status).toBe(404)
  })

  it('sitemap and robots exclude everything that is not public and published', async () => {
    const sitemap = await (await get('/sitemap.xml')).text()
    expect(sitemap).toContain('/en/projects/operations-monitoring-suite')
    expect(sitemap).toContain('/ar/projects/operations-monitoring-suite')
    expect(sitemap).not.toContain('fixture-unlisted')
    expect(sitemap).not.toContain('fixture-private')
    expect(sitemap).not.toContain('fixture-draft')
    const robots = await get('/robots.txt')
    expect(robots.status).toBe(200)
    const text = await robots.text()
    expect(text).toContain('Disallow: /admin')
    expect(text).toContain('Disallow: /api/')
    expect(text).toContain('Sitemap:')
  })

  it('language switch keeps the current page, and security headers are set', async () => {
    const res = await get('/en/projects/operations-monitoring-suite')
    const html = await res.text()
    expect(html).toContain('href="/ar/projects/operations-monitoring-suite"')
    expect(html).toMatch(/hreflang="ar"/i)
    expect(res.headers.get('x-content-type-options')).toBe('nosniff')
    expect(res.headers.get('x-frame-options')).toBe('SAMEORIGIN')
    expect(res.headers.get('x-powered-by')).toBeNull()
  })

  it('hreflang alternates are absolute URLs on the site origin (metadataBase)', async () => {
    const html = await (await get('/en')).text()
    // React renders the attribute as hrefLang; attribute order inside the tag is not guaranteed.
    const alternates = html.match(/<link[^>]*rel="alternate"[^>]*>/gi) ?? []
    const ar = alternates.find((tag) => /hreflang="ar"/i.test(tag))
    expect(ar, alternates.join('\n')).toBeDefined()
    expect(ar).toContain(`href="${BASE_URL}/ar"`)
    expect(alternates.find((tag) => /hreflang="en"/i.test(tag))).toContain(`href="${BASE_URL}/en"`)
  })
})

describe('public media delivery', () => {
  it('serves approved files only through the access-checked endpoint, never from public/ at /media/<name>', async () => {
    const approved = await get(`/api/public-media/file/${f.publicMediaFilename}`)
    expect(approved.status).toBe(200)
    expect(approved.headers.get('content-type')).toMatch(/^image\/png/)
    const unapproved = await get(`/api/public-media/file/${f.unapprovedPublicMediaFilename}`)
    expect([403, 404]).toContain(unapproved.status)
    expect(unapproved.headers.get('content-type') ?? '').not.toMatch(/^image\//)
    // Next serves everything under public/ at its path with no access check. Uploads are stored in
    // uploads/public-media (PUBLIC_MEDIA_DIR) precisely so that no file is ever reachable this way.
    for (const name of [f.publicMediaFilename, f.unapprovedPublicMediaFilename]) {
      const res = await get(`/media/${name}`)
      expect(res.status, `/media/${name}`).not.toBe(200)
      expect(res.headers.get('content-type') ?? '', `/media/${name}`).not.toMatch(/^image\//)
    }
  })
})
