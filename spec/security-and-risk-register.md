# Security gaps to close before a real CMS launch

The static GitHub Pages preview must contain **demo data only**. No real screenshots, internal links, secrets, personal information, or private project content are allowed.

## Critical safeguards
1. Bootstrap first Admin before exposing Payload publicly. Verify that Editor can't elevate `users.role` via UI/REST/Local API.
2. Projects anonymous read = `public` AND `published`. Unlisted accessible only by exact server-side slug, not list API. Private inaccessible to visitors.
3. Private media outside `/public`, staff-only read. Verify direct URL, serialized JSON/relation depth, optimizer URLs, signed downloads and seek behavior.
4. Draft mode requires re-authentication per request and must be cleared on logout. Draft-mode preview routes intentionally not included in this starter.
5. Editors can save drafts and request review but never publish. Test updating already published documents in three access paths.
6. User uploads need magic-byte validation, image re-encoding, SVG sanitization/ban, file size caps and upload protections; the current MIME picker filter is NOT sufficient.
7. Leads anonymous POST currently blocked; implement validated endpoint, bot protections and retention limits before enabling contact form.
8. SMTP required for password recovery and lead notifications. Use environment secrets, never git.
9. Configure monitoring/backup, rate limiting, content ownership, approval, CSP and scan dependencies before production.
10. Payload v3 Local API defaults `overrideAccess:true`: always explicit, restrict query and project to safe public fields.

## Covered in scaffold (not yet verified at runtime)
Admin/Editor role guards, role field update restriction, draft publish guard, Projects public read filter, exact unlisted slug server query and public-field projection, separate private-media collection, locked Leads create.

## Unresolved P1 risks
No npm installation/build test here, no production storage, no actual SMTP, no first-admin bootstrap test, missing server-side upload magic validation, private media ACL and localized workflows require integration testing, no live publishing cache invalidation test, no unit/E2E security regression suite.
