import { EnglishLanguageMarker } from '@/components/english-language-marker'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  robots: { index: false, follow: true },
}

export default function EnglishLayout({ children }: { children: React.ReactNode }) {
  return <><EnglishLanguageMarker />{children}</>
}
