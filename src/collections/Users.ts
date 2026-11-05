import type { CollectionConfig } from 'payload'
import { adminFieldUpdate, adminOnly, isAdmin } from '../lib/access'

export const Users: CollectionConfig = {
  slug: 'users',
  auth: {
    tokenExpiration: 60 * 60 * 8,
    maxLoginAttempts: 5,
    lockTime: 15 * 60 * 1000,
    cookies: { sameSite: 'Lax', secure: process.env.NODE_ENV === 'production' },
  },
  admin: { useAsTitle: 'email', defaultColumns: ['email', 'displayName', 'role'] },
  access: {
    // Only admins create accounts; the first admin is created by `pnpm seed:admin`.
    create: adminOnly,
    read: ({ req }) => (isAdmin(req.user) ? true : req.user ? { id: { equals: req.user.id } } : false),
    update: ({ req }) => (isAdmin(req.user) ? true : req.user ? { id: { equals: req.user.id } } : false),
    // Admins may delete other accounts but never their own.
    delete: ({ req, id }) => isAdmin(req.user) && String(req.user?.id) !== String(id),
  },
  fields: [
    { name: 'displayName', type: 'text', required: true, maxLength: 100 },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'editor',
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Editor', value: 'editor' },
      ],
      // Non-admins cannot change roles: Payload silently discards the field, so an editor
      // sending role=admin keeps their existing role.
      access: { create: adminFieldUpdate, update: adminFieldUpdate },
    },
  ],
}
