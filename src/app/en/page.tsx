import Link from 'next/link'
import { ArrowUpRight, FlaskConical, Languages, Search } from 'lucide-react'
import { EN_STATIC_LOCALE_METADATA } from '@/lib/i18n/english-pilot'
import { buildRouteMetadata } from '@/lib/seo/metadata'

export const metadata = {
  ...buildRouteMetadata({
    title: 'English Content Experiment — DevSnack',
    description: 'DevSnack English pilot: original Stories, Lab Notes, a Project, Benchmark, and Knowledge pages translated for an SEO/GEO experiment.',
    canonicalPath: '/en',
  }),
  openGraph: { type: 'website', locale: 'en_US', title: 'English Content Experiment — DevSnack', description: 'A small English content SEO/GEO pilot for DevSnack.' },
}

const PILOT_LINKS = [
  { label: 'Story · I Read the News Written by AI', href: '/en/devsnack/i-read-ai-written-news', note: 'Editorial story about authorship, responsibility, and AI-generated news.' },
  { label: 'Story · The AI-Built Gomoku Engine', href: '/en/devsnack/ai-built-gomoku-engine-vs-rapfi', note: 'A debugging story where suspiciously perfect results exposed evaluation bugs.' },
  { label: 'Lab Project · StockPulse AI Self-Improvement', href: '/en/labs/stockpulse-ai-self-improvement', note: 'Project page with live evaluation data and two translated Lab Notes.' },
  { label: 'Lab Note · 2026-08-21 Success', href: '/en/lab/stockpulse-self-2026-08-21', note: 'A successful LLM forecast and its applied improvement actions.' },
  { label: 'Lab Note · 2026-08-25 Failure', href: '/en/lab/stockpulse-self-2026-08-25', note: 'A failed forecast and the resulting prompt and feature changes.' },
  { label: 'Benchmark · Ornith-1.5 Server Quality and Real-Use Speed', href: '/en/lab/ornith15-server-quality-speed-benchmark', note: 'Q5/Q6/Q8 structured-output reliability and serving-speed measurement.' },
  { label: 'Knowledge · Qwen3.8-27B NVFP4 MTP on GB10', href: '/en/research/qwen3-8-27b-nvfp4-mtp-gguf-gb10', note: 'Local model deployment, MTP acceptance, throughput, and long-serving results.' },
  { label: 'Knowledge · Wiki Embedding Search', href: '/en/research/wiki-embedding-search', note: 'A local hybrid semantic-search design using sqlite-vec, BGE-M3, and reranking.' },
  { label: 'Benchmark Hub · Local LLM Benchmark', href: '/en/benchmarks', note: 'English projection of the benchmark protocol and pilot measurement context.' },
]

export default function EnglishHomePage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-4 py-8 md:py-12">
        <header className="flex flex-col gap-6 border-b border-border pb-8 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-400"><Languages className="h-4 w-4" /> {EN_STATIC_LOCALE_METADATA.experiment}</div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight md:text-5xl">DevSnack in English</h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">A small, deliberate English content pilot. These pages preserve the technical meaning, measurements, protocols, code, and source links of their Korean originals.</p>
          </div>
        </header>

        <section className="mt-8 grid gap-3 sm:grid-cols-3" aria-label="Pilot principles">
          <div className="rounded-xl border border-border bg-white p-4 dark:bg-gray-900"><FlaskConical className="h-5 w-5 text-blue-600" /><h2 className="mt-3 text-sm font-bold">Original-value sample</h2><p className="mt-1 text-xs leading-relaxed text-muted-foreground">Stories, Lab, Benchmark, and Knowledge—not automated AI Tech or StockPulse Feed posts.</p></div>
          <div className="rounded-xl border border-border bg-white p-4 dark:bg-gray-900"><Search className="h-5 w-5 text-blue-600" /><h2 className="mt-3 text-sm font-bold">SEO/GEO experiment</h2><p className="mt-1 text-xs leading-relaxed text-muted-foreground">The `/en/...` URL is a stable English artifact for later search and citation comparison.</p></div>
          <div className="rounded-xl border border-border bg-white p-4 dark:bg-gray-900"><Languages className="h-5 w-5 text-blue-600" /><h2 className="mt-3 text-sm font-bold">Explicit language choice</h2><p className="mt-1 text-xs leading-relaxed text-muted-foreground">The Korean URL stays Korean. The switch remembers the reader’s choice without changing content behind one URL.</p></div>
        </section>

        <section className="mt-10" aria-labelledby="pilot-content-heading">
          <h2 id="pilot-content-heading" className="text-xl font-bold">Pilot content</h2>
          <p className="mt-1 text-sm text-muted-foreground">Selected pages are intentionally small enough to review for factual and technical parity.</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {PILOT_LINKS.map(item => (
              <Link key={item.href} href={item.href} className="group rounded-xl border border-border bg-white p-4 no-underline transition-colors hover:border-blue-400 hover:bg-blue-50/40 dark:bg-gray-900 dark:hover:border-blue-700 dark:hover:bg-blue-950/20">
                <span className="flex items-start justify-between gap-3"><span className="font-semibold text-foreground group-hover:text-blue-700 dark:group-hover:text-blue-300">{item.label}</span><ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground" /></span>
                <span className="mt-2 block text-sm leading-relaxed text-muted-foreground">{item.note}</span>
              </Link>
            ))}
          </div>
        </section>

        <footer className="mt-12 border-t border-border pt-6 text-sm text-muted-foreground">
          <p>Phase 4 intentionally does not add hreflang, canonical pairing, translated sitemap entries, or JSON-LD language integration. Those belong to the next SEO/GEO phase.</p>
          <Link href="/" className="mt-3 inline-flex text-blue-600 no-underline hover:underline dark:text-blue-400">Back to the Korean DevSnack home →</Link>
        </footer>
      </div>
    </div>
  )
}
