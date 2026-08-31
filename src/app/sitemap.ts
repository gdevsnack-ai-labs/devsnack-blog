import { supabase } from '@/lib/supabase'
import type { MetadataRoute } from 'next'
import { postHref } from '@/config/site-catalog'
import { isIndexableSitemapRoute } from '@/lib/seo/sitemap-policy'
import { SITE_URL } from '@/lib/seo/metadata'
import { publicFeedOrFilter } from '@/lib/ia/feed-lifecycle'
import { isIndexablePostSitemapEntry } from '@/lib/seo/search-policy'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { data: posts } = await supabase
    .from('posts')
    .select('id,slug,blog_id,updated,title,content,excerpt,seo_desc,labels,status,lifecycle_status')
    .eq('status', 'live')
    .or(publicFeedOrFilter())
    .order('updated', { ascending: false })

  const blogEntries = (posts ?? []).flatMap((post) => {
    const path = postHref(post.blog_id, post.slug)
    if (!path) {
      console.error(`[sitemap] 알 수 없는 blog_id: ${post.blog_id}`)
      return []
    }
    if (!isIndexablePostSitemapEntry(post)) return []
    return [{
      url: `${SITE_URL}${path}`,
      lastModified: post.updated ? new Date(post.updated) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }]
  })

  const baseUrl = SITE_URL
  const staticEntries: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${baseUrl}/devsnack`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/stock`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/aitech`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/labs`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.85 },
    { url: `${baseUrl}/labs/autonomous-ai-blog`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/labs/stockpulse-ai-self-improvement`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/benchmarks`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.85 },
    { url: `${baseUrl}/data`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.85 },
    { url: `${baseUrl}/demos`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/demos/html`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.75 },
    { url: `${baseUrl}/research`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },

    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/privacy`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${baseUrl}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
  ]

  const indexableStaticEntries = staticEntries.filter(entry => isIndexableSitemapRoute(new URL(entry.url).pathname))
  return [...indexableStaticEntries, ...blogEntries]
}
