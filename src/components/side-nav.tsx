'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  House, FileText, FlaskConical, Video, Info, Telescope,
  ChevronLeft, ChevronDown, Search, Play, Wrench,
} from 'lucide-react'

interface SideNavCounts {
  devsnack?: number
  stockpulse?: number
  realestate?: number
  aitech?: number
}

interface NavItem {
  href: string
  label: string
  icon?: any
  blogId?: keyof SideNavCounts
  subItems?: { href: string; label: string }[]
}

interface NavGroup {
  label: string
  icon?: any
  items: NavItem[]
}

// ── 단독 메뉴 (그룹 밖) ──
const SINGLE_ITEMS: NavItem[] = [
  { href: '/', label: 'Home', icon: House },
  { href: '/lab', label: 'Lab', icon: FlaskConical },
  { href: '/links', label: 'Links', icon: Video },
  { href: '/about', label: 'About', icon: Info },
]

// ── 그룹 메뉴 (펼침/접힘) ──
const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Blogs',
    icon: FileText,
    items: [
      { href: '/devsnack', label: 'DevSnack', blogId: 'devsnack' },
      { href: '/stock',    label: 'StockPulse', blogId: 'stockpulse' },
      { href: '/aitech',   label: 'AI Tech', blogId: 'aitech' },
    ],
  },
  {
    label: 'Tools',
    icon: Wrench,
    items: [
      { href: '/realestate', label: '부동산', blogId: 'realestate' },
      { href: '/misc',      label: '잡동사니', icon: Wrench },
    ],
  },
]

// ── Demos (단독 + 서브메뉴) ──
const DEMOS_ITEM: NavItem = {
  href: '/demos',
  label: 'Demos',
  icon: Play,
  subItems: [
    { href: '/demos/html',  label: 'HTML' },
    { href: '/demos/music', label: 'Music' },
    { href: '/demos/image', label: 'Image' },
    { href: '/demos/shortmovie', label: 'Short Movie' },
  ],
}

// ── Research (단독 + 카테고리 서브메뉴) — 전체 / 세부 카테고리 ──
const RESEARCH_ITEM: NavItem = {
  href: '/research',
  label: 'Research',
  icon: Telescope,
  subItems: [
    { href: '/research',                    label: '전체' },
    { href: '/research/category/llm',       label: '🤖 LLM/모델' },
    { href: '/research/category/tts',       label: '🎙️ TTS' },
    { href: '/research/category/media',     label: '🎨 미디어' },
    { href: '/research/category/benchmark', label: '📊 벤치마크' },
    { href: '/research/category/hardware',  label: '🖥️ 하드웨어' },
  ],
}

