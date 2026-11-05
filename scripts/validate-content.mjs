import { readFileSync } from 'node:fs'
const json = JSON.parse(readFileSync(new URL('../content/demo-content.json', import.meta.url), 'utf8'))
const errors = []
if (json.meta?.status !== 'DEMO_ONLY') errors.push('Demo content must be marked DEMO_ONLY.')
for (const key of ['services','projects']) if (!Array.isArray(json[key])) errors.push(`${key} must be an array`)
const slugs = new Set()
for (const project of json.projects ?? []) {
  if (!/^[a-z0-9-]+$/.test(project.slug)) errors.push(`Invalid slug ${project.slug}`)
  if (slugs.has(project.slug)) errors.push(`Duplicate slug ${project.slug}`)
  slugs.add(project.slug)
  for (const lang of ['en','ar']) for (const prop of ['title','summary','challenge','solution']) if (!project[prop]?.[lang]) errors.push(`${project.slug}.${prop}.${lang} missing`)
  if (!['public','unlisted','private'].includes(project.visibility)) errors.push(`Invalid visibility ${project.visibility}`)
}
if (errors.length) { console.error(errors.join('\n')); process.exit(1) }
console.log(`Demo data validated: ${json.services.length} services, ${json.projects.length} projects.`)
