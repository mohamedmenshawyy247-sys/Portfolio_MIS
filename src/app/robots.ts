import type { MetadataRoute } from 'next'
import { siteURL } from '@/lib/site-url'

// Rendered per request so the Sitemap line carries the deployment's SITE_URL, not the origin baked in at build time.
export const dynamic = 'force-dynamic'

/** robots.txt is a hint for crawlers, never an access control: the server enforces visibility itself. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/api/', '/preview', '/exit-preview'] }],
    sitemap: `${siteURL()}/sitemap.xml`,
  }
}
