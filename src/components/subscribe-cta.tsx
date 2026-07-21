import { Rss, Video, BookOpen } from 'lucide-react'

const ITEMS = [
  { icon: Rss,      label: 'RSS Feed', href: '/rss.xml' },
  { icon: Video,    label: 'YouTube',  href: 'https://www.youtube.com/@devsnackailab' },
  { icon: BookOpen, label: 'GitHub',   href: 'https://github.com/gdevsnack-ai-labs' },
] as const

export function SubscribeCta() {
  return (
    <div className="border border-border rounded-xl p-6 md:p-8 bg-white dark:bg-gray-900 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div>
        <h3 className="text-lg font-bold mb-1">새로운 글과 영상을 놓치지 마세요!</h3>
        <p className="text-sm text-muted-foreground">RSS, YouTube, GitHub를 통해 DevSnack의 최신 업데이트를 받아보세요.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {ITEMS.map(({ icon: Icon, label, href }) => (
          <a
            key={label}
            href={href}
            target={href.startsWith('http') ? '_blank' : undefined}
            rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-white dark:bg-gray-950 text-sm font-medium hover:border-foreground/30 transition-colors no-underline"
          >
            <Icon className="w-4 h-4" />
            {label}
          </a>
        ))}
      </div>
    </div>
  )
}
