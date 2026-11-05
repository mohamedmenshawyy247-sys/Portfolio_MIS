# Claude Code Handoff — Phase 2 continuation

Target: `MIS Department Portfolio`, approved **Next.js + Payload 3.93.0 + PostgreSQL**, GitHub Pages STATIC DEMO for now. Do NOT replace with Express + Vite or touch unrelated running applications.

1. Inspect starter code and the `spec/` folder. Set up Node >=24.22.1 and pnpm; install exact packages, generate types/importmap, run build, fix compilation errors.
2. Set a dedicated LOCAL PostgreSQL and `.env` (never commit credentials). Validate migrations and bootstrap first Admin securely.
3. Confirm Admin and Editor access rules via actual REST, UI and Local API. Prove an Editor can revise published content without publishing; deny role escalation.
4. Complete localized field validation and Homepage block renderer so CMS updates appear on public Next site. Only active approved bilingual content can publish.
5. Validate public vs unlisted vs private visibility, direct media endpoints, nested REST/GraphQL (GraphQL disabled), authenticated preview logout, no private data in Pages preview.
6. Add real server-side upload safeguards and test all media MIME/size/path restrictions.
7. Enable SMTP when provider is available; otherwise keep public Leads submission disabled. Avoid placeholder recipient addresses.
8. Test responsive/RTL 360,390,430,768,1024,1440,1920; accessibility, motion fallback, no overflow; run Playwright screenshots and report test evidence.
9. Keep GitHub Pages solely as static demo; do not claim it runs the CMS. Open a PR rather than overwriting main without review.
10. Produce a truthful gate report with `DONE`, `BLOCKED`, `SECURITY OPEN`, and `READY FOR NEXT PHASE` labels.

Never upload secrets or live customer data. Do not deploy to VPS/domain yet, per owner's instruction.
