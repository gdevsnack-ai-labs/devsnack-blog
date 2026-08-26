import Link from 'next/link'
import {
  Activity,
  Bot,
  CheckCircle2,
  ExternalLink,
  FlaskConical,
  Link2,
  ShieldAlert,
  XCircle,
} from 'lucide-react'
import {
  formatGeneratedAt,
  humanReviewLabel,
  normalizeProvenance,
  sourceCountLabel,
} from '@/lib/provenance'
import { feedProjectForBlog } from '@/lib/ia/feed-projects'

export type StockPulsePredictionSummary = {
  date: string
  direction: string | null
  kospi_target: string | null
  actual_direction: string | null
  actual_kospi_close: number | null
  accuracy_score: number | null
  is_correct: boolean | null
}

type FeedProvenanceProps = {
  blogId: 'aitech' | 'stockpulse'
  provenance: unknown
  published?: string | null
  prediction?: StockPulsePredictionSummary | null
}

function dateLabel(value: string | null | undefined): string | null {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).format(date)
}

function Score({ score }: { score: number | null }) {
  if (score === null) return null
  return <span>{Math.round(score * 100)}%</span>
}

function AITechProvenance({ provenance, published }: Omit<FeedProvenanceProps, 'blogId' | 'prediction'>) {
  const normalized = normalizeProvenance(provenance)
  const generatedAt = formatGeneratedAt(normalized?.generated_at) || dateLabel(published)
  const review = humanReviewLabel(normalized)
  const sourceUrls = normalized?.source_urls || []
  const project = feedProjectForBlog('aitech')

  return (
    <aside className="mb-8 rounded-xl border border-purple-200 bg-purple-50/60 p-4 dark:border-purple-900/50 dark:bg-purple-950/20" aria-label="AI Tech Feed provenance">
      <div className="flex items-start gap-3">
        <Bot className="mt-0.5 h-5 w-5 shrink-0 text-purple-600 dark:text-purple-400" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-semibold">
            <span>AI Tech</span>
            <span className="text-purple-600 dark:text-purple-400">· Automated Feed</span>
          </div>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">자동 수집·분석·생성으로 만들어진 AI 기술·산업 동향 Feed입니다.</p>
          <dl className="mt-3 grid gap-x-4 gap-y-2 text-xs text-muted-foreground sm:grid-cols-2">
            <div><dt className="inline font-medium text-foreground">생성 시각: </dt><dd className="inline">{generatedAt || '기록 없음'}</dd></div>
            <div><dt className="inline font-medium text-foreground">출처: </dt><dd className="inline">{sourceCountLabel(normalized)}</dd></div>
            {normalized?.pipeline && <div><dt className="inline font-medium text-foreground">Pipeline: </dt><dd className="inline">{normalized.pipeline}</dd></div>}
            {review && <div><dt className="inline font-medium text-foreground">검수: </dt><dd className="inline">{review}</dd></div>}
          </dl>
          {sourceUrls.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-purple-200/70 pt-3 dark:border-purple-900/50">
              <span className="inline-flex items-center gap-1 text-xs font-medium text-foreground"><Link2 className="h-3.5 w-3.5" /> 원문 출처</span>
              {sourceUrls.slice(0, 3).map((url, index) => (
                <a key={url} href={url} target="_blank" rel="noreferrer" className="inline-flex max-w-full items-center gap-1 truncate text-xs text-purple-700 underline dark:text-purple-300">
                  출처 {index + 1}<ExternalLink className="h-3 w-3 shrink-0" />
                </a>
              ))}
            </div>
          )}
          {project && (
            <div className="mt-3 border-t border-purple-200/70 pt-3 text-xs dark:border-purple-900/50">
              <Link href={project.href} className="inline-flex items-center gap-1 font-medium text-purple-700 no-underline hover:underline dark:text-purple-300">
                <Bot className="h-3.5 w-3.5" /> 이 Feed를 생성한 자동화 시스템 보기 <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}

function StockPulseProvenance({ provenance, prediction }: Omit<FeedProvenanceProps, 'blogId' | 'published'>) {
  const normalized = normalizeProvenance(provenance)
  const reportDate = normalized?.report_date || prediction?.date || null
  const projectHref = '/labs/stockpulse-ai-self-improvement'

  return (
    <aside className="mb-8 rounded-xl border border-green-200 bg-green-50/60 p-4 dark:border-green-900/50 dark:bg-green-950/20" aria-label="StockPulse experiment provenance">
      <div className="flex items-start gap-3">
        <FlaskConical className="mt-0.5 h-5 w-5 shrink-0 text-green-600 dark:text-green-400" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-semibold">
            <span>StockPulse</span>
            <span className="text-green-700 dark:text-green-300">· 자기개선 AI 실험 Output</span>
          </div>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">시장 데이터를 예측하고, 실제 결과를 평가한 뒤, 다음 전략을 수정하는 실험의 공개 결과입니다.</p>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {reportDate && <span className="rounded-full bg-white/70 px-2 py-1 dark:bg-gray-900/50">실험 일자 {reportDate}</span>}
            {normalized?.session && <span className="rounded-full bg-white/70 px-2 py-1 dark:bg-gray-900/50">{normalized.session === 'morning' ? '아침 예측' : normalized.session}</span>}
          </div>
          {prediction && (
            <div className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
              <div className="rounded-lg border border-green-200/80 bg-white/70 p-3 dark:border-green-900/50 dark:bg-gray-900/50">
                <div className="flex items-center gap-1 font-medium text-foreground"><Activity className="h-3.5 w-3.5" /> 예측·평가</div>
                <p className="mt-1 text-muted-foreground">예측 {prediction.direction || '기록 없음'}{prediction.kospi_target ? ` · 목표 ${prediction.kospi_target}` : ''}</p>
                {prediction.is_correct === true && <p className="mt-1 inline-flex items-center gap-1 text-green-700 dark:text-green-300"><CheckCircle2 className="h-3.5 w-3.5" /> 평가 성공 · <Score score={prediction.accuracy_score} /></p>}
                {prediction.is_correct === false && <p className="mt-1 inline-flex items-center gap-1 text-red-700 dark:text-red-300"><XCircle className="h-3.5 w-3.5" /> 평가 실패 · <Score score={prediction.accuracy_score} /></p>}
                {prediction.is_correct === null && <p className="mt-1 text-muted-foreground">아직 평가 전</p>}
              </div>
              <div className="rounded-lg border border-green-200/80 bg-white/70 p-3 dark:border-green-900/50 dark:bg-gray-900/50">
                <div className="font-medium text-foreground">실제 결과</div>
                <p className="mt-1 text-muted-foreground">
                  {prediction.actual_direction ? `실제 방향 ${prediction.actual_direction}` : '평가 대기 중'}
                  {prediction.actual_kospi_close !== null ? ` · 종가 ${prediction.actual_kospi_close.toLocaleString('ko-KR')}` : ''}
                </p>
              </div>
            </div>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-green-200/70 pt-3 text-xs dark:border-green-900/50">
            <Link href={projectHref} className="inline-flex items-center gap-1 font-medium text-green-700 no-underline hover:underline dark:text-green-300"><FlaskConical className="h-3.5 w-3.5" /> 이 결과를 만든 StockPulse 실험 보기</Link>
            <span className="inline-flex items-center gap-1 text-muted-foreground"><ShieldAlert className="h-3.5 w-3.5" /> 투자 조언이 아닌 실험 기록</span>
          </div>
        </div>
      </div>
    </aside>
  )
}

export function FeedProvenance(props: FeedProvenanceProps) {
  return props.blogId === 'aitech'
    ? <AITechProvenance {...props} />
    : <StockPulseProvenance {...props} />
}
