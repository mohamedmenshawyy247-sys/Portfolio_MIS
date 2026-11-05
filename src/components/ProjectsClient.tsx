'use client'
import { useMemo, useState } from 'react'
import Link from 'next/link'
import type { Locale, PortfolioProject } from '@/lib/catalog'
import { PreviewDashboard } from './SiteShell'
export default function ProjectsClient({ locale, projects }: { locale: Locale; projects: PortfolioProject[] }) {
 const [q,setQ]=useState('');const [cat,setCat]=useState('all')
 const categories=[['all',locale==='ar'?'الكل':'All'],['real-time',locale==='ar'?'المراقبة':'Real-Time'],['quality',locale==='ar'?'الجودة':'Quality'],['reporting',locale==='ar'?'التقارير':'Reporting']]
 const result=useMemo(()=>projects.filter(p=>(cat==='all'||p.category===cat)&&`${p.title} ${p.summary}`.toLowerCase().includes(q.toLowerCase())),[q,cat,projects])
 return <><div className="toolbar"><div className="filters">{categories.map(([id,label])=><button key={id} onClick={()=>setCat(id)} className={`filter-btn ${id===cat?'active':''}`} type="button" aria-pressed={id===cat}>{label}</button>)}</div><input className="search-input" placeholder={locale==='ar'?'ابحث عن مشروع':'Search projects'} value={q} onChange={e=>setQ(e.target.value)} aria-label="Search projects"/></div><div className="gallery">{result.map(p=><Link key={p.slug} href={`/${locale}/projects/${p.slug}`} className="gallery-card"><div className="gallery-thumb"><PreviewDashboard/></div><div className="gallery-content"><span className="category-tag">{p.category}</span><h3>{p.title}</h3><p>{p.summary}</p><span className="text-link">{locale==='ar'?'عرض المشروع ↗':'Explore case study ↗'}</span></div></Link>)}</div>{result.length===0&&<p className="no-results">{locale==='ar'?'لا توجد نتائج':'No matching projects'}</p>}</>
}
