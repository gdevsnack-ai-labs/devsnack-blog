import { supabase } from '@/lib/supabase'
import type { MetadataRoute } from 'next'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { data: posts } = await supabase
    .from('posts')
    .select('slug, blog_id, updated')
    .eq('status', 'live')
    .order('updated', { ascending: false })

  const baseUrl = 'https://devsnack-blog.vercel.app'

  const blogEntries = (posts ?? []).flatMap((post) => {
    const blogPath = post.blog_id === 'stockpulse' ? 'stock' 
      : post.blog_id === 'realestate' ? 'realestate'
      : post.blog_id === 'aitech' ? 'aitech'
      : 'devsnack'
    return {
      url: `${baseUrl}/${blogPath}/${post.slug}`,
      lastModified: post.updated ? new Date(post.updated) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }
  })

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/devsnack`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/stock`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/realestate`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/aitech`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/links`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    ...blogEntries,
  ]
}
