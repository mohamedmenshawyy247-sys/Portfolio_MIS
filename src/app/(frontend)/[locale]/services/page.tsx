import type { Metadata } from 'next'
import Link from 'next/link'
import { SiteShell } from '@/components/SiteShell'
import { getServices, getSiteInfo, type Locale } from '@/lib/catalog'
import { copy } from '@/lib/copy'
import { getViewer } from '@/lib/viewer'
import { assertLocale } from '@/lib/locale'

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const locale = assertLocale((await params).locale)
  return { title: `${copy(locale).servicesTitle} | MIS Department`, alternates: { languages: { en: '/en/services', ar: '/ar/services' } } }
}

export default async function ServicesPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const locale = assertLocale((await params).locale)
  const c = copy(locale)
  const viewer = await getViewer()
  const [site, services] = await Promise.all([getSiteInfo(locale), getServices(locale, viewer)])
  return (
    <SiteShell locale={locale} active="services" pathSuffix="services" preview={viewer.draft} site={site}>
      <section className="page-hero"><div className="container"><div className="eyebrow bright">{c.services}</div><h1>{c.servicesTitle}</h1><p>{c.servicesIntro}</p></div></section>
      <section className="section">
        <div className="container">
          <div className="service-grid">
            {services.map((s) => (
              <article className="service-card" key={s.id}>
                <div className="service-icon" aria-hidden="true">✦</div><h3>{s.title}</h3><p>{s.summary}</p>
                {s.points.length > 0 && <ul className="feature-list">{s.points.map((p) => <li key={p}>{p}</li>)}</ul>}
              </article>
            ))}
          </div>
          <div style={{ marginTop: 35 }}><Link className="button" href={`/${locale}/projects`}>{c.projects}</Link></div>
        </div>
      </section>
    </SiteShell>
  )
}
