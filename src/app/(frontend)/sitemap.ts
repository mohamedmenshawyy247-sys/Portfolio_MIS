import type { MetadataRoute } from 'next'
import { getProjects } from '@/lib/catalog'

export const dynamic = 'force-dynamic'

const site = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/+$/, '')
const locales = ['en', 'ar'] as const

/** Only public, published content is listed. Unlisted, private and draft projects never appear. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = []
  for (const locale of locales) {
    for (const path of ['', '/about', '/services', '/projects', '/impact']) {
      entries.push({ url: `${site}/${locale}${path}`, alternates: { languages: { en: `${site}/en${path}`, ar: `${site}/ar${path}` } } })
    }
  }
  const projects = await getProjects('en')
  for (const project of projects) {
    if (project.visibility !== 'public') continue
    for (const locale of locales) {
      entries.push({ url: `${site}/${locale}/projects/${project.slug}`, alternates: { languages: { en: `${site}/en/projects/${project.slug}`, ar: `${site}/ar/projects/${project.slug}` } } })
    }
  }
  return entries
}
