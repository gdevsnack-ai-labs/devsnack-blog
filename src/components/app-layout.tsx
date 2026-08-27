'use client'

import { SideNav } from './side-nav'
import { MobileTabBar } from './mobile-tab-bar'
import { GlobalLanguageSwitch } from './global-language-switch'

interface AppLayoutProps {
  children: React.ReactNode
  counts?: {
    devsnack?: number
    stockpulse?: number

    aitech?: number
  }
}

export function AppLayout({ children, counts }: AppLayoutProps) {
  return (
    <div className="flex min-h-screen">
      <SideNav counts={counts} />
      <main className="flex-1 min-w-0 pb-16 md:pb-0">
        <GlobalLanguageSwitch />
        {children}
      </main>
      <MobileTabBar />
    </div>
  )
}
