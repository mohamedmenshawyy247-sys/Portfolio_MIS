# Scaffold Verification (no browser/network required)

Generated: 2026-11-05

## Checks
- HTML parsed: all four pages
- Relative file links and static assets checked
- Canonical JSON data matches published preview JSON
- Node JavaScript parse passes
- Content schema checks pass
- Required Next + Payload source files present
- Source-presence only (not a rule check): the identifiers `visibility` and `privateGallery` appear in src/collections/Projects.ts and the string `published` appears in Projects.ts or src/lib/access.ts. The visibility, private-gallery and published-only access rules themselves are verified by the integration suite (tests/int, `pnpm test:int`).
- Public demo content has no known placeholder email/secrets

## Outcome
PASS

## Findings
No errors in tested static checks.

## Not covered
- Browser QA of the static preview: run `pnpm test:e2e` (Playwright) or `python3 scripts/qa_preview.py` (writes `qa-screenshots/static-preview-qa.generated.md`).
- Next.js + Payload runtime, migrations and security tests: run `pnpm build && pnpm test:int` (see PHASE_1_2_REPORT.md).
- This script never pushes to GitHub or deploys Pages.
