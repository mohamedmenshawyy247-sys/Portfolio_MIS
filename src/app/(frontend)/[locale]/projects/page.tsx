import { SiteShell } from '@/components/SiteShell'
import ProjectsClient from '@/components/ProjectsClient'
import { getProjects, type Locale } from '@/lib/catalog'
import { copy } from '@/lib/copy'
export default async function ProjectsPage({params}:{params:Promise<{locale:Locale}>}){const {locale}=await params;const c=copy(locale);const projects=await getProjects(locale);return <SiteShell locale={locale} active="projects"><section className="page-hero"><div className="container"><div className="eyebrow bright">OUR WORK</div><h1>{c.projectsTitle}</h1><p>{c.projectsIntro}</p></div></section><section className="section"><div className="container"><ProjectsClient locale={locale} projects={projects}/></div></section></SiteShell>}
