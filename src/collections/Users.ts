import type { CollectionConfig } from 'payload'
import { adminOnly, adminFieldUpdate, isAdmin } from '../lib/access'

export const Users: CollectionConfig = {
  slug: 'users',
  auth: { tokenExpiration: 60 * 60 * 8, maxLoginAttempts: 5, lockTime: 15 * 60 * 1000 },
  admin: { useAsTitle: 'email' },
  access: {
    create: adminOnly,
    read: ({ req }) => isAdmin(req.user) ? true : req.user ? { id: { equals: req.user.id } } : false,
    update: ({ req }) => isAdmin(req.user) ? true : req.user ? { id: { equals: req.user.id } } : false,
    delete: adminOnly,
  },
  fields: [
    { name: 'displayName', type: 'text', required: true },
    {
      name: 'role', type: 'select', required: true, defaultValue: 'editor',
      options: [{ label: 'Admin', value: 'admin' }, { label: 'Editor', value: 'editor' }],
      access: { update: adminFieldUpdate },
    },
  ],
}
