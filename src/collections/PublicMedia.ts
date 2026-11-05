import type { CollectionConfig } from 'payload'
import { adminFieldUpdate, adminOnly, isAdmin, isEditor, isStaff, staffOnly } from '../lib/access'
import { IMAGE_UPLOADS, VIDEO_UPLOADS, validateUploadedFile } from '../lib/upload-guards'

/**
 * Owner-approved public assets. Files are written to uploads/public-media (PUBLIC_MEDIA_DIR) and served only through Payload's
 * file endpoint (/api/public-media/file/<name>), which is the only path next/image may optimise.
 * Anonymous readers only ever see assets with `approvedForPublic`; staff see everything.
 */
export const PublicMedia: CollectionConfig = {
  slug: 'public-media',
  labels: { singular: { en: 'Public media', ar: 'وسائط عامة' }, plural: { en: 'Public media', ar: 'الوسائط العامة' } },
  upload: {
    // Outside Next's public/ folder on purpose: files in public/ are served by Next at /media/<name> with
    // no access check, which would bypass the approval gate. The only route to the bytes is
    // /api/public-media/file/<name>, which runs this collection's read access.
    staticDir: process.env.PUBLIC_MEDIA_DIR || 'uploads/public-media',
    mimeTypes: [...Object.keys(IMAGE_UPLOADS), ...Object.keys(VIDEO_UPLOADS)],
    allowRestrictedFileTypes: false,
    // Images are re-encoded through sharp (metadata stripped, dimensions bounded).
    resizeOptions: { width: 2400, height: 2400, fit: 'inside', withoutEnlargement: true },
    imageSizes: [
      { name: 'thumbnail', width: 480 },
      { name: 'card', width: 1200 },
    ],
    adminThumbnail: 'thumbnail',
  },
  admin: { useAsTitle: 'alt' },
  access: {
    read: ({ req }) => (isStaff(req.user) ? true : { approvedForPublic: { equals: true } }),
    create: staffOnly,
    // Editors may edit or replace the file of UNAPPROVED assets only. Anything already approved may
    // be in use on a published page (project cover, gallery, logo) and is admin-only, exactly like
    // approval itself (see the field-level access on `approvedForPublic`).
    update: ({ req }) => (isAdmin(req.user) ? true : isEditor(req.user) ? { approvedForPublic: { equals: false } } : false),
    delete: adminOnly,
  },
  hooks: { beforeValidate: [validateUploadedFile({ ...IMAGE_UPLOADS, ...VIDEO_UPLOADS })] },
  fields: [
    { name: 'alt', type: 'text', label: { en: 'Alt text', ar: 'النص البديل' }, localized: true, required: true, maxLength: 200 },
    { name: 'caption', type: 'textarea', label: { en: 'Caption', ar: 'التعليق' }, localized: true, maxLength: 300 },
    {
      name: 'approvedForPublic',
      type: 'checkbox',
      label: { en: 'Approved for public use', ar: 'معتمد للعرض العام' },
      defaultValue: false,
      // Only admins approve. Payload silently discards the field for everyone else (same pattern as
      // users.role), so an editor sending approvedForPublic=true on create or update keeps `false`.
      access: { create: adminFieldUpdate, update: adminFieldUpdate },
      admin: {
        description: {
          en: 'Unapproved assets are never served to visitors or rendered on public pages.',
          ar: 'الأصول غير المعتمدة لا تُقدَّم للزوار ولا تُعرض في الصفحات العامة أبدًا.',
        },
      },
    },
  ],
}
