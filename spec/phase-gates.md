# Four phases and acceptance gates

| Phase | Scope | Exit gate |
| --- | --- | --- |
| **1 — Planning & Design** | Final design baseline, 7 responsive widths, bilingual content schema, brand tokens, privacy policy | Design approved and static preview reviewed |
| **2 — Website + CMS Foundation** | Next.js pages, Payload + Postgres config, Admin/Editor, Projects, Services, public/private media, drafts, demo content | Real CMS build passes; editor-to-publish E2E and access tests pass |
| **3 — Motion & Optimization** | GSAP storytelling, Motion, R3F optional hero, reduced motion and mobile fallback, image optimization | Lighthouse/Core Web Vitals targets met on agreed test device; bilingual UX/accessibility tests pass |
| **4 — Full QA & Go Live** | Security, emails, uploads, backups, monitoring, DNS/SSL, safe migration, rollback | Production domain, real CMS, UAT, zero open P0/P1, restore successful |

**Current status (Nov 5, 2026):** Phase 1 starter plan and visual preview delivered for review. Phase 2 Next/Payload **source scaffold** delivered, **NOT runtime-built/verified**: npm registry unreachable and local Node 22.16.0 is below the required Payload version. Static preview browser QA is blocked by browser policy; run Playwright after uploading or in local dev. Hosting and domain deployment are postponed by owner.

**Metrics for later testing:** LCP ≤2.5s, INP ≤200ms, CLS ≤0.1 on a controlled mobile profile. Check all 7 widths × EN/AR, no scroll traps, keyboard access, `prefers-reduced-motion` behavior.
