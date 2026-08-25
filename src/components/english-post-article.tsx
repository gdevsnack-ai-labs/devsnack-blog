import Link from 'next/link'
import { ArrowLeft, Calendar, Clock, Languages, ShieldAlert } from 'lucide-react'
import { LanguageSwitch } from '@/components/language-switch'
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
}: {
  source: Post
  translation: PostTranslation
  status: TranslationStatus
  englishPath: string
  sectionTitle: string
  sectionSubtitle: string
}) {
  const koreanPath = koreanSourcePath(englishPath)
  const readingTime = Math.max(1, Math.ceil((translation.content?.length || 0) / 2000))

  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-4xl flex-col gap-4 px-4 py-6 md:flex-row md:items-center md:justify-between">
          <div>
            <Link href="/en" className="text-sm font-semibold text-muted-foreground no-underline hover:text-foreground">DevSnack English Pilot</Link>
            <p className="mt-1 text-xs text-muted-foreground">{sectionTitle} · {sectionSubtitle}</p>
          </div>
          <LanguageSwitch englishHref={englishPath} koreanHref={koreanPath} />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        <Link href={koreanPath} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground no-underline hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> View the Korean source
        </Link>

        <article className="content-article mt-8">
          {source.cover_image && <img src={source.cover_image} alt={translation.title} className="mb-8 aspect-[16/7] w-full rounded-xl object-cover" />}
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1"><Languages className="h-3.5 w-3.5" /> English Content Experiment</span>
            <span>·</span>
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
          </div>
          <div className="mt-8 border-t border-border pt-8 prose-devsnack" dangerouslySetInnerHTML={{ __html: stripImportedHeadArtifacts(translation.content || '') }} />
        </article>

        <footer className="mt-12 border-t border-border pt-6 text-sm text-muted-foreground">
          <p>This English page is part of DevSnack's English Content SEO/GEO Experiment. The Korean source remains the canonical editorial origin for this pilot.</p>
          <Link href={koreanPath} className="mt-3 inline-flex text-blue-600 no-underline hover:underline dark:text-blue-400">Open the Korean source →</Link>
        </footer>
      </main>
    </div>
  )
}
