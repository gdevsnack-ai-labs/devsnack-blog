import Link from 'next/link'
import { ArrowLeft, ArrowUpRight, FlaskConical, Languages, ShieldCheck } from 'lucide-react'
import { notFound } from 'next/navigation'
import { LanguageSwitch } from '@/components/language-switch'
import { EnglishStockPulseEvaluation } from '@/components/english-stockpulse-evaluation'
import { EN_PROJECT_PROJECTIONS } from '@/lib/i18n/english-pilot'
import { getEnglishPost } from '@/lib/translation'
import { buildRouteMetadata } from '@/lib/seo/metadata'

export const revalidate = 60

const project = EN_PROJECT_PROJECTIONS['stockpulse-ai-self-improvement']
const NOTE_SLUGS = ['stockpulse-self-2026-08-21', 'stockpulse-self-2026-08-25']

export const metadata = buildRouteMetadata({
  title: `${project.name} — DevSnack English Pilot`,
  description: project.description,
  canonicalPath: '/en/labs/stockpulse-ai-self-improvement',
})

export default async function EnglishStockPulseProjectPage() {
  const notes = (await Promise.all(NOTE_SLUGS.map(slug => getEnglishPost('lab', slug)))).filter(Boolean)
  if (notes.length === 0) notFound()

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-8 md:py-12">
        <header className="border-b border-border pb-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <Link href="/en" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground no-underline hover:text-foreground"><ArrowLeft className="h-4 w-4" /> English Pilot</Link>
              <div className="mt-6 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground"><FlaskConical className="h-4 w-4" /> {project.domain}</div>
              <h1 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">{project.name}</h1>
            </div>
            <LanguageSwitch englishHref="/en/labs/stockpulse-ai-self-improvement" koreanHref="/labs/stockpulse-ai-self-improvement" />
          </div>
          <p className="mt-6 max-w-3xl text-base leading-relaxed text-muted-foreground">{project.description}</p>
          <p className="mt-3 text-sm text-muted-foreground">{project.nature}</p>
        </header>

        <main className="mt-8 space-y-8">
          <section className="rounded-xl border border-blue-200 bg-blue-50/60 p-5 dark:border-blue-900/50 dark:bg-blue-950/20" aria-labelledby="english-finding-heading">
            <h2 id="english-finding-heading" className="text-sm font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300">Current finding</h2>
            <p className="mt-3 text-base leading-relaxed">{project.currentFinding}</p>
          </section>

          <EnglishStockPulseEvaluation />

          <section aria-labelledby="english-lab-notes-heading">
            <div className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-green-600" /><h2 id="english-lab-notes-heading" className="text-xl font-bold">{project.labNotesHeading}</h2></div>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{project.labNotesDescription}</p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {notes.map(entry => entry && (
                <Link key={entry.translation.id} href={`/en/lab/${entry.source.slug}`} className="group rounded-xl border border-border bg-white p-4 no-underline transition-colors hover:border-green-400 hover:bg-green-50/40 dark:bg-gray-900 dark:hover:border-green-700 dark:hover:bg-green-950/20">
                  <span className="flex items-start justify-between gap-3"><span className="font-semibold text-foreground group-hover:text-green-700 dark:group-hover:text-green-300">{entry.translation.title}</span><ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground" /></span>
                  <span className="mt-2 block line-clamp-3 text-sm leading-relaxed text-muted-foreground">{entry.translation.excerpt || 'Open the translated Lab Note.'}</span>
                </Link>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-dashed border-border p-5" aria-labelledby="english-boundary-heading">
            <div className="flex items-center gap-2"><Languages className="h-5 w-5 text-muted-foreground" /><h2 id="english-boundary-heading" className="text-xl font-bold">Pilot boundary</h2></div>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">StockPulse morning and market-close Feed posts are intentionally not translated in this pilot. The Project and selected Lab Notes are translated so the experiment can compare original-value content without turning a daily Feed into a translation maintenance queue.</p>
          </section>
        </main>

        <footer className="mt-12 border-t border-border pt-6 text-sm text-muted-foreground"><Link href="/labs/stockpulse-ai-self-improvement" className="text-blue-600 no-underline hover:underline dark:text-blue-400">Open the Korean Project page →</Link></footer>
      </div>
    </div>
  )
}
