# Phase 1 + Phase 2 — Engineering Completion Report

**Project:** MIS Department Portfolio · **Date:** 2026-11-05 · **Branch:** `feature/mis-portfolio-phase-1-2` (7 commits ahead of `origin/main`, HEAD `0ff2774` pushed to `origin/feature/mis-portfolio-phase-1-2`; pull request #1 open against `main`, not merged)
**Stack verified locally:** Next.js 16.4.5 · Payload 3.93.0 · PostgreSQL 16.15 · Node 24.22.2 · pnpm 10.28.0 · TypeScript 6.0.3

Labels follow `spec/next-steps-for-claude-code.md` point 10: `DONE`, `BLOCKED`, `SECURITY OPEN`, `READY FOR NEXT PHASE`. Every statement is backed by a repository file or a session log listed in section 9; anything that could not be verified is marked *to be confirmed*. **Nothing is deployed.** GitHub Pages, once the owner enables it, will host only the static `docs/` demo; `docs/admin-demo.html` is a design-only mock, not a CMS.

## 1. Summary

1. Phase 1 static preview (`docs/`): `DONE` as repository artefacts — 7-width EN/AR Playwright checks pass and the scaffold checks report PASS; owner sign-off on the design baseline and a privacy-policy document are *to be confirmed*.
2. Phase 2 foundation: `DONE` locally — `pnpm typecheck`, `pnpm lint` and `pnpm build` pass; one committed migration (62 tables) applied with `push: false`; first-admin bootstrap and the idempotent bilingual demo seed verified; 38/38 integration tests pass; after two locator fixes all 4 admin browser tests pass (a final full re-run is *to be confirmed*: the last commit `0ff2774`, which adds a 14-test axe-core scan, post-dates every recorded run).
3. Rules proven server-side over REST, Local API and the admin UI: anonymous callers see only public + published projects and never staff-only fields or private media; editors cannot publish, unpublish, approve, restore versions or change roles; uploads are validated by content; draft preview needs the secret plus a live staff session; GraphQL is disabled; security headers are set.
4. `SECURITY OPEN` / `BLOCKED` before any real content or exposure: no SMTP (no password reset; Leads stay closed), no rate limiting, no CSP, media on local disk, repository still PUBLIC, GitHub Pages source setting unconfirmed, PR #1 open and not merged.
5. Gate: `READY FOR NEXT PHASE` for Phase 3 (motion and optimisation) work on this codebase; **not** ready for real content, public exposure or go-live (Phase 4 items in section 6 remain open).

## 2. Environment and toolchain (local session, 2026-11-05)

| Item | Value | Evidence |
| --- | --- | --- |
| Node.js | 24.22.2, downloaded from nodejs.org with SHA256 verification into `/opt/node24`; system Node 22.23.4 left unchanged | session; `package.json` `engines.node ">=24.22.1 <27"` |
| pnpm | 10.28.0, pinned as `packageManager` | `package.json` |
| PostgreSQL | 16.15 local; two disposable databases `mis_portfolio` (app) and `mis_portfolio_test` (wiped by the test suites) | session; `.env.example`; `tests/int/env.ts` |
| Install | npm registry reachable; `pnpm install` resolved every exact pin with no peer-dependency warnings; `pnpm-lock.yaml` committed (9,041 lines) | session; diff stat |
| Secrets | `.env` is git-ignored (`.gitignore`: `.env`, `.env.*`, `!.env.example`); `.env.example` committed with placeholders only; test runner refuses to run unless the test DB name contains "test" and differs from `DATABASE_URL` | `.gitignore`, `.env.example`, `tests/int/env.ts` |
| Package changes (with reason) | `sharp` 0.35.0 → 0.35.5 (0.35.0 declares no `types` in its `exports`, so TS could not resolve it); `build` script `payload build` → `next build` (Payload 3.93 CLI has no `build`: `generate:db-schema`, `generate:importmap`, `generate:types`, `info`, `jobs:run`, `jobs:handle-schedules`, `run`, `migrate*`); removed import of `generatePayloadViewport` (not exported by `@payloadcms/next` 3.93.0); added deps `file-type` 21.3.4, `@payloadcms/translations` 3.93.0; added dev deps `@playwright/test` 1.63.0 (matches preinstalled browsers), `vitest` 5.1.0, `eslint` 10.14.0, `eslint-config-next` 16.4.5, `tsx` 4.23.15, `dotenv` 18.0.9; Next.js adjusted `tsconfig.json` (`jsx: react-jsx`, include `.next/dev/types`). Commit `0ff2774` (after all recorded runs) adds dev dependency `@axe-core/playwright ^4.14.0` (a caret range, unlike the other exact pins; lockfile +14 lines) for `tests/e2e/a11y.spec.ts` | session; `package.json`; `tsconfig.json`; `git show --stat 0ff2774` |
| Quality gates | `pnpm typecheck` (TS 6.0.3 strict), `pnpm lint` (eslint-config-next core-web-vitals + typescript), `pnpm build` — all pass | session; `eslint.config.mjs` |
| Routes built | `/`, `/[locale]`, `/[locale]/about`, `/[locale]/impact`, `/[locale]/projects`, `/[locale]/projects/[slug]`, `/[locale]/services`, `/admin/[[...segments]]`, `/api/[...slug]`, `/preview`, `/exit-preview`, `/sitemap.xml`, `/robots.txt` | session build output; `src/app` tree |
| Server notices | `WARN No email adapter provided. Email will be written to console.` on every start (expected: SMTP not configured). `next-start.log` also holds three Payload `INFO You are not allowed to perform this action.` lines (standard denied-operation message; the requests that caused them are not recorded) and ends with pnpm's `ELIFECYCLE Command failed.` when that manual server was stopped (exit reason not recorded — *to be confirmed*; the test suites start their own server and passed). Next.js prints an `Experiments: turbopackServerFastRefresh` notice of its own. | `next-start.log`, `serve.log`, `test-int.log` |

## 3. Phase 1 completion matrix (scope from `spec/phase-gates.md`)

| Item | Status | Evidence |
| --- | --- | --- |
| Final design baseline | `DONE` (visual baseline); owner approval of project-specific content *to be confirmed* | `spec/branding-and-design.md` ("Visual Baseline Approved, pending project-specific content and verified real assets"); `design-references/` holds two generated concept boards, explicitly not screenshots |
| 7 responsive widths (360/390/430/768/1024/1440/1920) EN + AR | `DONE` | `tests/e2e/static-preview.spec.ts` 7/7 passed (`test-e2e.log` tests 23–29); Next site `tests/e2e/public-site.spec.ts` 14/14 home tests passed with zero console/page errors; see `STATIC_PREVIEW_QA.md` |
| Bilingual content schema and demo content | `DONE` | `content/demo-content.json` (`meta.status = DEMO_ONLY`, 3 services, 3 public projects, EN+AR); `pnpm validate:content` OK; `docs/data/content.json` identical (verify_scaffold) |
| Brand tokens and typography | `DONE` | all eight token colours from the branding spec (`#071226 #0D2142 #1D68ED #3DC8F2 #F5F8FD #10213C #53657F #E5EDF7`) present in `docs/assets/site.css` and `src/styles/site.css`; `font-family: Inter, "IBM Plex Sans Arabic", …` in both |
| Privacy policy | `BLOCKED` (owner) — *to be confirmed* | no dedicated privacy-policy document or page found in the repository; only the demo-data-only rule in `spec/security-and-risk-register.md` and `meta.contentPrivacy` in `content/demo-content.json` |
| Static preview pages (`index`, `projects`, `case-study`, `admin-demo`) | `DONE` | `python3 scripts/verify_scaffold.py` → `STATIC_CHECKS.md` PASS; e2e interaction test 30 passed |
| Static preview contains demo data only (no media, secrets, private hosts) | `DONE` | `docs/` has 8 files and no image/video; grep of `docs/`, `content/`, `spec/` for secrets/private hostnames found nothing; verify_scaffold rejects `example.invalid` / `API_KEY` / `PAYLOAD_SECRET` in docs HTML |
| GitHub Pages workflow | `BLOCKED` (owner) | `.github/workflows/pages.yml` publishes `./docs` on push to `main` touching `docs/**`; repository setting "Settings → Pages → Source: GitHub Actions" could not be read through this environment's GitHub proxy (API path blocked) — *to be confirmed*; nothing published, no URL |
| Exit gate: design approved and static preview reviewed | `DONE` for automated review; owner review *to be confirmed* | screenshots in `qa-screenshots/` (25 files, git-ignored); `spec/phase-gates.md` status line |

## 4. Phase 2 completion matrix (the 10 handoff points in `spec/next-steps-for-claude-code.md`)

| # | Handoff point | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Inspect starter + `spec/`; Node ≥ 24.22.1 and pnpm; exact packages; types/importmap; build; fix compilation errors | `DONE` | section 2; generated `src/payload-types.ts` (844 lines) and `src/app/(payload)/admin/importMap.js` committed; typecheck/lint/build pass |
| 2 | Dedicated local PostgreSQL and `.env` (never committed); validate migrations; bootstrap first Admin securely | `DONE` | `src/migrations/20261105_013239_initial.ts` (+ `.json`, `index.ts`) generated and applied by `pnpm db:migrate` → 62 tables; `payload.config.ts` `push: false`; `pnpm seed:admin` created the first admin from `SEED_ADMIN_*` env vars (password ≥ 12 chars with letters and digits) and refused a second run: "Refusing to bootstrap: 1 user(s) already exist"; `.env` git-ignored |
| 3 | Confirm Admin/Editor rules via REST, UI and Local API; editor revises published content without publishing; deny role escalation | `DONE` | REST: `SEC-08`, `SEC-17` tests; Local API: "editor publication boundary" (7 tests) and "users" (3 tests); UI: `admin.spec.ts` tests 1–2 (editor saves draft, no Publish/Unpublish button, public page unchanged; role control read-only). Details in section 5 |
| 4 | Localized field validation + Homepage block renderer; only approved bilingual content publishes | `DONE` (seeded blocks render; a test asserting the public HTML right after an admin publish is not in the suite — *to be confirmed*) | `requireBilingualToPublish` (projects: title/summary/challenge/solution; services: title/summary) proven by Local API "publishing requires both English and Arabic"; `reviewStatusRules` (publish ⇒ `approved`; editors cannot set approved/changes-requested); `src/components/HomeBlocks.tsx` renders the 7 block types from `src/globals/Homepage.ts`; `site.int` test 1 finds the seeded hero headline and "Collect" step on `/en` and Arabic on `/ar`; `[locale]/layout.tsx` is `force-dynamic` (rendered per request); `localization.fallback: false`, `fallbackLocale: false` in `catalog.ts` |
| 5 | Public vs unlisted vs private; direct media endpoints; nested REST; GraphQL disabled; preview logout; no private data in Pages preview | `DONE` | `SEC-01..05`, `SEC-06/07`, `SEC-09/18`, Local API anonymous reads, `site.int` tests 3–4; `graphQL.disable: true` (REST test returns 404); unlisted pages carry `robots noindex` (`projects/[slug]/page.tsx`); `docs/` contains no media and all demo projects are `public` |
| 6 | Real server-side upload safeguards; MIME/size/path tests | `DONE` | `src/lib/upload-guards.ts`: magic-byte detection (`file-type`), allow-list jpeg/png/webp/avif (8 MiB) + mp4 (25 MiB), declared MIME must equal detected, extension must match, per-type size cap; `resizeOptions` 2400×2400 re-encode via sharp; `allowRestrictedFileTypes: false`; request cap 25 MiB; proven by `SEC-11` (multipart) and Local API "uploads are validated by content"; `test-int.log` shows Payload's own SVG/`text/plain` rejections firing too |
| 7 | SMTP when available; otherwise keep public Leads disabled; no placeholder recipients | `BLOCKED` (SMTP) / `DONE` (Leads closed) | no email adapter configured (WARN in every log); `src/collections/Leads.ts` create/read/update/delete all `adminOnly`; anonymous `POST /api/leads` → 401/403 (REST test 3); `.env.example` lists `SMTP_*` as commented placeholders, no recipient address; `SiteSettings.contactEmail` empty by default ("Do not use sample addresses") |
| 8 | Responsive/RTL at 7 widths; accessibility; motion fallback; no overflow; Playwright screenshots | `DONE` (automated scope) | `public-site.spec.ts`: 14 home tests (7 widths × EN/AR: `dir` attribute, visible h1 and CTA in viewport, mobile menu ≤ 860 px, overflow ≤ 1 px, zero console/page errors), keyboard skip-link test, reduced-motion test, gallery filters/search/empty state/case study/language switch, phone gallery stacking with ≥ 36 px filter buttons — 18/18 passed; admin UI in Arabic with `dir=RTL` (admin test 4, passed on re-run); 25 screenshots in `qa-screenshots/`. Lighthouse/CWV and contrast ratios not measured (Phase 3 metrics). An axe-core WCAG 2.x A/AA scan (`tests/e2e/a11y.spec.ts`: 14 tests, 7 public paths × EN/AR, fails on serious/critical violations) plus default page titles/descriptions (`generateMetadata`) and a restyled 404 were added in commit `0ff2774` after the recorded runs; no run of that commit is recorded, *to be confirmed* |
| 9 | GitHub Pages solely a static demo; PR instead of overwriting `main` | `DONE` | README and `spec/architecture-and-deployment.md` state Pages is a demo, not a CMS; `admin-demo.html` banner "DESIGN PREVIEW ONLY"; `pages.yml` uploads only `./docs`; `next.config.mjs` comment forbids `output: 'export'`; all work is on the feature branch (`origin/main` holds only the file `Test`), pushed to `origin/feature/mis-portfolio-phase-1-2`; PR #1 "Phase 1 + 2: static preview, Next.js 16.4 + Payload 3.93 foundation with security tests" is open against `main` (not a draft, not merged) |
| 10 | Truthful gate report with the four labels | `DONE` | this file and `STATIC_PREVIEW_QA.md` |

Phase 2 exit gate (`spec/phase-gates.md`: "Real CMS build passes; editor-to-publish E2E and access tests pass"): build passes; access tests pass (38/38); editor-draft → admin-publish is proven over REST (`SEC-08` test 3) and the Local API; in the browser the editor draft save and the admin's Publish/Preview controls are verified, but no test clicks the admin Publish button — *to be confirmed* if a UI click-through is required for the gate.

## 5. Security test matrix (`pnpm test:int`, 38/38 passed, 29.57 s, `test-int.log`)

`spec/security-and-risk-register.md` numbers its critical safeguards 1–10 and defines no `SEC-xx` identifiers; the `SEC-xx` strings below are the labels of the `describe` blocks in the test files. "Reg." = register safeguard number. Test names are those of commit `5343a3d`, the version that produced the logged run; the later commit `0ff2774` touches `tests/int/*` only by renaming a helper (`useTestEnv` → `loadTestEnv`, 5 lines across 3 files) and leaves the 38 test names unchanged.

### `tests/int/rest-security.int.spec.ts` (14, over HTTP against a locally started `next start` build)

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

### `tests/int/local-api.int.spec.ts` (19, in-process Local API with `overrideAccess: false`)

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

### `tests/int/site.int.spec.ts` (5, public pages over HTTP)

| Test | Rule proven | Enforced by | Reg. |
| --- | --- | --- | --- |
| serves both locales with the right direction and CMS homepage blocks | `<html lang="en" dir="ltr">`, seeded hero headline and "Collect"; `<html lang="ar" dir="rtl">` with Arabic headline | `[locale]/layout.tsx`, `HomeBlocks.tsx`, `getHomepageBlocks` | — (handoff 4) |
| redirects / to /en and 404s unknown locales, slugs and traversal attempts | `/` → 307/308 to `/en`; `/xx`, unknown slug, `..%2Fadmin`, `UPPER`, `/fr/about` → 404 with "Page not found" | `SLUG_PATTERN`, locale guard, `not-found.tsx` | — (handoff 5) |
| lists only public projects; unlisted is reachable by exact link with noindex; private/draft are 404 | gallery omits unlisted/private/draft; unlisted → 200 + `<meta name="robots" content="noindex`; private and draft → 404 | `getProjects` (public+published), `getProjectBySlug` (exact slug, published, public/unlisted, projected fields), `[slug]/page.tsx` metadata | 2, 10 |
| sitemap and robots exclude everything that is not public and published | sitemap lists EN/AR public project URLs only; robots disallows `/admin`, `/api/`, lists `Sitemap:` | `sitemap.ts` (`visibility !== 'public'` skipped), `robots.ts` | — (admin-workflows step 4) |
| language switch keeps the current page, and security headers are set | `hreflang="ar"` link to the same slug; `x-content-type-options: nosniff`, `x-frame-options: SAMEORIGIN`, no `x-powered-by` | `SiteShell.tsx`; `next.config.mjs` headers (`Referrer-Policy`, `Permissions-Policy` also set) | 9 (partial) |

Browser evidence (`tests/e2e/admin.spec.ts`, 4 tests): full run `test-e2e.log` 28/30 passed — the two failures were test-locator mistakes (Payload renders "Preview" as a link, not a button; the account language control is a combobox); after the fixes the admin spec was re-run: `test-e2e-admin.log` 3 passed / 1 failed because Payload writes `dir="RTL"` in upper case (assertion made case-insensitive, commit `5343a3d`), then `test-e2e-admin2.log` 4 passed (18.3 s). A final full 30-test run after those fixes is *to be confirmed*.

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
| P1-5 | Media stored on local disk (`public/media`, `private-media/`); no S3/R2 | `BLOCKED` | Decide object storage before real uploads |
| P1-6 | GitHub Pages source setting unverifiable from this environment; publishes only after merge into `main`; no preview URL yet | `BLOCKED` | Confirm "Settings → Pages → Source: GitHub Actions"; merge via PR |
| P1-7 | PR #1 is open against `main` but not reviewed or merged; its head `0ff2774` post-dates every recorded test run, and these two report files are still untracked | `BLOCKED` | Re-run both suites on `0ff2774`, commit the reports, then review and merge PR #1 |
| P1-8 | No full `pnpm test:e2e` run is recorded after the locator fixes, and no run at all is recorded for commit `0ff2774` (which adds the 14-test axe-core spec: 30 + 14 tests) | *to be confirmed* | Re-run both suites on `0ff2774` and attach the logs; consider pinning `@axe-core/playwright` exactly like the other dependencies |
| P1-9 | No deployment, domain, backups or monitoring (per owner instruction: none yet) | `BLOCKED` | Phase 4 |

**P2 — non-blocking**

| Id | Issue | Owner action |
| --- | --- | --- |
| P2-1 | Phase 3 packages installed but unused: `gsap` 3.15.0, `motion` 14.9.0, `@react-three/fiber` 9.8.0, `@react-three/drei` 10.7.0, `three` 0.187.0 | Use in Phase 3 or remove |
| P2-2 | `public-media.approvedForPublic` is a checkbox with description "Editorial approval required before linking publicly", but `PublicMedia.access.read` is `() => true` and `catalog.ts` does not filter on it — enforcement beyond editorial process *to be confirmed* | Decide whether it should gate rendering |
| P2-3 | Register item 3 "signed downloads and seek (Range) behaviour" for private video not tested (no video fixture) | Phase 4 test with an mp4 fixture |
| P2-4 | No test asserts the public HTML immediately after an admin publish (pages are `force-dynamic`, so no cache layer is involved) | Add a test if required |
| P2-5 | Lighthouse / Core Web Vitals / contrast ratios not measured | Phase 3 metrics |
| P2-6 | Privacy-policy document (Phase 1 scope) not found | Owner to provide or confirm location |
| P2-7 | vitest prints "something prevents 2 Vite servers from exiting" after a green run; Next prints its own `Experiments: turbopackServerFastRefresh` notice; `next-start.log` ends with `ELIFECYCLE Command failed.` after the manual server was stopped | Cosmetic; investigate if it recurs |
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
pnpm test:int                            # 38 tests, vitest
pnpm test:e2e                            # 30 tests, Playwright; screenshots -> qa-screenshots/
pnpm exec playwright test tests/e2e/admin.spec.ts
pnpm exec playwright show-report

# branch state
git status --short --branch
git log --oneline origin/main..HEAD
git diff --stat origin/main..HEAD
```

## 8. Files changed overview (`git diff --stat origin/main..HEAD`)

`origin/main` contains a single file (`Test`); the branch adds **96 files, 22,453 insertions, 0 deletions** in 7 commits (`68ec64d` import starter, `b33e76f` Phase 2 app + security hooks, `2669f8d` test suites, `3106fe0` static preview fixes, `c6d8ff0` docs/spec status, `5343a3d` e2e locator fixes, `0ff2774` accessibility: default page titles, 404 on the dark surface, axe scan suite). HEAD `0ff2774` is pushed and identical to `origin/feature/mis-portfolio-phase-1-2` (pull request #1 against `main`: open, not merged); the working tree is clean apart from the two untracked report files. The table below covers the first 6 commits (94 files, 22,324 insertions), the state every recorded run was taken on. `0ff2774` adds 10 files, +66 −8: `package.json` (+1), `pnpm-lock.yaml` (+14), `[locale]/layout.tsx` (+9, default `generateMetadata`), `[locale]/page.tsx` (+8), `[locale]/not-found.tsx` (+6 −2), `tests/e2e/a11y.spec.ts` (+24, new), `tests/e2e/static-preview.spec.ts` (`let` → `const`, 1 line), `tests/int/{env,global-setup,local-api.int.spec}.ts` (helper rename, 5 lines). Sections 2–5 describe `5343a3d`.

| Area | Files | Lines | Notes |
| --- | --- | --- | --- |
| Root config and docs | 14 | 9,490 | `README.md`, `STATIC_CHECKS.md`, `.env.example`, `.gitignore`, `pages.yml`, `package.json`, `pnpm-lock.yaml` (9,041), `payload.config.ts`, `next.config.mjs`, `tsconfig.json`, `eslint.config.mjs`, `vitest.config.ts`, `playwright.config.ts`, `next-env.d.ts` |
| `content/`, `design-references/`, `docs/` | 12 | 215 | demo JSON (66) and its `docs/data` copy, 2 concept PNGs (binary), 4 static pages, `app.js`, `site.css`, `.nojekyll` |
| `scripts/` | 6 | 172 | `seed-admin.ts`, `seed-demo.ts`, `validate-content.mjs`, `sync-preview.mjs`, `verify_scaffold.py`, `qa_preview.py` |
| `spec/` | 7 | 196 | the seven specification files |
| `src/app/` | 19 | 378 | locale pages, preview/exit-preview routes, sitemap, robots, Payload admin/API routes |
| `src/collections/` | 6 | 295 | Users, Services, Projects, PublicMedia, PrivateMedia, Leads |
| `src/globals/` | 2 | 116 | Homepage block builder, SiteSettings |
| `src/lib/` | 9 | 688 | access, workflow-hooks, upload-guards, viewer, catalog, demo-seed, preview-url, copy, locale |
| `src/components/`, `src/styles/` | 4 | 327 | HomeBlocks, ProjectsClient, SiteShell, site.css |
| `src/migrations/` | 3 | 8,704 | initial migration `.ts` (990), `.json` snapshot (7,705), index |
| `src/payload-types.ts` | 1 | 844 | generated |
| `tests/int/`, `tests/e2e/` | 11 | 899 | 3 integration specs + env/helpers/global-setup; 3 Playwright specs + helpers/serve |

Git-ignored, not committed: `.env`, `.next/`, `node_modules/`, `public/media/`, `private-media/`, `qa-screenshots/`, `playwright-report/`, `test-results/`, `tests/.tmp/`, `*.log`.

## 9. Sources and evidence used for this report

Repository: `README.md`, `spec/*.md`, `STATIC_CHECKS.md`, `package.json`, `.env.example`, `payload.config.ts`, `next.config.mjs`, `tsconfig.json`, `src/collections/*`, `src/globals/*`, `src/lib/access.ts`, `src/lib/workflow-hooks.ts`, `src/lib/upload-guards.ts`, `src/lib/viewer.ts`, `src/lib/catalog.ts`, `src/lib/demo-seed.ts`, `src/app/(frontend)/preview/route.ts`, `src/app/(frontend)/exit-preview/route.ts`, `src/app/(frontend)/sitemap.ts`, `src/app/robots.ts`, `src/migrations/` (listing), `scripts/*`, `tests/int/*`, `tests/e2e/*` (including `tests/e2e/a11y.spec.ts` from `0ff2774`), `.github/workflows/pages.yml`, `docs/admin-demo.html`, `git log`, `git status`, `git show --stat 0ff2774`, `git diff --stat origin/main..HEAD`, `gh api repos/…/pulls` (PR #1, read-only).
Session logs (outside the repository, in `/tmp/claude-0/-home-user-Portfolio-MIS/b8487692-652f-5aad-bd09-33eb1b1b2d5b/scratchpad/`): `test-int.log`, `test-e2e.log`, `test-e2e-admin.log`, `test-e2e-admin2.log`, `next-start.log`, `serve.log`.
Screenshots (`qa-screenshots/`, 25 files, not committed): `admin-admin-project.png`, `admin-ar-dashboard.png`, `admin-editor-project.png`, `case-study-ar-1440.png`, `home-ar-{360,390,430,768,1024,1440,1920}.png`, `home-en-{360,390,430,768,1024,1440,1920}.png`, `home-en-390-reduced-motion.png`, `preview-draft-admin.png`, `projects-ar-390.png`, `projects-en-1440.png`, `static-admin-demo.png`, `static-home-ar-390.png`, `static-home-ar-1440.png`.
