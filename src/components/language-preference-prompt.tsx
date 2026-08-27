'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { getLanguageRoute } from '@/lib/i18n/english-pilot'

export function rememberLanguagePreference(locale: 'ko' | 'en') {
  document.cookie = `devsnack-language=${locale}; Max-Age=31536000; Path=/; SameSite=Lax`
  window.localStorage.setItem('devsnack-language-preference', locale)
}

export function LanguagePreferencePrompt() {
  const pathname = usePathname()
  const [visible, setVisible] = useState(false)
  const [englishHref, setEnglishHref] = useState<string | null>(null)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const route = getLanguageRoute(pathname)
      if (!route || route.koreanPath !== pathname) {
        setVisible(false)
        setEnglishHref(null)
        return
      }

      const saved = window.localStorage.getItem('devsnack-language-preference')
      const cookie = document.cookie.match(/(?:^|; )devsnack-language=([^;]+)/)?.[1]
      if (saved === 'ko' || saved === 'en' || cookie === 'ko' || cookie === 'en') {
        setVisible(false)
        setEnglishHref(null)
        return
      }

      const browserLanguage = window.navigator.language.toLowerCase()
      if (browserLanguage.startsWith('ko')) {
        rememberLanguagePreference('ko')
        setVisible(false)
        setEnglishHref(null)
        return
      }

      setEnglishHref(route.englishPath)
      setVisible(true)
    }, 0)
    return () => window.clearTimeout(timer)
  }, [pathname])

  if (!visible || !englishHref) return null

  return (
    <aside className="fixed inset-x-3 bottom-3 z-50 mx-auto flex max-w-xl flex-col gap-3 rounded-xl border border-blue-200 bg-white p-4 text-sm shadow-xl dark:border-blue-900 dark:bg-gray-900 sm:flex-row sm:items-center sm:justify-between" aria-label="Language preference">
      <p className="leading-relaxed text-muted-foreground">This page has an English pilot version. Choose a language for this visit.</p>
      <div className="flex shrink-0 gap-2">
        <Link href={englishHref} onClick={() => rememberLanguagePreference('en')} className="rounded-lg bg-blue-600 px-3 py-2 font-medium text-white no-underline hover:bg-blue-700">View English</Link>
        <button type="button" onClick={() => { rememberLanguagePreference('ko'); setVisible(false) }} className="rounded-lg border border-border px-3 py-2 text-foreground">한국어 유지</button>
      </div>
    </aside>
  )
}
