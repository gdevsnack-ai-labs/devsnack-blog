import Link from 'next/link'
import { ArrowLeft, Calendar, CheckCircle2, FlaskConical } from 'lucide-react'
import { notFound } from 'next/navigation'
import { experiments } from '@/data/experiments'
import { AUTONOMOUS_AI_BLOG_LIVE } from '@/data/autonomous-ai-blog-live'
import { ProgressBar } from '@/components/progress-bar'
import { getCurrentStage, getDomainLabel, getProjectFinding, getKeyMetrics, getKeyResults, getLabBoardMetadata, getLatestResult, getNature, getSortedTimeline, LAB_FILTERS } from '@/lib/labs'
import { getPublishedLabNotes } from '@/lib/lab-notes'
import { mergePublishedLabNotes } from '@/lib/lab-note-projection'
import { getRelatedAssets, type RelatedAssetLink } from '@/lib/ia/hub-projections'
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

function getProjectRelatedLinks(experiment: (typeof experiments)[number], projectId: string): RelatedAssetLink[] {
  const projectHref = `/labs/${projectId}`
  const registered = getRelatedAssets(`project:${projectId}`).filter(link => link.href !== projectHref)
  const seen = new Set(registered.map(link => link.href))
  const directLinks: RelatedAssetLink[] = [
    ...(experiment.youtubeVideos || []).map(videoId => ({
      assetId: `youtube:${videoId}`,
      relation: 'supports' as const,
      relationLabel: 'YouTube',
      title: 'YouTube video',
      href: `https://youtube.com/watch?v=${videoId}`,
      kind: 'showcase' as const,
    })),
    ...(experiment.githubUrl ? [{
      assetId: `github:${experiment.githubUrl}`,
      relation: 'supports' as const,
      relationLabel: 'GitHub',
      title: 'GitHub repository',
      href: experiment.githubUrl,
      kind: 'knowledge' as const,
    }] : []),
    ...(experiment.externalLinks || []).map(link => ({
      assetId: `external:${link.href}`,
      relation: 'supports' as const,
      relationLabel: 'External',
      title: link.label,
      href: link.href,
      kind: 'knowledge' as const,
    })),
  ]
  return [...registered, ...directLinks.filter(link => !seen.has(link.href))]
}

