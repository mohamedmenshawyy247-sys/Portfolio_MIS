import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

/**
 * Automated WCAG 2.x A/AA scan of the public pages in both languages (axe-core). Serious and critical
 * violations fail the build; moderate/minor ones are listed in the Playwright report for follow-up.
 * Automated checks complement, and never replace, the manual keyboard/RTL/zoom review.
 */
const pages = ['', '/about', '/services', '/projects', '/projects/operations-monitoring-suite', '/impact', '/projects/does-not-exist']

for (const locale of ['en', 'ar'] as const) {
  for (const path of pages) {
    test(`axe ${locale}${path || '/'}`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width: locale === 'ar' ? 390 : 1366, height: 900 })
      await page.goto(`/${locale}${path}`)
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze()
      const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
      const other = results.violations.filter((v) => !(v.impact === 'serious' || v.impact === 'critical'))
      await testInfo.attach('axe-violations.json', { body: JSON.stringify(results.violations, null, 2), contentType: 'application/json' })
      if (other.length) testInfo.annotations.push({ type: 'a11y-minor', description: other.map((v) => `${v.id} (${v.impact}) x${v.nodes.length}`).join('; ') })
      expect(serious.map((v) => `${v.id}: ${v.help} -> ${v.nodes.map((n) => n.target.join(' ')).slice(0, 3).join(' | ')}`)).toEqual([])
    })
  }
}