export function SideNav({ counts }: { counts?: SideNavCounts }) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({})
  const [userToggled, setUserToggled] = useState<Record<string, boolean>>({})

  const isActive = (href: string): boolean => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  const toggleGroup = (label: string) => {
    setUserToggled(prev => ({ ...prev, [label]: true }))
    setOpenGroups(prev => ({ ...prev, [label]: !prev[label] }))
  }

  const groupOpen = (group: NavGroup): boolean => {
    // 사용자가 직접 토글한 적 있으면 수동 상태 우선
    if (userToggled[group.label]) return !!openGroups[group.label]
    // 하위 항목이 활성화되어 있으면 자동 펼침
    if (group.items.some(item => isActive(item.href))) return true
    if (group.label === 'Demos' && DEMOS_ITEM.subItems?.some(s => isActive(s.href))) return true
    if (group.label === 'Research' && RESEARCH_ITEM.subItems?.some(s => isActive(s.href))) return true
    return false
  }

  const renderSubItems = (subItems: { href: string; label: string }[]) => (
    <div className="ml-4 mt-1 space-y-0.5 border-l border-border pl-2">
      {subItems.map(sub => {
        const subActive = isActive(sub.href)
        return (
          <Link
            key={sub.href}
            href={sub.href}
            className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs no-underline transition-colors ${
              subActive
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium'
                : 'text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
            }`}
          >
            {sub.label}
          </Link>
        )
      })}
    </div>
  )

  const renderGroup = (group: NavGroup) => {
    const open = groupOpen(group)
    const anyActive = group.items.some(item => isActive(item.href))
    const Icon = group.icon

    return (
      <div key={group.label}>
        {/* 그룹 헤더 — 클릭 시 펼침/접힘 */}
        <button
          onClick={() => toggleGroup(group.label)}
          className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm no-underline transition-colors cursor-pointer ${
            anyActive
              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium'
              : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
          } ${collapsed ? 'justify-center' : ''}`}
          title={collapsed ? group.label : undefined}
        >
          {Icon && <Icon className="w-4 h-4 shrink-0" />}
          {!collapsed && (
            <>
              <span className="flex-1 truncate text-left">{group.label}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
            </>
          )}
        </button>

        {/* 그룹 항목 */}
        {!collapsed && open && (
          <div className="ml-2 mt-1 space-y-0.5 border-l border-border pl-2">
            {group.items.map(item => {
              const active = isActive(item.href)
              const ItemIcon = item.icon
              const count = item.blogId ? counts?.[item.blogId] : undefined
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm no-underline transition-colors ${
                    active
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium'
                      : 'text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                  }`}
                >
                  {ItemIcon && <ItemIcon className="w-4 h-4 shrink-0" />}
                  <span className="flex-1 truncate">{item.label}</span>
                  {count !== undefined && (
                    <span className="text-xs text-muted-foreground/60">{count}</span>
                  )}
                </Link>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  const renderSingle = (item: NavItem) => {
    const active = isActive(item.href)
    const Icon = item.icon
    const isHome = item.href === '/'

    return (
      <Link
        key={item.href}
        href={item.href}
        className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm no-underline transition-colors ${
          active
            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium'
            : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
        } ${collapsed ? 'justify-center' : ''}`}
        title={collapsed ? item.label : undefined}
      >
        {Icon && <Icon className={`w-4 h-4 shrink-0 ${isHome && active ? 'text-blue-600 dark:text-blue-400' : ''}`} />}
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
        {SINGLE_ITEMS.map(renderSingle)}

        {/* 그룹 메뉴 */}
        <div className="pt-2 space-y-1">
          {NAV_GROUPS.map(renderGroup)}

          {/* Demos — 단독 + 서브메뉴 */}
          <div key="demos">
            <Link
              href={DEMOS_ITEM.href}
              onClick={() => toggleGroup('Demos')}
              className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm no-underline transition-colors ${
                isActive(DEMOS_ITEM.href) || DEMOS_ITEM.subItems?.some(s => isActive(s.href))
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              } ${collapsed ? 'justify-center' : ''}`}
              title={collapsed ? DEMOS_ITEM.label : undefined}
            >
              {DEMOS_ITEM.icon && <DEMOS_ITEM.icon className="w-4 h-4 shrink-0" />}
              {!collapsed && (
                <>
                  <span className="flex-1 truncate">{DEMOS_ITEM.label}</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${groupOpen({ label: 'Demos', items: [] }) ? 'rotate-180' : ''}`} />
                </>
              )}
            </Link>
            {!collapsed && groupOpen({ label: 'Demos', items: [] }) && DEMOS_ITEM.subItems && (
              renderSubItems(DEMOS_ITEM.subItems)
            )}
          </div>

          {/* Research — 단독 + 카테고리 서브메뉴 */}
          <div key="research">
            <Link
              href={RESEARCH_ITEM.href}
              onClick={() => toggleGroup('Research')}
              className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm no-underline transition-colors ${
                isActive(RESEARCH_ITEM.href) || RESEARCH_ITEM.subItems?.some(s => isActive(s.href))
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              } ${collapsed ? 'justify-center' : ''}`}
              title={collapsed ? RESEARCH_ITEM.label : undefined}
            >
              {RESEARCH_ITEM.icon && <RESEARCH_ITEM.icon className="w-4 h-4 shrink-0" />}
              {!collapsed && (
                <>
                  <span className="flex-1 truncate">{RESEARCH_ITEM.label}</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${groupOpen({ label: 'Research', items: [] }) ? 'rotate-180' : ''}`} />
                </>
              )}
            </Link>
            {!collapsed && groupOpen({ label: 'Research', items: [] }) && RESEARCH_ITEM.subItems && (
              renderSubItems(RESEARCH_ITEM.subItems)
            )}
          </div>
        </div>
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