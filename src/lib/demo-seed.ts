import { readFileSync } from 'node:fs'
import type { Payload } from 'payload'
import type { Homepage, SiteSetting } from '@/payload-types'
import { LOCALES } from './workflow-hooks'

type Sections = NonNullable<Homepage['sections']>
type L = { en: string; ar: string }
type Demo = {
  meta: { status: string }
  services: { id: string; icon: 'activity' | 'shield' | 'chart'; title: L; summary: L; points: { en: string[]; ar: string[] } }[]
  projects: {
    slug: string; category: string; visibility: 'public' | 'unlisted' | 'private'; featured: boolean
    title: L; summary: L; challenge: L; solution: L; value: { en: string[]; ar: string[] }
  }[]
}

const demo = JSON.parse(readFileSync(new URL('../../content/demo-content.json', import.meta.url), 'utf8')) as Demo
if (demo.meta.status !== 'DEMO_ONLY') throw new Error('Refusing to seed content that is not marked DEMO_ONLY')

async function seedServices(payload: Payload): Promise<Map<string, number>> {
  const ids = new Map<string, number>()
  for (const [index, s] of demo.services.entries()) {
    const existing = await payload.find({ collection: 'services', where: { key: { equals: s.id } }, limit: 1, overrideAccess: true, draft: true })
    if (existing.docs[0]) { ids.set(s.id, existing.docs[0].id as number); continue }
    const created = await payload.create({
      collection: 'services', locale: 'en', overrideAccess: true,
      data: { key: s.id, icon: s.icon, order: index, active: true, title: s.title.en, summary: s.summary.en, features: s.points.en.map((text) => ({ text })), _status: 'draft' },
    })
    await payload.update({
      collection: 'services', id: created.id, locale: 'ar', draft: true, overrideAccess: true,
      data: { title: s.title.ar, summary: s.summary.ar, features: s.points.ar.map((text) => ({ text })) },
    })
    await payload.update({ collection: 'services', id: created.id, locale: 'en', overrideAccess: true, data: { _status: 'published' } })
    ids.set(s.id, created.id as number)
    log(`service ${s.id}: created and published (en+ar)`)
  }
  return ids
}

async function seedProjects(payload: Payload, services: Map<string, number>) {
  for (const [index, p] of demo.projects.entries()) {
    const existing = await payload.find({ collection: 'projects', where: { slug: { equals: p.slug } }, limit: 1, overrideAccess: true, draft: true })
    if (existing.docs[0]) continue
    const service = services.get(p.category)
    if (!service) throw new Error(`Unknown service key ${p.category}`)
    const created = await payload.create({
      collection: 'projects', locale: 'en', overrideAccess: true,
      data: {
        slug: p.slug, service, visibility: p.visibility, featured: p.featured, order: index, reviewStatus: 'approved',
        title: p.title.en, summary: p.summary.en, challenge: p.challenge.en, solution: p.solution.en,
        deliveredValue: p.value.en.map((text) => ({ text })), _status: 'draft',
      },
    })
    await payload.update({
      collection: 'projects', id: created.id, locale: 'ar', draft: true, overrideAccess: true,
      data: { title: p.title.ar, summary: p.summary.ar, challenge: p.challenge.ar, solution: p.solution.ar, deliveredValue: p.value.ar.map((text) => ({ text })) },
    })
    await payload.update({ collection: 'projects', id: created.id, locale: 'en', overrideAccess: true, data: { _status: 'published' } })
    log(`project ${p.slug}: created and published (en+ar, ${p.visibility})`)
  }
}

