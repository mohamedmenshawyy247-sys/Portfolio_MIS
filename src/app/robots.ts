import type { MetadataRoute } from 'next'

const site = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/+$/, '')

/** robots.txt is a hint for crawlers, never an access control: the server enforces visibility itself. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/api/', '/preview', '/exit-preview'] }],
    sitemap: `${site}/sitemap.xml`,
  }
}
