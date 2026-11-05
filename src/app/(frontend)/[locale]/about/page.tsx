import type { Metadata } from 'next'
import Link from 'next/link'
import { PreviewDashboard, SiteShell } from '@/components/SiteShell'
import { getSiteInfo, type Locale } from '@/lib/catalog'
import { copy } from '@/lib/copy'
import { getViewer } from '@/lib/viewer'
import { assertLocale } from '@/lib/locale'

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const locale = assertLocale((await params).locale)
  return { title: `${copy(locale).about} | MIS Department`, alternates: { languages: { en: '/en/about', ar: '/ar/about' } } }
}

export default async function About({ params }: { params: Promise<{ locale: Locale }> }) {
  const locale = assertLocale((await params).locale)
  const c = copy(locale)
  const [viewer, site] = await Promise.all([getViewer(), getSiteInfo(locale)])
  return (
    <SiteShell locale={locale} active="about" pathSuffix="about" preview={viewer.draft} site={site}>
      <section className="page-hero"><div className="container"><div className="eyebrow bright">{site.brandName}</div><h1>{c.about}</h1><p>{c.intro}</p></div></section>
      <section className="section">
        <div className="container about-layout">
          <div><div className="eyebrow">{c.about}</div><h2>{site.tagline || c.tagline}</h2><p className="lead">{c.intro}</p><Link className="button" href={`/${locale}/projects`}>{c.explore}</Link></div>
          <div className="visual-pane"><PreviewDashboard /></div>
        </div>
      </section>
      <section className="section dark-section"><div className="container"><h2>{c.approachTitle}</h2><p className="lead">{c.approachDesc}</p></div></section>
    </SiteShell>
  )
}
