import Link from 'next/link'
import { ArrowUpRight, BookOpen, Calendar } from 'lucide-react'
import type { KnowledgeProjection } from '@/lib/ia/hub-projections'

export function KnowledgeAssetCard({ post }: { post: KnowledgeProjection }) {
  return (
    <article className="group flex min-w-0 h-full flex-col rounded-xl border border-border bg-white p-4 dark:bg-gray-900">
      <div className="flex items-start justify-between gap-3 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1.5"><BookOpen className="h-3.5 w-3.5" aria-hidden="true" />{post.domainLabel}</span>
        <span className="inline-flex shrink-0 items-center gap-1"><Calendar className="h-3.5 w-3.5" aria-hidden="true" />{new Date(post.published).toLocaleDateString('ko-KR')}</span>
      </div>
      <h3 className="mt-3 line-clamp-2 text-base font-bold leading-snug transition-colors group-hover:text-purple-600 dark:group-hover:text-purple-400">{post.title}</h3>
      <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-muted-foreground">{post.excerpt}</p>
      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-3">
        {post.benchmarkResearch && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">Benchmark Research</span>}
        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">{post.statusLabel}</span>
        <Link href={`/research/${post.slug}`} className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-foreground no-underline hover:text-purple-600 dark:hover:text-purple-400">
          읽기 <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </div>
    </article>
  )
}
