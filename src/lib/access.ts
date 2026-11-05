import type { Access, FieldAccess } from 'payload'

export const isAdmin = (user: unknown) => Boolean(user && typeof user === 'object' && 'role' in user && user.role === 'admin')
export const isStaff = (user: unknown) => Boolean(user && typeof user === 'object' && 'role' in user && (user.role === 'admin' || user.role === 'editor'))
export const adminOnly: Access = ({ req }) => isAdmin(req.user)
export const staffOnly: Access = ({ req }) => isStaff(req.user)
export const adminFieldUpdate: FieldAccess = ({ req }) => isAdmin(req.user)
