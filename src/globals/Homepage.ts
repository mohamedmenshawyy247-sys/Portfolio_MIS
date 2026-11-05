import type { GlobalConfig } from 'payload'
import { staffUpdateNoEditorPublish } from '../lib/access'
import { editorPublicationGuardGlobal } from '../lib/workflow-hooks'

const internalOrHttps = (value: unknown): string | true => {
  if (value === undefined || value === null || value === '') return true
  if (typeof value !== 'string') return 'Must be a link'
  if (value.startsWith('/') && !value.startsWith('//')) return true
  try {
    return new URL(value).protocol === 'https:' || 'Only internal paths or https:// links are allowed'
  } catch {
    return 'Only internal paths or https:// links are allowed'
  }
}

const heading = { name: 'heading', type: 'text', localized: true, maxLength: 120 } as const
const intro = { name: 'intro', type: 'textarea', localized: true, maxLength: 400 } as const

/**
 * Approved homepage block builder. Editors arrange and edit a fixed catalogue of blocks; the public
 * site renders them in order. Published content is public; drafts are visible only in preview.
 */
export const Homepage: GlobalConfig = {
  slug: 'homepage',
  access: { read: () => true, update: staffUpdateNoEditorPublish },
  versions: { drafts: true, max: 20 },
  hooks: { beforeChange: [editorPublicationGuardGlobal] },
  fields: [
    {
      name: 'sections',
      type: 'blocks',
      maxRows: 12,
      blocks: [
        {
          slug: 'hero',
          labels: { singular: 'Hero', plural: 'Heroes' },
          fields: [
            { name: 'eyebrow', type: 'text', localized: true, maxLength: 80 },
            { name: 'headline', type: 'text', localized: true, required: true, maxLength: 120 },
            { name: 'subline', type: 'textarea', localized: true, maxLength: 300 },
            { name: 'primaryLabel', type: 'text', localized: true, maxLength: 40 },
            { name: 'secondaryLabel', type: 'text', localized: true, maxLength: 40 },
          ],
        },
        { slug: 'introduction', fields: [heading, { name: 'text', type: 'textarea', localized: true, maxLength: 600 }] },
        { slug: 'servicesSection', fields: [heading, intro] },
        {
          slug: 'featuredProjects',
          fields: [heading, intro, { name: 'limit', type: 'number', min: 1, max: 3, defaultValue: 1 }],
        },
        {
          slug: 'approach',
          fields: [
            heading,
            intro,
            {
              name: 'steps',
              type: 'array',
              localized: true,
              maxRows: 6,
              fields: [
                { name: 'title', type: 'text', required: true, maxLength: 40 },
                { name: 'detail', type: 'text', maxLength: 80 },
              ],
            },
          ],
        },
        {
          slug: 'impactSection',
          fields: [
            heading,
            intro,
            {
              name: 'items',
              type: 'array',
              localized: true,
              maxRows: 6,
              fields: [
                { name: 'title', type: 'text', required: true, maxLength: 60 },
                { name: 'detail', type: 'text', maxLength: 120 },
              ],
            },
          ],
        },
        {
          slug: 'cta',
          fields: [
            heading,
            { name: 'label', type: 'text', localized: true, maxLength: 40 },
            { name: 'href', type: 'text', validate: internalOrHttps, admin: { description: 'Internal path such as /en/projects, or an https:// link.' } },
          ],
        },
      ],
    },
  ],
}
