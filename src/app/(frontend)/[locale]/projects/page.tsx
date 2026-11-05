import type { Metadata } from 'next'
import ProjectsClient from '@/components/ProjectsClient'
import { SiteShell } from '@/components/SiteShell'
import { getProjects, getServices, getSiteInfo, type Locale } from '@/lib/catalog'
import { copy } from '@/lib/copy'
import { getViewer } from '@/lib/viewer'
import { assertLocale } from '@/lib/locale'

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const locale = assertLocale((await params).locale)
  const c = copy(locale)
  return { title: `${c.projectsTitle} | MIS Department`, alternates: { languages: { en: '/en/projects', ar: '/ar/projects' } } }
}

export default async function ProjectsPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const locale = assertLocale((await params).locale)
  const c = copy(locale)
  const viewer = await getViewer()
  const [site, projects, services] = await Promise.all([getSiteInfo(locale), getProjects(locale, viewer), getServices(locale, viewer)])
  const filters = services.map((s) => ({ key: s.key, label: s.title }))
  return (
    <SiteShell locale={locale} active="projects" pathSuffix="projects" preview={viewer.draft} site={site}>
      <section className="page-hero"><div className="container"><div className="eyebrow bright">{c.projects}</div><h1>{c.projectsTitle}</h1><p>{c.projectsIntro}</p></div></section>
      <section className="section"><div className="container"><ProjectsClient locale={locale} projects={projects} filters={filters} /></div></section>
    </SiteShell>
  )
}
