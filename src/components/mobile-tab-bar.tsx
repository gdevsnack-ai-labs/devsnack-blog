'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { House, FileText, FlaskConical, Telescope, Wrench, Info, ChevronUp } from 'lucide-react'

interface TabSubItem {
  href: string
  label: string
}

interface Tab {
  href: string
  label: string
  icon: any
  subItems?: TabSubItem[]
}

const TABS: Tab[] = [
  { href: '/', label: 'Home', icon: House },
  {
    href: '/devsnack',
    label: 'Blogs',
    icon: FileText,
    subItems: [
      { href: '/devsnack', label: 'DevSnack' },
      { href: '/stock',    label: 'StockPulse' },
      { href: '/aitech',   label: 'AI Tech' },
    ],
  },
  {
    href: '/lab',
    label: 'Lab',
    icon: FlaskConical,
    subItems: [
      { href: '/lab',    label: 'Lab' },
      { href: '/demos',  label: 'Demos' },
    ],
  },
  { href: '/research', label: 'Research', icon: Telescope },
  {
    href: '/misc',
    label: 'Tools',
    icon: Wrench,
    subItems: [
      { href: '/realestate', label: '부동산' },
      { href: '/misc',      label: '잡동사니' },
    ],
  },
  { href: '/about', label: 'About', icon: Info },
]

export function MobileTabBar() {
  const pathname = usePathname()
  const [openMenu, setOpenMenu] = useState<string | null>(null)

  const isActive = (href: string): boolean => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  const tabActive = (tab: Tab): boolean => {
    if (tab.subItems) return tab.subItems.some(s => isActive(s.href))
    return isActive(tab.href)
  }

  // 라우트 변경 시 서브메뉴 닫기
  useEffect(() => { setOpenMenu(null) }, [pathname])

  // 바깥 클릭 시 서브메뉴 닫기
  useEffect(() => {
    const close = () => setOpenMenu(null)
    window.addEventListener('click', close)
    return () => window.removeEventListener('click', close)
  }, [])

  const toggleMenu = (label: string) => {
    setOpenMenu(prev => (prev === label ? null : label))
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background md:hidden"
      onClick={e => e.stopPropagation()}
    >
      <div className="flex justify-between gap-1 px-1 py-1.5">
        {TABS.map(tab => {
          const active = tabActive(tab)
          const Icon = tab.icon
          const hasSub = !!tab.subItems
          const open = openMenu === tab.label

          const itemClass = `flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg no-underline transition-colors cursor-pointer ${
            active ? 'text-blue-600 dark:text-blue-400' : 'text-muted-foreground hover:text-foreground'
          }`

          return (
            <div key={tab.label} className="relative">
              {hasSub ? (
                <button
                  onClick={(e) => { e.stopPropagation(); toggleMenu(tab.label) }}
                  className={itemClass}
                  aria-expanded={open}
                  aria-haspopup="menu"
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-[10px] font-medium flex items-center gap-0.5">
                    {tab.label}
                    <ChevronUp className={`w-2.5 h-2.5 transition-transform ${open ? '' : 'rotate-180'}`} />
                  </span>
                </button>
              ) : (
                <Link href={tab.href} className={itemClass}>
                  <Icon className="w-5 h-5" />
                  <span className="text-[10px] font-medium">{tab.label}</span>
                </Link>
              )}

              {/* 서브메뉴 팝오버 — 탭 바로 위로 펼침 */}
              {hasSub && open && (
                <div
                  role="menu"
                  className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 min-w-[140px] bg-white dark:bg-gray-900 border border-border rounded-xl shadow-xl p-1.5 z-50"
                >
                  {tab.subItems!.map(sub => {
                    const subActive = isActive(sub.href)
                    return (
                      <Link
                        key={sub.href}
                        href={sub.href}
                        role="menuitem"
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm no-underline whitespace-nowrap ${
                          subActive
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium'
                            : 'text-foreground hover:bg-muted'
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
        })}
      </div>
    </nav>
  )
}