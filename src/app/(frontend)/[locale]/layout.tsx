import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { notFound } from 'next/navigation'
import { copy } from '@/lib/copy'
import '@/styles/site.css'
export const dynamic = 'force-dynamic'

/** Default document title/description for every locale page; pages override `title` as needed. */
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const c = copy(locale === 'ar' ? 'ar' : 'en')
  return { title: `MIS Department | ${c.tagline}`, description: c.intro }
}
export default async function LocaleLayout({ children, params }: { children:ReactNode, params: Promise<{locale: string}> }) {
  const { locale } = await params
  if (locale !== 'en' && locale !== 'ar') notFound()
  return <html lang={locale} dir={locale==='ar'?'rtl':'ltr'}><body>{children}</body></html>
}
