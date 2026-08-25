import { supabase } from '@/lib/supabase'
import type { MetadataRoute } from 'next'
import { postHref } from '@/config/site-catalog'
import { isIndexableSitemapRoute } from '@/lib/seo/sitemap-policy'
import { absoluteSiteUrl, SITE_URL } from '@/lib/seo/metadata'
import { sourceContentHash } from '@/lib/translation-core'

export const dynamic = 'force-dynamic'

function englishPostHref(blogId: string, slug: string): string | null {
  if (blogId === 'devsnack') return `/en/devsnack/${slug}`
  if (blogId === 'lab') return `/en/lab/${slug}`
  if (blogId === 'research') return `/en/research/${slug}`
  return null
}

function localeAlternates(koreanPath: string, englishPath: string) {
  return {
    ko: absoluteSiteUrl(koreanPath),
    en: absoluteSiteUrl(englishPath),
    'x-default': absoluteSiteUrl(koreanPath),
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [{ data: posts }, { data: translations }] = await Promise.all([
    supabase
      .from('posts')
      .select('id,slug,blog_id,updated,title,content,excerpt,seo_desc,labels')
      .eq('status', 'live')
      .order('updated', { ascending: false }),
    supabase
      .from('post_translations')
      .select('post_id,locale,translation_status,source_content_hash')
      .eq('locale', 'en')
      .eq('translation_status', 'published'),
  ])

  const baseUrl = SITE_URL
  const translationByPost = new Map((translations ?? []).map(row => [row.post_id, row]))

  const blogEntries = (posts ?? []).flatMap((post) => {
    const koreanPath = postHref(post.blog_id, post.slug)
    if (!koreanPath) {
      console.error(`[sitemap] 알 수 없는 blog_id: ${post.blog_id}`)
      return []
    }
    const translation = translationByPost.get(post.id)
    const englishPath = translation ? englishPostHref(post.blog_id, post.slug) : null
    const translationIsFresh = !translation || translation.source_content_hash === sourceContentHash(post)
    const pair = englishPath && translationIsFresh
      ? { languages: localeAlternates(koreanPath, englishPath) }
      : undefined
    const koreanEntry: MetadataRoute.Sitemap[number] = {
      url: `${baseUrl}${koreanPath}`,
      lastModified: post.updated ? new Date(post.updated) : new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
      ...(pair ? { alternates: pair } : {}),
    }
    const englishEntry: MetadataRoute.Sitemap[number] | null = pair && englishPath
      ? {
          url: `${baseUrl}${englishPath}`,
          lastModified: post.updated ? new Date(post.updated) : new Date(),
          changeFrequency: 'weekly',
          priority: 0.65,
          alternates: pair,
        }
      : null
    return englishEntry ? [koreanEntry, englishEntry] : [koreanEntry]
  })

  const staticEntries: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${baseUrl}/devsnack`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/stock`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },

    { url: `${baseUrl}/aitech`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/labs`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.85 },
    {
      url: `${baseUrl}/labs/stockpulse-ai-self-improvement`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
      alternates: { languages: localeAlternates('/labs/stockpulse-ai-self-improvement', '/en/labs/stockpulse-ai-self-improvement') },
    },
    { url: `${baseUrl}/benchmarks`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.85, alternates: { languages: localeAlternates('/benchmarks', '/en/benchmarks') } },
    { url: `${baseUrl}/en`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.75 },
    { url: `${baseUrl}/en/labs/stockpulse-ai-self-improvement`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.75, alternates: { languages: localeAlternates('/labs/stockpulse-ai-self-improvement', '/en/labs/stockpulse-ai-self-improvement') } },
    { url: `${baseUrl}/en/benchmarks`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8, alternates: { languages: localeAlternates('/benchmarks', '/en/benchmarks') } },
    { url: `${baseUrl}/data`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.85 },
    { url: `${baseUrl}/lab`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/demos`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/research`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/misc`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.6 },

    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/privacy`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${baseUrl}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${baseUrl}/links`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
  ]

  const indexableStaticEntries = staticEntries.filter(entry => isIndexableSitemapRoute(new URL(entry.url).pathname))
  return [...indexableStaticEntries, ...blogEntries]
}
