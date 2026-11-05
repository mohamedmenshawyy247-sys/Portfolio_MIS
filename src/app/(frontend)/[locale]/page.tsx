import type { Metadata } from 'next'
import { HomeBlocks, defaultHomepageBlocks } from '@/components/HomeBlocks'
import { SiteShell } from '@/components/SiteShell'
import { getHomepageBlocks, getProjects, getServices, getSiteInfo, type Locale } from '@/lib/catalog'
import { getViewer } from '@/lib/viewer'
import { copy } from '@/lib/copy'
import { assertLocale } from '@/lib/locale'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const locale = assertLocale((await params).locale)
  const c = copy(locale)
  return { title: `MIS Department | ${c.tagline}`, description: c.intro, alternates: { languages: { en: '/en', ar: '/ar' } } }
}

export default async function Home({ params }: { params: Promise<{ locale: Locale }> }) {
  const locale = assertLocale((await params).locale)
  const viewer = await getViewer()
  const [site, blocks, services, projects] = await Promise.all([
    getSiteInfo(locale),
    getHomepageBlocks(locale, viewer),
    getServices(locale, viewer),
    getProjects(locale, viewer),
  ])
  return (
    <SiteShell locale={locale} preview={viewer.draft} site={site}>
      {/* null: nothing published yet, or no block has its required text in this locale (see getHomepageBlocks). */}
      <HomeBlocks blocks={blocks ?? defaultHomepageBlocks(locale)} locale={locale} services={services} projects={projects} />
    </SiteShell>
  )
}
