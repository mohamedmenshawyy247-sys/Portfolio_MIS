# Implementation architecture — preview first, VPS later

## Approved stack
- Next.js 16.4.5, React 19.3.x, TypeScript 6.0.3
- Payload CMS 3.93.0 integrated in Next.js; `@payloadcms/*` same exact version
- PostgreSQL 16 (later), no live database on GitHub Pages
- GSAP ScrollTrigger, Motion for React, React Three Fiber/Drei (Phase 3)
- CSS design tokens; Next locale routes (EN/AR)
- GitHub source + Actions + free GitHub Pages static preview

## Two outputs, not two production apps
1. `docs/` browser-ready static preview with shared public demo JSON and visual-only CMS showcase. This is a demo for immediate sharing from GitHub Pages.
2. `src/` + `payload.config.ts` production-direction unified Next/Payload source. Will become the true editable site when a Node/Postgres runtime is available, after thorough integration tests.

Avoid saying that the static preview Admin is an operational CMS. Do not enable public SQL or private media on Pages.

## Key source folders
- `content/demo-content.json`: canonical demo content; `scripts/sync-preview.mjs` syncs into `docs/data/content.json`.
- `docs/`: GitHub Pages preview (no npm build).
- `src/app/(frontend)/[locale]`: Next public site.
- `src/app/(payload)`: Admin and REST APIs.
- `src/collections`: Payload content types and security controls.
- `src/globals`: site settings and controlled homepage block builder.
- `src/lib/catalog.ts`: public content mapper; Payload or explicit `USE_DEMO_CONTENT=true` mode.
- `spec/`: branding, privacy, delivery acceptance, workflows.

## Workflow
- Avoid committing secrets and sample private items.
- Push feature branch → PR review → merge into `main` → GitHub Pages Action publishes `docs/`.
- No VPS/Domain changes now.
- Next source and CMS require Node 24.22.1+, pnpm install, DB, secret, migration and role tests before exposure.

## Verified on 2026-11-05 (local, not deployed)
- Node 24.22.2 + pnpm 10.28: `pnpm install` resolves every exact pin with no peer warnings; `next build` and `tsc` are clean.
- PostgreSQL 16: initial migration generated from the schema and applied with `pnpm db:migrate` (adapter runs with `push: false`).
- Payload admin, REST, Local API, drafts/versions/trash, localization (en/ar, no fallback) and the Arabic/RTL admin UI work at runtime.
- Security rules are enforced server-side and exercised by `pnpm test:int` (38 tests) and `pnpm test:e2e`.

## Remaining blockers
- SMTP provider (password reset and lead notifications), object storage for media, reverse-proxy rate limiting and CSP, staging/VPS, backups: Phase 4.
- Phase 3 motion and performance budgets not started.
