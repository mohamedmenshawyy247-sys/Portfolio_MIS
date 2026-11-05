'use client'
import { useId, useMemo, useState } from 'react'
import Link from 'next/link'
import type { Locale, MediaRef } from '@/lib/catalog'
import { copy } from '@/lib/copy'
import { CoverImage, StatusBadges } from './SiteShell'

type Filter = { key: string; label: string }

/** The subset of a project that the gallery card renders; nothing else reaches the client. */
export type ProjectCard = {
  /** Service key, used only for filtering. */
  category: string
  /** Localized service title shown on the card. */
  categoryLabel: string
  cover: MediaRef | null
  slug: string
  status: 'draft' | 'published'
  summary: string
  title: string
  visibility: 'private' | 'public' | 'unlisted'
}

export default function ProjectsClient({ locale, projects, filters, showBadges = false }: { filters: Filter[]; locale: Locale; projects: ProjectCard[]; showBadges?: boolean }) {
  const c = copy(locale)
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('all')
  const searchId = useId()
  const categories: Filter[] = [{ key: 'all', label: c.all }, ...filters]
  const result = useMemo(
    () => projects.filter((p) => (cat === 'all' || p.category === cat) && `${p.title} ${p.summary}`.toLowerCase().includes(q.trim().toLowerCase())),
    [q, cat, projects],
  )
  return (
    <>
      <div className="toolbar">
        <div className="filters" role="group" aria-label={c.filters}>
          {categories.map((f) => (
            <button key={f.key} onClick={() => setCat(f.key)} className={`filter-btn ${f.key === cat ? 'active' : ''}`} type="button" aria-pressed={f.key === cat}>{f.label}</button>
          ))}
        </div>
        <label className="visually-hidden" htmlFor={searchId}>{c.search}</label>
        <input id={searchId} className="search-input" type="search" placeholder={c.search} value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="gallery" aria-live="polite">
        {result.map((p) => (
          <Link key={p.slug} href={`/${locale}/projects/${p.slug}`} className="gallery-card">
            <div className="gallery-thumb"><CoverImage media={p.cover} sizes="(max-width: 860px) 100vw, 33vw" /></div>
            <div className="gallery-content">
              {p.categoryLabel && <span className="category-tag">{p.categoryLabel}</span>}
              {showBadges && <StatusBadges locale={locale} status={p.status} visibility={p.visibility} />}
              <h3>{p.title}</h3><p>{p.summary}</p><span className="text-link">{c.case}</span>
            </div>
          </Link>
        ))}
      </div>
      {result.length === 0 && <p className="no-results">{c.noResults}</p>}
    </>
  )
}
