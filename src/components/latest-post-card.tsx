import Link from 'next/link'
import { FileText } from 'lucide-react'
import { BLOG_COLORS, BLOG_PATH, BLOG_LABEL, type BlogId } from '@/lib/colors'

interface Props {
  slug: string
  blogId: BlogId
  title: string
  publishedAt: string
  thumbnail?: string | null
}

export function LatestPostCard({ slug, blogId, title, publishedAt, thumbnail }: Props) {
  const c = BLOG_COLORS[blogId]
  const label = BLOG_LABEL[blogId]
  const base = BLOG_PATH[blogId]
  return (
    <Link
      href={`${base}/${slug}`}
      className="flex items-start gap-3 p-3 rounded-lg border border-border hover:border-foreground/20 transition-colors no-underline"
    >
      {thumbnail ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={thumbnail}
          alt=""
          className="w-12 h-12 rounded object-cover flex-shrink-0"
        />
      ) : (
        <div className={`w-12 h-12 rounded ${c.bg} flex items-center justify-center flex-shrink-0`}>
          <FileText className={`w-5 h-5 ${c.text}`} />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-snug line-clamp-2 mb-1">{title}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{publishedAt}</span>
          <span className={`px-1.5 py-0.5 rounded ${c.bg} ${c.text} text-[10px] font-medium`}>
            {label}
          </span>
        </div>
      </div>
    </Link>
  )
}
