import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CoverImage, SiteShell, StatusBadges } from '@/components/SiteShell'
import { getProjectBySlug, getSiteInfo, type Locale } from '@/lib/catalog'
import { copy } from '@/lib/copy'
import { getViewer } from '@/lib/viewer'
import { assertLocale } from '@/lib/locale'

type Params = { params: Promise<{ locale: Locale; slug: string }> }

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params
  const locale = assertLocale(rawLocale)
  const viewer = await getViewer()
  const p = await getProjectBySlug(locale, slug, viewer)
  if (!p) return { title: 'MIS Department', robots: { index: false, follow: false } }
  const indexable = p.visibility === 'public' && p.status === 'published' && !viewer.draft
  return {
    title: `${p.seoTitle || p.title} | MIS Department`,
    description: p.seoDescription || p.summary,
    robots: indexable ? { index: true, follow: true } : { index: false, follow: false },
    alternates: indexable ? { languages: { en: `/en/projects/${p.slug}`, ar: `/ar/projects/${p.slug}` } } : undefined,
  }
}

export default async function CasePage({ params }: Params) {
  const { locale: rawLocale, slug } = await params
  const locale = assertLocale(rawLocale)
  const viewer = await getViewer()
  const [site, p] = await Promise.all([getSiteInfo(locale), getProjectBySlug(locale, slug, viewer)])
  if (!p) notFound()
  const c = copy(locale)
  return (
    <SiteShell locale={locale} active="projects" pathSuffix={`projects/${p.slug}`} preview={viewer.draft} site={site}>
      <section className="page-hero">
        <div className="container">
          <div className="eyebrow bright">{c.case} · {p.category}</div>
          <StatusBadges locale={locale} status={p.status} visibility={p.visibility} />
          <h1>{p.title}</h1>
          <p>{p.summary}</p>
          <Link className="button-outline" href={`/${locale}/projects`}>{c.back}</Link>
        </div>
      </section>
      <section className="section">
        <div className="container">
          <figure className="cover-figure"><CoverImage media={p.cover} priority sizes="(max-width: 1100px) 100vw, 1100px" />{p.cover?.alt && <figcaption>{p.cover.alt}</figcaption>}</figure>
          <div className="details-grid">
            <article className="content-card"><div className="eyebrow">{c.challenge}</div><h2>{c.challenge}</h2><p>{p.challenge}</p></article>
            <article className="content-card"><div className="eyebrow">{c.solution}</div><h2>{c.solution}</h2><p>{p.solution}</p></article>
          </div>
          {p.gallery.length > 0 && (
            <>
              <div className="section-head" style={{ marginTop: 65 }}><div><h2>{c.gallery}</h2></div></div>
              <div className="gallery-grid">{p.gallery.map((m, i) => <figure key={`${m.url}-${i}`}><CoverImage media={m} sizes="(max-width: 860px) 100vw, 50vw" />{m.alt && <figcaption>{m.alt}</figcaption>}</figure>)}</div>
            </>
          )}
          {p.value.length > 0 && (
            <>
              <div className="section-head" style={{ marginTop: 65 }}><div><h2>{c.value}</h2></div></div>
              <div className="content-card"><ul className="value-list">{p.value.map((x) => <li key={x}>{x}</li>)}</ul></div>
            </>
          )}
        </div>
      </section>
    </SiteShell>
  )
}
