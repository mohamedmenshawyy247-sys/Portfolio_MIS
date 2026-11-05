import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { expect, test } from '@playwright/test'
import { collectPageErrors, expectNoHorizontalOverflow, LOCALES, shot, WIDTHS } from './helpers'

const fixtures = JSON.parse(readFileSync(resolve(process.cwd(), 'tests/.tmp/fixtures.json'), 'utf8')) as { projects: { publicPublished: number } }
void fixtures

for (const locale of LOCALES) {
  for (const width of WIDTHS) {
    test(`home ${locale} @${width}px: readable hero, visible CTA, usable navigation, no overflow`, async ({ page }) => {
      const errors = collectPageErrors(page)
      await page.setViewportSize({ width, height: width < 800 ? 820 : 900 })
      await page.goto(`/${locale}`)
      await expect(page.locator('html')).toHaveAttribute('dir', locale === 'ar' ? 'rtl' : 'ltr')
      const h1 = page.locator('h1').first()
      await expect(h1).toBeVisible()
      const cta = page.locator('.hero-buttons a').first()
      await expect(cta).toBeVisible()
      await expect(cta).toBeInViewport()
      if (width <= 860) {
        const summary = page.locator('details.mobile-menu summary')
        await expect(summary).toBeVisible()
        await summary.click()
        await expect(page.locator('details.mobile-menu nav a').first()).toBeVisible()
      } else {
        await expect(page.locator('nav.primary-nav a').first()).toBeVisible()
      }
      await expectNoHorizontalOverflow(page, `home ${locale} ${width}`)
      await page.screenshot({ path: shot(`home-${locale}-${width}`), fullPage: true })
      expect(errors, errors.join('\n')).toEqual([])
    })
  }
}

test('keyboard: skip link first, then navigation links are reachable', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/en')
  await page.keyboard.press('Tab')
  await expect(page.locator('a.skip-link')).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/#main$/)
  await page.keyboard.press('Tab')
  const focused = await page.evaluate(() => document.activeElement?.getAttribute('href') ?? '')
  expect(focused).toContain('/en')
})

test('reduced motion: content is complete and visible without animations', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.setViewportSize({ width: 390, height: 820 })
  await page.goto('/en')
  await expect(page.locator('h1').first()).toBeVisible()
  await expect(page.locator('.service-card').first()).toBeVisible()
  await expect(page.locator('.closing .button')).toBeVisible()
  await page.screenshot({ path: shot('home-en-390-reduced-motion'), fullPage: true })
})

test('projects gallery: filters, search, empty state and case-study route', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/en/projects')
  const cards = page.locator('.gallery-card')
  await expect(cards).toHaveCount(3)
  await page.getByRole('button', { name: 'Quality & Performance Management' }).click()
  await expect(cards).toHaveCount(1)
  await page.getByRole('button', { name: 'All projects' }).click()
  await expect(cards).toHaveCount(3)
  await page.getByRole('searchbox', { name: 'Search projects' }).fill('no-match-keyword')
  await expect(cards).toHaveCount(0)
  await expect(page.locator('.no-results')).toBeVisible()
  await page.getByRole('searchbox', { name: 'Search projects' }).fill('')
  await page.screenshot({ path: shot('projects-en-1440'), fullPage: true })
  await cards.first().click()
  await expect(page).toHaveURL(/\/en\/projects\/[a-z0-9-]+$/)
  await expect(page.locator('h1')).toBeVisible()
  await expect(page.locator('.value-list li').first()).toBeVisible()
  // Language switch keeps the current page
  await page.locator('.lang-switch a[hreflang="ar"]').click()
  await expect(page).toHaveURL(/\/ar\/projects\/[a-z0-9-]+$/)
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
  await page.screenshot({ path: shot('case-study-ar-1440'), fullPage: true })
})

test('projects gallery on a phone stacks vertically with usable controls', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 820 })
  await page.goto('/ar/projects')
  await expect(page.locator('.gallery-card')).toHaveCount(3)
  const first = page.locator('.gallery-card').first().locator('..')
  void first
  const boxes = await page.locator('.gallery-card').evaluateAll((els) => els.map((e) => e.getBoundingClientRect().left))
  expect(new Set(boxes.map((x) => Math.round(x))).size).toBe(1)
  const filter = page.locator('.filter-btn').nth(1)
  const box = await filter.boundingBox()
  expect(box?.height ?? 0).toBeGreaterThanOrEqual(36)
  await expectNoHorizontalOverflow(page, 'projects ar 390')
  await page.screenshot({ path: shot('projects-ar-390'), fullPage: true })
})
