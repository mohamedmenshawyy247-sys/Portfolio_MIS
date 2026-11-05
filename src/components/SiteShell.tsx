import type { ReactNode } from 'react'
import Link from 'next/link'
import type { Locale } from '@/lib/catalog'
import { copy } from '@/lib/copy'

export function Brand({ inverse = false }: { inverse?: boolean }) {
  return <span className={`brand ${inverse ? 'inverse' : ''}`}><svg className="brand-mark" viewBox="0 0 48 48" aria-hidden="true"><path d="M24 3 43 13 24 23 5 13 24 3Z" fill="#1268F0"/><path d="m5 22 19 10 19-10" stroke="#3ec7f4" strokeWidth="6" strokeLinejoin="round"/><path d="m5 32 19 10 19-10" stroke="#2665d9" strokeWidth="6" strokeLinejoin="round"/></svg>MIS Department</span>
}
export function SiteShell({ locale, children, active='home' }: { locale: Locale; children: ReactNode; active?: string }) {
  const c=copy(locale)
  const tabs=[['home',c.home,''],['about',c.about,'about'],['services',c.services,'services'],['projects',c.projects,'projects'],['impact',c.impact,'impact']]
  return <>
    <a className="skip-link" href="#main">Skip to content</a>
    <header className="topbar"><div className="container"><Link className="brand-link" href={`/${locale}`}><Brand/></Link><nav className="primary-nav" aria-label="Main navigation">{tabs.map(([id,label,route])=><Link key={id} href={`/${locale}/${route}`} className={active===id?'active':''}>{label}</Link>)}</nav><div className="header-actions"><div className="lang-switch"><Link aria-label="English" href="/en">EN</Link><Link aria-label="العربية" href="/ar">AR</Link></div><details className="mobile-menu"><summary aria-label="Toggle navigation">☰</summary><nav>{tabs.map(([id,label,route])=><Link key={id} href={`/${locale}/${route}`}>{label}</Link>)}</nav></details></div></div></header>
    <main id="main">{children}</main>
    <footer className="footer"><div className="container footer-inner"><Brand/><small>{c.preview}</small><Link href={`/${locale}/projects`}>{c.projects} ↗</Link></div></footer>
  </>
}
export function PreviewDashboard(){return <div className="screen"><div className="screen-top"/><div className="screen-grid"><div className="screen-panel"><svg viewBox="0 0 200 90" role="img" aria-label="Illustrative trend"><path d="M0 72 35 54 55 62 90 24 121 43 155 12 200 25" stroke="#36d3ff" strokeWidth="3" fill="none"/></svg></div><div className="screen-panel"><svg viewBox="0 0 120 90" role="img" aria-label="Illustrative bars"><rect x="12" y="48" width="18" height="34" fill="#186dcc"/><rect x="39" y="25" width="18" height="57" fill="#45d2ff"/><rect x="66" y="40" width="18" height="42" fill="#2463bf"/><rect x="93" y="12" width="18" height="70" fill="#82e2ff"/></svg></div></div></div>}
