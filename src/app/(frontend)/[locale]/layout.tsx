import type { ReactNode } from 'react'
import { notFound } from 'next/navigation'
import '@/styles/site.css'
export const dynamic = 'force-dynamic'
export default async function LocaleLayout({ children, params }: { children:ReactNode, params: Promise<{locale: string}> }) {
  const { locale } = await params
  if (locale !== 'en' && locale !== 'ar') notFound()
  return <html lang={locale} dir={locale==='ar'?'rtl':'ltr'}><body>{children}</body></html>
}
