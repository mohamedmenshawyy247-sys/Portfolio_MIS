import type { Metadata } from 'next'
import Link from 'next/link'
import { SiteShell } from '@/components/SiteShell'
import { getSiteInfo, type Locale } from '@/lib/catalog'
import { copy } from '@/lib/copy'
import { getViewer } from '@/lib/viewer'
import { assertLocale } from '@/lib/locale'

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const locale = assertLocale((await params).locale)
  return { title: `${copy(locale).impact} | MIS Department`, alternates: { languages: { en: '/en/impact', ar: '/ar/impact' } } }
}

export default async function ImpactPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const locale = assertLocale((await params).locale)
  const c = copy(locale)
  const [viewer, site] = await Promise.all([getViewer(), getSiteInfo(locale)])
  const items = locale === 'ar'
    ? [['رؤية تشغيلية أوضح', 'معرفة ما يهم في الوقت المناسب.'], ['اتساق العمليات', 'متابعة أكثر وضوحًا.'], ['تحليلات أسرع', 'ربط المعلومات بالقرارات.'], ['تحسين مستمر', 'التعلّم والتطوير باستمرار.']]
    : [['Operational visibility', 'See what matters, when it matters.'], ['Process consistency', 'Make follow-up workflows clearer.'], ['Faster insights', 'Connect context to decisions.'], ['Continuous improvement', 'Learn, refine and move forward.']]
  return (
    <SiteShell locale={locale} active="impact" pathSuffix="impact" preview={viewer.draft} site={site}>
      <section className="page-hero"><div className="container"><div className="eyebrow bright">{c.value}</div><h1>{c.impactTitle}</h1><p>{c.impactIntro}</p></div></section>
      <section className="section dark-section">
        <div className="container">
          <div className="impact-grid">{items.map(([title, detail]) => <article className="impact-card" key={title}><b>{title}</b><p>{detail}</p></article>)}</div>
          <div style={{ marginTop: 40 }}><Link href={`/${locale}/projects`} className="button">{c.explore}</Link></div>
        </div>
      </section>
    </SiteShell>
  )
}
