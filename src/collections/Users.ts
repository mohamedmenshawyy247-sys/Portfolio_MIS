import type { CollectionConfig } from 'payload'
import { adminFieldUpdate, adminOnly, isAdmin } from '../lib/access'

export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: { en: 'User', ar: 'مستخدم' }, plural: { en: 'Users', ar: 'المستخدمون' } },
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
    // Admins may delete other accounts but never their own. The by-id route is refused outright;
    // the bulk route (DELETE /api/users?where=...) calls this without `id`, so it gets a constraint
    // that always excludes the caller's own account.
    delete: ({ req, id }) => {
      const user = req.user
      if (!user || !isAdmin(user)) return false
      if (id !== undefined && String(id) === String(user.id)) return false
      return { id: { not_equals: user.id } }
    },
    // Clearing a brute-force lockout is an admin action (Payload's default is any signed-in user).
    unlock: adminOnly,
  },
  fields: [
    { name: 'displayName', type: 'text', label: { en: 'Display name', ar: 'الاسم المعروض' }, required: true, maxLength: 100 },
    {
      name: 'role',
      type: 'select',
      label: { en: 'Role', ar: 'الدور' },
      required: true,
      defaultValue: 'editor',
      options: [
        { label: { en: 'Admin', ar: 'مدير' }, value: 'admin' },
        { label: { en: 'Editor', ar: 'محرر' }, value: 'editor' },
      ],
      // Non-admins cannot change roles: Payload silently discards the field, so an editor
      // sending role=admin keeps their existing role.
      access: { create: adminFieldUpdate, update: adminFieldUpdate },
    },
  ],
}
