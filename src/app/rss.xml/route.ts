import { supabase } from '@/lib/supabase'

const SITE_URL = 'https://devsnack-blog.vercel.app'

const BLOG_NAMES: Record<string, string> = {
  devsnack: 'DevSnack Blog — 개발자의 시선으로 보는 AI',
  stockpulse: 'StockPulse AI Lab — AI가 분석하는 주식 시장',
  realestate: '부동산 실거래 — AI가 분석하는 아파트 실거래가 동향',
}

export async function GET() {
  const { data: posts } = await supabase
    .from('posts')
    .select('slug, title, excerpt, blog_id, published, updated, cover_image')
    .eq('status', 'live')
    .order('published', { ascending: false })
    .limit(50)

  const items = (posts ?? []).map((post) => {
    const blogPath = post.blog_id === 'stockpulse' ? 'stock'
      : post.blog_id === 'realestate' ? 'realestate'
      : 'devsnack'
    const url = `${SITE_URL}/${blogPath}/${post.slug}`
    const pubDate = post.published
      ? new Date(post.published).toUTCString()
      : new Date(post.updated).toUTCString()

    return `    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description><![CDATA[${post.excerpt || post.title}]]></description>
      <pubDate>${pubDate}</pubDate>
      <category>${post.blog_id}</category>
      ${post.cover_image ? `<enclosure url="${post.cover_image}" type="image/jpeg" />` : ''}
    </item>`
  }).join('\n')

  const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>DevSnack Blog</title>
    <link>${SITE_URL}</link>
    <description>4개 블로그 통합 RSS — DevSnack · StockPulse · 부동산 실거래 · AI Tech</description>
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
