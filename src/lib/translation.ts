import { supabase, type Post } from '@/lib/supabase'
import {
  effectiveTranslationStatus,
  type PostTranslation,
  type TranslationStatus,
} from './translation-core'

export * from './translation-core'

export async function getLivePost(blogId: string, slug: string): Promise<Post | null> {
  const { data } = await supabase
    .from('posts')
    .select('*')
    .eq('blog_id', blogId)
    .eq('slug', slug)
    .eq('status', 'live')
    .maybeSingle()
  return (data as Post | null) || null
}

export async function getPublishedEnglishTranslation(postId: number): Promise<PostTranslation | null> {
  const { data } = await supabase
    .from('post_translations')
    .select('*')
    .eq('post_id', postId)
    .eq('locale', 'en')
    .eq('translation_status', 'published')
    .maybeSingle()
  return (data as PostTranslation | null) || null
}

export async function getEnglishPost(blogId: string, slug: string): Promise<{ source: Post; translation: PostTranslation; status: TranslationStatus } | null> {
  const source = await getLivePost(blogId, slug)
  if (!source) return null
  const translation = await getPublishedEnglishTranslation(source.id)
  if (!translation) return null
  return { source, translation, status: effectiveTranslationStatus(translation, source) }
}
