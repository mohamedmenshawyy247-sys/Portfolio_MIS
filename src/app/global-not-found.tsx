import type { Metadata } from 'next'
import Link from 'next/link'
import '@/styles/site.css'

export const metadata: Metadata = { title: 'MIS Department | Page not found', robots: { index: false } }

/**
 * Document for URLs that match no route (e.g. /en/nope). The site's root layout lives in the dynamic [locale]
 * segment, so Next cannot reuse it here; this file owns its own <html>. Bilingual because the locale is unknown.
 * Enabled by `experimental.globalNotFound` in next.config.mjs (file-based, no runtime flag beyond that).
 */
export default function GlobalNotFound() {
  return (
    <html lang="en" dir="ltr">
      <body>
        <main id="main">
      <section className="page-hero not-found">
            <div className="container">
              <p className="eyebrow bright">404</p>
              <h1 lang="en">Page not found</h1>
              <p lang="en">This page does not exist or is not available.</p>
              <h2 lang="ar" dir="rtl">الصفحة غير موجودة</h2>
              <p lang="ar" dir="rtl">هذه الصفحة غير موجودة أو غير متاحة.</p>
              <p><Link className="button" href="/en">English</Link> <Link className="button-outline" href="/ar" lang="ar">العربية</Link></p>
            </div>
          </section>
        </main>
      </body>
    </html>
  )
}
