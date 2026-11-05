import {
  APIError,
  type CollectionBeforeChangeHook,
  type CollectionSlug,
  type GlobalBeforeChangeHook,
  type GlobalSlug,
  type PayloadRequest,
} from 'payload'
import { isAdmin, isEditor, isStaff } from './access'

type StatusData = { _status?: unknown; reviewStatus?: unknown; [key: string]: unknown }

const STATUS_VALUES = ['draft', 'published'] as const
const REVIEW_VALUES = ['draft', 'in-review', 'changes-requested', 'approved'] as const

/** Rejects anything but the exact canonical strings (arrays, objects, other casing) with a 400. */
function assertCanonical(value: unknown, allowed: readonly string[], field: string): void {
  if (value === undefined || value === null) return
  if (typeof value !== 'string' || !allowed.includes(value)) {
    throw new APIError(`Invalid value for ${field}.`, 400)
  }
}

export const LOCALES = ['en', 'ar'] as const
export type Locale = (typeof LOCALES)[number]

/**
 * True when this update is a "save as draft" request. Payload forces `data._status = 'draft'`
 * before hooks run when `draft=true`, and the admin UI's Save Draft button, the REST API and
 * `payload.update({ draft: true, context: { draftSave: true } })` all mark the request.
 * An "unpublish" request also carries `_status: 'draft'` but never `draft=true`.
 */
const isDraftSave = (req: PayloadRequest, data: StatusData): boolean => {
  const query = (req.query ?? {}) as { draft?: unknown }
  const context = (req.context ?? {}) as { draftSave?: unknown }
  return (
    data._status === 'draft' &&
    (query.draft === 'true' || query.draft === true || context.draftSave === true)
  )
}

/**
 * Query flags with which Payload publishes or unpublishes outside the `_status` field. The admin
 * Publish and Unpublish buttons send them; Save Draft and autosave never do. Even a `draft=true`
 * save with `unpublishAllLocales=true` goes through `saveVersion({ unpublish: true })` and rewrites
 * the latest version in place, and `publishSpecificLocale` publishes one locale. Editors never
 * need any of them, so their presence (whatever the value) is refused for editors.
 */
const LOCALE_PUBLICATION_FLAGS = ['publishAllLocales', 'unpublishAllLocales', 'publishSpecificLocale'] as const

const usesLocalePublicationFlag = (req: PayloadRequest): boolean => {
  const query = (req.query ?? {}) as Record<string, unknown>
  return LOCALE_PUBLICATION_FLAGS.some((flag) => flag in query)
}

/**
 * Server-side publication rules for editors. Runs for the admin UI, REST and the Local API alike,
 * as defence in depth behind `staffUpdateNoEditorPublish`:
 *  - editors can never set `_status: 'published'`;
 *  - editors can never use Payload's locale publish/unpublish query flags;
 *  - editors can only touch a LIVE (published) document by saving a new draft: never a live write,
 *    never an unpublish.
 * The live status is read from the main document on purpose. When a newer draft version exists,
 * Payload hands hooks that draft as `originalDoc` (and merges its `_status: 'draft'` into `data`),
 * which would otherwise make a published document look unpublished and let a plain update
 * overwrite, and effectively unpublish, the live version.
 * System scripts (no `req.user`, e.g. seeds) are not restricted.
 */
export async function enforceEditorPublicationRules(args: {
  data: StatusData
  getLiveStatus: () => Promise<unknown>
  operation: 'create' | 'update'
  req: PayloadRequest
}): Promise<void> {
  const { req, data, operation, getLiveStatus } = args
  assertCanonical(data._status, STATUS_VALUES, '_status')
  if (!req.user || isAdmin(req.user)) return
  if (!isStaff(req.user)) throw new APIError('You are not allowed to change content.', 403)
  if (isEditor(req.user) && usesLocalePublicationFlag(req)) {
    throw new APIError('Publishing or unpublishing locales is admin-only; editors save drafts.', 403)
  }
  if (data._status === 'published') {
    throw new APIError('Editors can save drafts and request review; only admins may publish.', 403)
  }
  if (operation === 'update' && (await getLiveStatus()) === 'published' && !isDraftSave(req, data)) {
    throw new APIError(
      'This document is published. Editors must save changes as a draft for admin review; unpublishing is admin-only.',
      403,
    )
  }
}

const liveStatusOfDocument = (req: PayloadRequest, collection: string, id: unknown) => async (): Promise<unknown> => {
  if (id === undefined || id === null) return undefined
  // Not passing `req`: nested operations that receive it rewrite req.locale for the outer update.
  const live = await req.payload.findByID({
    collection: collection as CollectionSlug,
    id: id as number | string,
    depth: 0,
    draft: false,
    overrideAccess: true,
  })
  return (live as { _status?: unknown })._status
}

export const editorPublicationGuard: CollectionBeforeChangeHook = async ({ req, data, originalDoc, operation, collection }) => {
  await enforceEditorPublicationRules({
    req,
    data: data as StatusData,
    operation,
    getLiveStatus: liveStatusOfDocument(req, collection.slug, (originalDoc as { id?: unknown } | undefined)?.id),
  })
  return data
}

export const editorPublicationGuardGlobal: GlobalBeforeChangeHook = async ({ req, data, global }) => {
  await enforceEditorPublicationRules({
    req,
    data,
    operation: 'update',
    getLiveStatus: async () => {
      const live = await req.payload.findGlobal({ slug: global.slug as GlobalSlug, depth: 0, draft: false, overrideAccess: true })
      return (live as { _status?: unknown })._status
    },
  })
  return data
}

