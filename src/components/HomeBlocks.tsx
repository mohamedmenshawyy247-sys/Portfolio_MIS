import type { ReactNode } from 'react'
import Link from 'next/link'
import type { HomepageBlock, Locale, PortfolioProject, PortfolioService } from '@/lib/catalog'
import { copy } from '@/lib/copy'
import { safeInternalPath } from '@/lib/safe-path'
import FeaturedCarousel, { type FeaturedItem } from './FeaturedCarousel'
import { PreviewDashboard, ServiceIcon } from './SiteShell'

type Props = { blocks: HomepageBlock[]; locale: Locale; projects: PortfolioProject[]; services: PortfolioService[] }

/** Built-in blocks used until the homepage builder has published content. */
export function defaultHomepageBlocks(locale: Locale): HomepageBlock[] {
  const c = copy(locale)
  const steps = locale === 'ar'
    ? [['جمع', 'بيانات التشغيل'], ['تحقق', 'مدخلات موثوقة'], ['تحليل', 'أنماط ذات معنى'], ['عرض', 'تجارب واضحة'], ['تحسين', 'خطوات مدروسة']]
    : [['Collect', 'Operational signals'], ['Validate', 'Reliable inputs'], ['Analyze', 'Meaningful patterns'], ['Present', 'Clear experiences'], ['Improve', 'Informed action']]
  const items = locale === 'ar'
    ? [['رؤية تشغيلية', 'معرفة ما يهم في الوقت المناسب.'], ['اتساق العمليات', 'متابعة أكثر وضوحًا.'], ['تحليلات أسرع', 'ربط المعلومات بالقرارات.'], ['تحسين مستمر', 'التعلّم والتطوير باستمرار.']]
    : [['Operational visibility', 'See what matters, when it matters.'], ['Process consistency', 'Make follow-up workflows clearer.'], ['Faster insights', 'Connect context to decisions.'], ['Continuous improvement', 'Learn, refine and move forward.']]
  return [
    { blockType: 'hero', eyebrow: c.heroEyebrow, headline: locale === 'ar' ? '**ذكاء تشغيلي** برؤية أوضح وقرارات أقوى.' : 'Operational **Intelligence** That Drives Decisions.', subline: c.intro, primaryLabel: c.explore, secondaryLabel: c.services },
    { blockType: 'introduction', heading: c.tagline, text: c.intro },
    { blockType: 'servicesSection', heading: c.servicesTitle, intro: c.servicesIntro },
    { blockType: 'featuredProjects', heading: c.projectsTitle, intro: c.projectsIntro, limit: 3 },
    { blockType: 'approach', heading: c.approachTitle, intro: c.approachDesc, steps: steps.map(([title, detail]) => ({ title, detail })) },
    { blockType: 'impactSection', heading: c.impactTitle, intro: c.impactIntro, items: items.map(([title, detail]) => ({ title, detail })) },
    { blockType: 'cta', heading: c.impactTitle, label: c.explore, href: `/${locale}/projects` },
  ]
}

/** CTA target: a validated internal site path (browsers read `/\host` as `//host`) or an https:// URL; anything else falls back. */
const safeHref = (href: unknown, fallback: string): string => {
  if (typeof href !== 'string' || !href) return fallback
  if (href.startsWith('/')) return safeInternalPath(href) ?? fallback
  try { return new URL(href).protocol === 'https:' ? href : fallback } catch { return fallback }
}

const ACCENT = /^(.*?)\*\*(.+?)\*\*(.*)$/

/** A headline may mark one `**accent**` span, rendered with the cyan gradient; everything else stays plain text. */
const renderHeadline = (text: string): ReactNode => {
  const match = ACCENT.exec(text)
  if (!match) return text
  return <>{match[1]}<span className="accent">{match[2]}</span>{match[3]}</>
}

/** Featured projects first (in catalogue order), the rest of the public list as a fallback; at most `limit` cards. */
const featuredItems = (projects: PortfolioProject[], limit: number): FeaturedItem[] => {
  const featured = projects.filter((p) => p.featured)
  return (featured.length > 0 ? featured : projects).slice(0, limit).map(({ slug, title, summary, categoryLabel, cover }) => ({ slug, title, summary, categoryLabel, cover }))
}

