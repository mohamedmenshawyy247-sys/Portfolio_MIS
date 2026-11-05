import { createReadStream, existsSync, statSync } from 'node:fs'
import { createServer, type Server } from 'node:http'
import { extname, join, normalize, resolve } from 'node:path'
import { expect, test } from '@playwright/test'
import { expectNoHorizontalOverflow, shot, WIDTHS } from './helpers'

/** The GitHub Pages preview is plain HTML/JS/CSS in docs/. It is a demo, not the CMS. */
const DOCS = resolve(process.cwd(), 'docs')
const types: Record<string, string> = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png' }
let server: Server
let origin = ''

test.beforeAll(async () => {
  server = createServer((req, res) => {
    const path = normalize(decodeURIComponent((req.url ?? '/').split('?')[0]!)).replace(/^(\.\.[/\\])+/, '')
    const file = join(DOCS, path === '/' ? 'index.html' : path)
    if (!file.startsWith(DOCS) || !existsSync(file) || statSync(file).isDirectory()) {
      res.statusCode = 404
      return res.end('not found')
    }
    res.setHeader('content-type', types[extname(file)] ?? 'application/octet-stream')
    createReadStream(file).pipe(res)
  })
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', () => r()))
  const address = server.address()
  origin = typeof address === 'object' && address ? `http://127.0.0.1:${address.port}` : ''
})

test.afterAll(async () => {
  await new Promise<void>((r) => server.close(() => r()))
})

for (const width of WIDTHS) {
  test(`static preview @${width}px: EN and AR render without overflow`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto(`${origin}/index.html`)
    await expect(page.locator('#serviceCards .service-card')).toHaveCount(3)
    await expectNoHorizontalOverflow(page, `static en ${width}`)
    await page.locator('[data-lang="ar"]').click()
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
    await expect(page.locator('h1')).toContainText('ذكاء')
    await expectNoHorizontalOverflow(page, `static ar ${width}`)
    if (width === 390 || width === 1440) await page.screenshot({ path: shot(`static-home-ar-${width}`), fullPage: true })
    await page.locator('[data-lang="en"]').click()
  })
}

test('static preview: gallery filters, case study and the design-only admin banner', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 900 })
  await page.goto(`${origin}/projects.html`)
  await expect(page.locator('#gallery .gallery-card')).toHaveCount(3)
  await page.locator('[data-filter="quality"]').click()
  await expect(page.locator('#gallery .gallery-card')).toHaveCount(1)
  await page.locator('#searchProjects').fill('no-match-demo-keyword')
  await expect(page.locator('#emptyGallery')).toBeVisible()
  await page.goto(`${origin}/case-study.html?slug=quality-management-hub`)
  await expect(page.locator('#caseTitle')).toContainText('Quality')
  await page.goto(`${origin}/admin-demo.html`)
  await expect(page.locator('.preview-banner')).toBeVisible()
  await expect(page.locator('.preview-banner')).toContainText(/design preview only/i)
  await page.locator('[data-pane="projects"]').click()
  await expect(page.locator('#adminPlaceholder')).toBeVisible()
  await page.screenshot({ path: shot('static-admin-demo'), fullPage: true })
})