async function seedHomepage(payload: Payload) {
  const current = await payload.findGlobal({ slug: 'homepage', overrideAccess: true, draft: true, depth: 0 })
  if (Array.isArray(current.sections) && current.sections.length > 0) return
  // A hero headline may mark one `**accent**` span, rendered with the cyan gradient (see HomeBlocks.renderHeadline).
  const sections: Sections = [
      { blockType: 'hero', eyebrow: 'MIS DEPARTMENT · DIGITAL EXPERIENCE', headline: 'Operational **Intelligence** That Drives Decisions.', subline: 'We turn complex operational data into clear visibility, consistent quality and informed decisions.', primaryLabel: 'Explore Projects', secondaryLabel: 'Our Services' },
      { blockType: 'introduction', heading: 'The technology backbone for operational excellence.', text: 'Our work brings together monitoring, quality and advanced reporting to turn operational complexity into a clearer way forward.' },
      { blockType: 'servicesSection', heading: 'Our core services.', intro: 'Three connected capabilities that bring insight, confidence and control to operations.' },
      { blockType: 'featuredProjects', heading: 'Featured projects.', intro: 'A visual look at our solutions and the thinking behind them.', limit: 3 },
      { blockType: 'approach', heading: 'From data to direction.', intro: 'An intentional journey from scattered signals to useful operational insight.', steps: [
        { title: 'Collect', detail: 'Operational signals' }, { title: 'Validate', detail: 'Reliable inputs' }, { title: 'Analyze', detail: 'Meaningful patterns' }, { title: 'Present', detail: 'Clear experiences' }, { title: 'Improve', detail: 'Informed action' } ] },
      { blockType: 'impactSection', heading: 'Our impact, without the noise.', intro: 'We focus on the operational capabilities a solution enables, not on invented performance numbers.', items: [
        { title: 'Operational visibility', detail: 'See what matters, when it matters.' }, { title: 'Process consistency', detail: 'Make follow-up workflows clearer.' }, { title: 'Faster insights', detail: 'Connect context to decisions.' }, { title: 'Continuous improvement', detail: 'Learn, refine and move forward.' } ] },
      { blockType: 'cta', heading: 'See what operational intelligence can look like.', label: 'Explore Case Studies', href: '/en/projects' },
  ]
  const en = { sections }
  const ar: Record<string, Record<string, unknown>> = {
    hero: { eyebrow: 'قسم MIS · تجربة رقمية', headline: '**ذكاء تشغيلي** برؤية أوضح وقرارات أقوى.', subline: 'نحوّل البيانات التشغيلية المعقدة إلى رؤية واضحة وجودة مستمرة وقرارات مدروسة.', primaryLabel: 'استكشف المشاريع', secondaryLabel: 'خدماتنا' },
    introduction: { heading: 'القوة التقنية وراء التميز التشغيلي.', text: 'نربط المراقبة اللحظية والجودة والتقارير المتقدمة لتحويل تحديات التشغيل إلى خطوات واضحة.' },
    servicesSection: { heading: 'خدماتنا الأساسية.', intro: 'ثلاث قدرات مترابطة تمنح العمليات رؤية وثقة وتحكمًا أفضل.' },
    featuredProjects: { heading: 'مشاريع مميزة.', intro: 'نظرة بصرية على الحلول وطريقة التفكير وراء كل مشروع.' },
    approach: { heading: 'من البيانات إلى القرار.', intro: 'رحلة واضحة من المؤشرات التشغيلية إلى نتائج مفيدة لاتخاذ القرار.', steps: [
      { title: 'جمع', detail: 'بيانات التشغيل' }, { title: 'تحقق', detail: 'مدخلات موثوقة' }, { title: 'تحليل', detail: 'أنماط ذات معنى' }, { title: 'عرض', detail: 'تجارب واضحة' }, { title: 'تحسين', detail: 'خطوات مدروسة' } ] },
    impactSection: { heading: 'أثر عملنا، بلا ضوضاء.', intro: 'نركز على القدرات التشغيلية التي يتيحها الحل، دون اختلاق أرقام أداء.', items: [
      { title: 'رؤية تشغيلية', detail: 'معرفة ما يهم في الوقت المناسب.' }, { title: 'اتساق العمليات', detail: 'متابعة أكثر وضوحًا.' }, { title: 'تحليلات أسرع', detail: 'ربط المعلومات بالقرارات.' }, { title: 'تحسين مستمر', detail: 'التعلّم والتطوير باستمرار.' } ] },
    cta: { heading: 'اكتشف كيف يبدو الذكاء التشغيلي.', label: 'استكشف دراسات الحالة', href: '/ar/projects' },
  }
  // Create the English draft first, then write Arabic values onto the same block rows by id.
  await payload.updateGlobal({ slug: 'homepage', locale: 'en', draft: true, overrideAccess: true, data: en })
  const saved = await payload.findGlobal({ slug: 'homepage', locale: 'en', draft: true, overrideAccess: true, depth: 0 })
  const arSections = (saved.sections ?? []).map((block) => ({ ...block, ...(ar[block.blockType] ?? {}) })) as unknown as Sections
  await payload.updateGlobal({ slug: 'homepage', locale: 'ar', draft: true, overrideAccess: true, data: { sections: arSections } })
  await payload.updateGlobal({ slug: 'homepage', locale: 'en', overrideAccess: true, data: { _status: 'published' } })
  log('homepage: 7 approved blocks published (en+ar)')
}

type SettingsDefaults = Partial<Pick<SiteSetting, 'accentColor' | 'brandName' | 'defaultLocale' | 'footerNote' | 'tagline'>>
/** Shared (non-localized) values are written with the English pass; the localized ones per locale. */
const SETTINGS_SHARED: SettingsDefaults = { brandName: 'MIS Department', defaultLocale: 'en', accentColor: 'blue' }
const SETTINGS_LOCALIZED: Record<(typeof LOCALES)[number], SettingsDefaults> = {
  en: { tagline: 'Operational Intelligence, Real Impact.', footerNote: 'Illustrative portfolio preview. No customer data.' },
  ar: { tagline: 'ذكاء تشغيلي وأثر واضح.', footerNote: 'معاينة توضيحية. بدون بيانات عملاء.' },
}

const isBlank = (value: unknown): boolean => value === undefined || value === null || (typeof value === 'string' && value.trim() === '')

/**
 * Fills site settings that are still empty, locale by locale, and never overwrites a value that is already set (an
 * admin's customisation survives a re-run). Fields with a schema default read back as that default and are therefore
 * left to Payload, which stores them on the first save.
 */
async function seedSettings(payload: Payload) {
  for (const locale of LOCALES) {
    const current = await payload.findGlobal({ slug: 'site-settings', locale, overrideAccess: true, depth: 0 })
    const wanted: SettingsDefaults = { ...SETTINGS_LOCALIZED[locale], ...(locale === 'en' ? SETTINGS_SHARED : {}) }
    const data: SettingsDefaults = {}
    for (const field of Object.keys(wanted) as (keyof SettingsDefaults)[]) {
      if (isBlank(current[field])) Object.assign(data, { [field]: wanted[field] })
    }
    const written = Object.keys(data)
    if (written.length === 0) {
      log(`site-settings (${locale}): nothing written, every seeded field already has a value`)
      continue
    }
    await payload.updateGlobal({ slug: 'site-settings', locale, overrideAccess: true, data })
    log(`site-settings (${locale}): wrote ${written.join(', ')}`)
  }
}


/** Seeds the DEMO_ONLY catalogue, homepage blocks and site settings. Safe to run repeatedly. */
let log: (line: string) => void = console.log

export async function seedDemoContent(payload: Payload, logger: (line: string) => void = console.log): Promise<void> {
  log = logger
  const services = await seedServices(payload)
  await seedProjects(payload, services)
  await seedHomepage(payload)
  await seedSettings(payload)
  log('Demo seed complete.')
}
