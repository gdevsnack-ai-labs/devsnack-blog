// @ts-expect-error Node's strip-types runner requires the explicit extension.
import { SITE_URL } from './site.ts'
// @ts-expect-error Node's strip-types runner requires the explicit extension.
import { cleanMetaText, type SeoLanguage } from './metadata.ts'

export type ArticleSchemaType = 'Article' | 'TechArticle'

export interface BreadcrumbItem {
  name: string
  url: string
}

export interface ArticleSchemaInput {
  type: ArticleSchemaType
  title: string
  description: string
  url: string
  language: SeoLanguage
  section: string
  published?: string | null
  modified?: string | null
  image?: string | null
  keywords?: string[]
  citations?: string[]
  about?: Record<string, unknown>
  isPartOf?: Record<string, unknown>
}

const ORGANIZATION = {
  '@type': 'Organization',
  name: 'DevSnack',
  url: SITE_URL,
}

const PUBLISHER = {
  '@type': 'Organization',
  name: 'DevSnack Blog',
  url: SITE_URL,
}

export function buildArticleJsonLd(input: ArticleSchemaInput): Record<string, unknown> {
  const language = input.language === 'en' ? 'en-US' : 'ko-KR'
  const data: Record<string, unknown> = {
    '@type': input.type,
    headline: input.title,
    description: cleanMetaText(input.description),
    url: input.url,
    mainEntityOfPage: { '@type': 'WebPage', '@id': input.url },
    inLanguage: language,
    isAccessibleForFree: true,
    articleSection: input.section,
    author: ORGANIZATION,
    publisher: PUBLISHER,
    ...(input.image ? { image: input.image } : {}),
    ...(input.keywords?.length ? { keywords: input.keywords.join(', ') } : {}),
    ...(input.citations?.length ? { citation: input.citations } : {}),
    ...(input.about ? { about: input.about } : {}),
    ...(input.isPartOf ? { isPartOf: input.isPartOf } : {}),
  }
  if (input.published) data.datePublished = input.published
  if (input.modified) data.dateModified = input.modified
  return data
}

export function buildBreadcrumbJsonLd(items: BreadcrumbItem[], language: SeoLanguage): Record<string, unknown> {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
    inLanguage: language === 'en' ? 'en-US' : 'ko-KR',
  }
}

export interface CollectionSchemaInput {
  name: string
  description: string
  url: string
  language: SeoLanguage
  breadcrumbs: BreadcrumbItem[]
  parts?: Array<{ name: string; url: string; position: number }>
  section?: string
}

export function buildCollectionPageJsonLd(input: CollectionSchemaInput): Record<string, unknown> {
  const language = input.language === 'en' ? 'en-US' : 'ko-KR'
  const page: Record<string, unknown> = {
    '@type': 'CollectionPage',
    name: input.name,
    description: cleanMetaText(input.description),
    url: input.url,
    inLanguage: language,
    isPartOf: { '@type': 'WebSite', name: 'DevSnack Blog', url: SITE_URL },
    ...(input.section ? { about: { '@type': 'Thing', name: input.section } } : {}),
  }
  if (input.parts?.length) {
    page.mainEntity = {
      '@type': 'ItemList',
      itemListElement: input.parts.map(part => ({
        '@type': 'ListItem',
        position: part.position,
        name: part.name,
        url: part.url,
      })),
    }
  }
  return page
}

export function buildJsonLdGraph(...entities: Record<string, unknown>[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@graph': entities,
  }
}
