import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

export default defineConfig([
  globalIgnores(['.next/**', 'node_modules/**', 'docs/**', 'public/**', 'private-media/**', 'src/payload-types.ts', 'src/app/(payload)/admin/importMap.js', 'src/migrations/**', 'qa-screenshots/**', 'playwright-report/**', 'test-results/**']),
  ...nextVitals,
  ...nextTs,
])
