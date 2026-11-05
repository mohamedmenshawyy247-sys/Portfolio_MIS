import { copyFileSync, mkdirSync } from 'node:fs'
mkdirSync(new URL('../docs/data/', import.meta.url), { recursive: true })
copyFileSync(new URL('../content/demo-content.json', import.meta.url), new URL('../docs/data/content.json', import.meta.url))
console.log('Preview data synced from content/demo-content.json')
