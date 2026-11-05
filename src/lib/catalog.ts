import config from '@payload-config'
import { getPayload } from 'payload'
import demo from '../../content/demo-content.json'

export type Locale = 'en' | 'ar'
export type PortfolioService = { id: string; key: string; icon: string; title: string; summary: string; points: string[] }
export type PortfolioProject = { id: string; slug: string; category: string; title: string; summary: string; challenge: string; solution: string; value: string[]; featured: boolean; visibility: 'public'|'unlisted' }
const isDemo = () => process.env.USE_DEMO_CONTENT === 'true'
const txt = (value: unknown) => typeof value === 'string' ? value : ''
const publicValue = (items: unknown) => Array.isArray(items) ? items.map((x: unknown) => typeof x === 'object' && x !== null && 'text' in x ? txt(x.text) : '').filter(Boolean) : []

export async function getServices(locale: Locale): Promise<PortfolioService[]> {
  if (isDemo()) return demo.services.map(x => ({ id: x.id, key: x.id, icon: x.icon, title: x.title[locale], summary: x.summary[locale], points: [...x.points[locale]] }))
  const payload = await getPayload({ config })
  const result = await payload.find({ collection: 'services', locale, fallbackLocale: false, overrideAccess: false, depth: 0, where: { and: [{ active: { equals: true } }, { _status: { equals: 'published' } }] }, sort: 'order', limit: 100 })
  return result.docs.map(x => ({ id: String(x.id), key: txt(x.key), icon: txt(x.icon), title: txt(x.title), summary: txt(x.summary), points: publicValue(x.features) }))
}

export async function getProjects(locale: Locale): Promise<PortfolioProject[]> {
  if (isDemo()) return demo.projects.filter(x=>x.visibility === 'public').map(x=>({ id:x.slug, slug:x.slug, category:x.category, title:x.title[locale], summary:x.summary[locale], challenge:x.challenge[locale], solution:x.solution[locale], value:[...x.value[locale]], featured:x.featured, visibility:'public' }))
  const payload = await getPayload({ config })
  const result = await payload.find({ collection: 'projects', locale, fallbackLocale: false, overrideAccess: false, depth: 0, where: { and: [{ visibility: { equals: 'public' } }, { _status: { equals: 'published' } }] }, sort:'order', limit: 100 })
  // Explicit public-field projection: no privateGallery, demoURL, or private media metadata.
  const keys = new Map((await getServices(locale)).map(s => [s.id, s.key]))
  return result.docs.map(x=>({ id:String(x.id), slug:txt(x.slug), category:keys.get(String(x.service ?? '')) ?? '', title:txt(x.title), summary:txt(x.summary), challenge:txt(x.challenge), solution:txt(x.solution), value:publicValue(x.deliveredValue), featured:Boolean(x.featured), visibility:'public' }))
}

export async function getProjectBySlug(locale: Locale, slug: string): Promise<PortfolioProject | null> {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return null
  if (isDemo()) return (await getProjects(locale)).find(x => x.slug === slug) ?? null
  const payload = await getPayload({ config })
  // Unlisted projects: accessible only by exact slug, never through a public list.
  // NEVER allow private status or draft, and NEVER serialize raw Payload documents.
  const result = await payload.find({ collection:'projects', locale, fallbackLocale:false, overrideAccess:true, depth:0, limit:1,
    where: { and: [{ slug:{ equals:slug } }, { _status:{ equals:'published' } }, { visibility:{ in:['public','unlisted'] } }] } })
  const x = result.docs[0]
  if (!x || (x.visibility !== 'public' && x.visibility !== 'unlisted')) return null
  const keys = new Map((await getServices(locale)).map(s => [s.id, s.key]))
  return { id:String(x.id),slug:txt(x.slug),category:keys.get(String(x.service ?? '')) ?? '',title:txt(x.title),summary:txt(x.summary),challenge:txt(x.challenge),solution:txt(x.solution),value:publicValue(x.deliveredValue),featured:Boolean(x.featured),visibility:x.visibility }
}
