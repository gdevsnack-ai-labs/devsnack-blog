'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

function rememberLanguage(locale: 'ko' | 'en') {
  document.cookie = `devsnack-language=${locale}; Max-Age=31536000; Path=/; SameSite=Lax`
  window.localStorage.setItem('devsnack-language-preference', locale)
}

export function LanguageSwitch({ englishHref, koreanHref }: { englishHref: string; koreanHref: string }) {
  const pathname = usePathname()
  const isEnglish = pathname.startsWith('/en/') || pathname === '/en'

  return (
    <nav aria-label="Language" className="inline-flex items-center gap-1 rounded-full border border-border bg-background/80 p-1 text-xs">
      <Link
        href={koreanHref}
        onClick={() => rememberLanguage('ko')}
        className={`rounded-full px-2.5 py-1 no-underline transition-colors ${!isEnglish ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`}
      >
        한국어
      </Link>
      <Link
        href={englishHref}
        onClick={() => rememberLanguage('en')}
        className={`rounded-full px-2.5 py-1 no-underline transition-colors ${isEnglish ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`}
      >
        English
      </Link>
    </nav>
  )
}
