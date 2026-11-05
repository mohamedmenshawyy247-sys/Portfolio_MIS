import type { CollectionConfig } from 'payload'
import { adminOnly } from '../lib/access'

export const Leads: CollectionConfig = {
  slug: 'leads',
  admin: { useAsTitle: 'email' },
  access: { create: adminOnly, read: adminOnly, update: adminOnly, delete: adminOnly },
  fields: [
    { name: 'name', type: 'text', required: true, maxLength: 100 },
    { name: 'email', type: 'email', required: true },
    { name: 'company', type: 'text', maxLength: 150 },
    { name: 'message', type: 'textarea', required: true, maxLength: 2000 },
    { name: 'status', type: 'select', options: ['new', 'reviewing', 'closed'], defaultValue: 'new' },
  ],
}
