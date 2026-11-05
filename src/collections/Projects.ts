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
  labels: { singular: { en: 'Project', ar: 'مشروع' }, plural: { en: 'Projects', ar: 'المشاريع' } },
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
      label: { en: 'Slug', ar: 'المعرّف في الرابط' },
      unique: true,
      required: true,
      index: true,
      validate: (val: unknown) => (typeof val === 'string' && SLUG.test(val)) || 'Use lowercase a-z, digits and hyphens',
      admin: {
        description: {
          en: 'Shared by both languages. Changing it changes the public URL.',
          ar: 'مشترك بين اللغتين. تغييره يغيّر الرابط العام.',
        },
      },
    },
    { name: 'title', type: 'text', label: { en: 'Title', ar: 'العنوان' }, localized: true, required: true, maxLength: 150 },
    { name: 'summary', type: 'textarea', label: { en: 'Summary', ar: 'الملخص' }, localized: true, required: true, maxLength: 300 },
    { name: 'challenge', type: 'textarea', label: { en: 'Challenge', ar: 'التحدي' }, localized: true, required: true, maxLength: 3000 },
    { name: 'solution', type: 'textarea', label: { en: 'Solution', ar: 'الحل' }, localized: true, required: true, maxLength: 3000 },
    {
      name: 'deliveredValue',
      type: 'array',
      label: { en: 'Delivered value', ar: 'القيمة المحققة' },
      labels: { singular: { en: 'Item', ar: 'عنصر' }, plural: { en: 'Items', ar: 'عناصر' } },
      localized: true,
      maxRows: 8,
      fields: [{ name: 'text', type: 'text', label: { en: 'Text', ar: 'النص' }, required: true, maxLength: 200 }],
      admin: {
        description: {
          en: 'Qualitative capabilities only. No invented KPIs or percentages.',
          ar: 'قدرات نوعية فقط، دون مؤشرات أداء أو نسب مئوية مختلقة.',
        },
      },
    },
    { name: 'service', type: 'relationship', label: { en: 'Service', ar: 'الخدمة' }, relationTo: 'services', required: true },
    {
      name: 'visibility',
      type: 'select',
      label: { en: 'Visibility', ar: 'الظهور' },
      required: true,
      defaultValue: 'private',
      options: [
        { label: { en: 'Public (listed and indexable)', ar: 'عام (مدرج وقابل للفهرسة)' }, value: 'public' },
        {
          label: { en: 'Unlisted (reachable by exact link, not listed, noindex)', ar: 'غير مدرج (يُفتح بالرابط المباشر فقط، لا يظهر في القوائم، بدون فهرسة)' },
          value: 'unlisted',
        },
        { label: { en: 'Private (staff only)', ar: 'خاص (للموظفين فقط)' }, value: 'private' },
      ],
    },
    { name: 'featured', type: 'checkbox', label: { en: 'Featured', ar: 'مميز' }, defaultValue: false },
    { name: 'order', type: 'number', label: { en: 'Order', ar: 'الترتيب' }, defaultValue: 0 },
    {
      name: 'reviewStatus',
      type: 'select',
      label: { en: 'Review status', ar: 'حالة المراجعة' },
      defaultValue: 'draft',
      options: [
        { label: { en: 'Draft', ar: 'مسودة' }, value: 'draft' },
        { label: { en: 'In review', ar: 'قيد المراجعة' }, value: 'in-review' },
        { label: { en: 'Changes requested', ar: 'مطلوب تعديلات' }, value: 'changes-requested' },
        { label: { en: 'Approved', ar: 'معتمد' }, value: 'approved' },
      ],
      admin: {
        description: {
          en: 'Editors request review; admins approve and publish.',
          ar: 'يطلب المحررون المراجعة، ويعتمد المديرون وينشرون.',
        },
      },
    },
    { name: 'cover', type: 'upload', label: { en: 'Cover image', ar: 'صورة الغلاف' }, relationTo: 'public-media' },
    { name: 'publicGallery', type: 'upload', label: { en: 'Public gallery', ar: 'المعرض العام' }, relationTo: 'public-media', hasMany: true },
    {
      name: 'privateGallery',
      type: 'upload',
      label: { en: 'Private gallery', ar: 'المعرض الخاص' },
      relationTo: 'private-media',
      hasMany: true,
      access: { read: staffFieldRead },
      validate: (val: unknown, { siblingData }) =>
        !Array.isArray(val) ||
        val.length === 0 ||
        (siblingData as { visibility?: string } | undefined)?.visibility === 'private' ||
        'Private gallery is only allowed on private projects',
      admin: {
        description: {
          en: 'Staff-only media; allowed on private projects only.',
          ar: 'وسائط للموظفين فقط؛ مسموح بها في المشاريع الخاصة فقط.',
        },
      },
    },
    {
      name: 'demoURL',
      type: 'text',
      label: { en: 'Demo URL', ar: 'رابط العرض التجريبي' },
      access: { read: staffFieldRead },
      validate: httpsOrEmpty,
      admin: {
        description: {
          en: 'Staff-only until demo access is approved; never expose internal endpoints publicly.',
          ar: 'للموظفين فقط حتى تتم الموافقة على إتاحة العرض التجريبي؛ لا تكشف نقاط النهاية الداخلية للعامة أبدًا.',
        },
      },
    },
    { name: 'seoTitle', type: 'text', label: { en: 'SEO title', ar: 'عنوان SEO' }, localized: true, maxLength: 70 },
    { name: 'seoDescription', type: 'textarea', label: { en: 'SEO description', ar: 'وصف SEO' }, localized: true, maxLength: 160 },
  ],
}
