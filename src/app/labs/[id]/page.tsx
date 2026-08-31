import Link from 'next/link'
import { ArrowLeft, Calendar, CheckCircle2, ExternalLink, FileText, FlaskConical, PlayCircle } from 'lucide-react'
import { notFound } from 'next/navigation'
import { experiments } from '@/data/experiments'
import { AUTONOMOUS_AI_BLOG_LIVE } from '@/data/autonomous-ai-blog-live'
import { ProgressBar } from '@/components/progress-bar'
import { getCurrentStage, getDomainLabel, getProjectFinding, getKeyMetrics, getKeyResults, getLabBoardMetadata, getLatestResult, getNature, getSortedTimeline, LAB_FILTERS } from '@/lib/labs'
import { getPublishedLabNotes } from '@/lib/lab-notes'
import { mergePublishedLabNotes } from '@/lib/lab-note-projection'
import { getRelatedAssets } from '@/lib/ia/hub-projections'
import { getProjectFeedOutputs } from '@/lib/ia/feed-output-projection'
import { ProjectFeedOutputs } from '@/components/project-feed-outputs'
import { RelatedAssets } from '@/components/related-assets'
import { buildRouteMetadata, absoluteSiteUrl } from '@/lib/seo/metadata'
import { buildBreadcrumbJsonLd, buildCollectionPageJsonLd, buildJsonLdGraph } from '@/lib/seo/structured-data'

const STATUS_CLASS: Record<string, string> = {
  진행중: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  완료: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  예정: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  보류: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  미정: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
}

const BOARD_STATUS_CLASS: Record<string, string> = {
  active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  next: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  backlog: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  paused: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  completed: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
}

function relatedLabel(href: string): string {
  if (href.startsWith('/research/')) return 'Knowledge'
  if (href.startsWith('/devsnack/')) return 'Stories'
  if (href.startsWith('/lab/')) return 'Lab'
  return 'Related'
}

export const revalidate = 60

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const experiment = experiments.find(item => item.id === id)
  if (!experiment) return { title: 'Lab Not Found' }

  return buildRouteMetadata({
    title: `${experiment.name} — DevSnack Lab`,
    description: experiment.description,
    canonicalPath: `/labs/${id}`,
    kind: 'website',
    language: 'ko',
    section: 'Lab Project',
  })
}

