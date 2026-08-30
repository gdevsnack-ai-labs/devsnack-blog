import Link from 'next/link'
import { ArrowUpRight, Database, RefreshCw } from 'lucide-react'

export interface DataServiceCardProps {
  title: string
  type: 'Feed' | 'Tracker' | 'Publication'
  description: string
  updateDescription: string
  lastUpdated: string
  href: string
  provenance: string
  latestTitle?: string | null
  relatedHref?: string
  relatedLabel?: string
}

export function DataServiceCard({
  title,
  type,
  description,
  updateDescription,
  lastUpdated,
  href,
  provenance,
  latestTitle,
  relatedHref,
  relatedLabel,
}: DataServiceCardProps) {
  return (
    <article className="flex h-full flex-col rounded-2xl border border-border bg-white p-5 dark:bg-gray-900">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300"><Database className="h-4 w-4" aria-hidden="true" />{type}</span>
        <span className="max-w-full rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">{provenance}</span>
      </div>
      <h3 className="mt-3 text-xl font-bold">{title}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{description}</p>
      <div className="mt-4 space-y-2 border-t border-border pt-4 text-xs text-muted-foreground">
        <p className="flex items-start gap-2"><RefreshCw className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" /><span><strong className="text-foreground">Update:</strong> {updateDescription}</span></p>
        <p><strong className="text-foreground">Latest:</strong> {latestTitle || lastUpdated}</p>
        <p><strong className="text-foreground">Data date:</strong> {lastUpdated}</p>
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        <Link href={href} className="inline-flex items-center gap-1.5 rounded-lg bg-foreground px-3 py-2 text-sm text-background no-underline hover:opacity-80">열어보기 <ArrowUpRight className="h-4 w-4" aria-hidden="true" /></Link>
        {relatedHref && relatedLabel && <Link href={relatedHref} className="inline-flex items-center rounded-lg border border-border px-3 py-2 text-sm no-underline hover:border-emerald-300 hover:text-emerald-700 dark:hover:border-emerald-700 dark:hover:text-emerald-300">{relatedLabel}</Link>}
      </div>
    </article>
  )
}
