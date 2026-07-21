'use client'

import { SideNav } from './side-nav'
import { MobileTabBar } from './mobile-tab-bar'

interface AppLayoutProps {
  children: React.ReactNode
  counts?: {
    devsnack?: number
    stockpulse?: number
    realestate?: number
    aitech?: number
  }
}

export function AppLayout({ children, counts }: AppLayoutProps) {
  return (
    <div className="flex min-h-screen">
      <SideNav counts={counts} />
      <main className="flex-1 min-w-0 pb-16 md:pb-0">
        {children}
      </main>
      <MobileTabBar />
    </div>
  )
}
