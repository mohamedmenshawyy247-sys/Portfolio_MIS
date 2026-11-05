# Admin UX, roles and content workflows

## Admin pages
- Overview: content statuses and message counts (only when real DB active).
- Projects: sortable, searchable list; edit bilingual content, media, related services, privacy, SEO.
- Services: edit copy, features, display order.
- Homepage Builder: reorder 7 approved blocks, swap text/media, preview in both languages.
- Media Library: upload, inspect, alt text, reference validation, delete guard.
- Leads Inbox: read, triage, retention policy (public submissions deferred until SMTP).
- Branding: name, logo, allowed color tokens, footer/contact.
- Users & Roles: Admin management only.

## Permissions
| Action | Admin | Editor | Visitor |
| --- | --- | --- | --- |
| Read published public items | Yes | Yes | Yes |
| Read private project content | Yes | Yes (authorized staff) | No |
| Edit service/project draft | Yes | Yes | No |
| Submit for review | Yes | Yes | No |
| Publish/unpublish | Yes | No | No |
| Change own role | Admin-managed | No | No |
| Manage other users | Yes | No | No |
| Change appearance | Yes | No | No |
| Submit contact request | N/A | N/A | Not yet enabled |

## Workflow to verify during Phase 2
1. Editor signs in, creates project draft in both languages, attaches approved public demo images, saves.
2. Editor requests review via custom `reviewStatus`.
3. Admin sees review queue, validates visibility and media, approves and publishes.
4. Public project appears in gallery. Private and draft projects remain absent from REST lists, SEO and sitemap.
5. Editor edits published item as a *new draft* (not a live write). Admin republishes after review.
6. Admin unpublishes; public page returns 404 and no cached copies continue showing.

## Media rules
- Site must not expose real internal systems without approval.
- Public covers/gallery items explicitly approved; private media in separate collection and storage.
- Video files may be uploaded later, with poster and captions; sensitive recordings require protected streaming, tested Range requests, retention and rights approval.

This spec sets requirements; it is not an assertion that all workflows are already tested in the starter.
