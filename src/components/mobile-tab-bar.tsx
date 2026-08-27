'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { House, FileText, FlaskConical, Telescope, Wrench, Server, Info, Play, Search, Link as LinkIcon, Rss, ChevronUp, Sun, Moon } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { MOBILE_NAV_GROUPS, SINGLE_NAV_ITEMS, type IconKey, type NavGroup } from '@/config/site-catalog'
import { getEnglishNavigationPath, getLanguageRoute } from '@/lib/i18n/english-pilot'
import { trackSiteEvent } from '@/lib/analytics'

const ICONS: Record<IconKey, LucideIcon> = {
  house: House,
  fileText: FileText,
  flask: FlaskConical,
  telescope: Telescope,
  wrench: Wrench,
  server: Server,
  play: Play,
  search: Search,
  info: Info,
  link: LinkIcon,
  rss: Rss,
}

export function MobileTabBar() {
  const pathname = usePathname()
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [dark, setDark] = useState(false)
  const home = SINGLE_NAV_ITEMS[0]
  const isEnglish = pathname === '/en' || pathname.startsWith('/en/')
  const localizedHref = (href: string): string => isEnglish ? getEnglishNavigationPath(href) : href

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDark(document.documentElement.classList.contains('dark'))
    }, 0)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => setOpenMenu(null), 0)
    return () => window.clearTimeout(timer)
  }, [pathname])

  useEffect(() => {
    const close = (event: MouseEvent) => {
      const target = event.target
      if (target instanceof Element && target.closest('[data-mobile-nav]')) return
      setOpenMenu(null)
    }
    window.addEventListener('click', close)
    return () => window.removeEventListener('click', close)
  }, [])

  const isActive = (href: string, activeHrefs: string[] = []): boolean => {
    const prefixes = [href, ...activeHrefs]
    return prefixes.some(prefix => {
      if (prefix === '/' && pathname === '/') return true
      if (prefix !== '/' && pathname.startsWith(prefix)) return true
      if (!isEnglish) return false
      const englishPath = getLanguageRoute(prefix)?.englishPath
      if (!englishPath) return false
      return englishPath === '/en' ? pathname === '/en' : pathname.startsWith(englishPath)
    })
  }

  const groupActive = (group: NavGroup) => group.items.some(item => isActive(item.href, item.activeHrefs))

  const toggleTheme = () => {
    const next = !document.documentElement.classList.contains('dark')
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('theme', next ? 'dark' : 'light')
    setDark(next)
  }

  const tabs = [
    { id: 'home', label: home.label, href: localizedHref(home.href), icon: home.icon, group: null },
    ...MOBILE_NAV_GROUPS.map(group => ({ id: group.id, label: group.label, href: localizedHref(group.items[0]?.href || '/'), icon: group.icon, group })),
  ]

  return (
    <nav
      className="fixed bottom-0 left-0 z-[60] w-[100vw] border-t border-border bg-background md:hidden"
      data-mobile-nav
      aria-label="모바일 주 메뉴"
      onClick={e => e.stopPropagation()}
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="grid grid-cols-6 items-stretch gap-0 px-1 py-1.5">
        {tabs.map(tab => {
          const Icon = tab.icon ? ICONS[tab.icon] : House
          const active = tab.group ? groupActive(tab.group) : isActive(tab.href)
          const open = openMenu === tab.id
          const hasSub = !!tab.group
          const itemClass = `flex w-full min-w-0 flex-col items-center justify-center gap-0.5 px-1 py-1 rounded-lg no-underline transition-colors cursor-pointer ${
            active ? 'text-blue-600 dark:text-blue-400' : 'text-muted-foreground hover:text-foreground'
          }`

          return (
            <div key={tab.id} className="relative min-w-0 w-full">
              {hasSub ? (
                <button
                  type="button"
                  onClick={e => {
                    e.stopPropagation()
                    trackSiteEvent('nav_group_toggle', { location: 'mobile', group: tab.id })
                    setOpenMenu(prev => prev === tab.id ? null : tab.id)
                  }}
                  className={itemClass}
                  aria-expanded={open}
                  aria-haspopup="menu"
                  aria-label={`${tab.label} 메뉴`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-[10px] font-medium flex items-center gap-0.5 whitespace-nowrap">
                    {tab.label}
                    <ChevronUp className={`w-2.5 h-2.5 transition-transform ${open ? '' : 'rotate-180'}`} />
                  </span>
                </button>
              ) : (
                <Link href={tab.href} className={itemClass}>
                  <Icon className="w-5 h-5" />
                  <span className="text-[10px] font-medium whitespace-nowrap">{tab.label}</span>
                </Link>
              )}

              {hasSub && open && (
                <div
                  role="menu"
                  aria-label={`${tab.label} 하위 메뉴`}
                  className={`absolute bottom-full mb-1.5 min-w-[148px] max-w-[calc(100vw-16px)] bg-white dark:bg-gray-900 border border-border rounded-xl shadow-xl p-1.5 z-50 ${
                    tab.id === 'more' ? 'right-0 left-auto translate-x-0' : 'left-1/2 -translate-x-1/2'
                  }`}
                >
                  {tab.group!.items.map(item => {
                    const itemActive = isActive(item.href, item.activeHrefs)
                    return (
                      <Link
                        key={item.id}
                        href={localizedHref(item.href)}
                        role="menuitem"
                        className={`block px-3 py-2 rounded-lg text-sm no-underline whitespace-nowrap ${
                          itemActive
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium'
                            : 'text-foreground hover:bg-muted'
                        }`}
                      >
                        {item.label}
                      </Link>
                    )
                  })}
                  {tab.id === 'more' && (
                    <button
                      type="button"
                      role="menuitem"
                      onClick={toggleTheme}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-foreground hover:bg-muted text-left"
                    >
                      {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                      {dark ? '라이트 테마' : '다크 테마'}
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </nav>
  )
}
