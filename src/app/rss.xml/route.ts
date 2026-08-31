import { supabase } from '@/lib/supabase'
import { destinationLabel, postHref } from '@/config/site-catalog'
import { publicFeedOrFilter } from '@/lib/ia/feed-lifecycle'
import { isRssEligiblePost } from '@/lib/seo/rss-policy'

const SITE_URL = 'https://devsnack-blog.vercel.app'

export async function GET() {
  const { data: posts } = await supabase
    .from('posts')
    .select('slug, title, excerpt, blog_id, published, updated, cover_image')
    .eq('status', 'live')
    .or(publicFeedOrFilter())
    .order('published', { ascending: false })
    .limit(50)

  const items = (posts ?? []).flatMap((post) => {
    if (!isRssEligiblePost(post)) return []
    const urlPath = postHref(post.blog_id, post.slug)
    if (!urlPath) {
      console.error(`[rss] 알 수 없는 blog_id: ${post.blog_id}`)
      return []
    }
    const url = `${SITE_URL}${urlPath}`
    const pubDate = post.published
      ? new Date(post.published).toUTCString()
      : new Date(post.updated).toUTCString()

    return [`    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description><![CDATA[${post.excerpt || post.title}]]></description>
      <pubDate>${pubDate}</pubDate>
      <category>${destinationLabel(post.blog_id)}</category>
      ${post.cover_image ? `<enclosure url="${post.cover_image}" type="image/jpeg" />` : ''}
    </item>`]
  }).join('')

  const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>DevSnack Blog</title>
    <link>${SITE_URL}</link>
    <description>DevSnack의 블로그·실험·리서치·도구 콘텐츠 통합 RSS</description>
    <language>ko</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml"/>
    <image>
      <url>${SITE_URL}/favicon.ico</url>
      <title>DevSnack Blog</title>
      <link>${SITE_URL}</link>
    </image>
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
