import type { Metadata } from 'next'

export const SITE_URL = 'https://devsnack-blog.vercel.app'

export type RouteMetadataKind = 'website' | 'article'

export interface RouteMetadataInput {
  title: string
  description: string
  canonicalPath: string
  kind?: RouteMetadataKind
  image?: string | null
  publishedTime?: string | null
  modifiedTime?: string | null
}

export function absoluteSiteUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${SITE_URL}${normalized}`
}

export function buildRouteMetadata({
  title,
  description,
  canonicalPath,
  kind = 'website',
  image,
  publishedTime,
  modifiedTime,
}: RouteMetadataInput): Metadata {
  const canonical = absoluteSiteUrl(canonicalPath)
  const openGraph = {
    type: kind,
    locale: 'ko_KR',
    url: canonical,
    title,
    description,
    siteName: 'DevSnack Blog',
    ...(publishedTime ? { publishedTime } : {}),
    ...(modifiedTime ? { modifiedTime } : {}),
    ...(image ? { images: [image] } : {}),
  }

  return {
    title,
    description,
    alternates: { canonical },
    robots: { index: true, follow: true },
    openGraph,
    twitter: {
      card: image ? 'summary_large_image' : 'summary',
      title,
      description,
      ...(image ? { images: [image] } : {}),
    },
  }
}

const SOURCE_HEADING = /(?:출처|참고문헌|참고 자료|sources?|references?)/i
const HEADING_BOUNDARY = /(?:<h[1-6]\b|^#{1,6}\s+)/gim
const URL_PATTERN = /https?:\/\/[^\s<>)\]"']+/g
const HREF_PATTERN = /href\s*=\s*["'](https?:\/\/[^"']+)["']/gi

function trimUrl(value: string): string {
  return value.replace(/[),.;]+$/g, '')
}

export function extractSourceUrls(content: string): string[] {
  const htmlHeading = Array.from(content.matchAll(/<h[1-6][^>]*>\s*([^<]+?)\s*<\/h[1-6]>/gi))
    .find(match => SOURCE_HEADING.test(match[1]))
  const markdownHeading = Array.from(content.matchAll(/^#{1,6}\s+(.+)$/gim))
    .find(match => SOURCE_HEADING.test(match[1]))
  const headingMatch = htmlHeading || markdownHeading
  if (!headingMatch || headingMatch.index === undefined) return []

  const start = headingMatch.index + headingMatch[0].length
  const remainder = content.slice(start)
  HEADING_BOUNDARY.lastIndex = 0
  const boundary = HEADING_BOUNDARY.exec(remainder)
  const section = remainder.slice(0, boundary?.index ?? remainder.length)
  const values = [
    ...Array.from(section.matchAll(HREF_PATTERN), match => match[1]),
    ...Array.from(section.matchAll(URL_PATTERN), match => trimUrl(match[0])),
  ]

  return Array.from(new Set(values.map(trimUrl).filter(Boolean)))
}

export interface ResearchJsonLdInput {
  title: string
  description: string
  canonical: string
  categoryLabel: string
  content: string
  keywords?: string
  published?: string | null
  updated?: string | null
}

export function buildResearchJsonLd({
  title,
  description,
  canonical,
  categoryLabel,
  content,
  keywords,
  published,
  updated,
}: ResearchJsonLdInput): Record<string, unknown> {
  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: title,
    description,
    url: canonical,
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
    inLanguage: 'ko-KR',
    isAccessibleForFree: true,
    articleSection: categoryLabel,
    author: { '@type': 'Organization', name: 'DevSnack' },
    publisher: { '@type': 'Organization', name: 'DevSnack Blog', url: SITE_URL },
    ...(keywords ? { keywords } : {}),
  }
  if (published) jsonLd.datePublished = published
  if (updated) jsonLd.dateModified = updated

  const citations = extractSourceUrls(content)
  if (citations.length > 0) jsonLd.citation = citations

  return jsonLd
}

/**
 * Blogger content sometimes contains head-only tags from the source page.
 * They are not part of the visible article body and must not compete with
 * Next.js route metadata.
 */
export function stripImportedHeadArtifacts(content: string): string {
  return content
    .replace(/<head\b[^>]*>[\s\S]*?<\/head>/gi, '')
    .replace(/<title\b[^>]*>[\s\S]*?<\/title>/gi, '')
    .replace(/<meta\b[^>]*>/gi, '')
    .replace(/<link\b[^>]*>/gi, '')
    .replace(/<script\b(?=[^>]*\btype\s*=\s*["']application\/ld\+json["'])[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<\/?(?:html|body)\b[^>]*>/gi, '')
}
