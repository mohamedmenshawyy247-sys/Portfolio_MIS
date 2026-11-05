# Website sitemap and bilingual content policy

## Public routes (Next app)
- `/en` and `/ar`: Homepage
- `/[locale]/about`: About MIS Department
- `/[locale]/services`: Three core services and related capabilities
- `/[locale]/projects`: Filterable Projects Gallery
- `/[locale]/projects/[slug]`: Case Study: Challenge → Solution → Media → Delivered Value
- `/[locale]/impact`: Qualitative business impact without fictional KPIs
- `/admin`: authenticated CMS (not on GitHub Pages)

## GitHub Pages static preview routes
- `/` → `docs/index.html` Home, About, Services, Featured Projects, Approach, Impact
- `/projects.html`: filterable gallery
- `/case-study.html?slug=...`: project detail with placeholder walkthrough
- `/admin-demo.html`: design-only overview with tabs; NO authentication/edits

## Content types
- **Services**: key, localized name/description/features, icon, active, order, draft status.
- **Projects**: slug, localized title/summary/challenge/solution/value, service, featured, order, visibility public/unlisted/private, status draft/review/published, approved public cover/gallery, separate private-media list.
- **Public media**: alt, caption, type, visibility approval, public hosting.
- **Private media**: access-controlled, separate storage; never copied into GitHub Pages.
- **Homepage**: approved block catalog only, fixed design variants.
- **Settings**: brand name, logo, allowed accent, locale, contact info.
- **Users**: Admin and Editor. No self-role elevation.
- **Leads**: no public writes until SMTP and anti-spam decisions.

## Translation approval
English is default; Arabic is mandatory for all visitor-facing copy before publishing. Keep slug common to both languages and avoid fallback to incomplete translations on public pages. Avoid translating technical identifiers and branded product terms where inappropriate. Editor can create drafts with incomplete translation; only Admin can publish when both are ready.

## Sample project catalog (demonstration, not claims)
- Operations Monitoring Suite
- Quality Management Hub
- Executive Reporting Suite

These are illustrative names and descriptions, not evidence that MIS has delivered these precise systems or results. No real client identifiers or percentages are used.
