import { describe, expect, it } from 'vitest'
import { BASE_URL } from './env'

const get = (path: string) => fetch(`${BASE_URL}${path}`, { redirect: 'manual' })

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

  it('redirects / to /en and 404s unknown locales, slugs and traversal attempts', async () => {
    const root = await get('/')
    expect([307, 308]).toContain(root.status)
    expect(root.headers.get('location')).toMatch(/\/en$/)
    for (const p of ['/xx', '/en/projects/does-not-exist', '/en/projects/..%2Fadmin', '/en/projects/UPPER', '/fr/about']) {
      const res = await get(p)
      expect(res.status, p).toBe(404)
    }
    expect(await (await get('/en/projects/does-not-exist')).text()).toContain('Page not found')
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
})
