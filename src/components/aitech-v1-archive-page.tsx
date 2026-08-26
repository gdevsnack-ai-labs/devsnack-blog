import { Bot, CalendarDays, ExternalLink, FlaskConical, Search } from 'lucide-react'
import Link from 'next/link'
import archiveSnapshot from '@/data/aitech-v1-archive.json'
import { BlogHeader } from '@/components/blog-header'
import { formatAitechArchiveDate, groupAitechV1Archive, type AitechV1ArchiveEntry } from '@/lib/aitech-v1-archive'

const entries = archiveSnapshot.entries as AitechV1ArchiveEntry[]
const months = groupAitechV1Archive(entries)

export function AitechV1ArchivePage() {
  return (
    <div className="min-h-screen bg-background">
      <BlogHeader title="AI Tech Insight" subtitle="v1 자동 발행 실험 기록" icon="aitech" color="purple" />
      <main className="mx-auto max-w-5xl px-4 py-8 md:py-12">
        <header className="max-w-3xl">
          <p className="text-sm font-semibold text-purple-600 dark:text-purple-400">AI Tech · v1 archive</p>
          <h1 className="mt-3 text-3xl font-bold leading-tight tracking-tight md:text-5xl">자동 발행 실험을 잠시 마치고, 근거 수집부터 다시 정비합니다.</h1>
          <p className="mt-5 text-base leading-relaxed text-muted-foreground md:text-lg">
            AI Tech는 AI가 뉴스를 수집하고 분석해 자동으로 발행할 수 있는지를 실험한 프로젝트입니다. 초기 운영에서 생성 자체는 가능했지만, 안정적인 품질을 유지하려면 작성 모델만 개선하는 것으로는 부족하다는 점을 확인했습니다.
          </p>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground md:text-lg">
            제한된 RSS 요약이나 충분하지 않은 source evidence에서 분석을 확장하면 사실과 AI의 추론 사이 경계가 약해질 수 있었습니다. 그래서 현재 자동 발행을 중지하고 SearXNG source discovery, 원문 크롤링, 독립 근거 확보, evidence 기반 검증 흐름을 재정비하고 있습니다.
          </p>
        </header>

        <section className="mt-8 grid gap-3 md:grid-cols-3" aria-label="AI Tech v1 status">
          <div className="rounded-2xl border border-purple-200 bg-purple-50/70 p-5 dark:border-purple-900/60 dark:bg-purple-950/20">
            <FlaskConical className="h-5 w-5 text-purple-600 dark:text-purple-400" aria-hidden="true" />
            <h2 className="mt-3 text-sm font-bold">실험</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">뉴스 수집·분석·자동 발행이 실제로 가능한지 확인했습니다.</p>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5 dark:border-amber-900/60 dark:bg-amber-950/20">
            <Bot className="h-5 w-5 text-amber-600 dark:text-amber-400" aria-hidden="true" />
            <h2 className="mt-3 text-sm font-bold">관찰</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">생성 품질은 입력 evidence와 source 구조에 크게 좌우됐습니다.</p>
          </div>
          <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-5 dark:border-blue-900/60 dark:bg-blue-950/20">
            <Search className="h-5 w-5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
            <h2 className="mt-3 text-sm font-bold">다음 단계</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">primary source 탐색 → 독립 source 추가 → evidence 추출 → quality gate를 준비합니다.</p>
          </div>
        </section>

        <section className="mt-12" aria-labelledby="aitech-v1-archive-heading">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Historical index</p>
              <h2 id="aitech-v1-archive-heading" className="mt-1 text-2xl font-bold">AI Tech v1에서 다룬 뉴스</h2>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
                과거 article 전문을 다시 노출하는 목록이 아니라, v1 실험에서 어떤 뉴스를 다뤘는지 남기는 compact index입니다. 제목과 발행일만 보존하며, 기존 상세 URL은 URL lifecycle 정책이 결정될 때까지 이 목록에서 새로 연결하지 않습니다.
              </p>
            </div>
            <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">{entries.length}개 기록</span>
          </div>

          <div className="mt-5 space-y-3">
            {months.map((month, index) => (
              <details key={month.key} open={index === 0} className="group rounded-2xl border border-border bg-white dark:bg-gray-900">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-4 font-semibold marker:hidden [&::-webkit-details-marker]:hidden">
                  <span className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-purple-600 dark:text-purple-400" aria-hidden="true" />{month.label}</span>
                  <span className="text-xs font-normal text-muted-foreground">{month.entries.length}개</span>
                </summary>
                <ol className="divide-y divide-border border-t border-border px-4">
                  {month.entries.map((entry, entryIndex) => (
                    <li key={`${entry.date}-${entry.title}-${entryIndex}`} className="grid gap-1 py-3 sm:grid-cols-[118px_1fr] sm:gap-4">
                      <time dateTime={entry.date} className="text-xs text-muted-foreground">{formatAitechArchiveDate(entry.date)}</time>
                      <span className="text-sm leading-relaxed text-foreground">{entry.title}</span>
                    </li>
                  ))}
                </ol>
              </details>
            ))}
          </div>
        </section>

        <section className="mt-10 flex flex-wrap gap-2 border-t border-border pt-6" aria-label="AI Tech navigation">
          <Link href="/" className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm no-underline hover:border-foreground/25"><ExternalLink className="h-4 w-4" aria-hidden="true" />DevSnack Home</Link>
          <Link href="/labs/blog" className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm no-underline hover:border-foreground/25">AI Tech Automation System</Link>
        </section>
      </main>
    </div>
  )
}
