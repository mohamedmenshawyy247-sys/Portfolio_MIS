import { redirect } from 'next/navigation'
import { getDefaultLocale } from '@/lib/catalog'

// Resolved on every request: the target is SiteSettings.defaultLocale, which admins may change at any time.
export const dynamic = 'force-dynamic'

export default async function Index() {
  redirect(`/${await getDefaultLocale()}`)
}
