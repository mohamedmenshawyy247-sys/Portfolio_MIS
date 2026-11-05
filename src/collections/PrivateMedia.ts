import type { CollectionConfig } from 'payload'
import { adminOnly, staffOnly } from '../lib/access'

export const PrivateMedia: CollectionConfig = {
  slug: 'private-media',
  // Outside public/: NEVER expose as a Next.js static asset or a public CDN object.
  upload: { staticDir: './private-media', mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'video/mp4'] },
  access: { read: staffOnly, create: staffOnly, update: staffOnly, delete: adminOnly },
  admin: { useAsTitle: 'description' },
  fields: [{ name: 'description', type: 'text', required: true }],
}
