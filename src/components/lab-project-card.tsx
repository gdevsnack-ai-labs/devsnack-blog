import Link from 'next/link'
import { ArrowRight, FileText, Video, ExternalLink } from 'lucide-react'
import { ProgressBar } from './progress-bar'
import type { Experiment } from '@/data/experiments'

export function LabProjectCard({ experiment }: { experiment: Experiment }) {
  const { id, name, description, progress, color, status, category, startedAt, whyText, nextGoals, timeline, blogPosts, youtubeVideos, githubUrl } = experiment

  const statusColors: Record<string, string> = {
    '진행중': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    '완료':   'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    '예정':   'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
    '보류':   'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    '미정':   'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
  }

  return (
    <div className="border border-border rounded-xl p-6 bg-white dark:bg-gray-900 hover:border-blue-200 dark:hover:border-blue-800 transition-colors">
      {/* 헤더 */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <Link href={`/lab/${id}`} className="no-underline group">
          <h3 className="text-lg font-bold group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {name}
          </h3>
        </Link>
        <span className={`shrink-0 px-2 py-0.5 rounded text-xs font-medium ${statusColors[status] || 'bg-gray-100 text-gray-600'}`}>
          {status}
        </span>
      </div>

      {/* 설명 */}
      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{description}</p>

      {/* 시작일 */}
      {startedAt && (
        <p className="text-xs text-muted-foreground/70 mb-3">
          Started: {startedAt}
        </p>
      )}

      {/* 진행률 */}
      <div className="mb-3">
        <ProgressBar value={progress} color={color} showLabel />
      </div>

      {/* Why (접힌 상태로 — 간략) */}
      {whyText && (
        <p className="text-xs text-muted-foreground/80 mb-3 line-clamp-2 italic">
          {whyText}
        </p>
      )}

      {/* 타임라인 (최대 3개) + 결과 */}
      {timeline && timeline.length > 0 && (
        <div className="space-y-1 mb-3">
          {timeline.slice(0, 3).map((t, i) => {
            const dotColor =
              t.status === '완료'   ? 'bg-green-500' :
              t.status === '진행중' ? 'bg-blue-500' :
              t.status === '예정'   ? 'bg-gray-300 dark:bg-gray-600' :
                                      'bg-gray-200 dark:bg-gray-700'
            return (
              <div key={i} className="flex items-center gap-2 text-xs">
                <span className={`w-1.5 h-1.5 rounded-full ${dotColor} shrink-0`} />
                <div className="min-w-0 flex-1">
                  <span className="text-muted-foreground">{t.name}</span>
                  {t.result && (
                    <span className="text-[10px] text-muted-foreground/60 block truncate">{t.result}</span>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {t.date && <span className="text-muted-foreground/60">{t.date}</span>}
                  {t.blogSlug && (
                    <a href={t.blogSlug} className="text-blue-500 hover:text-blue-700 no-underline" title="블로그 글">→</a>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 링크 */}
      <div className="flex items-center gap-3 pt-2 border-t border-border">
        {blogPosts && blogPosts.length > 0 && (
          <Link href={blogPosts[0]} className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline no-underline">
            <FileText className="w-3 h-3" />
            Blog
            {blogPosts.length > 1 && <span className="text-muted-foreground">+{blogPosts.length - 1}</span>}
          </Link>
        )}
        {youtubeVideos && youtubeVideos.length > 0 && (
          <a href={`https://youtube.com/watch?v=${youtubeVideos[0]}`} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-red-600 dark:text-red-400 hover:underline no-underline">
            <Video className="w-3 h-3" />
            YouTube
          </a>
        )}
        {githubUrl && (
          <a href={githubUrl} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground no-underline">
            <ExternalLink className="w-3 h-3" />
            GitHub
          </a>
        )}
        <Link href={`/lab/${id}`} className="ml-auto inline-flex items-center gap-0.5 text-xs text-muted-foreground hover:text-foreground no-underline">
          상세 <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  )
}
