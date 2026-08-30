import type { MetadataRoute } from 'next'

const SITE_URL = 'https://devsnack-blog.vercel.app'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin/',
        '/api/ingest',
        '/api/ops/',
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
