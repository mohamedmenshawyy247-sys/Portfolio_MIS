# Phase 1 + Phase 2 — Engineering Completion Report

**Project:** MIS Department Portfolio · **Date:** 2026-11-05 (updated after the independent review, same day) · **Branch:** `feature/mis-portfolio-phase-1-2` (19 commits ahead of `origin/main`, HEAD `f01f3b7` pushed to `origin/feature/mis-portfolio-phase-1-2`; pull request #1 open against `main`, not merged; CI run #10 green on this HEAD: https://github.com/mohamedmenshawyy247-sys/Portfolio_MIS/actions/runs/41968963985)
**Stack verified locally:** Next.js 16.4.5 · Payload 3.93.0 · PostgreSQL 16.15 · Node 24.22.2 · pnpm 10.28.0 · TypeScript 6.0.3

Labels follow `spec/next-steps-for-claude-code.md` point 10: `DONE`, `BLOCKED`, `SECURITY OPEN`, `READY FOR NEXT PHASE`. Every statement is backed by a repository file, a CI run or a session log listed in section 9; anything that could not be verified is marked *to be confirmed*. Section 10 records the independent verification (adversarial probes, three-lens code review, screenshot review) that followed the first version of this report and what was changed because of it. **Nothing is deployed.** GitHub Pages, once the owner enables it, will host only the static `docs/` demo; `docs/admin-demo.html` is a design-only mock, not a CMS.

## 1. Summary

1. Phase 1 static preview (`docs/`): `DONE` as repository artefacts — 7-width EN/AR Playwright checks pass, the scaffold checks report PASS, and the defects found by the screenshot review (sections stuck invisible after a language switch, an unreadable EN/AR toggle on the admin mock, unmirrored arrows and untranslated hero chrome in Arabic) are fixed; owner sign-off on the design baseline and a privacy-policy document are *to be confirmed*.
2. Phase 2 foundation: `DONE` — `pnpm typecheck`, `pnpm lint` and `pnpm build` pass; one committed migration (62 tables) applied with `push: false`; first-admin bootstrap and the idempotent bilingual demo seed verified; **57/57 integration tests and 45/45 browser tests pass on HEAD `f01f3b7`**, locally and in GitHub Actions (CI run #10; every push to the PR runs the same pipeline).
3. Rules proven server-side over REST, Local API and the admin UI: anonymous callers see only public + published projects, approved public media and never staff-only fields, private media or unpublished homepage drafts; editors cannot publish, unpublish, approve media or content, read or restore version history, use Payload's locale publish flags, or change roles; uploads are validated by content and stored outside Next's `public/` folder; draft preview needs the secret plus a live staff session and only ever redirects to same-origin site paths; GraphQL is disabled; security headers are set. Four independent attack probes (section 10) found 10 issues, all fixed and covered by regression tests; 79 further attack attempts failed as intended.
4. `SECURITY OPEN` / `BLOCKED` before any real content or exposure: no SMTP (no password reset; Leads stay closed), no rate limiting, no CSP, media on local disk, repository still PUBLIC, GitHub Pages source setting unconfirmed, PR #1 open and not merged (owner decision).
5. Gate: `READY FOR NEXT PHASE` for Phase 3 (motion and optimisation) work on this codebase; **not** ready for real content, public exposure or go-live (Phase 4 items in section 6 remain open).

## 2. Environment and toolchain (local session, 2026-11-05)

| Item | Value | Evidence |
| --- | --- | --- |
| Node.js | 24.22.2, downloaded from nodejs.org with SHA256 verification into `/opt/node24`; system Node 22.23.4 left unchanged | session; `package.json` `engines.node ">=24.22.1 <27"` |
| pnpm | 10.28.0, pinned as `packageManager` | `package.json` |
| PostgreSQL | 16.15 local; two disposable databases `mis_portfolio` (app) and `mis_portfolio_test` (wiped by the test suites) | session; `.env.example`; `tests/int/env.ts` |
| Install | npm registry reachable; `pnpm install` resolved every exact pin with no peer-dependency warnings; `pnpm-lock.yaml` committed (9,041 lines) | session; diff stat |
| Secrets | `.env` is git-ignored (`.gitignore`: `.env`, `.env.*`, `!.env.example`); `.env.example` committed with placeholders only; test runner refuses to run unless the test DB name contains "test" and differs from `DATABASE_URL` | `.gitignore`, `.env.example`, `tests/int/env.ts` |
| Package changes (with reason) | `sharp` 0.35.0 → 0.35.5 (0.35.0 declares no `types` in its `exports`, so TS could not resolve it); `build` script `payload build` → `next build` (Payload 3.93 CLI has no `build`: `generate:db-schema`, `generate:importmap`, `generate:types`, `info`, `jobs:run`, `jobs:handle-schedules`, `run`, `migrate*`); removed import of `generatePayloadViewport` (not exported by `@payloadcms/next` 3.93.0); added deps `file-type` 21.3.4, `@payloadcms/translations` 3.93.0; added dev deps `@playwright/test` 1.63.0 (matches preinstalled browsers), `vitest` 5.1.0, `eslint` 10.14.0, `eslint-config-next` 16.4.5, `tsx` 4.23.15, `dotenv` 18.0.9; Next.js adjusted `tsconfig.json` (`jsx: react-jsx`, include `.next/dev/types`). Dev dependency `@axe-core/playwright` 4.14.0 (pinned exactly in `56ebd6c`) for `tests/e2e/a11y.spec.ts`. No package was added or changed after the independent review | session; `package.json`; `tsconfig.json`; `git log` |
| Quality gates | `pnpm typecheck` (TS 6.0.3 strict), `pnpm lint` (eslint-config-next core-web-vitals + typescript), `pnpm build` — all pass | session; `eslint.config.mjs` |
| Routes built | `/`, `/_not-found` (from `src/app/global-not-found.tsx`), `/[locale]`, `/[locale]/about`, `/[locale]/impact`, `/[locale]/projects`, `/[locale]/projects/[slug]`, `/[locale]/services`, `/admin/[[...segments]]`, `/api/[...slug]`, `/preview`, `/exit-preview`, `/sitemap.xml`, `/robots.txt` | session build output; `src/app` tree |
| Server notices | `WARN No email adapter provided. Email will be written to console.` on every start (expected: SMTP not configured). Payload logs `INFO You are not allowed to perform this action.` for every denied request (the security tests cause many of them on purpose). Next.js prints an `Experiments: turbopackServerFastRefresh` notice of its own. | CI job logs; local run logs |

## 3. Phase 1 completion matrix (scope from `spec/phase-gates.md`)

| Item | Status | Evidence |
| --- | --- | --- |
| Final design baseline | `DONE` (visual baseline); owner approval of project-specific content *to be confirmed* | `spec/branding-and-design.md` ("Visual Baseline Approved, pending project-specific content and verified real assets"); `design-references/` holds two generated concept boards, explicitly not screenshots |
| 7 responsive widths (360/390/430/768/1024/1440/1920) EN + AR | `DONE` | `tests/e2e/static-preview.spec.ts` 8/8 (7 widths + interactions) and `tests/e2e/public-site.spec.ts` 14/14 home tests pass with zero console/page errors (CI run #10); all 25 captures were reviewed tile by tile and the resulting fixes are in section 10.3; see `STATIC_PREVIEW_QA.md` |
| Bilingual content schema and demo content | `DONE` | `content/demo-content.json` (`meta.status = DEMO_ONLY`, 3 services, 3 public projects, EN+AR); `pnpm validate:content` OK; `docs/data/content.json` identical (verify_scaffold) |
| Brand tokens and typography | `DONE` | all eight token colours from the branding spec (`#071226 #0D2142 #1D68ED #3DC8F2 #F5F8FD #10213C #53657F #E5EDF7`) present in `docs/assets/site.css` and `src/styles/site.css`; `font-family: Inter, "IBM Plex Sans Arabic", …` in both |
| Privacy policy | `BLOCKED` (owner) — *to be confirmed* | no dedicated privacy-policy document or page found in the repository; only the demo-data-only rule in `spec/security-and-risk-register.md` and `meta.contentPrivacy` in `content/demo-content.json` |
| Static preview pages (`index`, `projects`, `case-study`, `admin-demo`) | `DONE` | `python3 scripts/verify_scaffold.py` → `STATIC_CHECKS.md` PASS (its source-presence checks are now labelled as such); e2e interaction test passes; sections are visible by default and only animate on entry (`913c49c`), the admin mock's EN/AR toggle is readable (9.0:1), arrows mirror in RTL and the hero chrome is translated (`20b6ed9`) |
| Static preview contains demo data only (no media, secrets, private hosts) | `DONE` | `docs/` has 8 files and no image/video; grep of `docs/`, `content/`, `spec/` for secrets/private hostnames found nothing; verify_scaffold rejects `example.invalid` / `API_KEY` / `PAYLOAD_SECRET` in docs HTML |
| GitHub Pages workflow | `BLOCKED` (owner) | `.github/workflows/pages.yml` publishes `./docs` on push to `main` touching `docs/**`; repository setting "Settings → Pages → Source: GitHub Actions" could not be read through this environment's GitHub proxy (API path blocked) — *to be confirmed*; nothing published, no URL |
| Exit gate: design approved and static preview reviewed | `DONE` for automated and screenshot review; owner review *to be confirmed* | screenshots in `qa-screenshots/` (28 files, git-ignored; uploaded as the `qa-evidence` artifact of every CI run); `spec/phase-gates.md` status line |

## 4. Phase 2 completion matrix (the 10 handoff points in `spec/next-steps-for-claude-code.md`)

| # | Handoff point | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Inspect starter + `spec/`; Node ≥ 24.22.1 and pnpm; exact packages; types/importmap; build; fix compilation errors | `DONE` | section 2; generated `src/payload-types.ts` (844 lines) and `src/app/(payload)/admin/importMap.js` committed; typecheck/lint/build pass |
| 2 | Dedicated local PostgreSQL and `.env` (never committed); validate migrations; bootstrap first Admin securely | `DONE` | `src/migrations/20261105_013239_initial.ts` (+ `.json`, `index.ts`) generated and applied by `pnpm db:migrate` → 62 tables; `payload.config.ts` `push: false`; `pnpm seed:admin` created the first admin from `SEED_ADMIN_*` env vars (password ≥ 12 chars with letters and digits) and refused a second run: "Refusing to bootstrap: 1 user(s) already exist"; `.env` git-ignored |
| 3 | Confirm Admin/Editor rules via REST, UI and Local API; editor revises published content without publishing; deny role escalation | `DONE` | REST: `SEC-08`, `SEC-17` tests; Local API: "editor publication boundary" (7 tests) and "users" (3 tests); UI: `admin.spec.ts` tests 1–2 (editor saves draft, no Publish/Unpublish button, public page unchanged; role control read-only). After the review: version history and restore are admin-only for collections and globals, editors cannot use Payload's `publishAllLocales` / `unpublishAllLocales` / `publishSpecificLocale` flags, admins cannot delete themselves through the bulk route either. Details in section 5 |
| 4 | Localized field validation + Homepage block renderer; only approved bilingual content publishes | `DONE` (seeded blocks render; the homepage global now also refuses to publish while any block lacks its headline/heading in one language, CTA links are validated, and a block without text in the requested locale is never rendered empty; a test asserting the public HTML right after an admin publish is not in the suite — *to be confirmed*) | `requireBilingualToPublish` (projects: title/summary/challenge/solution; services: title/summary) proven by Local API "publishing requires both English and Arabic"; `reviewStatusRules` (publish ⇒ `approved`; editors cannot set approved/changes-requested); `src/components/HomeBlocks.tsx` renders the 7 block types from `src/globals/Homepage.ts`; `site.int` test 1 finds the seeded hero headline and "Collect" step on `/en` and Arabic on `/ar`; `[locale]/layout.tsx` is `force-dynamic` (rendered per request); `localization.fallback: false`, `fallbackLocale: false` in `catalog.ts` |
| 5 | Public vs unlisted vs private; direct media endpoints; nested REST; GraphQL disabled; preview logout; no private data in Pages preview | `DONE` | `SEC-01..05`, `SEC-06/07`, `SEC-09/18`, Local API anonymous reads, `site.int` tests 3–4; `graphQL.disable: true` (REST test returns 404); unlisted pages carry `robots noindex` (`projects/[slug]/page.tsx`); `docs/` contains no media and all demo projects are `public`; unapproved public media is hidden from visitors (REST, file route, optimizer) and uploads live under `uploads/`, outside Next's `public/` folder, so no file is ever served without the access check (`site.int` "never from public/ at /media/<name>") |
| 6 | Real server-side upload safeguards; MIME/size/path tests | `DONE` | `src/lib/upload-guards.ts`: magic-byte detection (`file-type`), allow-list jpeg/png/webp/avif (8 MiB) + mp4 (25 MiB), declared MIME must equal detected, extension must match, per-type size cap; `resizeOptions` 2400×2400 re-encode via sharp; `allowRestrictedFileTypes: false`; request cap 25 MiB; proven by `SEC-11` (multipart) and Local API "uploads are validated by content"; the suite log shows Payload's own SVG/`text/plain` rejections firing too |
| 7 | SMTP when available; otherwise keep public Leads disabled; no placeholder recipients | `BLOCKED` (SMTP) / `DONE` (Leads closed) | no email adapter configured (WARN in every log); `src/collections/Leads.ts` create/read/update/delete all `adminOnly`; anonymous `POST /api/leads` → 401/403 (REST test 3); `.env.example` lists `SMTP_*` as commented placeholders, no recipient address; `SiteSettings.contactEmail` empty by default ("Do not use sample addresses") |
| 8 | Responsive/RTL at 7 widths; accessibility; motion fallback; no overflow; Playwright screenshots | `DONE` (automated scope) | `public-site.spec.ts`: 14 home tests (7 widths × EN/AR: `dir` attribute, visible h1 and CTA in viewport, mobile menu ≤ 860 px, overflow ≤ 1 px, zero console/page errors), keyboard skip-link test, reduced-motion test, gallery filters/search/empty state/case study/language switch, phone gallery stacking with ≥ 36 px filter buttons — 18/18 passed; admin UI in Arabic with `dir=RTL` (admin test 4, passed on re-run); 25 screenshots in `qa-screenshots/`. Lighthouse/CWV and contrast ratios not measured (Phase 3 metrics). An axe-core WCAG 2.x A/AA scan (`tests/e2e/a11y.spec.ts`: 14 tests, 7 public paths × EN/AR, fails on serious/critical violations) passes. The screenshot review (section 10.3) led to: localized category labels instead of raw service keys, an accessible featured-project carousel, distinct service icons, a self-contained bilingual 404, RTL mirrors for the mobile menu and decorative gradients, Arabic type sizes, button/focus contrast ≥ 4.5:1 / 3:1 (computed), 24 px+ hit targets; `45/45` browser tests pass on HEAD |
| 9 | GitHub Pages solely a static demo; PR instead of overwriting `main` | `DONE` | README and `spec/architecture-and-deployment.md` state Pages is a demo, not a CMS; `admin-demo.html` banner "DESIGN PREVIEW ONLY"; `pages.yml` uploads only `./docs`; `next.config.mjs` comment forbids `output: 'export'`; all work is on the feature branch (`origin/main` holds only the file `Test`), pushed to `origin/feature/mis-portfolio-phase-1-2`; PR #1 "Phase 1 + 2: static preview, Next.js 16.4 + Payload 3.93 foundation with security tests" is open against `main` (not a draft, not merged) |
| 10 | Truthful gate report with the four labels | `DONE` | this file and `STATIC_PREVIEW_QA.md` |

Phase 2 exit gate (`spec/phase-gates.md`: "Real CMS build passes; editor-to-publish E2E and access tests pass"): build passes; access tests pass (57/57); editor-draft → admin-publish is proven over REST (`SEC-08` test 3) and the Local API; in the browser the editor draft save and the admin's Publish/Preview controls are verified, but no test clicks the admin Publish button — *to be confirmed* if a UI click-through is required for the gate.

## 5. Security test matrix (`pnpm test:int`, 57/57 passed on HEAD `f01f3b7`, locally and in CI run #10)

`spec/security-and-risk-register.md` numbers its critical safeguards 1–10 and defines no `SEC-xx` identifiers; the `SEC-xx` strings below are the labels of the `describe` blocks in the test files. "Reg." = register safeguard number. The three tables list the original 38 tests; the tests added after the independent review follow in 5.4. The suite is order-independent (each file creates and removes its own documents; files run one at a time in path order).

### `tests/int/rest-security.int.spec.ts` (14 original + 13 added, over HTTP against a locally started `next start` build)

| Test | Rule proven | Enforced by | Reg. |
| --- | --- | --- | --- |
| SEC-01..05 · lists only public + published projects, with no private fields even at depth=2 | anonymous list = `public` AND `published`; `privateGallery`/`demoURL` absent; no `private-media` leaks via relations | `Projects.access.read` → `publicPublished`; `staffFieldRead` on both fields | 2, 3 |
| SEC-01..05 · cannot fetch unlisted, private or draft projects by id or by slug query, nor drafts via draft=true | by-id → 403/404; slug query → 0 docs; `draft=true` returns nothing unpublished | same read rule applied to every REST path | 2 |
| SEC-01..05 · denies versions, users, private media, leads and GraphQL | `/api/projects/versions`, `/api/users` (GET+POST), `/api/private-media` (list + by id), `POST /api/leads` → 401/403; `/api/graphql` → 404 | `readVersions: staffOnly`; `Users.access`; `PrivateMedia.read: staffOnly`; `Leads` adminOnly; `graphQL.disable` | 1, 2, 3, 7 |
| SEC-06/07 · anonymous direct file URL never returns the file body | `/api/private-media/file/<name>` → 401/403/404, non-image content-type | `PrivateMedia.access.read`; `staticDir: 'private-media'` (outside `public/`) | 3 |
| SEC-06/07 · staff can fetch the same file | editor session → 200 `image/png` | same | 3 |
| SEC-06/07 · the image optimizer refuses private media and serves public media | `/_next/image?url=/api/private-media/...` → 400; public → 200 image | `next.config.mjs` `images.localPatterns` = `/api/public-media/file/**` only | 3 |
| SEC-08 · cannot publish, live-write or unpublish a published project | PATCH `_status: published`, live title write, `_status: draft` (unpublish), `draft=true` + published, POST with published → all 403 | `staffUpdateNoEditorPublish` + `editorPublicationGuard` | 5 |
| SEC-08 · can save a draft of a published project; the public page keeps the live title | PATCH `?draft=true` → 200; REST and HTML still show the live title | `isDraftSave` path in `workflow-hooks.ts` | 5 |
| SEC-08 · cannot restore a published version, admin can publish | editor `POST /versions/:id` → 403; admin publish → 200 with the editor's draft title and `reviewStatus: approved` | update access evaluated with the restored `_status`; `reviewStatusRules` | 5 |
| SEC-17 · editor cannot elevate their own role or touch other users | self PATCH `role: admin` → 200 but `/users/me` still `editor`; other user PATCH/GET/DELETE and user POST denied | `Users.access`; role field `access: adminFieldUpdate` | 1 |
| SEC-11 · rejects SVG, spoofed content, wrong extensions and oversize files; accepts a real PNG | SVG → 400; text with PNG name/type → 4xx; PNG bytes named `.jpg` → 400; 9 MiB → 4xx; real PNG → 201 | `validateUploadedFile` (beforeValidate) | 6 |
| SEC-09/18 · ignores a session cookie that is not sent by a browser navigation (Payload CSRF rule) | cookie without `Sec-Fetch-Site` → 403 at `/preview` | Payload cookie/CSRF rule; `csrf: [siteURL]` | 4 |
| SEC-09/18 · needs the secret and a staff session; non-relative paths are refused | wrong secret → 403; no session → 403; external URL or `/admin` path → 400 | `src/app/(frontend)/preview/route.ts` (`timingSafeEqual`, path allow-rules) | 4 |
| SEC-09/18 · shows drafts only while the Payload session is valid, and exit-preview ends it | anonymous draft page 404; secret + staff cookie → redirect + `__prerender_bypass`; page shows draft, preview bar and `noindex`; bypass cookie alone → 404; staff sees private project in preview; `/exit-preview` expires the cookie | `src/lib/viewer.ts` re-checks the session per request; `exit-preview/route.ts` | 4 |

### `tests/int/local-api.int.spec.ts` (19 original + 2 added, in-process Local API with `overrideAccess: false`)

| Test | Rule proven | Enforced by | Reg. |
| --- | --- | --- | --- |
| anonymous · lists only public + published projects | exactly the 3 demo slugs | `Projects.access.read` | 2, 10 |
| anonymous · does not reveal drafts even when draft:true is requested | no `fixture-draft`, no `_status: draft` | same | 2 |
| anonymous · cannot read unlisted, private or draft projects by id | `findByID` rejects for all three | same | 2 |
| anonymous · cannot read private media documents | `find` rejects | `PrivateMedia.access.read` | 3 |
| anonymous · cannot read users or versions | `find users`, `findVersions` reject | `Users.access.read`; `readVersions` | 1, 2 |
| editor · cannot publish on create | `create` with `_status: published` rejects | `staffUpdateNoEditorPublish` / guard | 5 |
| editor · can create a draft and request review | draft created with `reviewStatus: in-review` | `reviewStatusRules` | 5 |
| editor · cannot approve, publish, live-write or unpublish a published project | publish, live title write, unpublish, `approved`, `changes-requested` all reject; `in-review` draft save allowed | `editorPublicationGuard`, `reviewStatusRules` | 5 |
| editor · can revise a published project as a new draft without changing the live version | live title unchanged; latest draft carries the revision | draft/versions | 5 |
| editor · a newer draft never weakens protection of the live version (regression) | with a newer draft present, live write and unpublish still reject; live doc still published with the original title | `liveStatusOfDocument` reads the live status (`draft: false`) instead of `originalDoc` — fix for a bug found during development | 5 |
| editor · cannot restore a published version | `restoreVersion` rejects | update access with restored `_status` | 5 |
| editor · cannot publish the homepage global but can save a draft of it | `updateGlobal` publish rejects; draft save ok; live global stays published | `Homepage.access.update`; `editorPublicationGuardGlobal` | 5 |
| users · editor cannot elevate their own role (field silently discarded) | `role` stays `editor`, `displayName` updates | role field access | 1 |
| users · editor cannot read, update, create or delete other users | all four reject | `Users.access` | 1 |
| users · admin cannot delete their own account | `delete` rejects | `Users.access.delete` (`id !== req.user.id`) | — |
| content rules · publishing requires both English and Arabic | publish without AR rejects with "Arabic/(ar)"; after AR draft save publish succeeds with `reviewStatus: approved` | `requireBilingualToPublish` | — (handoff 4) |
| content rules · private galleries are only allowed on private projects | `privateGallery` on a public project rejects | `projectIntegrityRules` + field `validate` | 3 |
| content rules · demo links must be https and not internal | `http://`, `https://localhost`, `https://10.0.0.5`, `javascript:` all reject | `httpsOrEmpty` | — (admin-workflows media rule) |
| content rules · uploads are validated by content, not by declared type | SVG, fake PNG, wrong extension reject; valid PNG accepted with `mimeType image/png` | `validateUploadedFile` | 6 |

### `tests/int/site.int.spec.ts` (5 original + 4 added, public pages over HTTP)

| Test | Rule proven | Enforced by | Reg. |
| --- | --- | --- | --- |
| serves both locales with the right direction and CMS homepage blocks | `<html lang="en" dir="ltr">`, seeded hero headline and "Collect"; `<html lang="ar" dir="rtl">` with Arabic headline | `[locale]/layout.tsx`, `HomeBlocks.tsx`, `getHomepageBlocks` | — (handoff 4) |
| redirects / to /en and 404s unknown locales, slugs and traversal attempts | `/` → 307/308 to `/en`; `/xx`, unknown slug, `..%2Fadmin`, `UPPER`, `/fr/about` → 404 with "Page not found" | `SLUG_PATTERN`, locale guard, `not-found.tsx` | — (handoff 5) |
| lists only public projects; unlisted is reachable by exact link with noindex; private/draft are 404 | gallery omits unlisted/private/draft; unlisted → 200 + `<meta name="robots" content="noindex`; private and draft → 404 | `getProjects` (public+published), `getProjectBySlug` (exact slug, published, public/unlisted, projected fields), `[slug]/page.tsx` metadata | 2, 10 |
| sitemap and robots exclude everything that is not public and published | sitemap lists EN/AR public project URLs only; robots disallows `/admin`, `/api/`, lists `Sitemap:` | `sitemap.ts` (`visibility !== 'public'` skipped), `robots.ts` | — (admin-workflows step 4) |
| language switch keeps the current page, and security headers are set | `hreflang="ar"` link to the same slug; `x-content-type-options: nosniff`, `x-frame-options: SAMEORIGIN`, no `x-powered-by` | `SiteShell.tsx`; `next.config.mjs` headers (`Referrer-Policy`, `Permissions-Policy` also set) | 9 (partial) |

### 5.4 Tests added after the independent review (all pass; see section 10 for the findings they close)

| File | Test | Rule proven |
| --- | --- | --- |
| rest-security | public media approval gate | unapproved assets are invisible to visitors through the list, by id, the file route and `/_next/image`; approved ones are served |
| rest-security | exit-preview never redirects off-site (backslash / protocol-relative / scheme / dot-segment tricks) | `/\\evil.com`, `//evil.com`, `/%5Cevil.com`, `/.//evil.com`, `/en/%2e%2e//evil.com` … all land on our own origin |
| rest-security | system routes are never redirect targets, even percent-encoded or via dot segments | `/admin`, `/%61dmin`, `/en/../api/users/me`, `/_next/…` → `/` |
| rest-security | homepage drafts are never served to visitors, even with `?draft=true` | editor draft marker absent from anonymous REST and HTML; present for staff |
| rest-security | only admins can unlock accounts | editor `POST /api/users/unlock` → 403 |
| rest-security | non-canonical `_status` / `reviewStatus` values are rejected with 400 | arrays, objects, other casing never reach the database enum (was HTTP 500) |
| rest-security | version history and version restore are admin-only, for globals and collections | editor `GET …/versions` → 403; editor restore of the homepage → 403 and the live homepage unchanged; admin → 200 |
| rest-security | editors cannot approve public media or touch approved assets; admins can | `approvedForPublic` is dropped for editors; editing or re-uploading an approved asset → 403/404 |
| rest-security | admins cannot delete their own account, by id or through the bulk route | by-id → 403; `DELETE /api/users?where[id][equals]=<self>` leaves the account in place |
| rest-security | editors cannot publish or unpublish through the locale query flags; admins can | `publishAllLocales`, `unpublishAllLocales`, `publishSpecificLocale` → 403 for editors on projects and the homepage |
| rest-security | homepage CTA links must be safe internal paths or https:// URLs | `/\\evil.com`, `javascript:`, `/admin` … → 400; `/en/projects`, `https://example.org/x` → 200 |
| rest-security | the homepage cannot be published while a block lacks its text in one language | EN-only block → 400 naming the block and `(ar)`; after the Arabic draft save → 200 |
| local-api | cannot publish on create: rejected by the editor rule, not by the bilingual rule; a complete bilingual draft is rejected for the editor and published by the admin | the test now fails only if the editor rule is lost |
| local-api | publishing a service requires both English and Arabic | same rule as projects, on `services` |
| site | redirects `/` to the SiteSettings default locale | `/` → `/en` for the seeded settings |
| site | 404s are styled and bilingual | unmatched paths are server-rendered by `global-not-found.tsx` with `lang`/`dir`, stylesheet and both languages; `notFound()` from a page answers 404 + `noindex` with the self-styled page |
| site | hreflang alternates are absolute URLs on the site origin | `metadataBase` |
| site | serves approved files only through the access-checked endpoint, never from `public/` at `/media/<name>` | `/media/<approved>` and `/media/<unapproved>` are both non-200 |

Browser evidence (`tests/e2e/admin.spec.ts`, 4 tests; `public-site.spec.ts` 20 tests incl. the 404 rendering check; `a11y.spec.ts` 14 tests; `static-preview.spec.ts` 8 tests): 45/45 pass on HEAD `f01f3b7` locally and in CI run #10.

## 6. Open issues (ranked) with owner actions

**P0 — before any real content enters the repository or the app is reachable by anyone else**

| Id | Issue | Label | Owner action |
| --- | --- | --- | --- |
| P0-1 | Repository is still PUBLIC | `SECURITY OPEN` | Make it private (or confirm the policy) before real content, screenshots or credentials are added; `docs/` must stay demo-only either way |

**P1 — Phase 2 blockers before real content / Phase 4 prerequisites**

| Id | Issue | Label | Owner action |
| --- | --- | --- | --- |
| P1-1 | No SMTP provider: password-reset mails are only written to the console; lead notifications impossible | `BLOCKED` | Choose a provider; supply `SMTP_*` as environment secrets; then an email adapter must be wired (not wired yet) |
| P1-2 | Public Leads submission disabled by design (anonymous POST denied); needs validated endpoint, bot protection, retention policy | `BLOCKED` | Decide anti-spam and retention after P1-1 |
| P1-3 | No rate limiting (Payload 3 has none built in) | `SECURITY OPEN` | Provide it at the reverse proxy before exposure |
| P1-4 | No Content-Security-Policy header (`next.config.mjs` sets nosniff, referrer, frame, permissions policies only) | `SECURITY OPEN` | Define CSP during Phase 4 hardening |
| P1-5 | Media stored on local disk (`uploads/public-media`, `uploads/private-media`); no S3/R2 | `BLOCKED` | Decide object storage before real uploads |
| P1-6 | GitHub Pages source setting unverifiable from this environment; publishes only after merge into `main`; no preview URL yet | `BLOCKED` | Confirm "Settings → Pages → Source: GitHub Actions"; merge via PR |
| P1-7 | PR #1 is open against `main` and not reviewed or merged (CI green on HEAD `f01f3b7`) | `BLOCKED` (owner) | Review and merge PR #1; the Pages deploy only runs after the merge |
| P1-9 | No deployment, domain, backups or monitoring (per owner instruction: none yet) | `BLOCKED` | Phase 4 |

**P2 — non-blocking**

| Id | Issue | Owner action |
| --- | --- | --- |
| P2-1 | Phase 3 packages installed but unused: `gsap` 3.15.0, `motion` 14.9.0, `@react-three/fiber` 9.8.0, `@react-three/drei` 10.7.0, `three` 0.187.0 | Use in Phase 3 or remove |
| P2-3 | Register item 3 "signed downloads and seek (Range) behaviour" for private video not tested (no video fixture) | Phase 4 test with an mp4 fixture |
| P2-4 | No test asserts the public HTML immediately after an admin publish (pages are `force-dynamic`, so no cache layer is involved) | Add a test if required |
| P2-5 | Lighthouse / Core Web Vitals / contrast ratios not measured | Phase 3 metrics |
| P2-6 | Privacy-policy document (Phase 1 scope) not found | Owner to provide or confirm location |
| P2-7 | vitest still prints "close timed out after 10000ms … something prevents 2 Vite servers from exiting" after a green run (the test server itself is now stopped and its port confirmed free before the teardown returns); Next prints its own `Experiments: turbopackServerFastRefresh` notice | Cosmetic; investigate with vitest's `hanging-process` reporter if it recurs |
| P2-9 | `liveStatusOfDocument` reads the live row outside the request transaction: in the narrow window between an editor's draft write and an admin publish of the same never-published document, the editor's write could reset `_status` to draft (review finding, not reproduced) | Accept for now; Phase 4 may add a row lock or an `updatedAt` comparison |
| P2-10 | `notFound()` thrown from a dynamic page renders the 404 client-side inside Next's minimal document (root layout lives in the dynamic `[locale]` segment, Next 16.4 behaviour); the page is self-styled and bilingual, status 404 + `noindex`. URLs that match no route use `src/app/global-not-found.tsx` (server-rendered), enabled by `experimental.globalNotFound` | Revisit when Next stabilises `global-not-found`; alternatively move the root layout above `[locale]` with a `proxy.ts` that forwards the locale |
| P2-11 | Editors no longer see version history (readVersions is admin-only, the only way to stop a global version restore in Payload 3.93) | Product decision: keep, or give editors read-only history once Payload separates read from restore |
| P2-8 | `Test` (1-byte file) from the original `main` commit still at the repository root | Remove in the PR if unwanted |

## 7. How to reproduce every check (commands only)

```bash
# toolchain used in the session (system Node untouched)
export PATH=/opt/node24/bin:$PATH
node -v            # v24.22.2
pnpm -v            # 10.28.0
psql --version     # 16.15

pnpm install
cp .env.example .env   # set PAYLOAD_SECRET, DATABASE_URL, TEST_DATABASE_URL, PREVIEW_SECRET

# static preview checks
pnpm validate:content
pnpm sync:preview
python3 scripts/verify_scaffold.py       # writes STATIC_CHECKS.md
find docs -type f                        # 8 files, no images/videos

# application quality gates
pnpm typecheck
pnpm lint
pnpm build

# database, bootstrap, demo content
pnpm db:migrate
pnpm db:migrate:status
SEED_ADMIN_EMAIL=you@example.com SEED_ADMIN_PASSWORD='a long passphrase 123' pnpm seed:admin
SEED_ADMIN_EMAIL=you@example.com SEED_ADMIN_PASSWORD='a long passphrase 123' pnpm seed:admin   # second run refuses
pnpm seed:demo
pnpm seed:demo                           # idempotent
pnpm start                               # /en /ar /admin on :3000 — stop it before the tests

# automated suites (both wipe TEST_DATABASE_URL and need port 3000 free)
pnpm test:int                            # 57 tests, vitest (files run one at a time, in path order)
pnpm test:e2e                            # 45 tests, Playwright; screenshots -> qa-screenshots/
pnpm qa:static                           # static preview browser QA -> qa-screenshots/static-preview-qa.generated.md
pnpm exec playwright test tests/e2e/admin.spec.ts
pnpm exec playwright show-report

# branch state
git status --short --branch
git log --oneline origin/main..HEAD
git diff --stat origin/main..HEAD
```

## 8. Files changed overview (`git diff --stat origin/main..HEAD`)

`origin/main` contains a single file (`Test`); the branch adds **101 files, 23,350 insertions, 0 deletions** in 19 commits. HEAD `f01f3b7` is pushed and identical to `origin/feature/mis-portfolio-phase-1-2` (pull request #1 against `main`: open, not merged). Commits after the first version of this report: `870a362` hardening after the adversarial probes, `6585429` safe-path encoded separators, `1445a77` trimmed gallery payload, `20b6ed9` screenshot-review fixes, `d3c12cd` uploads outside `public/`, `584cb42` regenerated types, `913c49c` static preview reveal, `42d5f79` runtime site origin / hreflang / localized alt / default-locale redirect, and the review follow-up commit (access rules, test hygiene, 404 document) on top.

| Area | Notes |
| --- | --- |
| Root config and docs | `README.md`, `STATIC_CHECKS.md`, `.env.example`, `.gitignore`, `.github/workflows/{ci,pages}.yml`, `package.json`, `pnpm-lock.yaml`, `payload.config.ts`, `next.config.mjs`, `tsconfig.json`, `eslint.config.mjs`, `vitest.config.ts` (path-order sequencer), `playwright.config.ts` (never reuses a running server) |
| `content/`, `design-references/`, `docs/` | demo JSON and its `docs/data` copy, 2 concept PNGs, 4 static pages, `app.js`, `site.css`, `.nojekyll` |
| `scripts/` | `seed-admin.ts`, `seed-demo.ts`, `validate-content.mjs`, `sync-preview.mjs`, `verify_scaffold.py`, `qa_preview.py` |
| `spec/` | the seven specification files |
| `src/app/` | locale pages, `global-not-found.tsx`, preview/exit-preview routes, sitemap, robots, Payload admin/API routes, admin `custom.css` |
| `src/collections/`, `src/globals/` | Users, Services, Projects, PublicMedia, PrivateMedia, Leads; Homepage block builder, SiteSettings (bilingual admin labels) |
| `src/lib/` | access, workflow-hooks (editor rules, bilingual publish for projects/services/homepage), upload-guards, viewer, catalog, demo-seed, preview-url, safe-path, site-url, copy, locale |
| `src/components/`, `src/styles/` | HomeBlocks, FeaturedCarousel, ProjectsClient, SiteShell, site.css |
| `src/migrations/` | initial migration `.ts`, `.json` snapshot, index |
| `src/payload-types.ts` | generated |
| `tests/int/`, `tests/e2e/` | 3 integration specs + env/helpers/global-setup; 4 Playwright specs + helpers/serve |

Git-ignored, not committed: `.env`, `.next/`, `node_modules/`, `uploads/`, `public/media/`, `private-media/`, `qa-screenshots/`, `playwright-report/`, `test-results/`, `tests/.tmp/`, `*.log`.

## 9. Sources and evidence used for this report

Repository: `README.md`, `spec/*.md`, `STATIC_CHECKS.md`, `package.json`, `.env.example`, `payload.config.ts`, `next.config.mjs`, `tsconfig.json`, `src/collections/*`, `src/globals/*`, `src/lib/access.ts`, `src/lib/workflow-hooks.ts`, `src/lib/upload-guards.ts`, `src/lib/viewer.ts`, `src/lib/catalog.ts`, `src/lib/demo-seed.ts`, `src/app/(frontend)/preview/route.ts`, `src/app/(frontend)/exit-preview/route.ts`, `src/app/(frontend)/sitemap.ts`, `src/app/robots.ts`, `src/migrations/` (listing), `scripts/*`, `tests/int/*`, `tests/e2e/*`, `.github/workflows/{ci,pages}.yml`, `docs/admin-demo.html`, `git log`, `git status`, `git diff --stat origin/main..HEAD`, the GitHub Actions run list and PR #1 (read through the GitHub API).
GitHub Actions (`.github/workflows/ci.yml`, same steps as the local commands in section 7, PostgreSQL 16 service, throwaway CI-only secrets): run #1 https://github.com/mohamedmenshawyy247-sys/Portfolio_MIS/actions/runs/41955215336 (first green run: 38 integration + 44 browser tests), run #4 https://github.com/mohamedmenshawyy247-sys/Portfolio_MIS/actions/runs/41956249827 (red: a regression test wrongly treated `/%5Cevil.com` as off-site, fixed in `6585429`), run #9 https://github.com/mohamedmenshawyy247-sys/Portfolio_MIS/actions/runs/41965732730 (red: the first 404 test expected the root layout in Next's 404 document, fixed in the review follow-up commit), run #10 https://github.com/mohamedmenshawyy247-sys/Portfolio_MIS/actions/runs/41968963985 (green on HEAD `f01f3b7`: 57 integration + 45 browser tests; artifacts `qa-evidence` with screenshots and the Playwright report). Local session logs (outside the repository): `run-b2984fa.log`, `run-merged.log`, `run-final.log`.
Screenshots (`qa-screenshots/`, 28 files, not committed; the same set is the `qa-evidence` artifact of CI run #10): `admin-admin-project.png`, `admin-ar-dashboard.png`, `admin-editor-project.png`, `case-study-ar-1440.png`, `home-ar-{360,390,430,768,1024,1440,1920}.png`, `home-en-{360,390,430,768,1024,1440,1920}.png`, `home-{en,ar}-390-menu-open.png`, `home-en-390-reduced-motion.png`, `not-found-en-1440.png`, `preview-draft-admin.png`, `projects-ar-390.png`, `projects-en-1440.png`, `static-admin-demo.png`, `static-home-ar-390.png`, `static-home-ar-1440.png`.

## 10. Independent verification after the first report (same day)

The first version of this report was followed by three independent reviews, each run by agents that had not written the code: (1) adversarial probes against the running test server, (2) a three-lens code review of the whole diff, (3) a tile-by-tile review of all 25 QA screenshots. Everything below is fixed on HEAD `f01f3b7` unless marked otherwise, and every fix has a regression test or a browser check.

### 10.1 Adversarial probes (4 lenses, 79 attack ideas recorded as not working, 10 raw findings)

| Lens | What was tried (summary) | Result |
| --- | --- | --- |
| anonymous REST exposure | every list/by-id/where/sort/draft/locale/count/versions/access/GraphQL shape, private file route with traversal and encoding variants, image optimizer, sitemap/robots | nothing leaked |
| editor privilege escalation | publish/unpublish/approve/live-write through every route incl. bulk, duplicate, restore, locale flags, globals, role changes, user management, unlock, password reset | 3 findings, fixed: editors could unlock any account; non-canonical `_status`/`reviewStatus` values reached the database enum (HTTP 500); homepage global exposed its latest draft to anonymous `?draft=true` |
| media, uploads and preview | disguised files (SVG as PNG, HTML as JPG, polyglots, oversize, traversal names), anonymous private files, optimizer, preview secret/session/path tricks, exit-preview | 3 findings, fixed: `/exit-preview` open redirect via backslash or tab in the path; HTTP 500 on CRLF in the path; preview path denylist bypass by percent-encoding |
| server-rendered pages and payloads | HTML and RSC payload of every public page for draft/private/internal data, bad locales, traversal slugs | 4 findings, fixed: unapproved public media served to visitors; gallery payload carried internal ids and non-rendered fields; "Unlisted" badge shown to visitors; (duplicate of the exit-preview redirect) |

Independent refutation: each finding was handed to two skeptical verifiers; all reproduced on the then-running build. Three were classed "already fixed at HEAD, stale build" because the fixes (`870a362`) had landed while the probes ran. Regression tests: section 5.4.

### 10.2 Code review (28 findings across access/hooks, Next.js frontend, tests/operations)

| Disposition | Count | Items |
| --- | --- | --- |
| fixed | 26 | editors could restore (and thereby unpublish) the homepage global through the version-restore route → version history admin-only; editors could approve media or replace an approved file → field-level and row-level rules; admin self-delete through the bulk route; editors could unpublish via `unpublishAllLocales`; `safeInternalPath` returned `//evil.com` for `/.//evil.com` (dot-segment normalisation) → output re-validated; CMS `href` values accepted `/\\evil.com`; uploads in `public/media` were served by Next at `/media/<name>` with no access check → storage moved to `uploads/`; `NEXT_PUBLIC_SITE_URL` was inlined at build time → runtime `SITE_URL`; Arabic pages showed the English image alt; videos could be picked as covers; relative hreflang; `notFound()` in the root layout; root redirect ignored `defaultLocale`; homepage published from one language rendered empty headings on the other → publish guard + render-time filter; mobile menu physical offset in RTL; test files shared mutable state and passed only in one order; Playwright reused any server on :3000; `qa_preview.py` overwrote the hand-written QA report; a test that could not fail for its rule; `/test/` substring database guard; test uploads polluting real media folders; `seed:demo` overwriting admin settings; "security" checks in `verify_scaffold.py` presented as rule checks; missing services bilingual test; this report's stale statements |
| partially fixed, documented | 1 | 404 rendering (P2-10): unmatched URLs are now a full server-rendered document; `notFound()` from a dynamic page stays client-rendered inside Next's minimal document (self-styled, bilingual, 404 + `noindex`) |
| accepted with note | 1 | TOCTOU window in the live-status check (P2-9), not reproduced |

### 10.3 Screenshot review (25 captures, 9 major and 17 minor findings; no blockers)

Fixed in `20b6ed9` (app, stylesheet, admin, static preview) and `913c49c` (static preview): category labels showed the raw service key; `<details>` marker next to the menu button; mobile menu opened far from its button in Arabic; case-study fallback cover stretched across the page; static preview sections stayed invisible after a language switch (real bug: re-rendered cards were never re-observed) and in any non-scrolling render; invisible EN/AR toggle on the admin mock (1.5:1); broken gravatar avatar in the Payload admin (and e-mail hashes sent to gravatar.com); auto-generated admin labels ("Demo U R L", "Public Medias") → bilingual labels; no featured-project navigation → accessible carousel; generic "✦" icons and CTA labels; eyebrow repeating the heading; orphaned grid cells; unbalanced headline wraps; unmirrored gradients/arrows in RTL; Arabic letter-spacing and 11–12 px copy; button text 4.19:1 and focus ring 1.78:1 → 5.17:1 / ≥ 3:1 (computed); hit targets under 24 px; untranslated hero chrome in the Arabic static preview; KPI-styled demo counts on the admin mock. Not changed (content, not code): the three demo projects share one placeholder graphic until approved cover media exists.

### 10.4 Still open from the reviews

Section 6 (P2-9 TOCTOU, P2-10 404 rendering, P2-11 editor version history) and the owner items (P0-1 repository public, P1-6 Pages source setting, P1-7 PR review/merge).
