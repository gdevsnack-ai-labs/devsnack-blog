'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { getLanguageRoute } from '@/lib/i18n/english-pilot'

function rememberLanguage(locale: 'ko' | 'en') {
  document.cookie = `devsnack-language=${locale}; Max-Age=31536000; Path=/; SameSite=Lax`
  window.localStorage.setItem('devsnack-language-preference', locale)
}

type LanguageSwitchProps = {
  englishHref?: string
  koreanHref?: string
}

export function LanguageSwitch({ englishHref: explicitEnglishHref, koreanHref: explicitKoreanHref }: LanguageSwitchProps = {}) {
  const pathname = usePathname()
  const route = getLanguageRoute(pathname)
  const englishHref = explicitEnglishHref || route?.englishPath
  const koreanHref = explicitKoreanHref || route?.koreanPath

  if (!englishHref || !koreanHref) return null

  const isEnglish = pathname === englishHref || pathname.startsWith(`${englishHref}/`)

  return (
    <nav aria-label="Language" className="inline-flex items-center gap-1 rounded-full border border-border bg-background/80 p-1 text-xs shadow-sm backdrop-blur">
      <Link
        href={koreanHref}
        onClick={() => rememberLanguage('ko')}
        aria-current={!isEnglish ? 'page' : undefined}
        className={`rounded-full px-2.5 py-1 no-underline transition-colors ${!isEnglish ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`}
      >
        한국어
      </Link>
      <Link
        href={englishHref}
        onClick={() => rememberLanguage('en')}
        aria-current={isEnglish ? 'page' : undefined}
        className={`rounded-full px-2.5 py-1 no-underline transition-colors ${isEnglish ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`}
      >
        English
      </Link>
    </nav>
  )
}
