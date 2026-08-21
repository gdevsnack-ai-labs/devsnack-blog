import Link from 'next/link'
import { ArrowLeft, Calendar, CheckCircle2, ExternalLink, FileText, FlaskConical, PlayCircle } from 'lucide-react'
import { notFound } from 'next/navigation'
import { experiments } from '@/data/experiments'
import { ProgressBar } from '@/components/progress-bar'
import { getCurrentStage, getDomainLabel, getKeyFinding, getKeyMetrics, getKeyResults, getLatestResult, getNature, getSortedTimeline } from '@/lib/labs'
import { getRelatedAssets } from '@/lib/ia/hub-projections'
import { RelatedAssets } from '@/components/related-assets'

const STATUS_CLASS: Record<string, string> = {
  진행중: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  완료: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  예정: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  보류: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  미정: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
}

function relatedLabel(href: string): string {
  if (href.startsWith('/research/')) return 'Research'
  if (href.startsWith('/devsnack/')) return 'Blog'
  if (href.startsWith('/lab/')) return 'Lab Note'
  return 'Related'
}

export const revalidate = 60

export default async function LabsDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const experiment = experiments.find(item => item.id === id)
  if (!experiment) notFound()

  const nature = getNature(experiment)
  const keyFinding = getKeyFinding(experiment)
  const latestActivity = getLatestResult(experiment)
  const keyMetrics = getKeyMetrics(experiment)
  const keyResults = getKeyResults(experiment)
  const timeline = getSortedTimeline(experiment)

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-8 md:py-10">
        <Link href="/labs" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground no-underline hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Labs 대시보드
        </Link>

        <header className="mt-8 border-b border-border pb-8">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <FlaskConical className="h-4 w-4" />
            {getDomainLabel(experiment)}
            <span aria-hidden="true">·</span>
            {nature.label}
          </div>
          <div className="mt-3 flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <h1 className="text-3xl font-bold leading-tight tracking-tight md:text-4xl">{experiment.name}</h1>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span className={`rounded px-2 py-0.5 text-xs font-medium ${STATUS_CLASS[experiment.status] || STATUS_CLASS.미정}`}>
                  {experiment.status}
                </span>
                <span>현재 단계: {getCurrentStage(experiment)}</span>
                {experiment.startedAt && <span>· {experiment.startedAt} 시작</span>}
              </div>
            </div>
            <div className="w-full shrink-0 md:w-52">
              <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                <span>진행률</span>
                <strong className="text-foreground">{experiment.progress}%</strong>
              </div>
              <ProgressBar value={experiment.progress} color={experiment.color} size="md" />
            </div>
          </div>
          <p className="mt-6 max-w-3xl text-base leading-relaxed text-muted-foreground">{experiment.description}</p>
          <p className="mt-3 text-sm text-muted-foreground">{nature.description}</p>
        </header>

        <main className="mt-8 space-y-8">
          {(keyFinding || latestActivity) && (
            <section className="rounded-xl border border-blue-200 bg-blue-50/60 p-5 dark:border-blue-900/50 dark:bg-blue-950/20" aria-labelledby="current-finding-heading">
              <h2 id="current-finding-heading" className="text-sm font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300">Current Finding</h2>
              <p className="mt-3 text-base leading-relaxed">{keyFinding || latestActivity?.result}</p>
              {latestActivity && (
                <p className="mt-3 text-xs text-muted-foreground">
                  Latest Activity · {latestActivity.date || '날짜 미기록'} · {latestActivity.name}
                </p>
              )}
            </section>
          )}

          {(keyMetrics.length > 0 || keyResults.length > 0) && (
            <section aria-labelledby="key-results-heading">
              <div className="mb-4 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                <h2 id="key-results-heading" className="text-xl font-bold">Key Results</h2>
              </div>
              {keyMetrics.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {keyMetrics.map(metric => (
                    <div key={metric.label} className="rounded-xl border border-border bg-white p-4 dark:bg-gray-900">
                      <p className="text-xs text-muted-foreground">{metric.label}</p>
                      <p className="mt-2 text-xl font-bold tracking-tight">{metric.value}</p>
                      {metric.note && <p className="mt-1 text-xs text-muted-foreground">{metric.note}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-3">
                  {keyResults.map(item => (
                    <div key={`${item.date}-${item.name}`} className="rounded-xl border border-border bg-white p-4 dark:bg-gray-900">
                      <p className="text-xs text-muted-foreground">{item.date || '날짜 미기록'}</p>
                      <h3 className="mt-2 text-sm font-semibold leading-snug">{item.name}</h3>
                      <p className="mt-2 line-clamp-4 text-sm leading-relaxed text-muted-foreground">{item.result}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          <section aria-labelledby="experiment-log-heading">
            <div className="mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <h2 id="experiment-log-heading" className="text-xl font-bold">Experiment Log</h2>
            </div>
            <div className="space-y-3">
              {timeline.map((item, index) => (
                <article key={`${item.date}-${item.name}-${index}`} className="rounded-xl border border-border bg-white p-4 dark:bg-gray-900">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex min-w-0 items-start gap-3">
                      <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${item.status === '완료' ? 'bg-green-500' : item.status === '진행중' ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold leading-snug">{item.name}</h3>
                        {item.result && <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.result}</p>}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2 pl-5 text-xs text-muted-foreground sm:pl-0">
                      <span>{item.date || '날짜 미기록'}</span>
                      <span>{item.status}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          {experiment.id === 'local-llm-benchmark' && (
            <section className="rounded-xl border border-dashed border-blue-300 bg-blue-50/30 p-5 dark:border-blue-900/60 dark:bg-blue-950/10" aria-labelledby="sub-labs-heading">
              <h2 id="sub-labs-heading" className="text-lg font-bold">Model Sub-Labs</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                이 실험은 하나의 완료 과제가 아니라 모델별 측정을 계속 추가하는 부모 실험실로 운영할 수 있습니다. Qwen3.8, Ornith1.5 같은 하위 실험은 실제 측정 데이터가 연결될 때 이 영역에 추가합니다.
              </p>
            </section>
          )}

          <section aria-labelledby="related-heading">
            <div className="mb-4 flex items-center gap-2">
              <ExternalLink className="h-5 w-5 text-muted-foreground" />
              <h2 id="related-heading" className="text-xl font-bold">Related</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {(experiment.blogPosts || []).map(href => (
                <Link key={href} href={href} className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-700 no-underline transition-colors hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:hover:bg-blue-900/40">
                  <FileText className="h-4 w-4" />
                  {relatedLabel(href)}
                </Link>
              ))}
              {(experiment.youtubeVideos || []).map(videoId => (
                <a key={videoId} href={`https://youtube.com/watch?v=${videoId}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 no-underline transition-colors hover:bg-red-100 dark:bg-red-900/20 dark:text-red-300 dark:hover:bg-red-900/40">
                  <PlayCircle className="h-4 w-4" />
                  YouTube
                </a>
              ))}
              {experiment.githubUrl && (
                <a href={experiment.githubUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground no-underline transition-colors hover:text-foreground">
                  <ExternalLink className="h-4 w-4" />
                  GitHub
                </a>
              )}
            </div>
          </section>

          <RelatedAssets links={getRelatedAssets(`project:${id}`)} title="Registered Relations" />
        </main>
      </div>
    </div>
  )
}
