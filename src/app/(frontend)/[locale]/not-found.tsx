import Link from 'next/link'

/** Rendered for unknown locales, slugs and private/draft projects. Bilingual because params are not available here. */
export default function NotFound() {
  return (
    <main id="main" className="not-found">
      <div className="container">
        <p className="eyebrow">404</p>
        <h1 lang="en">Page not found</h1>
        <p lang="en">This page does not exist or is not available.</p>
        <h2 lang="ar" dir="rtl">الصفحة غير موجودة</h2>
        <p lang="ar" dir="rtl">هذه الصفحة غير موجودة أو غير متاحة.</p>
        <p><Link className="button" href="/en">English</Link> <Link className="button-outline" href="/ar" lang="ar">العربية</Link></p>
      </div>
    </main>
  )
}
