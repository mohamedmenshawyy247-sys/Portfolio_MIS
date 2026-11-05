'use client'
import { useId, useState } from 'react'
import Link from 'next/link'
import type { Locale, MediaRef } from '@/lib/catalog'
import { copy } from '@/lib/copy'
import { CoverImage } from './SiteShell'

/** The subset of a project that a featured card renders; nothing else reaches the client. */
export type FeaturedItem = { categoryLabel: string; cover: MediaRef | null; slug: string; summary: string; title: string }

/**
 * Featured-project gallery with explicit previous/next and dot buttons (spec: manual navigation, no
 * autoplay, no forced horizontal scroll). Every card is in the server HTML; the first one is visible
 * without JavaScript and the rest carry `hidden`. Motion is left to the stylesheet, which already
 * honours prefers-reduced-motion, so nothing here animates.
 */
export default function FeaturedCarousel({ locale, items }: { items: FeaturedItem[]; locale: Locale }) {
  const c = copy(locale)
  const [index, setIndex] = useState(0)
  const baseId = useId()
  const count = items.length
  if (count === 0) return null
  const current = Math.min(index, count - 1)
  const go = (next: number) => setIndex((next + count) % count)
  const slideId = (i: number) => `${baseId}-slide-${i}`
  return (
    <div className="featured-carousel" role="region" aria-roledescription={c.carousel} aria-label={c.featuredCarousel}>
      <div aria-live="polite">
        {items.map((p, i) => (
          <div className="featured-slide" key={p.slug} id={slideId(i)} role="group" aria-roledescription={c.slide} aria-label={c.slideOf(i + 1, count)} hidden={i !== current}>
            <article className="featured-project">
              <div className="project-copy">
                {p.categoryLabel && <span className="category-tag">{p.categoryLabel}</span>}
                <h3>{p.title}</h3><p>{p.summary}</p><Link className="button" href={`/${locale}/projects/${p.slug}`}>{c.case}</Link>
              </div>
              <div className="project-visual"><CoverImage media={p.cover} /></div>
            </article>
          </div>
        ))}
      </div>
      {count > 1 && (
        <div className="project-controls">
          <button type="button" className="icon-button" aria-label={c.previousProject} onClick={() => go(current - 1)}><span aria-hidden="true">‹</span></button>
          <div className="slide-dots">
            {items.map((p, i) => (
              <button key={p.slug} type="button" className={i === current ? 'active' : ''} aria-label={c.slideOf(i + 1, count)} aria-current={i === current ? 'true' : undefined} aria-controls={slideId(i)} onClick={() => setIndex(i)} />
            ))}
          </div>
          <button type="button" className="icon-button" aria-label={c.nextProject} onClick={() => go(current + 1)}><span aria-hidden="true">›</span></button>
        </div>
      )}
    </div>
  )
}