function LocalBenchmarkHistory({ experiment }: { experiment: (typeof experiments)[number] }) {
  const finding = getProjectFinding(experiment)
  const metrics = getKeyMetrics(experiment)
  const timeline = getSortedTimeline(experiment)

  return (
    <>
      <section className="rounded-2xl border border-blue-200 bg-blue-50/50 p-5 dark:border-blue-900/50 dark:bg-blue-950/15" aria-labelledby="benchmark-history-heading">
        <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
          <FlaskConical className="h-5 w-5" aria-hidden="true" />
          <h2 id="benchmark-history-heading" className="text-xl font-bold">초기 실험의 의미</h2>
        </div>
        <p className="mt-3 max-w-3xl text-base leading-relaxed">{experiment.whyText}</p>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-blue-200/80 bg-white/80 p-4 dark:border-blue-900/50 dark:bg-gray-900/60">
            <h3 className="font-semibold">무엇을 확인했나</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">GB10에서 로컬 LLM을 실제로 실행할 수 있는지, 그리고 단순 속도 측정을 넘어 서빙과 결과물까지 이어지는지 확인했습니다.</p>
          </div>
          <div className="rounded-xl border border-blue-200/80 bg-white/80 p-4 dark:border-blue-900/50 dark:bg-gray-900/60">
            <h3 className="font-semibold">현재 결과는 어디에 있나</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">후속 측정은 이 역사 페이지에 누적하지 않고, 재현 가능한 비교 결과와 개별 심층 측정을 별도 Benchmark surface로 관리합니다.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/benchmarks" className="inline-flex items-center rounded-lg bg-foreground px-3 py-2 text-sm text-background no-underline hover:opacity-80">Standard Benchmarks 보기</Link>
              <Link href="/benchmarks/custom" className="inline-flex items-center rounded-lg border border-blue-200 px-3 py-2 text-sm no-underline hover:border-blue-300 hover:text-blue-700 dark:border-blue-900/60 dark:hover:border-blue-700 dark:hover:text-blue-300">Custom Benchmarks 보기</Link>
            </div>
          </div>
        </div>
      </section>

      {finding && (
        <section className="rounded-xl border border-blue-200 bg-blue-50/60 p-5 dark:border-blue-900/50 dark:bg-blue-950/20" aria-labelledby="local-benchmark-finding-heading">
          <h2 id="local-benchmark-finding-heading" className="text-sm font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300">Verified Project Finding</h2>
          <p className="mt-3 text-base leading-relaxed">{finding.statement}</p>
          <div className="mt-4 grid gap-4 text-sm md:grid-cols-2">
            <div>
              <p className="font-semibold text-foreground">Evidence</p>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-muted-foreground">{finding.evidence.map(item => <li key={item}>{item}</li>)}</ul>
            </div>
            <div>
              <p className="font-semibold text-foreground">Scope</p>
              <p className="mt-1 leading-relaxed text-muted-foreground">{finding.scope}</p>
              {finding.confidence && <p className="mt-2 text-xs text-muted-foreground">Confidence · {finding.confidence}</p>}
            </div>
          </div>
        </section>
      )}

      {metrics.length > 0 && (
        <section aria-labelledby="local-benchmark-metrics-heading">
          <div className="mb-4 flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" /><h2 id="local-benchmark-metrics-heading" className="text-xl font-bold">핵심 결과</h2></div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {metrics.map(metric => <div key={metric.label} className="rounded-xl border border-border bg-white p-4 dark:bg-gray-900"><p className="text-xs text-muted-foreground">{metric.label}</p><p className="mt-2 text-xl font-bold tracking-tight">{metric.value}</p>{metric.note && <p className="mt-1 text-xs text-muted-foreground">{metric.note}</p>}</div>)}
          </div>
        </section>
      )}

      {timeline.length > 0 && (
        <section aria-labelledby="local-benchmark-log-heading">
          <div className="mb-4 flex items-center gap-2"><Calendar className="h-5 w-5 text-muted-foreground" /><h2 id="local-benchmark-log-heading" className="text-xl font-bold">주요 실험 기록</h2></div>
          <div className="space-y-3">
            {timeline.map((item, index) => (
              <article key={`${item.date}-${item.name}-${index}`} className="rounded-xl border border-border bg-white p-4 dark:bg-gray-900">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0"><h3 className="text-sm font-semibold leading-snug">{item.name}</h3>{item.result && <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.result}</p>}</div>
                  <div className="flex shrink-0 items-center gap-2 pl-0 text-xs text-muted-foreground"><span>{item.date || '날짜 미기록'}</span><span>{item.status}</span>{item.blogSlug && <Link href={item.blogSlug} className="text-blue-600 no-underline hover:underline dark:text-blue-400">원문</Link>}</div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </>
  )
}

function AutonomousBlogOverview({ experiment, live }: { experiment: (typeof experiments)[number]; live: typeof AUTONOMOUS_AI_BLOG_LIVE }) {
  const publications = live.recentPublications.slice(0, 3)
  const operations = live.timeline.slice(0, 5)
  const lastRunDate = live.lastRunAt?.slice(0, 10).replaceAll('-', '.') || '날짜 미기록'
  return (
    <>
      <section className="rounded-2xl border border-purple-200 bg-purple-50/50 p-5 dark:border-purple-900/50 dark:bg-purple-950/15" aria-labelledby="autonomous-overview-heading">
        <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
          <FlaskConical className="h-5 w-5" aria-hidden="true" />
          <h2 id="autonomous-overview-heading" className="text-xl font-bold">실험 목적과 관찰</h2>
        </div>
        <p className="mt-3 max-w-3xl text-base leading-relaxed">{experiment.whyText}</p>
        {live.latestActivity?.summary && <p className="mt-4 max-w-3xl rounded-xl border border-purple-200/80 bg-white/70 p-4 text-sm leading-relaxed dark:border-purple-900/50 dark:bg-gray-900/60"><strong className="text-foreground">최근 관찰 · </strong>{live.latestActivity.summary}</p>}
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-purple-200/80 bg-white/80 p-4 dark:border-purple-900/50 dark:bg-gray-900/60">
            <h3 className="font-semibold">AI 편집 모델</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">AI가 주제를 고르고, 자료를 비교하고, 글의 형식과 발행 여부를 판단합니다. 사람에게 지시받은 자동화가 아니라 편집권을 위임한 운영 모델입니다.</p>
          </div>
          <div className="rounded-xl border border-purple-200/80 bg-white/80 p-4 dark:border-purple-900/50 dark:bg-gray-900/60">
            <h3 className="font-semibold">유라의 역할</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">유라는 후보 조사·출처 교차검증·초안 편집·발행 판단을 담당합니다. 사람의 개입은 보안·인프라·서비스 장애와 실험 지속 여부 같은 운영 경계에 둡니다.</p>
          </div>
        </div>
      </section>

      <section aria-labelledby="autonomous-snapshot-heading">
        <div className="mb-4 flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" /><h2 id="autonomous-snapshot-heading" className="text-xl font-bold">공개 운영 현황</h2></div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-white p-4 dark:bg-gray-900"><p className="text-xs text-muted-foreground">공개 Field Notes</p><p className="mt-2 text-2xl font-bold">{live.publishedCount}</p></div>
          <div className="rounded-xl border border-border bg-white p-4 dark:bg-gray-900"><p className="text-xs text-muted-foreground">보류된 후보</p><p className="mt-2 text-2xl font-bold">{live.heldCount}</p></div>
          <div className="rounded-xl border border-border bg-white p-4 dark:bg-gray-900"><p className="text-xs text-muted-foreground">최근 편집 cycle</p><p className="mt-2 text-sm font-semibold">{lastRunDate}</p></div>
        </div>
      </section>

      <section aria-labelledby="autonomous-publications-heading">
        <div className="mb-4"><h2 id="autonomous-publications-heading" className="text-xl font-bold">최근 공개 글</h2><p className="mt-1 text-sm text-muted-foreground">글 전문은 Agent Field Notes가 보관하며, 여기에는 최근 공개 결과와 canonical 링크만 남깁니다.</p></div>
        {publications.length > 0 ? (
          <div className="space-y-3">
            {publications.map(publication => (
              <article key={publication.externalUrl} className="rounded-xl border border-border bg-white p-4 dark:bg-gray-900">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0"><h3 className="font-semibold leading-snug">{publication.title}</h3><p className="mt-1 text-xs text-muted-foreground">{publication.publishedAt?.slice(0, 10).replaceAll('-', '.') || '날짜 미기록'}</p></div>
                  <a href={publication.externalUrl} target="_blank" rel="noopener noreferrer" className="shrink-0 text-sm font-medium text-purple-700 no-underline hover:underline dark:text-purple-300">원문 보기 →</a>
                </div>
              </article>
            ))}
          </div>
        ) : <p className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">아직 공개된 글이 없습니다.</p>}
      </section>

      {live.nextGoals.length > 0 && (
        <section aria-labelledby="autonomous-next-goals-heading">
          <div className="mb-4"><h2 id="autonomous-next-goals-heading" className="text-xl font-bold">다음 목표</h2><p className="mt-1 text-sm text-muted-foreground">다음 편집 cycle에서 검증할 운영 가설입니다.</p></div>
          <ul className="grid gap-3 md:grid-cols-2">{live.nextGoals.map(goal => <li key={goal} className="rounded-xl border border-border bg-white p-4 text-sm leading-relaxed dark:bg-gray-900">{goal}</li>)}</ul>
        </section>
      )}

      {operations.length > 0 && (
        <section aria-labelledby="autonomous-changes-heading">
          <div className="mb-4"><h2 id="autonomous-changes-heading" className="text-xl font-bold">최근 운영 기록</h2><p className="mt-1 text-sm text-muted-foreground">편집 결과와 분리해, 공개 운영에서 확인한 주요 변화만 남깁니다.</p></div>
          <div className="space-y-3">{operations.map((item, index) => <article key={`${item.date}-${item.name}-${index}`} className="rounded-xl border border-border bg-muted/30 p-4"><div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground"><span>{item.date}</span><span>·</span><span>{item.status}</span></div><h3 className="mt-2 text-sm font-semibold">{item.name}</h3><p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.result}</p></article>)}</div>
        </section>
      )}

      <section aria-labelledby="autonomous-retrospective-heading">
        <h2 id="autonomous-retrospective-heading" className="text-xl font-bold">현재까지의 회고</h2>
        <p className="mt-2 rounded-xl border border-border bg-muted/30 p-5 text-sm leading-relaxed text-muted-foreground">{live.retrospective || '아직 최종 회고 시점은 아닙니다. 운영이 더 이어진 뒤 주제 선택, 출처 품질, 발행 판단의 변화를 정리합니다.'}</p>
      </section>
    </>
  )
}

function CreativeTestOverview({ experiment }: { experiment: (typeof experiments)[number] }) {
  return (
    <section className="rounded-2xl border border-sky-200 bg-sky-50/50 p-5 dark:border-sky-900/50 dark:bg-sky-950/15" aria-labelledby="creative-test-result-heading">
      <div className="flex items-center gap-2 text-sky-700 dark:text-sky-300">
        <FlaskConical className="h-5 w-5" aria-hidden="true" />
        <h2 id="creative-test-result-heading" className="text-xl font-bold">Creative Test 결과</h2>
      </div>
      <p className="mt-3 max-w-3xl text-base leading-relaxed">{experiment.whyText}</p>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-sky-200/80 bg-white/80 p-4 dark:border-sky-900/50 dark:bg-gray-900/60">
          <h3 className="font-semibold">비교한 두 레인</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">GPT Image는 포즈 시트를 직접 만들고, LTX 2.5는 시작 이미지에서 움직임을 만든 뒤 프레임을 추출했습니다. 두 결과를 같은 모션 Showcase에서 비교할 수 있습니다.</p>
        </div>
        <div className="rounded-xl border border-sky-200/80 bg-white/80 p-4 dark:border-sky-900/50 dark:bg-gray-900/60">
          <h3 className="font-semibold">공개 Showcase</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">생성 방식보다 실제 게임 에셋으로 쓸 수 있는지에 초점을 둔 비교 결과입니다.</p>
          <Link href="/ai-game-assets.html" className="mt-4 inline-flex items-center rounded-lg bg-foreground px-3 py-2 text-sm text-background no-underline hover:opacity-80">Sprite Motion Demo 보기 →</Link>
        </div>
      </div>
    </section>
  )
}

export const revalidate = 60

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const experiment = experiments.find(item => item.id === id)
  if (!experiment || experiment.isDummy) return { title: 'Lab Not Found', robots: { index: false, follow: false } }

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
  if (!sourceExperiment || sourceExperiment.isDummy) notFound()

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
  const latestActivitySummary = latestActivity?.result
  const latestActivityDate = latestActivity?.date
  const timeline = getSortedTimeline(experiment)
  const isLocalBenchmark = id === 'local-llm-benchmark'
  const isAutonomousBlog = id === 'autonomous-ai-blog'
  const isCreativeTest = id === 'ai-game-assets-sprite-lab'
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
          {isLocalBenchmark && <LocalBenchmarkHistory experiment={experiment} />}
          {isCreativeTest && <CreativeTestOverview experiment={experiment} />}

          {!isLocalBenchmark && !isAutonomousBlog && !isCreativeTest && <section className="rounded-xl border border-blue-200 bg-blue-50/60 p-5 dark:border-blue-900/50 dark:bg-blue-950/20" aria-labelledby="project-finding-heading">
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
          </section>}

          {!isLocalBenchmark && !isAutonomousBlog && !isCreativeTest && latestActivitySummary && (
            <section className="rounded-xl border border-border bg-muted/30 p-5" aria-labelledby="latest-activity-heading">
              <h2 id="latest-activity-heading" className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Latest Activity</h2>
              <p className="mt-3 text-base leading-relaxed">{latestActivitySummary}</p>
              <p className="mt-3 text-xs text-muted-foreground">{latestActivityDate || '날짜 미기록'}{latestActivity?.name ? ` · ${latestActivity.name}` : ''}</p>
            </section>
          )}

          {!isLocalBenchmark && !isAutonomousBlog && !isCreativeTest && (keyMetrics.length > 0 || keyResults.length > 0) && (
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

          {isAutonomousBlog && autonomousLive && <AutonomousBlogOverview experiment={experiment} live={autonomousLive} />}

          {!isLocalBenchmark && !isAutonomousBlog && !isCreativeTest && <ProjectFeedOutputs outputs={feedOutputs} />}

          {!isLocalBenchmark && !isAutonomousBlog && !isCreativeTest && <section aria-labelledby="experiment-log-heading">
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
          </section>}

          {!isLocalBenchmark && !isAutonomousBlog && !isCreativeTest && <RelatedAssets links={getProjectRelatedLinks(experiment, id)} title="Related" />}

        </main>
      </div>
    </div>
  )
}
