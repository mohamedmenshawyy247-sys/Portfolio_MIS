import type { CollectionConfig } from 'payload'
import { adminOnly, staffOnly } from '../lib/access'
import { IMAGE_UPLOADS, VIDEO_UPLOADS, validateUploadedFile } from '../lib/upload-guards'

/**
 * Owner-approved public assets. Files are written to public/media but served through Payload's
 * file endpoint (/api/public-media/file/<name>), which is the only path next/image may optimise.
 */
export const PublicMedia: CollectionConfig = {
  slug: 'public-media',
  upload: {
    staticDir: 'public/media',
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
  access: { read: () => true, create: staffOnly, update: staffOnly, delete: adminOnly },
  hooks: { beforeValidate: [validateUploadedFile({ ...IMAGE_UPLOADS, ...VIDEO_UPLOADS })] },
  fields: [
    { name: 'alt', type: 'text', localized: true, required: true, maxLength: 200 },
    { name: 'caption', type: 'textarea', localized: true, maxLength: 300 },
    {
      name: 'approvedForPublic',
      type: 'checkbox',
      defaultValue: false,
      admin: { description: 'Editorial approval required before linking publicly.' },
    },
  ],
}
