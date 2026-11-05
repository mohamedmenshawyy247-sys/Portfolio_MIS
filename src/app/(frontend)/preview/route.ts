import { timingSafeEqual } from 'node:crypto'
import config from '@payload-config'
import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import { isStaff } from '@/lib/access'
import { safeInternalPath } from '@/lib/safe-path'

const safeEqual = (a: string, b: string): boolean => {
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  return ab.length === bb.length && timingSafeEqual(ab, bb)
}

/**
 * Enters Next.js draft mode for an authenticated staff member.
 * Requirements, all enforced server-side: PREVIEW_SECRET configured and matching, a relative
 * internal path, and a valid Payload staff session on this request. Draft rendering additionally
 * re-checks the session on every page request (see src/lib/viewer.ts).
 */
export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url)
  const secret = process.env.PREVIEW_SECRET
  const supplied = searchParams.get('secret') ?? ''
  const path = safeInternalPath(searchParams.get('path'))
  const draft = await draftMode()

  if (!secret || !safeEqual(secret, supplied)) {
    draft.disable()
    return new Response('Preview is not enabled or the secret is invalid.', { status: 403 })
  }
  if (!path) {
    draft.disable()
    return new Response('Only relative site paths can be previewed.', { status: 400 })
  }
  let user: unknown = null
  try {
    const payload = await getPayload({ config })
    user = (await payload.auth({ headers: request.headers })).user
  } catch {
    user = null
  }
  if (!isStaff(user)) {
    draft.disable()
    return new Response('Sign in to the admin panel to preview drafts.', { status: 403 })
  }
  draft.enable()
  redirect(path)
}