export function HomeBlocks({ blocks, locale, projects, services }: Props) {
  const c = copy(locale)
  return (
    <>
      {blocks.map((block, index) => {
        const key = block.id ?? `${block.blockType}-${index}`
        switch (block.blockType) {
          case 'hero':
            return (
              <section className="hero" key={key}>
                <div className="container hero-inner">
                  <div className="hero-copy">
                    {block.eyebrow && <div className="eyebrow bright">{block.eyebrow}</div>}
                    <h1>{renderHeadline(block.headline)}</h1>
                    {block.subline && <p>{block.subline}</p>}
                    <div className="hero-buttons">
                      <Link href={`/${locale}/projects`} className="button">{block.primaryLabel || c.explore}</Link>
                      <Link href={`/${locale}/services`} className="button-outline">{block.secondaryLabel || c.services}</Link>
                    </div>
                    <div className="hero-tags">{services.slice(0, 3).map((s) => <span key={s.id}><ServiceIcon icon={s.icon} size={14} /> {s.title}</span>)}</div>
                  </div>
                  <div className="hero-art" aria-hidden="true"><div className="orb" /><div className="orb-rings" /><div className="glass-dash"><PreviewDashboard /></div></div>
                </div>
              </section>
            )
          case 'introduction':
            return (
              <section className="section" key={key}>
                <div className="container about-layout">
                  <div>
                    <div className="eyebrow">{c.about}</div><h2>{block.heading}</h2><p className="lead">{block.text}</p>
                    <Link href={`/${locale}/about`} className="text-link">{c.aboutCta}</Link>
                    {services.length > 0 && (
                      <div className="about-cards">{services.slice(0, 3).map((s) => <span className="mini-pill" key={s.id}><ServiceIcon icon={s.icon} size={16} />{s.title}</span>)}</div>
                    )}
                  </div>
                  <div className="visual-pane"><PreviewDashboard /></div>
                </div>
              </section>
            )
          case 'servicesSection':
            return (
              <section className="section" id="services" key={key}>
                <div className="container">
                  <div className="section-head"><div><div className="eyebrow">{c.services}</div><h2>{block.heading}</h2>{block.intro && <p className="lead">{block.intro}</p>}</div></div>
                  <div className="service-grid">
                    {services.map((s) => (
                      <Link className="service-card" href={`/${locale}/services`} key={s.id}>
                        <div className="service-icon" aria-hidden="true"><ServiceIcon icon={s.icon} /></div><h3>{s.title}</h3><p>{s.summary}</p><span className="text-link">{c.exploreService}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              </section>
            )
          case 'featuredProjects':
            return (
              <section className="section projects-section" key={key}>
                <div className="container">
                  <div className="section-head"><div><div className="eyebrow bright">{c.projects}</div><h2>{block.heading}</h2>{block.intro && <p className="lead">{block.intro}</p>}</div><Link className="button-outline" href={`/${locale}/projects`}>{c.all}</Link></div>
                  <FeaturedCarousel locale={locale} items={featuredItems(projects, Math.min(Math.max(block.limit ?? 3, 1), 3))} />
                </div>
              </section>
            )
          case 'approach':
            return (
              <section className="section" key={key}>
                <div className="container">
                  <div className="section-head"><div><div className="eyebrow">{c.approachTitle}</div><h2>{block.heading}</h2>{block.intro && <p className="lead">{block.intro}</p>}</div></div>
                  {block.steps && block.steps.length > 0 && (
                    <ol className="process">
                      {block.steps.map((step, i) => <li className="process-card" key={step.id ?? i}><span className="process-icon" aria-hidden="true">{i + 1}</span><strong>{step.title}</strong>{step.detail && <small>{step.detail}</small>}</li>)}
                    </ol>
                  )}
                </div>
              </section>
            )
          case 'impactSection':
            return (
              <section className="section dark-section" key={key}>
                <div className="container">
                  <div className="section-head"><div><div className="eyebrow bright">{c.impact}</div><h2>{block.heading}</h2>{block.intro && <p className="lead">{block.intro}</p>}</div></div>
                  {block.items && block.items.length > 0 && (
                    <div className="impact-grid">{block.items.map((item, i) => <article className="impact-card" key={item.id ?? i}><b>{item.title}</b>{item.detail && <p>{item.detail}</p>}</article>)}</div>
                  )}
                </div>
              </section>
            )
          case 'cta':
            return (
              <section className="closing" key={key}>
                <div className="container closing-inner">
                  <div><div className="eyebrow bright">{c.explore}</div><h2>{block.heading}</h2></div>
                  <Link className="button light" href={safeHref(block.href, `/${locale}/projects`)}>{block.label || c.explore}</Link>
                </div>
              </section>
            )
          default:
            return null
        }
      })}
    </>
  )
}
