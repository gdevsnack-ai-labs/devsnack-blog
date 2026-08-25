import { supabase } from '@/lib/supabase'

const SITE_URL = 'https://devsnack-blog.vercel.app'

function englishPostHref(blogId: string, slug: string): string | null {
  if (blogId === 'devsnack') return `/en/devsnack/${slug}`
  if (blogId === 'lab') return `/en/lab/${slug}`
  if (blogId === 'research') return `/en/research/${slug}`
  return null
}

function cdata(value: string): string {
  return value.replace(/]]>/g, ']]]]><![CDATA[>')
}

function xml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')
}

export const revalidate = 3600

export async function GET() {
  const { data: translations } = await supabase
    .from('post_translations')
    .select('post_id,title,excerpt,updated,translation_status')
    .eq('locale', 'en')
    .eq('translation_status', 'published')
    .order('updated', { ascending: false })
    .limit(50)

  const postIds = (translations ?? []).map(row => row.post_id)
  const { data: posts } = postIds.length
    ? await supabase.from('posts').select('id,slug,blog_id,published,updated,cover_image').in('id', postIds).eq('status', 'live')
    : { data: [] }
  const postById = new Map((posts ?? []).map(post => [post.id, post]))

  const items = (translations ?? []).flatMap(translation => {
    const post = postById.get(translation.post_id)
    const path = post ? englishPostHref(post.blog_id, post.slug) : null
    if (!post || !path) return []
    const url = `${SITE_URL}${path}`
    const pubDate = post.published
      ? new Date(post.published).toUTCString()
      : new Date(post.updated).toUTCString()
    return [`    <item>
      <title><![CDATA[${cdata(translation.title)}]]></title>
      <link>${xml(url)}</link>
      <guid isPermaLink="true">${xml(url)}</guid>
      <description><![CDATA[${cdata(translation.excerpt || translation.title)}]]></description>
      <pubDate>${pubDate}</pubDate>
      <category>English Content Experiment</category>
      ${post.cover_image ? `<enclosure url="${xml(post.cover_image)}" type="image/jpeg" />` : ''}
    </item>`]
  }).join('')

  const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>DevSnack Blog — English Content Experiment</title>
    <link>${SITE_URL}/en</link>
    <description>DevSnack English pilot: original Stories, Lab Notes, Benchmarks, and Knowledge.</description>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${SITE_URL}/en/rss.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`

  return new Response(feed, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
