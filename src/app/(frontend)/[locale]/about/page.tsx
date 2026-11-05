import Link from 'next/link'
import { SiteShell, PreviewDashboard } from '@/components/SiteShell'
import { copy } from '@/lib/copy'
import type { Locale } from '@/lib/catalog'
export default async function About({params}:{params:Promise<{locale:Locale}>}) {const {locale}=await params;const c=copy(locale);return <SiteShell locale={locale} active="about"><section className="page-hero"><div className="container"><div className="eyebrow bright">MIS DEPARTMENT</div><h1>{c.about}</h1><p>{c.intro}</p></div></section><section className="section"><div className="container about-layout"><div><div className="eyebrow">OUR PURPOSE</div><h2>{c.tagline}</h2><p className="lead">{c.intro}</p><Link className="button" href={`/${locale}/projects`}>{c.explore}</Link></div><div className="visual-pane"><PreviewDashboard/></div></div></section><section className="section dark-section"><div className="container"><h2>{c.approachTitle}</h2><p className="lead">{c.approachDesc}</p></div></section></SiteShell>}