/**
 * Review workflow on top of Payload's native draft/published status.
 * Editors may move a draft to "in-review"; only admins may mark it "approved" or "changes-requested".
 * Publishing (admin only) always records the document as approved.
 */
export const reviewStatusRules: CollectionBeforeChangeHook = ({ req, data, originalDoc }) => {
  const d = data as StatusData
  assertCanonical(d.reviewStatus, REVIEW_VALUES, 'reviewStatus')
  const previous = (originalDoc as StatusData | undefined)?.reviewStatus
  if (req.user && !isAdmin(req.user) && d.reviewStatus !== previous) {
    if (d.reviewStatus === 'approved' || d.reviewStatus === 'changes-requested') {
      throw new APIError('Only admins can approve or request changes.', 403)
    }
  }
  if (d._status === 'published') d.reviewStatus = 'approved'
  return data
}

const hasText = (value: unknown): boolean => typeof value === 'string' && value.trim().length > 0

/**
 * Publishing requires every listed localized field to be present in both English and Arabic.
 * Drafts may be incomplete. Values for locales other than the request locale are read from the
 * stored document (latest draft), so an editor can add the Arabic translation in a later save.
 */
export const requireBilingualToPublish = (
  collection: CollectionSlug,
  fields: string[],
): CollectionBeforeChangeHook => {
  return async ({ req, data, originalDoc, operation }) => {
    const d = data as StatusData
    if (d._status !== 'published') return data
    const requestLocale = (req.locale ?? 'en') as string
    let stored: Record<string, unknown> = {}
    const id = (originalDoc as { id?: string | number } | undefined)?.id
    if (operation === 'update' && id !== undefined) {
      // Read the latest draft in every locale. Deliberately NOT passing `req`: a nested operation
      // that receives the request object rewrites `req.locale` to 'all', which would make Payload
      // silently drop the localized values of the update in progress.
      stored = (await req.payload.findByID({
        collection,
        id,
        depth: 0,
        draft: true,
        locale: 'all',
        overrideAccess: true,
      })) as unknown as Record<string, unknown>
    }
    const missing: string[] = []
    for (const field of fields) {
      const storedValue = (stored[field] ?? {}) as Record<string, unknown>
      for (const locale of LOCALES) {
        // Partial updates only carry the changed fields: fall back to the stored value.
        const incoming = locale === requestLocale ? d[field] : undefined
        const value = incoming !== undefined ? incoming : storedValue[locale]
        if (!hasText(value)) missing.push(`${field} (${locale})`)
      }
    }
    if (missing.length > 0) {
      throw new APIError(
        `Cannot publish: both English and Arabic are required. Missing: ${missing.join(', ')}. Save as a draft, complete the translation, then publish.`,
        400,
      )
    }
    return data
  }
}

type LocalizedValues = Partial<Record<Locale, unknown>>
type HomepageBlock = { blockType?: unknown; heading?: unknown; headline?: unknown; id?: unknown }

/** The one text every homepage block must carry in both languages before the page can go live. */
const requiredHomepageText = (blockType: unknown): 'heading' | 'headline' => (blockType === 'hero' ? 'headline' : 'heading')

/**
 * Homepage counterpart of `requireBilingualToPublish`. The public page renders blocks with
 * `fallbackLocale: false`, so a block that only has English would render an empty heading on /ar.
 * Every section needs its headline (hero) or heading (every other block) in both locales: the
 * request locale is read from the incoming data (falling back to the stored value for partial
 * updates), the other locale from the stored draft. Blocks are matched by id, exactly as Payload
 * merges block rows, so a block with no stored counterpart has no second language yet.
 */
export const requireBilingualHomepage: GlobalBeforeChangeHook = async ({ req, data }) => {
  const d = data as StatusData
  if (d._status !== 'published') return data
  const requestLocale = (req.locale ?? 'en') as string
  // Latest draft in every locale. Deliberately NOT passing `req` (see requireBilingualToPublish);
  // `overrideAccess: true` also marks this as a trusted read for the homepage afterRead gate.
  const stored = (await req.payload.findGlobal({
    slug: 'homepage',
    depth: 0,
    draft: true,
    locale: 'all',
    overrideAccess: true,
  })) as unknown as { sections?: unknown }
  const storedBlocks = Array.isArray(stored.sections) ? (stored.sections as HomepageBlock[]) : []
  const incoming = Array.isArray(d.sections) ? (d.sections as HomepageBlock[]) : undefined
  const missing: string[] = []
  ;(incoming ?? storedBlocks).forEach((block, index) => {
    const field = requiredHomepageText(block.blockType)
    const storedBlock = block.id !== undefined && block.id !== null ? storedBlocks.find((candidate) => candidate.id === block.id) : undefined
    const storedValue = storedBlock?.[field]
    const storedLocales = (storedValue && typeof storedValue === 'object' ? storedValue : {}) as LocalizedValues
    for (const locale of LOCALES) {
      const fromRequest = incoming && locale === requestLocale ? block[field] : undefined
      const value = fromRequest !== undefined ? fromRequest : storedLocales[locale]
      if (!hasText(value)) missing.push(`sections[${index}].${field} (${locale})`)
    }
  })
  if (missing.length > 0) {
    throw new APIError(
      `Cannot publish the homepage: both English and Arabic are required for every section. Missing: ${missing.join(', ')}. Save as a draft, complete the translation, then publish.`,
      400,
    )
  }
  return data
}
