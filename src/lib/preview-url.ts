import { siteURL } from './site-url'

/**
 * Builds the authenticated draft-preview URL used by the "Preview" button in the admin panel.
 * Returns null (button hidden) when PREVIEW_SECRET is not configured.
 */
export function previewURL(path: string): null | string {
  const secret = process.env.PREVIEW_SECRET
  if (!secret) return null
  const params = new URLSearchParams({ secret, path })
  return `${siteURL()}/preview?${params.toString()}`
}

export const siteLocale = (locale: unknown): 'ar' | 'en' => (locale === 'ar' ? 'ar' : 'en')
