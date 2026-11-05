# Four phases and acceptance gates

| Phase | Scope | Exit gate |
| --- | --- | --- |
| **1 — Planning & Design** | Final design baseline, 7 responsive widths, bilingual content schema, brand tokens, privacy policy | Design approved and static preview reviewed |
| **2 — Website + CMS Foundation** | Next.js pages, Payload + Postgres config, Admin/Editor, Projects, Services, public/private media, drafts, demo content | Real CMS build passes; editor-to-publish E2E and access tests pass |
| **3 — Motion & Optimization** | GSAP storytelling, Motion, R3F optional hero, reduced motion and mobile fallback, image optimization | Lighthouse/Core Web Vitals targets met on agreed test device; bilingual UX/accessibility tests pass |
| **4 — Full QA & Go Live** | Security, emails, uploads, backups, monitoring, DNS/SSL, safe migration, rollback | Production domain, real CMS, UAT, zero open P0/P1, restore successful |

**Current status (Nov 5, 2026):** Phase 1 static preview delivered and browser-tested with Playwright at 360/390/430/768/1024/1440/1920 px in EN and AR. Phase 2 Next.js 16.4 + Payload 3.93 + PostgreSQL foundation **built and runtime-verified locally** on Node 24.22.2: committed migrations, first-admin bootstrap, bilingual demo seed, role/visibility/upload/preview security enforced server-side and covered by an automated integration suite (38 tests) plus admin browser flows. Not deployed; GitHub Pages hosts only `docs/`. Remaining Phase 2 blockers before real content: SMTP provider, object storage decision, rate limiting at the proxy. See `PHASE_1_2_REPORT.md`.

**Metrics for later testing:** LCP ≤2.5s, INP ≤200ms, CLS ≤0.1 on a controlled mobile profile. Check all 7 widths × EN/AR, no scroll traps, keyboard access, `prefers-reduced-motion` behavior.
