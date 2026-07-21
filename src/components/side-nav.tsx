'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  House, FileText, FlaskConical, Video, Info,
  ChevronLeft, Search,
} from 'lucide-react'

interface SideNavCounts {
  devsnack?: number
  stockpulse?: number
  realestate?: number
  aitech?: number
}

const NAV_ITEMS = [
  { href: '/',         label: 'Home',     icon: House },
  { href: '/devsnack', label: 'DevSnack', icon: FileText, blogId: 'devsnack' as const },
  { href: '/stock',    label: 'StockPulse', icon: FileText, blogId: 'stockpulse' as const },
  { href: '/realestate', label: '부동산',  icon: FileText, blogId: 'realestate' as const },
  { href: '/aitech',   label: 'AI Tech',  icon: FileText, blogId: 'aitech' as const },
  { href: '/lab',      label: 'Lab',      icon: FlaskConical },
  { href: '/links',    label: 'Links',    icon: Video },
  { href: '/about',    label: 'About',    icon: Info },
]

export function SideNav({ counts }: { counts?: SideNavCounts }) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  const isActive = (href: string): boolean => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <aside
      className={`hidden md:flex flex-col border-r border-border bg-sidebar text-sidebar-foreground transition-all duration-200 ${
        collapsed ? 'w-16' : 'w-56'
      } shrink-0`}
    >
      {/* 로고 */}
      <div className={`flex items-center border-b border-border px-3 py-3 ${collapsed ? 'justify-center' : 'justify-between'}`}>
        {!collapsed && (
          <Link href="/" className="no-underline">
            <span className="text-sm font-bold">🧪 Lab</span>
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded-lg hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
          title={collapsed ? '펼치기' : '접기'}
        >
          <ChevronLeft className={`w-4 h-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* 네비게이션 */}
      <nav className="flex-1 px-2 py-3 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href)
          const Icon = item.icon
          const count = item.blogId ? counts?.[item.blogId] : undefined
          const isLab = item.href === '/lab'

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm no-underline transition-colors ${
                active
                  ? isLab
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium'
                    : 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              } ${collapsed ? 'justify-center' : ''}`}
              title={collapsed ? item.label : undefined}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isLab && active ? 'text-blue-600 dark:text-blue-400' : ''}`} />
              {!collapsed && (
                <>
                  <span className="flex-1 truncate">{item.label}</span>
                  {count !== undefined && (
                    <span className="text-xs text-muted-foreground/60">{count}</span>
                  )}
                </>
              )}
            </Link>
          )
        })}
      </nav>

      {/* 하단 검색 */}
      <div className="border-t border-border px-2 py-3">
        <Link
          href="/search"
          className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground no-underline transition-colors ${
            collapsed ? 'justify-center' : ''
          }`}
          title="검색"
        >
          <Search className="w-4 h-4 shrink-0" />
          {!collapsed && <span>검색</span>}
        </Link>
      </div>
    </aside>
  )
}
