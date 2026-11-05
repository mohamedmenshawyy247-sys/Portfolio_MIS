# MIS Department Portfolio

Bilingual (English / Arabic, full RTL) executive portfolio for the MIS Department: Real-Time
Monitoring & Operations, Quality & Performance Management, Dashboards & Advanced Reporting.

> **Status (2026-11-05):** Phase 1 static preview and the Phase 2 **Next.js 16.4 + Payload 3.93 + PostgreSQL**
> foundation are implemented and verified locally: clean build, committed migrations, seeded bilingual
> demo content, and automated security/integration/browser tests. **Nothing is deployed.** All content is
> illustrative (`DEMO_ONLY`); no client names, KPIs or private media. See `PHASE_1_2_REPORT.md` for evidence
> and open items.

## Two deliverables in one repository

| | GitHub Pages preview (`docs/`) | Next.js + Payload application (`src/`, `payload.config.ts`) |
| --- | --- | --- |
| Purpose | Share the approved look and demo content with no hosting cost | The real, editable site and CMS (needs Node + PostgreSQL) |
| Content | `content/demo-content.json`, synced to `docs/data/content.json` | PostgreSQL, edited in `/admin` |
| Admin | `docs/admin-demo.html` is a **design-only mock**: no login, nothing is saved | Payload admin with roles, drafts, review and preview |
| Runs on | Any static host | Node.js 24, PostgreSQL 16 |

GitHub Pages cannot run Payload or PostgreSQL. The static preview is a demo, not a CMS.

## Requirements (application)

- Node.js **24.22.1+** (Payload 3.93 accepts `^22.23.4 || >=24.22.1`; the project pins 24)
- pnpm **10.28** (`corepack enable` or `npm i -g pnpm@10.28.0`)
- PostgreSQL 16 (one database for the app, a second disposable one for tests)

## Quick start

```bash
pnpm install
cp .env.example .env            # fill PAYLOAD_SECRET, DATABASE_URL, TEST_DATABASE_URL, PREVIEW_SECRET, SITE_URL
pnpm db:migrate                 # applies src/migrations (schema changes never use dev "push")
SEED_ADMIN_EMAIL=you@example.com SEED_ADMIN_PASSWORD='a long passphrase 123' pnpm seed:admin
pnpm seed:demo                  # optional: bilingual DEMO_ONLY catalogue, homepage blocks, settings
pnpm dev                        # http://localhost:3000/en , /ar , /admin
```

Production-style run: `pnpm build && pnpm start`.

`pnpm seed:admin` creates the first administrator **only if no user exists**; afterwards manage accounts in
`/admin`. Credentials come from the environment and are never stored in the repository.

## Scripts

| Script | What it does |
| --- | --- |
| `pnpm dev` / `pnpm build` / `pnpm start` | Next.js dev server / production build / production server |
| `pnpm typecheck` / `pnpm lint` | TypeScript 6 strict check / ESLint (next core-web-vitals + typescript) |
| `pnpm db:migrate` / `db:migrate:create` / `db:migrate:status` | Payload migrations (PostgreSQL) |
| `pnpm generate:types` / `generate:importmap` | Regenerate `src/payload-types.ts` and the admin import map after schema changes |
| `pnpm seed:admin` / `pnpm seed:demo` | First admin bootstrap / demo content |
| `pnpm test:int` | Integration suite (vitest) against `TEST_DATABASE_URL` and a production server. Run `pnpm build` first. |
| `pnpm test:e2e` | Playwright browser suite (public site at 7 widths × EN/AR, admin flows, static preview) |
| `pnpm validate:content` / `pnpm sync:preview` | Validate demo JSON and copy it into `docs/data/` |
| `python3 scripts/verify_scaffold.py` | Static checks of the preview and scaffold (writes `STATIC_CHECKS.md`) |

The test suites **wipe `TEST_DATABASE_URL`** (its name must contain `test` and it must differ from `DATABASE_URL`).
They refuse to start if something else is listening on port 3000.

## Environment variables

All variables are listed with comments in `.env.example`. The ones that differ per deployment:

- `SITE_URL`: public origin of the site (`https://example.com`, no trailing slash). It is read at **runtime** and
  drives Payload's `serverURL`, the only origin allowed for CORS/CSRF, the preview links, `metadataBase`
  (absolute canonical/hreflang URLs), the sitemap and `robots.txt`. `NEXT_PUBLIC_SITE_URL` is still accepted as a
  deprecated fallback, but Next inlines `NEXT_PUBLIC_*` values into the build, so a build made with one origin
  would keep it on every host; set `SITE_URL` on the server instead.
- `PUBLIC_MEDIA_DIR` / `PRIVATE_MEDIA_DIR`: upload directories (defaults `uploads/public-media` and
  `uploads/private-media`, git-ignored). Keep them outside `public/`: Next serves that folder at `/media/<name>`
  with no access check, which would bypass the approval gate and the staff-only rule.
- `PREVIEW_SECRET`: enables the admin "Preview" button; empty disables draft previews.

## Content model and roles

- **Services** and **Projects** are localized (title, summary, challenge, solution, delivered value, SEO).
  The slug is shared by both languages. Drafts may be incomplete; **publishing requires both English and
  Arabic** for the required fields.
- **Project visibility:** `public` (listed, indexable), `unlisted` (reachable only by exact link, `noindex`,
  never listed or enumerable through the API), `private` (staff only, 404 for visitors).
- **Roles:** *Editors* create and revise drafts and request review; they cannot publish, unpublish, approve,
  restore versions, change roles or manage other users. *Admins* approve, publish and manage everything.
  Editors revise a published project by saving a new draft; the live version stays untouched until an
  admin publishes it.
- **Media:** `public-media` (approved public assets, served at `/api/public-media/file/<name>` and the only
  path allowed through `next/image`) and `private-media` (staff-only, never referenced from public pages).
  Both are stored under `uploads/` (git-ignored, overridable with `PUBLIC_MEDIA_DIR` / `PRIVATE_MEDIA_DIR`),
  deliberately outside Next's `public/` folder, which would serve files with no access check. Uploads are validated by content (magic bytes), size and extension; SVG is
  rejected; images are re-encoded through sharp.
- **Homepage builder:** a fixed catalogue of seven blocks (hero, introduction, services, featured projects,
  approach, impact, CTA) rendered in order; built-in defaults are used until the global is published.
- **Preview:** the admin "Preview" button opens an authenticated draft preview (`PREVIEW_SECRET` + staff
  session, re-checked on every request). Use the yellow bar's "Exit preview" link to leave it.
- **Leads:** schema only. Public submission stays disabled until SMTP and anti-spam are configured.

## GitHub Pages (static preview only)

1. The preview is the `docs/` folder. Keep it demo-only: no confidential data, screenshots or links.
2. Repository **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. `.github/workflows/pages.yml` publishes `docs/` on every push to `main` that touches `docs/`.
4. The published URL appears in the workflow run's `github-pages` environment.

To update the preview content: edit `content/demo-content.json`, run `pnpm validate:content && pnpm sync:preview`,
and commit `docs/data/content.json`.

## Not done yet (by design, see `spec/phase-gates.md`)

- Email (SMTP): password reset emails are not sent and the contact form stays off until a provider is configured.
- Rate limiting and CSP are expected from the reverse proxy / Phase 4 hardening; Payload 3 has no built-in rate limit.
- Object storage (S3/R2) for media; files are stored on local disk.
- Phase 3 motion (GSAP / Motion / React Three Fiber) and performance budgets.
- VPS deployment, domain, backups and monitoring (Phase 4).
