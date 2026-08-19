'use client'

import { useState, useEffect, useCallback } from 'react'
import { Sun, Moon } from 'lucide-react'

export function ThemeToggle({ className = '' }: { className?: string }) {
  const [dark, setDark] = useState(false)

  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'))
  }, [])

  const toggle = useCallback(() => {
    const next = !document.documentElement.classList.contains('dark')
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('theme', next ? 'dark' : 'light')
    setDark(next)
  }, [])

  return (
    <button
      onClick={toggle}
      className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors cursor-pointer
        text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground
        ${className}`}
      title={dark ? '라이트 모드로 전환' : '다크 모드로 전환'}
    >
      {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      <span>{dark ? 'Light' : 'Dark'}</span>
    </button>
  )
}
