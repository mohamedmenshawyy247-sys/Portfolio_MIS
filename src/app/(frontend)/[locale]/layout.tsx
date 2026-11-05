import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { copy } from '@/lib/copy'
import { siteURL } from '@/lib/site-url'
import '@/styles/site.css'
export const dynamic = 'force-dynamic'

/**
 * `[locale]` is a free route param. This layout owns <html>, and Next does not allow notFound() from the
 * segment that owns it (it would replace the bilingual not-found.tsx with Next's bare error shell, with no
 * lang/dir and no CSS). Unknown values therefore render as English here, and every page's assertLocale()
 * triggers not-found.tsx inside this document.
 */
const safeLocale = (locale: string): 'ar' | 'en' => (locale === 'ar' ? 'ar' : 'en')

/**
 * Default document title/description for every locale page; pages override `title` as needed.
 * metadataBase turns the pages' relative `alternates.languages` into absolute hreflang URLs (relative ones are
 * ignored by search engines). Inherited by every child segment.
 */
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const c = copy(safeLocale((await params).locale))
  return { metadataBase: new URL(siteURL()), title: `MIS Department | ${c.tagline}`, description: c.intro }
}

export default async function LocaleLayout({ children, params }: { children: ReactNode; params: Promise<{ locale: string }> }) {
  const safe = safeLocale((await params).locale)
  return <html lang={safe} dir={safe === 'ar' ? 'rtl' : 'ltr'}><body>{children}</body></html>
}
