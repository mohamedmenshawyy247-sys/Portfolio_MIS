# Static Preview QA — GitHub Pages demo (`docs/`)

**Date:** 2026-11-05 (updated the same day after the screenshot review) · **Source of evidence:** `tests/e2e/static-preview.spec.ts` as run by `pnpm test:e2e` on HEAD `f01f3b7` (8/8 passed locally and in CI run #10, https://github.com/mohamedmenshawyy247-sys/Portfolio_MIS/actions/runs/41968963985) plus `python3 scripts/verify_scaffold.py` (`STATIC_CHECKS.md`: PASS). Section 6 lists what the screenshot review found in the static preview and how it was fixed.

**What was exercised:** the files in `docs/` served by a throw-away Node HTTP server that the spec starts itself (127.0.0.1, random port). That is the content GitHub Pages would publish, but **GitHub Pages itself was not exercised**: the repository's Pages source setting could not be read from this environment, the branch is not merged into `main`, and no Pages URL exists yet.

**What `docs/` is:** a static HTML/CSS/JS demo (8 files: `.nojekyll`, `index.html`, `projects.html`, `case-study.html`, `admin-demo.html`, `assets/app.js`, `assets/site.css`, `data/content.json`) fed by `docs/data/content.json`, an identical copy of `content/demo-content.json` (`meta.status = DEMO_ONLY`, 3 services, 3 projects, all `public`, EN + AR). It is a design and content demo, not a CMS, and it contains no image or video files.

## 1. Width × language matrix (`index.html`)

For each width the test: opens `/index.html` in EN → expects exactly 3 `.service-card` inside `#serviceCards` → asserts horizontal overflow ≤ 1 px → clicks `[data-lang="ar"]` → expects `<html dir="rtl">` and the `h1` to contain "ذكاء" → asserts overflow ≤ 1 px → clicks `[data-lang="en"]`. Viewport height 900 px. Full-page AR screenshots are saved at 390 and 1440 only.

| Width (px) | EN: 3 service cards, no overflow | AR: `dir="rtl"`, Arabic h1, no overflow | Result | Duration | Screenshot |
| --- | --- | --- | --- | --- | --- |
| 360 | pass | pass | PASS | 796 ms | — |
| 390 | pass | pass | PASS | 1.3 s | `qa-screenshots/static-home-ar-390.png` |
| 430 | pass | pass | PASS | 862 ms | — |
| 768 | pass | pass | PASS | 973 ms | — |
| 1024 | pass | pass | PASS | 1.2 s | — |
| 1440 | pass | pass | PASS | 2.5 s | `qa-screenshots/static-home-ar-1440.png` |
| 1920 | pass | pass | PASS | 1.7 s | — |

7 of 7 passed (local run on HEAD `f01f3b7` and CI run #10).

## 2. Interaction checks (one test at 1366 × 900, passed)

| Step | Check | Result |
| --- | --- | --- |
| Gallery | `/projects.html` renders 3 `.gallery-card` in `#gallery` | pass |
| Filter | click `[data-filter="quality"]` → 1 card | pass |
| Search empty state | type `no-match-demo-keyword` into `#searchProjects` → `#emptyGallery` visible | pass |
| Case study load | `/case-study.html?slug=quality-management-hub` → `#caseTitle` contains "Quality" | pass |
| Admin-demo banner | `/admin-demo.html` → `.preview-banner` visible, text matches /design preview only/i | pass |
| Admin-demo tab | click `[data-pane="projects"]` → `#adminPlaceholder` visible | pass — screenshot `qa-screenshots/static-admin-demo.png` |

**Language switch:** the EN/AR controls carry `data-lang="en"` / `data-lang="ar"`; `docs/assets/app.js` sets `document.documentElement.lang` and `dir` (`rtl` for Arabic) and remembers the choice in `localStorage` under `mis-lang`. The switch was verified at every width on `index.html` (section 1); the other pages were not switched by the test.

## 3. Static (non-browser) checks

- `python3 scripts/verify_scaffold.py` → `STATIC_CHECKS.md` **PASS**: the four HTML pages parse and contain `<main>` and a viewport meta; every relative link/asset exists; `docs/data/content.json` equals `content/demo-content.json`; `assets/app.js` passes `node --check`; content schema valid; required Next + Payload source files present; no `example.invalid` / `API_KEY` / `PAYLOAD_SECRET` strings in docs HTML.
- `pnpm validate:content` → 3 services, 3 projects; `pnpm sync:preview` OK.
- grep of `docs/`, `content/`, `spec/` for secrets and private hostnames found nothing; `docs/` holds no media files.

## 4. `docs/admin-demo.html` is design-only

The page carries, verbatim: banner **"DESIGN PREVIEW ONLY — not an authenticated admin panel; no content changes are saved."**, subtitle "Illustrative administration interface, not connected to a database.", and the closing placeholder "Real editing, authentication, permissions, uploads, database and publishing are part of the Payload application and cannot run on GitHub Pages." It has no login, no form submission and no backend; its navigation buttons only toggle static panes. The real admin is the Payload application at `/admin` (Node.js + PostgreSQL), which GitHub Pages cannot run. The demo must never be described as an operational CMS.

## 5. Not covered / to be confirmed

- EN screenshots of the static pages (the spec saves only AR at 390 and 1440, plus the admin-demo page).
- `projects.html`, `case-study.html` and `admin-demo.html` across the 7 widths (only `index.html` is width-swept; the interaction test runs at 1366 px).
- Keyboard navigation and `prefers-reduced-motion` on the static pages (those tests target the Next.js site in `tests/e2e/public-site.spec.ts`).
- Contrast ratios (4.5:1 / 3:1), Lighthouse and Core Web Vitals: not measured.
- `pnpm qa:static` (`scripts/qa_preview.py`): not run in this session (needs the Python Playwright package); it now writes `qa-screenshots/static-preview-qa.generated.md` and never touches this file.
- The real GitHub Pages deployment: "Settings → Pages → Source: GitHub Actions" must be confirmed by the owner; `.github/workflows/pages.yml` publishes `docs/` only on a push to `main` that touches `docs/**`, i.e. after the pull request is merged; no preview URL exists yet.

## 6. Screenshot review of the static preview and the fixes (2026-11-05)

All 25 QA captures were reviewed tile by tile by an agent that had not written the code. For the static preview it found:

| Finding | Severity | Fix | Verified by |
| --- | --- | --- | --- |
| About, Services, the Projects head and the Approach head were blank in the full-page AR captures: `.reveal{opacity:0}` was lifted only by an IntersectionObserver, and the cards re-rendered by the language switch were never re-observed, so they stayed invisible for real users too | major (real bug) | `20b6ed9`: re-observe after re-render; `913c49c`: sections are visible by default and only animate on entry (none under `prefers-reduced-motion` or in print) | Chromium check without scrolling at 390/1440, EN/AR, JS on and off: every `.reveal` at opacity 1; `static-preview.spec.ts` 8/8 |
| EN/AR toggle on `admin-demo.html` was 1.5:1 against the light header | major | two `data-lang` buttons with `aria-pressed`; 9.0:1 unpressed, 5.9:1 pressed | computed contrast; `static-preview.spec.ts` |
| Hero pseudo-UI strings stayed English on the Arabic page; "↗" glyphs did not mirror in RTL; the "Improve" step icon was a direction-bound arrow | minor | strings routed through `data-i18n`; inline SVG arrow mirrored with `[dir="rtl"] .arrow{transform:scaleX(-1)}`; neutral glyph | capture review |
| `.admin-kpi span` 3.9:1 and `.status.draft` 4.45:1 | minor | 6.2:1 and 7.1:1 | computed contrast |
| 8 × 8 px carousel dots | minor | 24 × 24 px hit targets, visual dot unchanged | measured boxes |
| Demo counts on the admin mock styled like KPIs | minor | plain small text with the caption "Demo data: counts of the sample content in this preview, not business metrics" (EN/AR) | capture review |

`docs/` still holds the same 8 files and no media; `docs/data/content.json` is unchanged and identical to `content/demo-content.json`.
