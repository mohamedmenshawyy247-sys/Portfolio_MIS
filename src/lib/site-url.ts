const DEFAULT_SITE_URL = 'http://localhost:3000'

/**
 * Public origin of the site (scheme + host, no trailing slash), read at REQUEST time.
 *
 * `SITE_URL` is the variable to set on the server. `NEXT_PUBLIC_SITE_URL` is still accepted as a fallback for
 * older .env files, but Next inlines every NEXT_PUBLIC_* value into the server and client bundles at build
 * time (next/dist/build/define-env.js), so an artifact built with http://localhost:3000 would keep that
 * origin on the real deployment: wrong CORS/CSRF origin, sitemap, canonical and hreflang URLs. Nothing in
 * the server code should read process.env.NEXT_PUBLIC_SITE_URL directly; call this instead.
 */
export function siteURL(): string {
  const raw = (process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL).trim()
  return raw.replace(/\/+$/, '') || DEFAULT_SITE_URL
}
