'use client'

import { useCallback, useSyncExternalStore } from 'react'
import { Sun, Moon } from 'lucide-react'

function subscribeToTheme(onStoreChange: () => void) {
  const observer = new MutationObserver(onStoreChange)
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
  })
  return () => observer.disconnect()
}

function getThemeSnapshot() {
  return document.documentElement.classList.contains('dark')
}

function getServerThemeSnapshot() {
  return false
}

export function ThemeToggle() {
  const dark = useSyncExternalStore(
    subscribeToTheme,
    getThemeSnapshot,
    getServerThemeSnapshot,
  )

  const toggle = useCallback(() => {
    const next = !document.documentElement.classList.contains('dark')
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('theme', next ? 'dark' : 'light')
  }, [])

  return (
    <button
      onClick={toggle}
      className="p-1 rounded-lg hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors cursor-pointer"
      title={dark ? '라이트 모드로 전환' : '다크 모드로 전환'}
    >
      {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  )
}
