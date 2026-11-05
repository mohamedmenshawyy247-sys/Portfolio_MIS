import type { CollectionConfig } from 'payload'
import { adminOnly, staffOnly } from '../lib/access'
import { IMAGE_UPLOADS, VIDEO_UPLOADS, validateUploadedFile } from '../lib/upload-guards'

/**
 * Staff-only assets. Stored outside public/ and only reachable through Payload's access-checked
 * file endpoint (/api/private-media/file/<name>). Never reference these from public pages,
 * never pass them through next/image, and never copy them into the GitHub Pages preview.
 */
export const PrivateMedia: CollectionConfig = {
  slug: 'private-media',
  labels: { singular: { en: 'Private media', ar: 'وسائط خاصة' }, plural: { en: 'Private media', ar: 'الوسائط الخاصة' } },
  upload: {
    staticDir: process.env.PRIVATE_MEDIA_DIR || 'uploads/private-media',
    mimeTypes: [...Object.keys(IMAGE_UPLOADS), ...Object.keys(VIDEO_UPLOADS)],
    allowRestrictedFileTypes: false,
    resizeOptions: { width: 2400, height: 2400, fit: 'inside', withoutEnlargement: true },
    imageSizes: [{ name: 'thumbnail', width: 480 }],
    adminThumbnail: 'thumbnail',
  },
  access: { read: staffOnly, create: staffOnly, update: staffOnly, delete: adminOnly },
  admin: { useAsTitle: 'description' },
  hooks: { beforeValidate: [validateUploadedFile({ ...IMAGE_UPLOADS, ...VIDEO_UPLOADS })] },
  fields: [{ name: 'description', type: 'text', label: { en: 'Description', ar: 'الوصف' }, required: true, maxLength: 200 }],
}
