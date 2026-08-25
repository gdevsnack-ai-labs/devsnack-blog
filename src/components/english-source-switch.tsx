import { LanguageSwitch } from '@/components/language-switch'
import { getPublishedEnglishTranslation } from '@/lib/translation'

export async function EnglishSourceSwitch({ postId, englishHref, koreanHref }: { postId: number; englishHref: string; koreanHref: string }) {
  const translation = await getPublishedEnglishTranslation(postId)
  if (!translation) return null
  return <LanguageSwitch englishHref={englishHref} koreanHref={koreanHref} />
}
