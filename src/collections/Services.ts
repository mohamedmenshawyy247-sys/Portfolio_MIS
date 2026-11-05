import type { CollectionConfig } from 'payload'
import { adminOnly, isStaff, staffOnly } from '../lib/access'

export const Services: CollectionConfig = {
  slug: 'services',
  admin: { useAsTitle: 'title', defaultColumns: ['title', 'key', 'active', 'order'] },
  access: { create: staffOnly, read: ({ req }) => isStaff(req.user) ? true : { _status: { equals: 'published' } }, update: staffOnly, delete: adminOnly },
  versions: { drafts: true },
  fields: [
    { name: 'key', type: 'text', unique: true, required: true },
    { name: 'title', type: 'text', localized: true, required: true },
    { name: 'summary', type: 'textarea', localized: true, required: true },
    { name: 'features', type: 'array', localized: true, fields: [{ name: 'text', type: 'text', required: true }] },
    { name: 'icon', type: 'select', options: ['activity', 'shield', 'chart'], required: true },
    { name: 'active', type: 'checkbox', defaultValue: true },
    { name: 'order', type: 'number', defaultValue: 0 },
  ],
}
