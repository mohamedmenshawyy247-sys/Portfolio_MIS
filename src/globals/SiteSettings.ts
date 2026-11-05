import type { GlobalConfig } from 'payload'
import { adminOnly } from '../lib/access'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  access: { read: () => true, update: adminOnly },
  fields: [
    { name: 'brandName', type: 'text', required: true, defaultValue: 'MIS Department', maxLength: 60 },
    { name: 'tagline', type: 'text', localized: true, maxLength: 120 },
    { name: 'logo', type: 'upload', relationTo: 'public-media' },
    { name: 'defaultLocale', type: 'select', options: ['en', 'ar'], defaultValue: 'en' },
    { name: 'accentColor', type: 'select', options: ['blue', 'cyan'], defaultValue: 'blue' },
    {
      name: 'contactEmail',
      type: 'email',
      admin: { description: 'Shown publicly in the footer once set. Do not use sample addresses.' },
    },
    { name: 'footerNote', type: 'text', localized: true, maxLength: 160 },
  ],
}
