import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import sharp from 'sharp'
import { Users } from './src/collections/Users'
import { Services } from './src/collections/Services'
import { Projects } from './src/collections/Projects'
import { PublicMedia } from './src/collections/PublicMedia'
import { PrivateMedia } from './src/collections/PrivateMedia'
import { Leads } from './src/collections/Leads'
import { SiteSettings } from './src/globals/SiteSettings'
import { Homepage } from './src/globals/Homepage'

export default buildConfig({
  secret: process.env.PAYLOAD_SECRET || '',
  serverURL: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  editor: lexicalEditor(),
  sharp,
  db: postgresAdapter({ pool: { connectionString: process.env.DATABASE_URL || '' } }),
  admin: { user: 'users', meta: { titleSuffix: ' | MIS Department' } },
  collections: [Users, Services, Projects, PublicMedia, PrivateMedia, Leads],
  globals: [Homepage, SiteSettings],
  localization: { locales: ['en', 'ar'], defaultLocale: 'en', fallback: false },
  graphQL: { disable: true },
  cors: [process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'],
  csrf: [process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'],
  maxDepth: 2,
  typescript: { outputFile: './src/payload-types.ts' },
})
