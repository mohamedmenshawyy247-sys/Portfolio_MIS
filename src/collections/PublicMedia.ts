import type { CollectionConfig } from 'payload'
import { adminOnly, isStaff, staffOnly } from '../lib/access'
import { IMAGE_UPLOADS, VIDEO_UPLOADS, validateUploadedFile } from '../lib/upload-guards'

/**
 * Owner-approved public assets. Files are written to public/media but served through Payload's
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
    update: staffOnly,
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
      admin: {
        description: {
          en: 'Unapproved assets are never served to visitors or rendered on public pages.',
          ar: 'الأصول غير المعتمدة لا تُقدَّم للزوار ولا تُعرض في الصفحات العامة أبدًا.',
        },
      },
    },
  ],
}
