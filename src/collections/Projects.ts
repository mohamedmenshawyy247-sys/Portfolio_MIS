import type { CollectionConfig } from 'payload'
import { APIError } from 'payload'
import { adminOnly, isStaff, staffOnly } from '../lib/access'

export const Projects: CollectionConfig = {
  slug: 'projects',
  admin: { useAsTitle: 'title', defaultColumns: ['title', 'slug', 'visibility', '_status'] },
  versions: { drafts: true, maxPerDoc: 30 },
  trash: true,
  access: {
    read: ({ req }) => isStaff(req.user) ? true : {
      and: [{ visibility: { equals: 'public' } }, { _status: { equals: 'published' } }],
    },
    create: staffOnly,
    update: staffOnly,
    delete: adminOnly,
  },
  hooks: {
    beforeChange: [({ req, data }) => {
      const user = req.user as { role?: string } | null
      if (user?.role === 'editor' && data?._status === 'published') {
        throw new APIError('Editors can save drafts and request review; only admins may publish.', 403)
      }
      return data
    }],
  },
  fields: [
    { name: 'slug', type: 'text', unique: true, required: true, validate: (val: unknown) => typeof val === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(val) || 'Use lowercase a-z, digits and hyphens' },
    { name: 'title', type: 'text', localized: true, required: true },
    { name: 'summary', type: 'textarea', localized: true, required: true },
    { name: 'challenge', type: 'textarea', localized: true, required: true },
    { name: 'solution', type: 'textarea', localized: true, required: true },
    { name: 'deliveredValue', type: 'array', localized: true, fields: [{ name: 'text', type: 'text', required: true }] },
    { name: 'service', type: 'relationship', relationTo: 'services', required: true },
    { name: 'visibility', type: 'select', required: true, defaultValue: 'private', options: ['public', 'unlisted', 'private'] },
    { name: 'featured', type: 'checkbox', defaultValue: false },
    { name: 'order', type: 'number', defaultValue: 0 },
    { name: 'reviewStatus', type: 'select', options: ['draft', 'in-review', 'approved'], defaultValue: 'draft' },
    { name: 'cover', type: 'upload', relationTo: 'public-media' },
    { name: 'publicGallery', type: 'upload', relationTo: 'public-media', hasMany: true },
    {
      name: 'privateGallery', type: 'upload', relationTo: 'private-media', hasMany: true,
      access: { read: ({ req }) => isStaff(req.user) },
      validate: (val: unknown, { siblingData }) => (!Array.isArray(val) || val.length === 0 || siblingData?.visibility === 'private') || 'Private gallery is only allowed on private projects',
    },
    { name: 'demoURL', type: 'text', access: { read: ({ req }) => isStaff(req.user) }, admin: { description: 'Staff-only until demo access is approved; never expose internal endpoints publicly.' } },
    { name: 'seoTitle', type: 'text', localized: true },
    { name: 'seoDescription', type: 'textarea', localized: true },
  ],
}
