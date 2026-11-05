import config from '@payload-config'
import { getPayload, type Payload } from 'payload'
import demo from '../../content/demo-content.json'
import type { Homepage, PublicMedia, SiteSetting } from '@/payload-types'
import { siteURL } from './site-url'
import { anonymousViewer, type Viewer } from './viewer'

export type Locale = 'ar' | 'en'
export type Visibility = 'private' | 'public' | 'unlisted'
export type MediaRef = { alt: string; height: null | number; url: string; width: null | number }
export type PortfolioService = { icon: string; id: string; key: string; points: string[]; summary: string; title: string }
export type PortfolioProject = {
  category: string
  categoryLabel: string
  challenge: string
  cover: MediaRef | null
  featured: boolean
  gallery: MediaRef[]
  id: string
  seoDescription: string
  seoTitle: string
  slug: string
  solution: string
  status: 'draft' | 'published'
  summary: string
  title: string
  value: string[]
  visibility: Visibility
}
export type HomepageBlock = NonNullable<Homepage['sections']>[number]
export type SiteInfo = { brandName: string; contactEmail: string; footerNote: string; tagline: string }

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
export const isDemoContent = (): boolean => process.env.USE_DEMO_CONTENT === 'true'

const txt = (value: unknown): string => (typeof value === 'string' ? value : '')
const textList = (items: unknown): string[] =>
  Array.isArray(items)
    ? items.map((x) => (x && typeof x === 'object' && 'text' in x ? txt((x as { text?: unknown }).text) : '')).filter(Boolean)
    : []
const relId = (value: unknown): null | string => {
  if (typeof value === 'number' || typeof value === 'string') return String(value)
  if (value && typeof value === 'object' && 'id' in value) return String((value as { id: unknown }).id)
  return null
}

const db = (): Promise<Payload> => getPayload({ config })

/** Read options shared by every public query. Access control is never overridden here. */
const readOptions = (viewer: Viewer) =>
  viewer.draft && viewer.user
    ? ({ draft: true, overrideAccess: false, user: viewer.user } as const)
    : ({ draft: false, overrideAccess: false } as const)

/** Keep media URLs same-origin and relative so next/image localPatterns can validate them. */
const relativeURL = (url: unknown): string => {
  const value = txt(url)
  if (!value) return ''
  try {
    const parsed = new URL(value)
    const site = new URL(siteURL())
    return parsed.origin === site.origin ? `${parsed.pathname}${parsed.search}` : value
  } catch {
    return value
  }
}

/** public-media also accepts video/mp4; only raster images can be rendered through next/image. */
const isImage = (mimeType: unknown): boolean => typeof mimeType === 'string' && mimeType.startsWith('image/')

const toMediaRef = (doc: Partial<PublicMedia> | undefined): MediaRef | null => {
  if (!doc || !isImage(doc.mimeType)) return null
  const card = doc.sizes?.card
  const url = relativeURL(card?.url || doc.url)
  if (!url) return null
  return { url, alt: txt(doc.alt), width: card?.width ?? doc.width ?? null, height: card?.height ?? doc.height ?? null }
}

/** Approved image assets by id, with `alt` in the requested locale (empty when not entered: no English fallback on Arabic pages). */
async function loadPublicMedia(ids: string[], locale: Locale): Promise<Map<string, MediaRef>> {
  const map = new Map<string, MediaRef>()
  if (ids.length === 0) return map
  const payload = await db()
  // Only approved assets are rendered, even for staff in preview mode.
  const result = await payload.find({
    collection: 'public-media',
    where: { and: [{ id: { in: ids } }, { approvedForPublic: { equals: true } }] },
    locale,
    fallbackLocale: false,
    depth: 0,
    limit: ids.length,
    overrideAccess: false,
    pagination: false,
  })
  for (const doc of result.docs) {
    const ref = toMediaRef(doc)
    if (ref) map.set(String(doc.id), ref)
  }
  return map
}

