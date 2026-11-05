import config from '@payload-config'
import { draftMode, headers } from 'next/headers'
import { getPayload } from 'payload'
import type { User } from '@/payload-types'
import { isStaff } from './access'

export type Viewer = { draft: boolean; user: null | User }

export const anonymousViewer: Viewer = { draft: false, user: null }

/**
 * Who is looking at the page, re-checked on every request.
 * Draft content is only ever rendered when BOTH the Next.js draft-mode cookie is present AND the
 * request carries a valid Payload staff session. Logging out of the admin panel therefore ends
 * draft previews immediately, even if the draft-mode cookie is still in the browser.
 */
export async function getViewer(): Promise<Viewer> {
  const { isEnabled } = await draftMode()
  if (!isEnabled) return anonymousViewer
  try {
    const payload = await getPayload({ config })
    const { user } = await payload.auth({ headers: await headers() })
    if (user && isStaff(user)) return { draft: true, user: user as User }
  } catch {
    // fall through: treat as anonymous
  }
  return anonymousViewer
}
