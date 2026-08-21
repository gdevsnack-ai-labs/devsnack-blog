'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  House, FileText, FlaskConical, Telescope, Wrench, Server,
  ChevronLeft, ChevronDown, Search, Info, Play, Link as LinkIcon, Rss,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { ThemeToggle } from './theme-toggle'
import { NAV_GROUPS, SINGLE_NAV_ITEMS, type IconKey, type NavGroup, type NavItem } from '@/config/site-catalog'
import { trackSiteEvent } from '@/lib/analytics'

interface SideNavCounts {
  devsnack?: number
  stockpulse?: number
  realestate?: number
  aitech?: number
}

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

export function SideNav({ counts }: { counts?: SideNavCounts }) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({})
  const [userToggled, setUserToggled] = useState<Record<string, boolean>>({})

  const isActive = (href: string, activeHrefs: string[] = []): boolean => {
    const prefixes = [href, ...activeHrefs]
    return prefixes.some(prefix => prefix === '/' ? pathname === '/' : pathname.startsWith(prefix))
  }

  const groupHasActiveItem = (group: NavGroup) => group.items.some(item => isActive(item.href, item.activeHrefs))

  const groupOpen = (group: NavGroup): boolean => {
    if (userToggled[group.id]) return !!openGroups[group.id]
    return groupHasActiveItem(group)
  }

  const toggleGroup = (id: string) => {
    trackSiteEvent('nav_group_toggle', { location: 'desktop', group: id })
    setUserToggled(prev => ({ ...prev, [id]: true }))
    setOpenGroups(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const renderSubItem = (item: NavItem) => {
    const active = isActive(item.href, item.activeHrefs)
    const ItemIcon = item.icon ? ICONS[item.icon] : null
    const countableBlogIds = new Set(['devsnack', 'stockpulse', 'realestate', 'aitech'])
    const count = item.blogId && countableBlogIds.has(item.blogId)
      ? counts?.[item.blogId as keyof SideNavCounts]
      : undefined

    return (
      <Link
        key={item.id}
        href={item.href}
        className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm no-underline transition-colors ${
          active
            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium'
            : 'text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
        }`}
      >
        {ItemIcon && <ItemIcon className="w-4 h-4 shrink-0" />}
        <span className="flex-1 truncate">{item.label}</span>
        {count !== undefined && <span className="text-xs text-muted-foreground/60">{count}</span>}
      </Link>
    )
  }

  const renderGroup = (group: NavGroup) => {
    const open = groupOpen(group)
    const active = groupHasActiveItem(group)
    const GroupIcon = ICONS[group.icon]

    return (
      <div key={group.id}>
        <button
          type="button"
          onClick={() => toggleGroup(group.id)}
          aria-expanded={open}
          aria-controls={`side-nav-${group.id}`}
          className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors cursor-pointer ${
            active
              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium'
              : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
          } ${collapsed ? 'justify-center' : ''}`}
          title={collapsed ? group.label : undefined}
        >
          <GroupIcon className="w-4 h-4 shrink-0" />
          {!collapsed && (
            <>
              <span className="flex-1 truncate text-left">{group.label}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
            </>
          )}
        </button>

        {!collapsed && open && (
          <div id={`side-nav-${group.id}`} className="ml-2 mt-1 space-y-0.5 border-l border-border pl-2">
            {group.items.map(renderSubItem)}
          </div>
        )}
      </div>
    )
  }

  const renderSingle = (item: NavItem) => {
    const active = isActive(item.href)
    const ItemIcon = item.icon ? ICONS[item.icon] : null

    return (
      <Link
        key={item.id}
        href={item.href}
        className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm no-underline transition-colors ${
          active
            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium'
            : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
        } ${collapsed ? 'justify-center' : ''}`}
        title={collapsed ? item.label : undefined}
      >
        {ItemIcon && <ItemIcon className="w-4 h-4 shrink-0" />}
        {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
      </Link>
    )
  }

  return (
    <aside
      className={`hidden md:flex flex-col border-r border-border bg-sidebar text-sidebar-foreground transition-all duration-200 ${
        collapsed ? 'w-16' : 'w-56'
      } shrink-0`}
    >
      <div className={`flex items-center border-b border-border px-3 py-3 ${collapsed ? 'justify-center' : 'justify-between'}`}>
        {!collapsed && (
          <Link href="/" className="no-underline">
            <span className="text-sm font-bold">🧪 Lab</span>
          </Link>
        )}
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 rounded-lg hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
            title={collapsed ? '펼치기' : '접기'}
            aria-label={collapsed ? '사이드바 펼치기' : '사이드바 접기'}
          >
            <ChevronLeft className={`w-4 h-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      <nav className="flex-1 px-2 py-3 space-y-1 overflow-y-auto" aria-label="주 메뉴">
        {SINGLE_NAV_ITEMS.map(renderSingle)}
        <div className="pt-2 space-y-1">
          {NAV_GROUPS.map(renderGroup)}
        </div>
      </nav>
    </aside>
  )
}
