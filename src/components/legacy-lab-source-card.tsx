import Link from 'next/link'
import { ArrowRight, FlaskConical } from 'lucide-react'
import type { LegacyLabProjection } from '@/lib/ia/hub-projections'

export function LegacyLabSourceCard({ post }: { post: LegacyLabProjection }) {
  return (
    <article className="flex flex-col gap-4 rounded-xl border border-border bg-white p-4 dark:bg-gray-900 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5"><FlaskConical className="h-3.5 w-3.5" aria-hidden="true" />Lab Note</span>
          <span aria-hidden="true">·</span>
          <span>{new Date(post.published).toLocaleDateString('ko-KR')}</span>
        </div>
        <h3 className="mt-2 text-base font-bold leading-snug">{post.title}</h3>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        <Link href={post.href} className="inline-flex items-center gap-1.5 rounded-lg bg-foreground px-3 py-2 text-xs text-background no-underline hover:opacity-80">
          Lab Note 읽기 <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
        {post.projectHref && <Link href={post.projectHref} className="inline-flex items-center rounded-lg border border-border px-3 py-2 text-xs no-underline hover:border-blue-300 hover:text-blue-600 dark:hover:border-blue-700 dark:hover:text-blue-400">Project 보기</Link>}
      </div>
    </article>
  )
}
