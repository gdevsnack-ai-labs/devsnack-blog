import Link from 'next/link'
import { ArrowLeft, Calendar, Clock, Languages, ShieldAlert } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { BlogHeader } from '@/components/blog-header'
import { LanguageSwitch } from '@/components/language-switch'
import { ViewCounter } from '@/components/view-counter'
import { stripImportedHeadArtifacts } from '@/lib/seo/metadata'
import { koreanSourcePath, translationStatusLabel, type TranslationStatus } from '@/lib/translation-core'
import type { Post } from '@/lib/supabase'
import type { PostTranslation } from '@/lib/translation-core'

function formatDate(value: string | null): string {
  if (!value) return 'Date not recorded'
  return new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(value))
}

export function EnglishPostArticle({
  source,
  translation,
  status,
  englishPath,
  sectionTitle,
  sectionSubtitle,
  structuredData,
}: {
  source: Post
  translation: PostTranslation
  status: TranslationStatus
  englishPath: string
  sectionTitle: string
  sectionSubtitle: string
  structuredData?: Record<string, unknown>
}) {
  const koreanPath = koreanSourcePath(englishPath)
  const isStory = sectionTitle === 'Stories'
  const isKnowledge = sectionTitle === 'Knowledge'
  const readingTime = Math.max(1, Math.ceil((translation.content?.length || 0) / 2000))
  const topClass = isKnowledge
    ? 'mx-auto max-w-3xl px-4 py-8'
    : isStory
      ? 'mx-auto max-w-3xl px-4 py-4'
      : 'mx-auto max-w-4xl px-4 py-4'
  const articleClass = isStory
    ? 'content-article mx-auto max-w-3xl min-w-0 px-4 py-8'
    : 'content-article mx-auto max-w-3xl min-w-0 px-4 py-8'

  return (
    <div className="min-h-screen bg-background">
      {structuredData && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      )}
      {isStory && <BlogHeader title="DevSnack Blog" subtitle="AI from a developer's point of view" icon="terminal" color="blue" />}

      <div className={topClass}>
        <Link href={koreanPath} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground no-underline hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> View the Korean source
        </Link>
        <div className="mt-3 flex justify-end">
          <LanguageSwitch englishHref={englishPath} koreanHref={koreanPath} />
        </div>
      </div>

      <article className={articleClass}>
        {source.cover_image && (
          <div className="mb-8 aspect-[16/7] overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={source.cover_image} alt={translation.title} className="h-full w-full object-cover" />
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1"><Languages className="h-3.5 w-3.5" /> English Content Experiment</span>
          <span aria-hidden="true">·</span>
          <span>{translationStatusLabel(status)}</span>
        </div>
        {status === 'stale' && (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200" role="status">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
            <span>The Korean source changed after this translation. This page remains available for comparison, but the translation needs refresh.</span>
          </div>
        )}

        <h1 className="mt-5 text-3xl font-bold leading-tight tracking-tight md:text-4xl">{translation.title}</h1>

        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5"><Calendar className="h-4 w-4" />{formatDate(source.published)}</span>
          <span className="inline-flex items-center gap-1.5"><Clock className="h-4 w-4" />About {readingTime} min</span>
          {isStory && <ViewCounter slug={source.slug} views={source.views} />}
          {source.labels && source.labels.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {source.labels.map(label => <Badge key={label} variant="secondary" className="text-xs font-normal">{label}</Badge>)}
            </div>
          )}
        </div>

        <div className="mt-8 border-t border-border pt-8 prose-devsnack" dangerouslySetInnerHTML={{ __html: stripImportedHeadArtifacts(translation.content || '') }} />
        {isKnowledge && (
          <section className="mt-8 rounded-xl border border-border bg-muted/30 p-4" aria-labelledby="related-material-heading">
            <h2 id="related-material-heading" className="text-sm font-semibold text-muted-foreground">Related material</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">This section mirrors the Korean Knowledge route's related-material boundary. Source links in the translated article remain unchanged unless a verified internal equivalent exists.</p>
          </section>
        )}
      </article>

      <footer className="mt-12 border-t border-border pt-6 text-sm text-muted-foreground">
        <div className="mx-auto max-w-3xl px-4">
          <p>This English page is part of DevSnack's English Content SEO/GEO Experiment. The Korean source remains the canonical editorial origin for this pilot.</p>
          <Link href={koreanPath} className="mt-3 inline-flex text-blue-600 no-underline hover:underline dark:text-blue-400">Open the Korean source →</Link>
        </div>
      </footer>
    </div>
  )
}
