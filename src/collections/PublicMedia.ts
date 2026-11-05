import type { CollectionConfig } from 'payload'
import { adminOnly, staffOnly } from '../lib/access'

export const PublicMedia: CollectionConfig = {
  slug: 'public-media',
  upload: { staticDir: 'public/media', mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'video/mp4'] },
  admin: { useAsTitle: 'alt' },
  access: { read: () => true, create: staffOnly, update: staffOnly, delete: adminOnly },
  fields: [
    { name: 'alt', type: 'text', localized: true, required: true },
    { name: 'caption', type: 'textarea', localized: true },
    { name: 'approvedForPublic', type: 'checkbox', defaultValue: false, admin: { description: 'Editorial approval required before linking publicly.' } },
  ],
}
