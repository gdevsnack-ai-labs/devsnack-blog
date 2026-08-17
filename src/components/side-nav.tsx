'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  House, FileText, FlaskConical, Video, Info, Telescope, Wrench,
  ChevronLeft, ChevronDown, Search, Play,
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
  { href: '/demos',    label: 'Demos',    icon: Play, subItems: [
    { href: '/demos/html',  label: 'HTML' },
    { href: '/demos/music', label: 'Music' },
    { href: '/demos/image', label: 'Image' },
  ]},
  { href: '/research', label: 'Research', icon: Telescope },
  { href: '/misc',     label: '잡동사니', icon: Wrench },
  { href: '/links',    label: 'Links',    icon: Video },
  { href: '/about',    label: 'About',    icon: Info },
]

export function SideNav({ counts }: { counts?: SideNavCounts }) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [demosOpen, setDemosOpen] = useState(false)

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

          // Demos: 접혀 있으면 클릭 시 펼치고, 서브메뉴 표시
          if (item.subItems) {
            const subActive = item.subItems.some(s => isActive(s.href))
            const open = demosOpen || subActive
            return (
              <div key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setDemosOpen(!open)}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm no-underline transition-colors ${
                    active || subActive
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium'
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                  } ${collapsed ? 'justify-center' : ''}`}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="flex-1 truncate">{item.label}</span>
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
                    </>
                  )}
                </Link>

                {/* 서브메뉴 */}
                {!collapsed && open && (
                  <div className="ml-4 mt-1 space-y-0.5 border-l border-border pl-2">
                    {item.subItems.map(sub => {
                      const subActiveNow = isActive(sub.href)
                      return (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs no-underline transition-colors ${
                            subActiveNow
                              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium'
                              : 'text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                          }`}
                        >
                          {sub.label}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          }

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