export async function getServices(locale: Locale, viewer: Viewer = anonymousViewer): Promise<PortfolioService[]> {
  if (isDemoContent()) {
    return demo.services.map((x) => ({ id: x.id, key: x.id, icon: x.icon, title: x.title[locale], summary: x.summary[locale], points: [...x.points[locale]] }))
  }
  const payload = await db()
  const result = await payload.find({
    collection: 'services',
    ...readOptions(viewer),
    locale,
    fallbackLocale: false,
    depth: 0,
    where: { active: { equals: true } },
    sort: 'order',
    limit: 50,
    select: { key: true, icon: true, title: true, summary: true, features: true },
  })
  return result.docs.map((x) => ({ id: String(x.id), key: txt(x.key), icon: txt(x.icon), title: txt(x.title), summary: txt(x.summary), points: textList(x.features) }))
}

const projectSelect = {
  slug: true, title: true, summary: true, challenge: true, solution: true, deliveredValue: true, service: true,
  visibility: true, featured: true, order: true, cover: true, publicGallery: true, seoTitle: true, seoDescription: true, _status: true,
} as const

type ProjectRow = {
  _status?: null | string
  challenge?: unknown
  cover?: unknown
  deliveredValue?: unknown
  featured?: boolean | null
  id: number | string
  publicGallery?: unknown
  seoDescription?: unknown
  seoTitle?: unknown
  service?: unknown
  slug?: unknown
  solution?: unknown
  summary?: unknown
  title?: unknown
  visibility?: unknown
}

async function mapProjects(rows: ProjectRow[], locale: Locale, viewer: Viewer): Promise<PortfolioProject[]> {
  const services = await getServices(locale, viewer)
  const byId = new Map(services.map((s) => [s.id, s]))
  const mediaIds = new Set<string>()
  for (const row of rows) {
    const cover = relId(row.cover)
    if (cover) mediaIds.add(cover)
    if (Array.isArray(row.publicGallery)) for (const g of row.publicGallery) { const id = relId(g); if (id) mediaIds.add(id) }
  }
  const media = await loadPublicMedia([...mediaIds], locale)
  return rows.map((x) => {
    const visibility = x.visibility === 'public' || x.visibility === 'unlisted' || x.visibility === 'private' ? x.visibility : 'private'
    const coverId = relId(x.cover)
    const gallery = Array.isArray(x.publicGallery) ? x.publicGallery.map((g) => media.get(relId(g) ?? '') ?? null).filter((m): m is MediaRef => m !== null) : []
    const service = byId.get(relId(x.service) ?? '')
    return {
      id: String(x.id), slug: txt(x.slug), category: service?.key ?? '', categoryLabel: service?.title ?? '',
      title: txt(x.title), summary: txt(x.summary), challenge: txt(x.challenge), solution: txt(x.solution),
      value: textList(x.deliveredValue), featured: Boolean(x.featured), visibility,
      status: x._status === 'published' ? 'published' : 'draft',
      cover: coverId ? (media.get(coverId) ?? null) : null, gallery,
      seoTitle: txt(x.seoTitle), seoDescription: txt(x.seoDescription),
    }
  })
}

const demoProjects = (locale: Locale): PortfolioProject[] => {
  const titles = new Map(demo.services.map((s) => [s.id, s.title[locale]]))
  return demo.projects.filter((x) => x.visibility === 'public').map((x) => ({
    id: x.slug, slug: x.slug, category: x.category, categoryLabel: titles.get(x.category) ?? '', title: x.title[locale], summary: x.summary[locale],
    challenge: x.challenge[locale], solution: x.solution[locale], value: [...x.value[locale]], featured: x.featured, visibility: 'public', status: 'published',
    cover: null, gallery: [], seoTitle: '', seoDescription: '',
  }))
}

/** Listed projects: public + published for everyone; staff in preview also see drafts and other visibilities. */
export async function getProjects(locale: Locale, viewer: Viewer = anonymousViewer): Promise<PortfolioProject[]> {
  if (isDemoContent()) return demoProjects(locale)
  const payload = await db()
  const result = await payload.find({
    collection: 'projects',
    ...readOptions(viewer),
    locale,
    fallbackLocale: false,
    depth: 0,
    where: viewer.draft ? {} : { and: [{ visibility: { equals: 'public' } }, { _status: { equals: 'published' } }] },
    sort: 'order',
    limit: 100,
    select: projectSelect,
  })
  return mapProjects(result.docs as ProjectRow[], locale, viewer)
}

