import type { CollectionConfig } from 'payload'
import { adminOnly, isStaff, publicPublished, staffFieldRead, staffOnly, staffUpdateNoEditorPublish } from '../lib/access'
import { previewURL, siteLocale } from '../lib/preview-url'
import { APIError, type CollectionBeforeChangeHook } from 'payload'
import { editorPublicationGuard, requireBilingualToPublish, reviewStatusRules } from '../lib/workflow-hooks'

export const PROJECT_REQUIRED_BILINGUAL_FIELDS = ['title', 'summary', 'challenge', 'solution']

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

const httpsOrEmpty = (value: unknown): string | true => {
  if (value === undefined || value === null || value === '') return true
  if (typeof value !== 'string') return 'Must be a URL'
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:') return 'Only https:// demo links are allowed'
    const host = url.hostname.toLowerCase()
    if (host === 'localhost' || host.endsWith('.local') || host.endsWith('.internal') || /^(\d+\.){3}\d+$/.test(host)) {
      return 'Internal hostnames and IP addresses cannot be linked publicly'
    }
    return true
  } catch {
    return 'Must be a valid https:// URL'
  }
}

/**
 * Rules that must hold even for draft saves. Payload skips field-level `validate()` when a draft
 * is saved (so editors can save incomplete work), so the security-relevant checks live here too.
 */
const projectIntegrityRules: CollectionBeforeChangeHook = ({ data }) => {
  const d = data as { demoURL?: unknown; privateGallery?: unknown; slug?: unknown; visibility?: unknown }
  const demo = httpsOrEmpty(d.demoURL)
  if (demo !== true) throw new APIError(`Demo link rejected: ${demo}`, 400)
  if (Array.isArray(d.privateGallery) && d.privateGallery.length > 0 && d.visibility !== 'private') {
    throw new APIError('Private gallery is only allowed on private projects.', 400)
  }
  if (typeof d.slug === 'string' && !SLUG.test(d.slug)) throw new APIError('Slug must use lowercase a-z, digits and hyphens.', 400)
  return data
}

export const Projects: CollectionConfig = {
  slug: 'projects',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'visibility', 'reviewStatus', '_status'],
    preview: (doc, { locale }) => {
      const slug = typeof doc.slug === 'string' ? doc.slug : ''
      return slug ? previewURL(`/${siteLocale(locale)}/projects/${slug}`) : null
    },
  },
  versions: { drafts: true, maxPerDoc: 30 },
  trash: true,
  access: {
    read: ({ req }) => (isStaff(req.user) ? true : publicPublished),
    readVersions: staffOnly,
    create: staffOnly,
    update: staffUpdateNoEditorPublish,
    delete: adminOnly,
  },
  hooks: {
    beforeChange: [
      editorPublicationGuard,
      projectIntegrityRules,
      reviewStatusRules,
      requireBilingualToPublish('projects', PROJECT_REQUIRED_BILINGUAL_FIELDS),
    ],
  },
  fields: [
    {
      name: 'slug',
      type: 'text',
      unique: true,
      required: true,
      index: true,
      validate: (val: unknown) => (typeof val === 'string' && SLUG.test(val)) || 'Use lowercase a-z, digits and hyphens',
      admin: { description: 'Shared by both languages. Changing it changes the public URL.' },
    },
    { name: 'title', type: 'text', localized: true, required: true, maxLength: 150 },
    { name: 'summary', type: 'textarea', localized: true, required: true, maxLength: 300 },
    { name: 'challenge', type: 'textarea', localized: true, required: true, maxLength: 3000 },
    { name: 'solution', type: 'textarea', localized: true, required: true, maxLength: 3000 },
    {
      name: 'deliveredValue',
      type: 'array',
      localized: true,
      maxRows: 8,
      fields: [{ name: 'text', type: 'text', required: true, maxLength: 200 }],
      admin: { description: 'Qualitative capabilities only. No invented KPIs or percentages.' },
    },
    { name: 'service', type: 'relationship', relationTo: 'services', required: true },
    {
      name: 'visibility',
      type: 'select',
      required: true,
      defaultValue: 'private',
      options: [
        { label: 'Public (listed and indexable)', value: 'public' },
        { label: 'Unlisted (reachable by exact link, not listed, noindex)', value: 'unlisted' },
        { label: 'Private (staff only)', value: 'private' },
      ],
    },
    { name: 'featured', type: 'checkbox', defaultValue: false },
    { name: 'order', type: 'number', defaultValue: 0 },
    {
      name: 'reviewStatus',
      type: 'select',
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'In review', value: 'in-review' },
        { label: 'Changes requested', value: 'changes-requested' },
        { label: 'Approved', value: 'approved' },
      ],
      admin: { description: 'Editors request review; admins approve and publish.' },
    },
    { name: 'cover', type: 'upload', relationTo: 'public-media' },
    { name: 'publicGallery', type: 'upload', relationTo: 'public-media', hasMany: true },
    {
      name: 'privateGallery',
      type: 'upload',
      relationTo: 'private-media',
      hasMany: true,
      access: { read: staffFieldRead },
      validate: (val: unknown, { siblingData }) =>
        !Array.isArray(val) ||
        val.length === 0 ||
        (siblingData as { visibility?: string } | undefined)?.visibility === 'private' ||
        'Private gallery is only allowed on private projects',
    },
    {
      name: 'demoURL',
      type: 'text',
      access: { read: staffFieldRead },
      validate: httpsOrEmpty,
      admin: { description: 'Staff-only until demo access is approved; never expose internal endpoints publicly.' },
    },
    { name: 'seoTitle', type: 'text', localized: true, maxLength: 70 },
    { name: 'seoDescription', type: 'textarea', localized: true, maxLength: 160 },
  ],
}
