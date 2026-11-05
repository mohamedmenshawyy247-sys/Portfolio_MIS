import { HomeBlocks, defaultHomepageBlocks } from '@/components/HomeBlocks'
import { SiteShell } from '@/components/SiteShell'
import { getHomepageBlocks, getProjects, getServices, getSiteInfo, type Locale } from '@/lib/catalog'
import { getViewer } from '@/lib/viewer'
import { assertLocale } from '@/lib/locale'

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
      <HomeBlocks blocks={blocks ?? defaultHomepageBlocks(locale)} locale={locale} services={services} projects={projects} />
    </SiteShell>
  )
}
