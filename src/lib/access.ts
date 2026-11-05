import type { Access, FieldAccess, Where } from 'payload'

export type Role = 'admin' | 'editor'

const roleOf = (user: unknown): Role | null => {
  if (user && typeof user === 'object' && 'role' in user) {
    const role = (user as { role?: unknown }).role
    if (role === 'admin' || role === 'editor') return role
  }
  return null
}

export const isAdmin = (user: unknown): boolean => roleOf(user) === 'admin'
export const isEditor = (user: unknown): boolean => roleOf(user) === 'editor'
export const isStaff = (user: unknown): boolean => roleOf(user) !== null

export const adminOnly: Access = ({ req }) => isAdmin(req.user)
export const staffOnly: Access = ({ req }) => isStaff(req.user)
export const adminFieldUpdate: FieldAccess = ({ req }) => isAdmin(req.user)
export const staffFieldRead: FieldAccess = ({ req }) => isStaff(req.user)

/** Anonymous readers only ever see published documents. */
export const publishedOnly: Where = { _status: { equals: 'published' } }
/** Anonymous readers of projects only see documents that are both public and published. */
export const publicPublished: Where = {
  and: [{ visibility: { equals: 'public' } }, { _status: { equals: 'published' } }],
}

/**
 * Update access for draftable content.
 *
 * Admins may do anything. Editors may create drafts and revise documents, but never publish.
 * Payload passes the incoming `data` to update access; the admin UI also calls this function with
 * `data: { _status: 'published' }` to decide whether to show the Publish button, and version
 * restores are authorised with the restored version's `_status`. Returning `false` for a
 * published status therefore hides the button for editors and makes the REST API, version
 * restore and the Local API (with `overrideAccess: false`) reject publishing with 403.
 */
export const staffUpdateNoEditorPublish: Access = ({ req, data }) => {
  if (isAdmin(req.user)) return true
  if (!isEditor(req.user)) return false
  const status = (data as { _status?: unknown } | undefined)?._status
  // Editors may only ever write the canonical draft status (or omit it); anything else is denied.
  return status === undefined || status === null || status === 'draft'
}