/**
 * Exact-slug lookup. Anonymous visitors may open public AND unlisted published projects here (and
 * nowhere else: lists, REST and sitemap never include unlisted ones). Private and draft projects are
 * only returned to staff in preview mode. The raw Payload document is never serialised: only the
 * projected public fields leave this function.
 */
export async function getProjectBySlug(locale: Locale, slug: string, viewer: Viewer = anonymousViewer): Promise<null | PortfolioProject> {
  if (!SLUG_PATTERN.test(slug)) return null
  if (isDemoContent()) return demoProjects(locale).find((x) => x.slug === slug) ?? null
  const payload = await db()
  const result = viewer.draft && viewer.user
    ? await payload.find({ collection: 'projects', draft: true, overrideAccess: false, user: viewer.user, locale, fallbackLocale: false, depth: 0, limit: 1, where: { slug: { equals: slug } }, select: projectSelect })
    : await payload.find({
        collection: 'projects', overrideAccess: true, locale, fallbackLocale: false, depth: 0, limit: 1,
        where: { and: [{ slug: { equals: slug } }, { _status: { equals: 'published' } }, { visibility: { in: ['public', 'unlisted'] } }] },
        select: projectSelect,
      })
  const row = result.docs[0] as ProjectRow | undefined
  if (!row) return null
  if (!viewer.draft && (row._status !== 'published' || (row.visibility !== 'public' && row.visibility !== 'unlisted'))) return null
  const [project] = await mapProjects([row], locale, viewer)
  return project ?? null
}

/** A block can only render when its required text exists in the requested locale (hero: headline; every other block: heading). */
const hasRequiredText = (block: HomepageBlock): boolean => {
  const text = block.blockType === 'hero' ? block.headline : block.heading
  return typeof text === 'string' && text.trim() !== ''
}

/**
 * Homepage builder blocks in the requested locale. Returns null when nothing is published yet, or when no block
 * has its required text in this locale (e.g. published from the English editor only): the page then renders the
 * built-in defaults instead of empty <h1>/<h2> elements. Blocks missing their text are dropped individually.
 */
export async function getHomepageBlocks(locale: Locale, viewer: Viewer = anonymousViewer): Promise<HomepageBlock[] | null> {
  if (isDemoContent()) return null
  const payload = await db()
  const doc = await payload.findGlobal({ slug: 'homepage', ...readOptions(viewer), locale, fallbackLocale: false, depth: 0 })
  if (!viewer.draft && doc._status !== 'published') return null
  const sections = Array.isArray(doc.sections) ? doc.sections.filter(hasRequiredText) : []
  return sections.length > 0 ? sections : null
}

/** SiteSettings.defaultLocale, the target of the root redirect. English in demo mode or when the database is unreachable. */
export async function getDefaultLocale(): Promise<Locale> {
  if (isDemoContent()) return 'en'
  try {
    const payload = await db()
    const doc = (await payload.findGlobal({ slug: 'site-settings', depth: 0, overrideAccess: true })) as Partial<SiteSetting>
    return doc.defaultLocale === 'ar' ? 'ar' : 'en'
  } catch {
    return 'en'
  }
}

export async function getSiteInfo(locale: Locale): Promise<SiteInfo> {
  const defaults: SiteInfo = { brandName: 'MIS Department', tagline: '', contactEmail: '', footerNote: '' }
  if (isDemoContent()) return defaults
  try {
    const payload = await db()
    const doc = (await payload.findGlobal({ slug: 'site-settings', overrideAccess: false, locale, fallbackLocale: false, depth: 0 })) as Partial<SiteSetting>
    return { brandName: txt(doc.brandName) || defaults.brandName, tagline: txt(doc.tagline), contactEmail: txt(doc.contactEmail), footerNote: txt(doc.footerNote) }
  } catch {
    return defaults
  }
}
