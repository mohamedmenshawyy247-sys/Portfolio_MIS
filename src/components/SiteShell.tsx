import type { ReactNode } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { Locale, MediaRef, SiteInfo } from '@/lib/catalog'
import { copy } from '@/lib/copy'

export function Brand({ name = 'MIS Department' }: { name?: string }) {
  return (
    <span className="brand">
      <svg className="brand-mark" viewBox="0 0 48 48" aria-hidden="true">
        <path d="M24 3 43 13 24 23 5 13 24 3Z" fill="#1268F0" />
        <path d="m5 22 19 10 19-10" stroke="#3ec7f4" strokeWidth="6" strokeLinejoin="round" fill="none" />
        <path d="m5 32 19 10 19-10" stroke="#2665d9" strokeWidth="6" strokeLinejoin="round" fill="none" />
      </svg>
      {name}
    </span>
  )
}

type ShellProps = {
  active?: string
  children: ReactNode
  locale: Locale
  /** Path after the locale segment, used by the language switch to stay on the same page. */
  pathSuffix?: string
  preview?: boolean
  site?: SiteInfo
}

export function SiteShell({ locale, children, active = 'home', pathSuffix = '', preview = false, site }: ShellProps) {
  const c = copy(locale)
  const brand = site?.brandName || 'MIS Department'
  const tabs: [string, string, string][] = [
    ['home', c.home, ''],
    ['about', c.about, 'about'],
    ['services', c.services, 'services'],
    ['projects', c.projects, 'projects'],
    ['impact', c.impact, 'impact'],
  ]
  const href = (route: string) => (route ? `/${locale}/${route}` : `/${locale}`)
  const switchTo = (target: Locale) => (pathSuffix ? `/${target}/${pathSuffix}` : `/${target}`)
  return (
    <>
      <a className="skip-link" href="#main">{c.skip}</a>
      {preview && (
        <div className="preview-bar" role="status">
          <span>{c.previewMode}</span>
          <Link href={`/exit-preview?path=${encodeURIComponent(`/${locale}`)}`} prefetch={false}>{c.exitPreview}</Link>
        </div>
      )}
      <header className="topbar">
        <div className="container">
          <Link className="brand-link" href={`/${locale}`} aria-label={brand}><Brand name={brand} /></Link>
          <nav className="primary-nav" aria-label={c.mainNav}>
            {tabs.map(([id, label, route]) => (
              <Link key={id} href={href(route)} className={active === id ? 'active' : ''} aria-current={active === id ? 'page' : undefined}>{label}</Link>
            ))}
          </nav>
          <div className="header-actions">
            <div className="lang-switch" role="group" aria-label={c.language}>
              <Link href={switchTo('en')} hrefLang="en" lang="en" aria-current={locale === 'en' ? 'true' : undefined}>EN</Link>
              <Link href={switchTo('ar')} hrefLang="ar" lang="ar" aria-current={locale === 'ar' ? 'true' : undefined}>AR</Link>
            </div>
            <details className="mobile-menu">
              <summary aria-label={c.menu}>☰</summary>
              <nav aria-label={c.mainNav}>
                {tabs.map(([id, label, route]) => <Link key={id} href={href(route)}>{label}</Link>)}
              </nav>
            </details>
          </div>
        </div>
      </header>
      <main id="main">{children}</main>
      <footer className="footer">
        <div className="container footer-inner">
          <Brand name={brand} />
          <small>{site?.footerNote || c.preview}</small>
          {site?.contactEmail ? <a href={`mailto:${site.contactEmail}`} dir="ltr">{site.contactEmail}</a> : <Link href={`/${locale}/projects`}>{c.projects}</Link>}
        </div>
      </footer>
    </>
  )
}

/** Illustrative dashboard graphic used wherever no approved image exists. */
export function PreviewDashboard() {
  return (
    <div className="screen" aria-hidden="true">
      <div className="screen-top" />
      <div className="screen-grid">
        <div className="screen-panel"><svg viewBox="0 0 200 90"><path d="M0 72 35 54 55 62 90 24 121 43 155 12 200 25" stroke="#36d3ff" strokeWidth="3" fill="none" /></svg></div>
        <div className="screen-panel"><svg viewBox="0 0 120 90"><rect x="12" y="48" width="18" height="34" fill="#186dcc" /><rect x="39" y="25" width="18" height="57" fill="#45d2ff" /><rect x="66" y="40" width="18" height="42" fill="#2463bf" /><rect x="93" y="12" width="18" height="70" fill="#82e2ff" /></svg></div>
      </div>
    </div>
  )
}

/** Approved public cover image, or the illustrative graphic when none is attached. */
export function CoverImage({ media, priority = false, sizes = '(max-width: 860px) 100vw, 50vw' }: { media: MediaRef | null; priority?: boolean; sizes?: string }) {
  if (!media) return <PreviewDashboard />
  return (
    <Image className="cover-img" src={media.url} alt={media.alt} width={media.width ?? 1200} height={media.height ?? 750} sizes={sizes} priority={priority} />
  )
}

export function StatusBadges({ locale, status, visibility }: { locale: Locale; status: 'draft' | 'published'; visibility: 'private' | 'public' | 'unlisted' }) {
  const c = copy(locale)
  const badges: string[] = []
  if (status === 'draft') badges.push(c.draftBadge)
  if (visibility === 'unlisted') badges.push(c.unlistedBadge)
  if (visibility === 'private') badges.push(c.privateBadge)
  if (badges.length === 0) return null
  return <span className="badge-row">{badges.map((b) => <span className="badge" key={b}>{b}</span>)}</span>
}
