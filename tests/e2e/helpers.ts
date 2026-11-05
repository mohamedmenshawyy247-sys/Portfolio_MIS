import { mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { expect, type Page } from '@playwright/test'

export const WIDTHS = [360, 390, 430, 768, 1024, 1440, 1920] as const
export const LOCALES = ['en', 'ar'] as const
export const SHOTS = resolve(process.cwd(), 'qa-screenshots')
mkdirSync(SHOTS, { recursive: true })

export async function expectNoHorizontalOverflow(page: Page, label: string): Promise<void> {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  expect(overflow, `${label}: horizontal overflow of ${overflow}px`).toBeLessThanOrEqual(1)
}

export function collectPageErrors(page: Page): string[] {
  const errors: string[] = []
  page.on('pageerror', (err) => errors.push(err.message))
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text())
  })
  return errors
}

export const shot = (name: string) => resolve(SHOTS, `${name}.png`)
