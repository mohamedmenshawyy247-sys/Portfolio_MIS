import type { GlobalConfig } from 'payload'
import { adminOnly, staffOnly } from '../lib/access'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  access: { read: () => true, update: adminOnly },
  fields: [
    { name: 'brandName', type: 'text', required: true, defaultValue: 'MIS Department' },
    { name: 'tagline', type: 'text', localized: true },
    { name: 'logo', type: 'upload', relationTo: 'public-media' },
    { name: 'defaultLocale', type: 'select', options: ['en', 'ar'], defaultValue: 'en' },
    { name: 'accentColor', type: 'select', options: ['blue', 'cyan'], defaultValue: 'blue' },
    { name: 'contactEmail', type: 'email', admin: { description: 'Do not use sample addresses on public pages.' } },
  ],
}
