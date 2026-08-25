import Link from 'next/link'
import { ArrowUpRight, Gauge, Languages } from 'lucide-react'
import { notFound } from 'next/navigation'
import { LanguageSwitch } from '@/components/language-switch'
import { EN_BENCHMARK_OVERVIEW } from '@/lib/i18n/english-pilot'
import { getEnglishPost } from '@/lib/translation'
import { buildRouteMetadata } from '@/lib/seo/metadata'

export const revalidate = 60

export const metadata = buildRouteMetadata({
  title: `${EN_BENCHMARK_OVERVIEW.title} — DevSnack English Pilot`,
  description: EN_BENCHMARK_OVERVIEW.description,
  canonicalPath: '/en/benchmarks',
})

export default async function EnglishBenchmarksPage() {
  const benchmark = await getEnglishPost('lab', 'ornith15-server-quality-speed-benchmark')
  if (!benchmark) notFound()

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-4 py-8 md:py-12">
        <header className="flex flex-col gap-5 border-b border-border pb-8 md:flex-row md:items-start md:justify-between">
          <div><Link href="/en" className="text-sm text-muted-foreground no-underline hover:text-foreground">DevSnack English Pilot</Link><div className="mt-5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400"><Gauge className="h-4 w-4" /> {EN_BENCHMARK_OVERVIEW.eyebrow}</div><h1 className="mt-3 text-3xl font-bold tracking-tight md:text-5xl">{EN_BENCHMARK_OVERVIEW.title}</h1><p className="mt-4 max-w-3xl text-base leading-relaxed text-muted-foreground">{EN_BENCHMARK_OVERVIEW.description}</p></div>
          <LanguageSwitch englishHref="/en/benchmarks" koreanHref="/benchmarks" />
        </header>

        <main className="mt-8 space-y-8">
          <section aria-labelledby="protocol-heading"><h2 id="protocol-heading" className="text-xl font-bold">{EN_BENCHMARK_OVERVIEW.protocolHeading}</h2><div className="mt-4 grid gap-3 sm:grid-cols-2">{EN_BENCHMARK_OVERVIEW.protocol.map(([label, value]) => <div key={label} className="rounded-xl border border-border bg-white p-4 dark:bg-gray-900"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p><p className="mt-2 text-sm leading-relaxed">{value}</p></div>)}</div></section>

          <section className="rounded-xl border border-blue-200 bg-blue-50/50 p-5 dark:border-blue-900/50 dark:bg-blue-950/15" aria-labelledby="selected-benchmark-heading"><h2 id="selected-benchmark-heading" className="text-xl font-bold">{EN_BENCHMARK_OVERVIEW.selectedHeading}</h2><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{EN_BENCHMARK_OVERVIEW.selectedDescription}</p><Link href="/en/lab/ornith15-server-quality-speed-benchmark" className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-blue-700 no-underline hover:underline dark:text-blue-300">Read the translated benchmark report <ArrowUpRight className="h-4 w-4" /></Link></section>

          <section className="rounded-xl border border-dashed border-border p-5" aria-labelledby="limitations-heading"><h2 id="limitations-heading" className="text-xl font-bold">Limitations</h2><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{EN_BENCHMARK_OVERVIEW.limitations}</p></section>
        </main>

        <footer className="mt-12 border-t border-border pt-6 text-sm text-muted-foreground"><p>This static Benchmark projection is stored by stable content ID so future locales can use the same projection contract.</p><Link href="/benchmarks" className="mt-3 inline-flex text-blue-600 no-underline hover:underline dark:text-blue-400">Open the Korean Benchmark hub →</Link></footer>
      </div>
    </div>
  )
}
