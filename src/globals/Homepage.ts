import type { GlobalConfig } from 'payload'
import { adminOnly, isStaff, staffUpdateNoEditorPublish } from '../lib/access'
import { safeInternalPath } from '../lib/safe-path'
import { editorPublicationGuardGlobal, requireBilingualHomepage } from '../lib/workflow-hooks'

/** CTA links: a safe internal site path (validated exactly like redirect targets) or an https:// URL. */
const internalOrHttps = (value: unknown): string | true => {
  if (value === undefined || value === null || value === '') return true
  if (typeof value !== 'string') return 'Must be a link'
  // Browsers read `/\host` as `//host`, so internal links get the same check as redirect targets.
  if (value.startsWith('/')) return safeInternalPath(value) !== null || 'Only internal site paths such as /en/projects are allowed'
  try {
    return new URL(value).protocol === 'https:' || 'Only internal paths or https:// links are allowed'
  } catch {
    return 'Only internal paths or https:// links are allowed'
  }
}

const heading = { name: 'heading', type: 'text', label: { en: 'Heading', ar: 'العنوان' }, localized: true, maxLength: 120 } as const
const intro = { name: 'intro', type: 'textarea', label: { en: 'Intro', ar: 'المقدمة' }, localized: true, maxLength: 400 } as const
const sectionLabels = (en: string, ar: string, pluralEn: string, pluralAr: string) => ({ singular: { en, ar }, plural: { en: pluralEn, ar: pluralAr } })

/**
 * Approved homepage block builder. Editors arrange and edit a fixed catalogue of blocks; the public
 * site renders them in order. Published content is public; drafts are visible only in preview.
 */
export const Homepage: GlobalConfig = {
  slug: 'homepage',
  label: { en: 'Homepage', ar: 'الصفحة الرئيسية' },
  access: {
    // Visitors may only read the published version (Payload's ?draft=true must never leak drafts).
    read: ({ req }) => (isStaff(req.user) ? true : { _status: { equals: 'published' } }),
    // Version history and restores are admin-only. Payload's global restore runs no beforeChange
    // hooks and authorises `update` with the restored version's status, so an editor who could read
    // versions could overwrite or unpublish the live homepage by restoring a draft version.
    readVersions: adminOnly,
    update: staffUpdateNoEditorPublish,
  },
  versions: { drafts: true, max: 20 },
  hooks: {
    beforeChange: [editorPublicationGuardGlobal, requireBilingualHomepage],
    // Belt and braces: whatever version Payload resolved, non-staff never receive unpublished blocks.
    // Trusted server-side reads that bypass access control (`overrideAccess: true`: seeds, hooks)
    // get the full document; every access-controlled read (REST, catalog.ts) stays gated.
    afterRead: [({ doc, overrideAccess, req }) => (overrideAccess || isStaff(req.user) || doc?._status === 'published' ? doc : { ...doc, sections: [] })],
  },
  fields: [
    {
      name: 'sections',
      type: 'blocks',
      label: { en: 'Sections', ar: 'الأقسام' },
      labels: sectionLabels('Section', 'قسم', 'Sections', 'الأقسام'),
      maxRows: 12,
      blocks: [
        {
          slug: 'hero',
          labels: sectionLabels('Hero', 'الواجهة الرئيسية', 'Heroes', 'الواجهات الرئيسية'),
          fields: [
            { name: 'eyebrow', type: 'text', label: { en: 'Eyebrow', ar: 'العنوان التمهيدي' }, localized: true, maxLength: 80 },
            { name: 'headline', type: 'text', label: { en: 'Headline', ar: 'العنوان الرئيسي' }, localized: true, required: true, maxLength: 120 },
            { name: 'subline', type: 'textarea', label: { en: 'Subline', ar: 'النص الفرعي' }, localized: true, maxLength: 300 },
            { name: 'primaryLabel', type: 'text', label: { en: 'Primary button label', ar: 'نص الزر الأساسي' }, localized: true, maxLength: 40 },
            { name: 'secondaryLabel', type: 'text', label: { en: 'Secondary button label', ar: 'نص الزر الثانوي' }, localized: true, maxLength: 40 },
          ],
        },
        {
          slug: 'introduction',
          labels: sectionLabels('Introduction', 'المقدمة', 'Introductions', 'المقدمات'),
          fields: [heading, { name: 'text', type: 'textarea', label: { en: 'Text', ar: 'النص' }, localized: true, maxLength: 600 }],
        },
        { slug: 'servicesSection', labels: sectionLabels('Services section', 'قسم الخدمات', 'Services sections', 'أقسام الخدمات'), fields: [heading, intro] },
        {
          slug: 'featuredProjects',
          labels: sectionLabels('Featured projects', 'المشاريع المميزة', 'Featured projects sections', 'أقسام المشاريع المميزة'),
          fields: [heading, intro, { name: 'limit', type: 'number', label: { en: 'Number of projects', ar: 'عدد المشاريع' }, min: 1, max: 3, defaultValue: 3 }],
        },
        {
          slug: 'approach',
          labels: sectionLabels('Approach', 'منهجية العمل', 'Approach sections', 'أقسام منهجية العمل'),
          fields: [
            heading,
            intro,
            {
              name: 'steps',
              type: 'array',
              label: { en: 'Steps', ar: 'الخطوات' },
              labels: sectionLabels('Step', 'خطوة', 'Steps', 'الخطوات'),
              localized: true,
              maxRows: 6,
              fields: [
                { name: 'title', type: 'text', label: { en: 'Title', ar: 'العنوان' }, required: true, maxLength: 40 },
                { name: 'detail', type: 'text', label: { en: 'Detail', ar: 'التفاصيل' }, maxLength: 80 },
              ],
            },
          ],
        },
        {
          slug: 'impactSection',
          labels: sectionLabels('Impact section', 'قسم الأثر', 'Impact sections', 'أقسام الأثر'),
          fields: [
            heading,
            intro,
            {
              name: 'items',
              type: 'array',
              label: { en: 'Items', ar: 'العناصر' },
              labels: sectionLabels('Item', 'عنصر', 'Items', 'عناصر'),
              localized: true,
              maxRows: 6,
              fields: [
                { name: 'title', type: 'text', label: { en: 'Title', ar: 'العنوان' }, required: true, maxLength: 60 },
                { name: 'detail', type: 'text', label: { en: 'Detail', ar: 'التفاصيل' }, maxLength: 120 },
              ],
            },
          ],
        },
        {
          slug: 'cta',
          labels: sectionLabels('Call to action', 'دعوة لاتخاذ إجراء', 'Calls to action', 'دعوات لاتخاذ إجراء'),
          fields: [
            heading,
            { name: 'label', type: 'text', label: { en: 'Button label', ar: 'نص الزر' }, localized: true, maxLength: 40 },
            {
              name: 'href',
              type: 'text',
              label: { en: 'Link', ar: 'الرابط' },
              validate: internalOrHttps,
              admin: {
                description: {
                  en: 'Internal path such as /en/projects, or an https:// link.',
                  ar: 'مسار داخلي مثل \u200E/en/projects\u200E أو رابط \u200Ehttps://\u200E.',
                },
              },
            },
          ],
        },
      ],
    },
  ],
}
