// @ts-expect-error Node's strip-types runner requires the explicit extension.
import { absoluteSiteUrl, SITE_URL } from './site.ts'
// @ts-expect-error Node's strip-types runner requires the explicit extension.
import { robotsForSearchPolicy, searchPolicyForPath, type SearchPolicy } from './search-policy.ts'

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
}

export type SeoLanguage = 'ko' | 'en'
export type RouteMetadataKind = 'website' | 'article'

export interface RouteMetadataInput {
  title: string
  description: string
  canonicalPath: string
  kind?: RouteMetadataKind
  image?: string | null
  publishedTime?: string | null
  modifiedTime?: string | null
  language?: SeoLanguage
  koreanPath?: string
  englishPath?: string
  indexable?: boolean
  searchPolicy?: SearchPolicy
  section?: string
}

export function cleanMetaText(value: string | null | undefined, maxLength = 160): string {
  const normalized = decodeHtmlEntities(String(value || ''))
    .replace(/<br\s*\/?\s*>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (normalized.length <= maxLength) return normalized
  return `${normalized.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`
}

export function buildLocaleAlternates(koreanPath: string, englishPath: string) {
  const ko = absoluteSiteUrl(koreanPath)
  const en = absoluteSiteUrl(englishPath)
  return {
    canonical: ko,
    languages: {
      ko,
      en,
      'x-default': ko,
    },
  }
}

export function buildRouteMetadata({
  title,
  description,
  canonicalPath,
  kind = 'website',
  image,
  publishedTime,
  modifiedTime,
  language = 'ko',
  koreanPath,
  englishPath,
  indexable,
  searchPolicy,
  section,
}: RouteMetadataInput) {
  const canonical = absoluteSiteUrl(canonicalPath)
  const policy = searchPolicy ?? (indexable === false ? 'noindex' : searchPolicyForPath(canonicalPath))
  const cleanTitle = cleanMetaText(title, 75)
  const cleanDescription = cleanMetaText(description, 160)
  const openGraph = {
    type: kind,
    locale: language === 'en' ? 'en_US' : 'ko_KR',
    url: canonical,
    title: cleanTitle,
    description: cleanDescription,
    siteName: 'DevSnack Blog',
    ...(section ? { section } : {}),
    ...(publishedTime ? { publishedTime } : {}),
    ...(modifiedTime ? { modifiedTime } : {}),
    ...(image ? { images: [image] } : {}),
  }

  return {
    title: cleanTitle,
    description: cleanDescription,
    alternates: koreanPath && englishPath
      ? {
          canonical,
          languages: {
            ko: absoluteSiteUrl(koreanPath),
            en: absoluteSiteUrl(englishPath),
            'x-default': absoluteSiteUrl(koreanPath),
          },
        }
      : { canonical },
    robots: robotsForSearchPolicy(policy),
    openGraph,
    twitter: {
      card: image ? 'summary_large_image' : 'summary',
      title: cleanTitle,
      description: cleanDescription,
      ...(image ? { images: [image] } : {}),
    },
  }
}

export { SITE_URL, absoluteSiteUrl }

const SOURCE_HEADING = /(?:출처|참고문헌|참고 자료|sources?|references?)/i
const HEADING_BOUNDARY = /(?:<h[1-6]\b|^#{1,6}\s+)/gim
const URL_PATTERN = /https?:\/\/[^\s<>)\]"']+/g
const HREF_PATTERN = /href\s*=\s*["'](https?:\/\/[^"']+)["']/gi

function trimUrl(value: string): string {
  return value.replace(/[),.;]+$/g, '')
}

function visibleHeadingText(value: string): string {
  return decodeHtmlEntities(value)
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function extractSourceUrls(content: string): string[] {
  const htmlHeading = Array.from(content.matchAll(/<h[1-6][^>]*>\s*([\s\S]*?)\s*<\/h[1-6]>/gi))
    .find(match => SOURCE_HEADING.test(visibleHeadingText(match[1])))
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
  language?: SeoLanguage
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
  language = 'ko',
}: ResearchJsonLdInput): Record<string, unknown> {
  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: title,
    description: cleanMetaText(description),
    url: canonical,
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
    inLanguage: language === 'en' ? 'en-US' : 'ko-KR',
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

export function stripImportedHeadArtifacts(content: string): string {
  return content
    .replace(/<head\b[^>]*>[\s\S]*?<\/head>/gi, '')
    .replace(/<title\b[^>]*>[\s\S]*?<\/title>/gi, '')
    .replace(/<meta\b[^>]*>/gi, '')
    .replace(/<link\b[^>]*>/gi, '')
    .replace(/<script\b(?=[^>]*\btype\s*=\s*["']application\/ld\+json["'])[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<\/?(?:html|body)\b[^>]*>/gi, '')
}
