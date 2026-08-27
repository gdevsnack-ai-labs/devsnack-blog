'use client'

import { usePathname } from 'next/navigation'
import { getLanguageRoute } from '@/lib/i18n/english-pilot'
import { LanguageSwitch } from './language-switch'

export function GlobalLanguageSwitch() {
  const pathname = usePathname()
  if (!getLanguageRoute(pathname)) return null

  return (
    <div className="mx-auto flex max-w-6xl justify-end px-3 py-3 md:px-5">
      <LanguageSwitch />
    </div>
  )
}
