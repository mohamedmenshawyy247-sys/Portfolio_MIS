import type { CollectionConfig } from 'payload'
import { adminOnly, isStaff, publishedOnly, staffOnly, staffUpdateNoEditorPublish } from '../lib/access'
import { editorPublicationGuard, requireBilingualToPublish } from '../lib/workflow-hooks'

export const Services: CollectionConfig = {
  slug: 'services',
  admin: { useAsTitle: 'title', defaultColumns: ['title', 'key', 'active', 'order', '_status'] },
  versions: { drafts: true, maxPerDoc: 20 },
  access: {
    read: ({ req }) => (isStaff(req.user) ? true : publishedOnly),
    readVersions: staffOnly,
    create: staffOnly,
    update: staffUpdateNoEditorPublish,
    delete: adminOnly,
  },
  hooks: {
    beforeChange: [editorPublicationGuard, requireBilingualToPublish('services', ['title', 'summary'])],
  },
  fields: [
    {
      name: 'key',
      type: 'text',
      unique: true,
      required: true,
      index: true,
      validate: (val: unknown) => (typeof val === 'string' && /^[a-z0-9-]+$/.test(val)) || 'Use lowercase a-z, digits and hyphens',
      admin: { description: 'Stable machine key used for filters (for example real-time, quality, reporting).' },
    },
    { name: 'title', type: 'text', localized: true, required: true, maxLength: 120 },
    { name: 'summary', type: 'textarea', localized: true, required: true, maxLength: 300 },
    {
      name: 'features',
      type: 'array',
      localized: true,
      maxRows: 8,
      fields: [{ name: 'text', type: 'text', required: true, maxLength: 120 }],
    },
    { name: 'icon', type: 'select', options: ['activity', 'shield', 'chart'], required: true, defaultValue: 'activity' },
    { name: 'active', type: 'checkbox', defaultValue: true },
    { name: 'order', type: 'number', defaultValue: 0 },
  ],
}
