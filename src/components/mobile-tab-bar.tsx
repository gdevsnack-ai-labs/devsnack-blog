'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { House, FileText, FlaskConical, Video, Info } from 'lucide-react'

const TABS = [
  { href: '/',             label: 'Home',   icon: House },
  { href: '/devsnack',     label: 'Blogs',  icon: FileText },
  { href: '/lab',          label: 'Lab',    icon: FlaskConical },
  { href: '/links',        label: 'Links',  icon: Video },
  { href: '/about',        label: 'About',  icon: Info },
]

export function MobileTabBar() {
  const pathname = usePathname()

  const isActive = (href: string): boolean => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background md:hidden">
      <div className="flex justify-around py-1.5">
        {TABS.map((tab) => {
          const active = isActive(tab.href)
          const Icon = tab.icon
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg no-underline transition-colors ${
                active
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
