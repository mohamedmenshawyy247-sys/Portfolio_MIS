import type { GlobalConfig } from 'payload'
import { staffOnly } from '../lib/access'

export const Homepage: GlobalConfig = {
  slug: 'homepage',
  access: { read: staffOnly, update: staffOnly },
  versions: { drafts: true },
  fields: [{
    name: 'sections', type: 'blocks', blocks: [
      { slug: 'hero', labels: { singular: 'Hero', plural: 'Heroes' }, fields: [{ name: 'headline', type: 'text', localized: true, required: true }, { name: 'subline', type: 'textarea', localized: true }] },
      { slug: 'introduction', fields: [{ name: 'heading', type: 'text', localized: true }, { name: 'text', type: 'textarea', localized: true }] },
      { slug: 'servicesSection', fields: [{ name: 'heading', type: 'text', localized: true }] },
      { slug: 'featuredProjects', fields: [{ name: 'heading', type: 'text', localized: true }] },
      { slug: 'approach', fields: [{ name: 'heading', type: 'text', localized: true }] },
      { slug: 'impactSection', fields: [{ name: 'heading', type: 'text', localized: true }] },
      { slug: 'cta', fields: [{ name: 'heading', type: 'text', localized: true }, { name: 'label', type: 'text', localized: true }, { name: 'href', type: 'text' }] },
    ],
  }],
}
