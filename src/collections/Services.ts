import type { CollectionConfig } from 'payload'
import { adminOnly, isStaff, publishedOnly, staffOnly, staffUpdateNoEditorPublish } from '../lib/access'
import { editorPublicationGuard, requireBilingualToPublish } from '../lib/workflow-hooks'

export const Services: CollectionConfig = {
  slug: 'services',
  labels: { singular: { en: 'Service', ar: 'خدمة' }, plural: { en: 'Services', ar: 'الخدمات' } },
  admin: { useAsTitle: 'title', defaultColumns: ['title', 'key', 'active', 'order', '_status'] },
  versions: { drafts: true, maxPerDoc: 20 },
  access: {
    read: ({ req }) => (isStaff(req.user) ? true : publishedOnly),
    // Version history is admin-only. Restores are already refused for editors by `update` access
    // (restored status) plus the editorPublicationGuard hook; hiding the history also removes the
    // version ids they would need. Editors keep Save Draft; they only lose the Versions tab.
    readVersions: adminOnly,
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
      label: { en: 'Key', ar: 'المفتاح' },
      unique: true,
      required: true,
      index: true,
      validate: (val: unknown) => (typeof val === 'string' && /^[a-z0-9-]+$/.test(val)) || 'Use lowercase a-z, digits and hyphens',
      admin: {
        description: {
          en: 'Stable machine key used for filters (for example real-time, quality, reporting).',
          ar: 'مفتاح ثابت يُستخدم في عوامل التصفية (مثل real-time أو quality أو reporting).',
        },
      },
    },
    { name: 'title', type: 'text', label: { en: 'Title', ar: 'العنوان' }, localized: true, required: true, maxLength: 120 },
    { name: 'summary', type: 'textarea', label: { en: 'Summary', ar: 'الملخص' }, localized: true, required: true, maxLength: 300 },
    {
      name: 'features',
      type: 'array',
      label: { en: 'Features', ar: 'المزايا' },
      labels: { singular: { en: 'Feature', ar: 'ميزة' }, plural: { en: 'Features', ar: 'المزايا' } },
      localized: true,
      maxRows: 8,
      fields: [{ name: 'text', type: 'text', label: { en: 'Text', ar: 'النص' }, required: true, maxLength: 120 }],
    },
    {
      name: 'icon',
      type: 'select',
      label: { en: 'Icon', ar: 'الأيقونة' },
      options: [
        { label: { en: 'Activity', ar: 'نشاط' }, value: 'activity' },
        { label: { en: 'Shield', ar: 'درع' }, value: 'shield' },
        { label: { en: 'Chart', ar: 'مخطط' }, value: 'chart' },
      ],
      required: true,
      defaultValue: 'activity',
    },
    { name: 'active', type: 'checkbox', label: { en: 'Active', ar: 'نشط' }, defaultValue: true },
    { name: 'order', type: 'number', label: { en: 'Order', ar: 'الترتيب' }, defaultValue: 0 },
  ],
}
