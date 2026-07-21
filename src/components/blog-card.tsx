import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { BLOG_COLORS, type BlogId } from '@/lib/colors'

interface Props {
  id: BlogId
  href: string
  title: string
  subtitle: string
  description: string
  icon: React.ComponentType<{ className?: string }>
}

export function BlogCard({ id, href, title, subtitle, description, icon: Icon }: Props) {
  const c = BLOG_COLORS[id]
  return (
    <Link href={href}
      className={`group rounded-xl border bg-white dark:bg-gray-900 p-6 ${c.hover} hover:shadow-lg transition-all duration-200 text-left no-underline`}>
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-lg ${c.bg} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${c.text}`} />
        </div>
        <div>
          <h2 className="text-lg font-bold">{title}</h2>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed mb-3">{description}</p>
      <span className={`inline-flex items-center gap-1 text-sm font-medium ${c.text} group-hover:gap-2 transition-all`}>
        블로그 보기 <ArrowRight className="w-4 h-4" />
      </span>
    </Link>
  )
}
