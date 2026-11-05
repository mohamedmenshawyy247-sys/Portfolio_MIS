import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { ar } from '@payloadcms/translations/languages/ar'
import { en } from '@payloadcms/translations/languages/en'
import sharp from 'sharp'
import { Users } from './src/collections/Users'
import { Services } from './src/collections/Services'
import { Projects } from './src/collections/Projects'
import { PublicMedia } from './src/collections/PublicMedia'
import { PrivateMedia } from './src/collections/PrivateMedia'
import { Leads } from './src/collections/Leads'
import { SiteSettings } from './src/globals/SiteSettings'
import { Homepage } from './src/globals/Homepage'
import { siteURL } from './src/lib/site-url'

// Read at runtime (SITE_URL), never from the build-time NEXT_PUBLIC_* inlining: see src/lib/site-url.ts.
const site = siteURL()

export default buildConfig({
  secret: process.env.PAYLOAD_SECRET || '',
  serverURL: site,
  editor: lexicalEditor(),
  sharp,
  db: postgresAdapter({
    pool: { connectionString: process.env.DATABASE_URL || '' },
    // Schema changes always go through committed migrations (pnpm db:migrate), never dev push.
    push: false,
  }),
  admin: {
    user: 'users',
    // Built-in avatar: Payload's default 'gravatar' breaks offline/behind a proxy and would send e-mail hashes to gravatar.com.
    avatar: 'default',
    meta: { titleSuffix: ' | MIS Department' },
  },
  // Admin UI available in English and Arabic (Payload switches to RTL automatically for Arabic).
  i18n: { supportedLanguages: { en, ar }, fallbackLanguage: 'en' },
  collections: [Users, Services, Projects, PublicMedia, PrivateMedia, Leads],
  globals: [Homepage, SiteSettings],
  localization: { locales: ['en', 'ar'], defaultLocale: 'en', fallback: false },
  graphQL: { disable: true },
  cors: [site],
  csrf: [site],
  // Request-level cap; per-type caps are enforced by the upload collections' validation hooks.
  upload: { limits: { fileSize: 25 * 1024 * 1024 } },
  maxDepth: 2,
  defaultDepth: 0,
  typescript: { outputFile: './src/payload-types.ts' },
})
