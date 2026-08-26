import Link from 'next/link'
import { ArrowRight, Calendar, FlaskConical } from 'lucide-react'
import type { LegacyLabProjection } from '@/lib/ia/hub-projections'

export function LegacyLabSourceCard({ post }: { post: LegacyLabProjection }) {
  return (
    <article className="rounded-xl border border-border bg-white p-4 dark:bg-gray-900">
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5"><FlaskConical className="h-3.5 w-3.5" aria-hidden="true" />Published Lab source</span>
        <span className="inline-flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" aria-hidden="true" />{new Date(post.published).toLocaleDateString('ko-KR')}</span>
      </div>
      <h3 className="mt-3 text-base font-bold leading-snug">{post.title}</h3>
      <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">{post.excerpt}</p>
      <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-3">
        <Link href={post.href} className="inline-flex items-center gap-1.5 rounded-lg bg-foreground px-3 py-2 text-xs text-background no-underline hover:opacity-80">
          원문 보기 <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
        {post.projectHref && <Link href={post.projectHref} className="inline-flex items-center rounded-lg border border-border px-3 py-2 text-xs no-underline hover:border-blue-300 hover:text-blue-600 dark:hover:border-blue-700 dark:hover:text-blue-400">Project 보기</Link>}
      </div>
    </article>
  )
}
