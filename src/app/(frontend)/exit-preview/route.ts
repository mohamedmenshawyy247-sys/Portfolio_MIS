import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'
import { safeInternalPath } from '@/lib/safe-path'

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url)
  const draft = await draftMode()
  draft.disable()
  // Anything that is not a plain same-origin path falls back to the home page (no open redirect).
  redirect(safeInternalPath(searchParams.get('path')) ?? '/')
}
