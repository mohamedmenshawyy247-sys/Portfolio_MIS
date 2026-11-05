import { notFound } from 'next/navigation'
import type { Locale } from './catalog'

/** Narrows a route param to a supported locale, or renders the 404 page before any data is fetched. */
export function assertLocale(value: string): Locale {
  if (value === 'en' || value === 'ar') return value
  notFound()
}
