import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'
import { ArrowRight, BarChart3, BookOpen, Database, ExternalLink, FlaskConical, Radio, Server, Sparkles } from 'lucide-react'
import type { HomeDataService, HomeFeaturedItem, HomeStoryProjection } from '@/lib/ia/home-projections'
import type { LabProjectProjection, KnowledgeProjection, RelatedAssetLink } from '@/lib/ia/hub-projections'

const FEATURE_META = {
  finding: { icon: FlaskConical, className: 'text-blue-600 dark:text-blue-400', label: 'Finding' },
  benchmark: { icon: BarChart3, className: 'text-amber-600 dark:text-amber-400', label: 'Benchmark' },
  knowledge: { icon: BookOpen, className: 'text-purple-600 dark:text-purple-400', label: 'Knowledge' },
} as const

export function HomeFeatureCard({ item, featured = false }: { item: HomeFeaturedItem; featured?: boolean }) {
  const meta = FEATURE_META[item.kind]
  const Icon = meta.icon
  return (
    <Link href={item.href} className={`group flex min-w-0 flex-col rounded-2xl border border-border bg-white p-5 no-underline transition-all hover:-translate-y-0.5 hover:border-foreground/25 hover:shadow-md dark:bg-gray-900 ${featured ? 'md:p-6' : ''}`}>
      <div className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-wide ${meta.className}`}>
        <Icon className="h-4 w-4" aria-hidden="true" />
        {item.eyebrow}
      </div>
      <h3 className={`mt-4 line-clamp-3 font-bold leading-snug transition-colors group-hover:text-blue-600 dark:group-hover:text-blue-400 ${featured ? 'text-xl md:text-2xl' : 'text-base md:text-lg'}`}>{item.title}</h3>
      <p className="mt-3 line-clamp-4 flex-1 text-sm leading-relaxed text-muted-foreground">{item.summary}</p>
      <span className="mt-5 inline-flex items-center gap-1 text-xs font-medium text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400">자세히 보기 <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /></span>
    </Link>
  )
}

export function HomeFindingItem({ project }: { project: LabProjectProjection }) {
  return (
    <Link href={project.href} className="group flex min-w-0 items-start justify-between gap-4 rounded-xl border border-border bg-white p-4 no-underline transition-colors hover:border-blue-300 dark:bg-gray-900 dark:hover:border-blue-700">
      <div className="min-w-0">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400"><FlaskConical className="h-3.5 w-3.5" aria-hidden="true" />{project.displayType}</div>
        <h3 className="mt-2 line-clamp-2 text-sm font-bold leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400">{project.title}</h3>
        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">{project.projectFinding || '아직 독립적인 Project Finding이 없습니다.'}</p>
      </div>
      <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
    </Link>
  )
}

export function HomeKnowledgeItem({ post }: { post: KnowledgeProjection }) {
  return (
    <Link href={`/research/${post.slug}`} className="group flex min-w-0 items-start gap-3 rounded-xl border border-border bg-white p-4 no-underline transition-colors hover:border-purple-300 dark:bg-gray-900 dark:hover:border-purple-700">
      <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-purple-600 dark:text-purple-400" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{post.domainLabel}</p>
        <h3 className="mt-1 line-clamp-2 text-sm font-bold leading-snug group-hover:text-purple-600 dark:group-hover:text-purple-400">{post.title}</h3>
        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{post.excerpt}</p>
      </div>
      <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
    </Link>
  )
}

export function HomeDataStrip({ services }: { services: HomeDataService[] }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
      {services.map(service => (
        <Link key={service.title} href={service.href} className="group min-w-0 rounded-xl border border-border bg-white p-4 no-underline transition-colors hover:border-emerald-300 dark:bg-gray-900 dark:hover:border-emerald-700">
          <div className="flex items-center justify-between gap-2"><span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">{service.type === 'Feed' ? <Radio className="h-3.5 w-3.5" aria-hidden="true" /> : <Database className="h-3.5 w-3.5" aria-hidden="true" />}{service.type}</span><ArrowRight className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" /></div>
          <h3 className="mt-3 text-sm font-bold group-hover:text-emerald-700 dark:group-hover:text-emerald-300">{service.title}</h3>
          <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{service.description}</p>
          {service.status && <p className="mt-3 line-clamp-2 text-xs leading-relaxed">{service.status}</p>}
          {service.updated && <p className="mt-2 text-[11px] text-muted-foreground">{service.updated}</p>}
        </Link>
      ))}
    </div>
  )
}

export function HomeStoryCard({ story }: { story: HomeStoryProjection }) {
  return (
    <Link href={story.href} className="group flex min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-white no-underline transition-all hover:-translate-y-0.5 hover:shadow-md dark:bg-gray-900">
      {story.coverImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={story.coverImage} alt="" className="aspect-[16/8] w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]" />
      ) : (
        <div className="flex aspect-[16/8] items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30"><Sparkles className="h-7 w-7 text-blue-500/60" aria-hidden="true" /></div>
      )}
      <div className="flex flex-1 flex-col p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">Story · DevSnack</p>
        <h3 className="mt-2 line-clamp-2 text-base font-bold leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400">{story.title}</h3>
        <p className="mt-2 line-clamp-2 flex-1 text-sm leading-relaxed text-muted-foreground">{story.excerpt}</p>
        <p className="mt-4 text-xs text-muted-foreground">{new Date(story.published).toLocaleDateString('ko-KR')}</p>
      </div>
    </Link>
  )
}

export function HomeRelationNote({ link, label = 'Related' }: { link?: RelatedAssetLink; label?: string }) {
  if (!link) return null
  return <Link href={link.href} className="inline-flex max-w-full items-center gap-1 text-xs text-muted-foreground no-underline hover:text-foreground"><span>{label}:</span><span className="min-w-0 max-w-[17rem] truncate">{link.title}</span><ExternalLink className="h-3 w-3 shrink-0" aria-hidden="true" /></Link>
}

export function HomeExploreLink({ href, title, description, icon: Icon = Server }: { href: string; title: string; description: string; icon?: LucideIcon }) {
  return <Link href={href} className="group flex min-w-0 items-center gap-3 rounded-xl border border-border bg-white px-4 py-3 no-underline transition-colors hover:border-foreground/25 dark:bg-gray-900"><Icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" /><span className="min-w-0 flex-1"><span className="block text-sm font-semibold group-hover:text-blue-600 dark:group-hover:text-blue-400">{title}</span><span className="mt-0.5 block truncate text-xs text-muted-foreground">{description}</span></span><ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" /></Link>
}
