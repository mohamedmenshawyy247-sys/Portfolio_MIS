import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { expect, test, type Page } from '@playwright/test'
import { ADMIN, EDITOR } from '../int/env'
import { shot } from './helpers'

const fixtures = JSON.parse(readFileSync(resolve(process.cwd(), 'tests/.tmp/fixtures.json'), 'utf8')) as { projects: { draftOnly: number; publicPublished: number } }

async function login(page: Page, user: { email: string; password: string }): Promise<void> {
  await page.goto('/admin/login')
  await page.getByLabel(/email/i).fill(user.email)
  await page.getByLabel(/password/i).fill(user.password)
  await page.getByRole('button', { name: /login|sign in/i }).click()
  await page.waitForURL((url) => !url.pathname.endsWith('/login'))
}

test('editor: can save a draft of a published project but has no Publish button', async ({ page }) => {
  await login(page, EDITOR)
  await page.goto(`/admin/collections/projects/${fixtures.projects.publicPublished}`)
  await expect(page.getByRole('button', { name: /^save draft$/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /^publish changes$|^publish$/i })).toHaveCount(0)
  await expect(page.getByRole('button', { name: /unpublish/i })).toHaveCount(0)
  const title = page.locator('#field-title')
  await title.fill('Editor UI draft title')
  await page.getByRole('button', { name: /^save draft$/i }).click()
  await expect(page.getByText(/updated successfully|saved/i).first()).toBeVisible()
  await page.screenshot({ path: shot('admin-editor-project'), fullPage: true })
  // The public page still shows the live title.
  const res = await page.request.get('/en/projects/operations-monitoring-suite')
  const html = await res.text()
  expect(html).toContain('Operations Monitoring Suite')
  expect(html).not.toContain('Editor UI draft title')
})

test('editor: cannot change their own role from the account page', async ({ page }) => {
  await login(page, EDITOR)
  await page.goto('/admin/account')
  const role = page.locator('#field-role')
  await expect(role).toBeVisible()
  // The role control is read-only for non-admins (field-level access), so it is disabled.
  const disabled = await role.evaluate((el) => el.classList.contains('read-only') || el.querySelector('input[disabled], select[disabled], [aria-disabled="true"]') !== null)
  expect(disabled).toBe(true)
})

test('admin: sees Publish and Preview, and the draft preview shows draft content with the preview bar', async ({ page, context }) => {
  await login(page, ADMIN)
  await page.goto(`/admin/collections/projects/${fixtures.projects.draftOnly}`)
  await expect(page.getByRole('button', { name: /^publish changes$|^publish$/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /^save draft$/i })).toBeVisible()
  const preview = page.getByRole('button', { name: /^preview$/i })
  await expect(preview).toBeVisible()
  await page.screenshot({ path: shot('admin-admin-project'), fullPage: true })
  // Enter preview the way the Preview button does: an authenticated navigation to /preview.
  const secret = process.env.PREVIEW_SECRET ?? ''
  const previewPage = await context.newPage()
  await previewPage.goto(`/preview?secret=${encodeURIComponent(secret)}&path=${encodeURIComponent('/en/projects/fixture-draft')}`)
  await expect(previewPage).toHaveURL(/\/en\/projects\/fixture-draft$/)
  await expect(previewPage.locator('.preview-bar')).toBeVisible()
  await expect(previewPage.locator('h1')).toHaveText(/Fixture Draft Only/)
  await previewPage.screenshot({ path: shot('preview-draft-admin'), fullPage: true })
  await previewPage.getByRole('link', { name: /exit preview/i }).click()
  await expect(previewPage).toHaveURL(/\/en$/)
  await expect(previewPage.locator('.preview-bar')).toHaveCount(0)
  const res = await previewPage.request.get('/en/projects/fixture-draft')
  expect(res.status()).toBe(404)
})

test('admin panel is available in Arabic with RTL direction', async ({ page }) => {
  await login(page, ADMIN)
  await page.goto('/admin/account')
  const language = page.locator('#field-language')
  await expect(language).toBeVisible()
  await language.locator('input').first().fill('عربي')
  await page.keyboard.press('Enter')
  await page.waitForTimeout(500)
  await page.goto('/admin')
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
  await page.screenshot({ path: shot('admin-ar-dashboard'), fullPage: true })
})
