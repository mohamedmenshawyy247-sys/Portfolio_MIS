import Link from 'next/link'

/**
 * Rendered when a page calls notFound(): unknown locale, unknown slug, private or draft project. For a dynamic
 * route Next answers with its minimal 404 document and renders this component on the client WITHOUT the root
 * layout or its stylesheet, so the page is self-contained: inline critical styles and explicit lang/dir.
 * URLs that match no route are served by src/app/global-not-found.tsx (a full server-rendered document).
 */
const css = `
  html{background:#071226}
  body{margin:0;font-family:Inter,"IBM Plex Sans Arabic",ui-sans-serif,system-ui,-apple-system,"Segoe UI",Arial,sans-serif;color:#fff}
  .nf{min-height:100vh;display:grid;place-items:center;padding:48px 16px;box-sizing:border-box;background:radial-gradient(circle at 78% 30%,#153e76 0%,#0a2343 35%,#071226 70%)}
  .nf .box{max-width:640px;text-align:center}
  .nf .eyebrow{letter-spacing:.14em;text-transform:uppercase;font-size:13px;font-weight:700;color:#59c8fa;margin:0 0 18px}
  .nf h1{font-size:clamp(34px,6vw,56px);line-height:1.08;margin:0 0 12px;letter-spacing:-.03em}
  .nf h2{font-size:clamp(26px,4.6vw,40px);line-height:1.25;margin:28px 0 8px}
  .nf p{font-size:17px;line-height:1.6;color:#bacbe0;margin:0}
  .nf .actions{margin-top:34px;display:flex;gap:12px;justify-content:center;flex-wrap:wrap}
  .nf a{display:inline-flex;align-items:center;min-height:44px;padding:10px 22px;border-radius:999px;font-weight:700;text-decoration:none}
  .nf a.button{background:linear-gradient(130deg,#0f66e6,#1350d8);color:#fff}
  .nf a.button-outline{border:1px solid #5b86b5;color:#fff}
  .nf a:focus-visible{outline:3px solid #59c8fa;outline-offset:3px}
`

export default function NotFound() {
  return (
    <main id="main" lang="en" dir="ltr">
      <style>{css}</style>
      <section className="page-hero not-found nf">
        <div className="container box">
          <p className="eyebrow bright">404</p>
          <h1 lang="en">Page not found</h1>
          <p lang="en">This page does not exist or is not available.</p>
          <h2 lang="ar" dir="rtl">الصفحة غير موجودة</h2>
          <p lang="ar" dir="rtl">هذه الصفحة غير موجودة أو غير متاحة.</p>
          <p className="actions"><Link className="button" href="/en">English</Link> <Link className="button-outline" href="/ar" lang="ar">العربية</Link></p>
        </div>
      </section>
    </main>
  )
}