export default async function LabsDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const sourceExperiment = experiments.find(item => item.id === id)
  if (!sourceExperiment) notFound()

  const experiment = id === 'blog'
    ? mergePublishedLabNotes(sourceExperiment, [
      ...(await getPublishedLabNotes('aitech-weekly-')),
    ])
    : sourceExperiment
  const feedOutputs = await getProjectFeedOutputs(id)
  const jsonLd = buildJsonLdGraph(
    buildCollectionPageJsonLd({
      name: experiment.name,
      description: experiment.description,
      url: absoluteSiteUrl(`/labs/${id}`),
      language: 'ko',
      section: 'Lab Project',
      breadcrumbs: [],
      parts: feedOutputs.map((output, index) => ({ name: output.title, url: absoluteSiteUrl(output.href), position: index + 1 })),
    }),
    buildBreadcrumbJsonLd([
      { name: '홈', url: absoluteSiteUrl('/') },
      { name: 'Lab Projects', url: absoluteSiteUrl('/labs') },
      { name: experiment.name, url: absoluteSiteUrl(`/labs/${id}`) },
    ], 'ko'),
  )

  const nature = getNature(experiment)
  const projectFinding = getProjectFinding(experiment)
  const latestActivity = getLatestResult(experiment)
  const autonomousLive = id === 'autonomous-ai-blog' ? AUTONOMOUS_AI_BLOG_LIVE : null
  const latestActivitySummary = autonomousLive?.latestActivity?.summary || latestActivity?.result
  const latestActivityDate = autonomousLive?.latestActivity?.date || latestActivity?.date
  const recentPublications = autonomousLive?.recentPublications || []
  const timeline = getSortedTimeline(experiment)
  const autonomousIncidents = autonomousLive
    ? timeline.filter(item => item.name.includes('유지보수') || item.name.includes('변경'))
    : []
  const keyMetrics = getKeyMetrics(experiment)
  const keyResults = getKeyResults(experiment)
  const board = getLabBoardMetadata(experiment)
  const boardLabel = LAB_FILTERS.find(item => item.key === board.status)?.label || board.status
  const boardConfidenceLabel = board.confidence === 'inferred' ? '기록 기반 추정' : undefined

  return (
    <div className="min-h-screen bg-background">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
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
                <span className={`rounded px-2 py-0.5 text-xs font-medium ${BOARD_STATUS_CLASS[board.status] || STATUS_CLASS.미정}`}>
                  {boardLabel}
                </span>
                {boardConfidenceLabel && <span className="text-xs text-muted-foreground">{boardConfidenceLabel}</span>}
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
          <section className="rounded-xl border border-blue-200 bg-blue-50/60 p-5 dark:border-blue-900/50 dark:bg-blue-950/20" aria-labelledby="project-finding-heading">
            <h2 id="project-finding-heading" className="text-sm font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300">Verified Project Finding</h2>
            {projectFinding ? (
              <>
                <p className="mt-3 text-base leading-relaxed">{projectFinding.statement}</p>
                <div className="mt-4 grid gap-4 text-sm md:grid-cols-2">
                  <div>
                    <p className="font-semibold text-foreground">Evidence</p>
                    <ul className="mt-1 list-disc space-y-1 pl-5 text-muted-foreground">{projectFinding.evidence.map(item => <li key={item}>{item}</li>)}</ul>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Scope</p>
                    <p className="mt-1 leading-relaxed text-muted-foreground">{projectFinding.scope}</p>
                    {projectFinding.confidence && <p className="mt-2 text-xs text-muted-foreground">Confidence · {projectFinding.confidence}</p>}
                  </div>
                </div>
              </>
            ) : (
              <p className="mt-3 text-base leading-relaxed text-muted-foreground">아직 독립적인 Project Finding이 없습니다. 현재는 Latest Activity와 Operational Snapshot만 기록되어 있습니다.</p>
            )}
          </section>

          {latestActivitySummary && (
            <section className="rounded-xl border border-border bg-muted/30 p-5" aria-labelledby="latest-activity-heading">
              <h2 id="latest-activity-heading" className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Latest Activity</h2>
              <p className="mt-3 text-base leading-relaxed">{latestActivitySummary}</p>
              <p className="mt-3 text-xs text-muted-foreground">{latestActivityDate || '날짜 미기록'}{latestActivity?.name ? ` · ${latestActivity.name}` : ''}</p>
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

          {autonomousLive && (
            <>
              <section className="grid gap-4 md:grid-cols-3" aria-label="Autonomous AI Blog project context">
                <div className="rounded-xl border border-border bg-white p-5 dark:bg-gray-900 md:col-span-3">
                  <h2 className="text-xl font-bold">Project Context</h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{experiment.whyText}</p>
                </div>
                <div className="rounded-xl border border-border bg-white p-5 dark:bg-gray-900">
                  <h2 className="text-lg font-bold">Operating Model</h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{experiment.operatingModel}</p>
                </div>
                <div className="rounded-xl border border-border bg-white p-5 dark:bg-gray-900 md:col-span-2">
                  <h2 className="text-lg font-bold">Human Intervention Policy</h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{experiment.humanInterventionPolicy}</p>
                </div>
              </section>

              <section aria-labelledby="operational-snapshot-heading">
                <div className="mb-4 flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" /><h2 id="operational-snapshot-heading" className="text-xl font-bold">Operational Snapshot</h2></div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-border bg-white p-4 dark:bg-gray-900"><p className="text-xs text-muted-foreground">Published notes</p><p className="mt-2 text-2xl font-bold">{autonomousLive.publishedCount}</p></div>
                  <div className="rounded-xl border border-border bg-white p-4 dark:bg-gray-900"><p className="text-xs text-muted-foreground">Held notes</p><p className="mt-2 text-2xl font-bold">{autonomousLive.heldCount}</p></div>
                  <div className="rounded-xl border border-border bg-white p-4 dark:bg-gray-900"><p className="text-xs text-muted-foreground">Last cycle</p><p className="mt-2 text-sm font-semibold">{autonomousLive.lastRunAt || '날짜 미기록'}</p></div>
                </div>
              </section>

              <section aria-labelledby="recent-publications-heading">
                <div className="mb-4"><h2 id="recent-publications-heading" className="text-xl font-bold">Recent Publications</h2><p className="mt-1 text-sm text-muted-foreground">전체 원문은 Agent Field Notes가 보관하며, DevSnack에는 제목·날짜·외부 canonical 링크만 남깁니다.</p></div>
                {recentPublications.length > 0 ? (
                  <div className="space-y-3">
                    {recentPublications.map(publication => (
                      <article key={publication.externalUrl} className="rounded-xl border border-border bg-white p-4 dark:bg-gray-900">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0"><h3 className="font-semibold leading-snug">{publication.title}</h3><p className="mt-1 text-xs text-muted-foreground">{publication.publishedAt || '날짜 미기록'} · {publication.publisher} · bodyStored=false</p></div>
                          <a href={publication.externalUrl} target="_blank" rel="noopener noreferrer" className="shrink-0 text-sm font-medium text-purple-700 no-underline hover:underline dark:text-purple-300">외부 원문 →</a>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : <p className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">아직 외부 publication 기록이 없습니다.</p>}
              </section>

              <section aria-labelledby="autonomous-incidents-heading">
                <div className="mb-4"><h2 id="autonomous-incidents-heading" className="text-xl font-bold">Incidents &amp; Changes</h2><p className="mt-1 text-sm text-muted-foreground">편집 결과와 분리한 운영 변경·유지보수 기록입니다.</p></div>
                {autonomousIncidents.length > 0 ? <div className="space-y-3">{autonomousIncidents.map((item, index) => <article key={`${item.date}-${item.name}-${index}`} className="rounded-xl border border-border bg-muted/30 p-4"><div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground"><span>{item.date || '날짜 미기록'}</span><span>·</span><span>{item.status}</span></div><h3 className="mt-2 text-sm font-semibold">{item.name}</h3>{item.result && <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.result}</p>}</article>)}</div> : <p className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">별도 운영 변경 기록이 없습니다.</p>}
              </section>

              <section aria-labelledby="autonomous-retrospective-heading">
                <h2 id="autonomous-retrospective-heading" className="text-xl font-bold">Retrospective</h2>
                <p className="mt-2 rounded-xl border border-border bg-muted/30 p-5 text-sm leading-relaxed text-muted-foreground">{experiment.retrospective || '아직 최종 회고 시점이 아닙니다. 운영 checkpoint가 쌓인 뒤 실험 결과와 한계를 정리합니다.'}</p>
              </section>
            </>
          )}

          <ProjectFeedOutputs outputs={feedOutputs} />

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
                      {item.blogSlug && <Link href={item.blogSlug} className="text-blue-600 no-underline hover:underline dark:text-blue-400">Lab Note</Link>}
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
              {(experiment.externalLinks || []).map(link => (
                <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-purple-50 px-3 py-2 text-sm text-purple-700 no-underline transition-colors hover:bg-purple-100 dark:bg-purple-900/20 dark:text-purple-300 dark:hover:bg-purple-900/40">
                  <ExternalLink className="h-4 w-4" />
                  {link.label}
                </a>
              ))}
            </div>
          </section>

          <RelatedAssets links={getRelatedAssets(`project:${id}`)} title="Registered Relations" />
        </main>
      </div>
    </div>
  )
}
