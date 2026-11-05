/**
 * Builds the authenticated draft-preview URL used by the "Preview" button in the admin panel.
 * Returns null (button hidden) when PREVIEW_SECRET is not configured.
 */
export function previewURL(path: string): null | string {
  const secret = process.env.PREVIEW_SECRET
  if (!secret) return null
  const base = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/+$/, '')
  const params = new URLSearchParams({ secret, path })
  return `${base}/preview?${params.toString()}`
}

export const siteLocale = (locale: unknown): 'ar' | 'en' => (locale === 'ar' ? 'ar' : 'en')
