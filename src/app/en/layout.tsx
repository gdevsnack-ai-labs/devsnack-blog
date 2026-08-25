import { EnglishLanguageMarker } from '@/components/english-language-marker'

export default function EnglishLayout({ children }: { children: React.ReactNode }) {
  return <><EnglishLanguageMarker />{children}</>
}
