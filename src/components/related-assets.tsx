import Link from 'next/link'
import { ArrowUpRight, Link2 } from 'lucide-react'
import type { RelatedAssetLink } from '@/lib/ia/hub-projections'

interface RelatedAssetsProps {
  links: RelatedAssetLink[]
  title?: string
}

export function RelatedAssets({ links, title = 'Related' }: RelatedAssetsProps) {
  if (links.length === 0) return null

  return (
    <section className="mt-8 border-t border-border pt-6" aria-labelledby="related-assets-heading">
      <div className="flex items-center gap-2">
        <Link2 className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        <h2 id="related-assets-heading" className="text-sm font-semibold">{title}</h2>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {links.map(link => (
          <Link
            key={`${link.assetId}-${link.relation}`}
            href={link.href}
            className="inline-flex max-w-full min-w-0 items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-2 text-sm no-underline transition-colors hover:border-blue-300 hover:text-blue-600 dark:bg-gray-900 dark:hover:border-blue-700 dark:hover:text-blue-400"
          >
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{link.relationLabel}</span>
            <span className="min-w-0 max-w-[18rem] flex-1 truncate">{link.title}</span>
            <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
          </Link>
        ))}
      </div>
    </section>
  )
}
