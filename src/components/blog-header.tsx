import Link from 'next/link'
import { Search, Terminal, TrendingUp, Bot } from 'lucide-react'

export function BlogHeader({ title, subtitle, icon, color, homeHref = '/', searchHref = '/search' }: {
  title: string
  subtitle: string
  icon: 'terminal' | 'trending' | 'aitech'
  color: 'blue' | 'green' | 'orange' | 'purple'
  homeHref?: string
  searchHref?: string | null
}) {
  return (
    <header data-header-color={color} className="border-b bg-white dark:bg-gray-950 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {icon === 'terminal' && <Terminal className="w-5 h-5 text-blue-600" />}
          {icon === 'trending' && <TrendingUp className="w-5 h-5 text-green-600" />}

          {icon === 'aitech' && <Bot className="w-5 h-5 text-purple-500" />}
          <div>
            <Link href={homeHref} className="no-underline">
              <h1 title={subtitle} className="text-lg font-bold tracking-tight">{title}</h1>
            </Link>
          </div>
        </div>

        {searchHref && <Link href={searchHref} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors no-underline">
          <Search className="w-5 h-5" />
        </Link>}
      </div>
    </header>
  )
}
