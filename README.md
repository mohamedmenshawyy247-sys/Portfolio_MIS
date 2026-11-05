# MIS Department Portfolio — Phase 1 & 2 Starter

> **Status:** Implemented source starter + **static showcase (browser QA pending)**. The live Payload CMS/PostgreSQL application is **not yet runtime-verified or deployed**. All included projects and values are **illustrative**; no client names, data, KPIs or private links should be published without approval.

## Project objective

An executive-grade MIS Department portfolio presenting Real-Time Monitoring & Operations, Quality & Performance Management, and Dashboards & Advanced Reporting through bilingual (English/Arabic) pages, cinematic project previews, case studies and a content-admin workflow.

## What is available now

| Feature | GitHub Pages preview (`/docs`) | Next.js + Payload source |
| --- | --- | --- |
| Responsive branded website | **Yes**: source prepared; browser QA pending | Source prepared; requires package install/build |
| English + Arabic / RTL | **Yes** | Source implemented |
| Home / Services / Projects / Case Studies / Impact | **Yes** (Home includes About, Services and Impact sections) | Source implemented as five routes plus case details |
| Project search & filters | **Yes** | Source implemented |
| Motion | Lightweight CSS + intersection effects, reduced-motion support | Base styles prepared; GSAP/R3F deep motion reserved for Phase 3 |
| Admin CMS | **Design-only page**; no authentication or editing | Payload config + collections + Admin routes scaffolded; needs runtime validation |
| PostgreSQL | No (static hosts cannot execute a database) | Configured but **not connected or tested** |
| Private media | No private media in static preview | Collection with staff-only access scaffolded; validate before uploading any sensitive files |
| Contact inbox / SMTP | Not active | Lead schema only; public submission intentionally disabled |
| Deployment | GitHub Actions Pages workflow included | Hosting and production deployment postponed |

## Fastest way to show your website using GitHub Pages

1. **Review `/docs` carefully; it contains only dummy content.** Do not add confidential customer data to this public preview.
2. Push the contents of this starter **into the `Portfolio_MIS` GitHub repository** on a dedicated branch, then create a Pull Request into `main`. The repo currently has only an experimental `Test` file; do not overwrite/remove other files without reviewing differences.
3. In GitHub repository go to **Settings → Pages → Build and deployment → GitHub Actions**.
4. Merge the reviewed PR; the provided workflow `.github/workflows/pages.yml` publishes `docs/` on pushes to `main`.
5. Review the **Actions** tab for the `Publish static portfolio preview to GitHub Pages` workflow and the published URL in its `github-pages` environment.

No Node, PostgreSQL or paid hosting is required for this static preview. **GitHub Pages does not run Payload or PostgreSQL.** This preview is not a production content-management system.

### View the preview before uploading

```bash
cd docs
python -m http.server 8080
```

Open `http://localhost:8080/` in a browser. `file://` will not work because the preview fetches `data/content.json`.

## Next.js + Payload development (when ready to use the CMS)

Requirements: Node.js **24.22.1+**, pnpm, PostgreSQL. Exact package versions in `package.json` need verification on a Node 24 machine with npm network access.

```bash
corepack enable
pnpm install
cp .env.example .env
# Fill PAYLOAD_SECRET, DATABASE_URL; set USE_DEMO_CONTENT=true for local demo-only pages
pnpm generate:importmap
pnpm generate:types
pnpm build
pnpm dev
```

After starting the server, the website lives at `/en` and `/ar`, and Payload Admin lives at `/admin`. Do not expose the server publicly until access tests, first-admin bootstrap and SMTP/password reset are verified. `src/lib/catalog.ts` reads Payload documents when `USE_DEMO_CONTENT` is not `true`, and deliberately does not fall back to demo data if the database fails.

## Content updates

- For static preview: edit `content/demo-content.json`, run `node scripts/validate-content.mjs` and `node scripts/sync-preview.mjs`; commit updated `docs/data/content.json`.
- For actual CMS: after installing the application, log in to Payload, create Services and Projects, save as draft, review bilingual text, then publish as Admin. Real CMS-to-UI updates must pass integration QA before external launch.
- `src/globals/Homepage.ts` models an approved-block homepage builder. Rendering saved blocks in the public site is **not completed** in this starter.
- Static preview admin (`docs/admin-demo.html`) is **visual only**. It does not save edits and cannot authenticate anyone.

## Security notes

- `Portfolio_MIS` was observed Public in the previous audit. Never commit `.env`, API keys, private screenshots, customer phone numbers, service URLs, real KPI data or tokens.
- The Pages preview contains only authored demo content. An unlisted link is **not** private access protection.
- Admin bootstrap, draft preview/logout protection, server-side media type validation, SMTP, and file upload security require testing before enabling public CMS or sensitive media.
- See `spec/security-and-risk-register.md` and `spec/phase-gates.md` for the exact review gates.

## Why two preview targets?

The approved **unified Next.js + Payload CMS** architecture requires a Node runtime and a database. For now `docs/` is a separate no-backend static representation of the same approved visual design and JSON sample content so you can review and share it on GitHub Pages without hosting expense. Once a Node host is available, the Next + Payload app becomes the editable production site.
