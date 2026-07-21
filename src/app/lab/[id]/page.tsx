import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, FileText, Video, ExternalLink, CheckCircle2, Sparkles, Calendar, Clock } from 'lucide-react'
import { ProgressBar } from '@/components/progress-bar'
import { experiments, type PartStatus } from '@/data/experiments'
import { supabase } from '@/lib/supabase'
import type { BlogId, BlogColor } from '@/lib/colors'

export const revalidate = 60
export const dynamicParams = true

const STATUS_META: Record<string, { icon: typeof CheckCircle2; color: string; label: string }> = {
  '완료':   { icon: CheckCircle2, color: 'text-green-600 dark:text-green-400', label: '완료' },
  '진행중': { icon: Sparkles,     color: 'text-blue-600 dark:text-blue-400',   label: '진행중' },
  '예정':   { icon: Calendar,     color: 'text-orange-500 dark:text-orange-400', label: '예정' },
  '예약':   { icon: Clock,        color: 'text-gray-400',                       label: '예약' },
}

const STATUS_BADGE: Record<string, string> = {
  '진행중': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  '완료':   'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  '예정':   'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  '보류':   'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  '미정':   'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
}

async function getBlogPosts(slugs: string[]) {
  if (!slugs.length) return []
  const { data } = await supabase
    .from('posts')
    .select('slug, blog_id, title, published')
    .in('slug', slugs.map(s => s.replace('/devsnack/', '').replace('/stock/', '')))
    .eq('status', 'live')
    .order('published', { ascending: false })
  return data || []
}

export default async function LabDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const exp = experiments.find(e => e.id === id)
  if (!exp) notFound()

  const relatedPosts = await getBlogPosts(exp.blogPosts || [])

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* 뒤로 가기 */}
        <Link href="/lab" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground no-underline mb-6">
          <ArrowLeft className="w-4 h-4" />
          Lab으로 돌아가기
        </Link>

        {/* 헤더 */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{exp.name}</h1>
            <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_BADGE[exp.status] || ''}`}>
                {exp.status}
              </span>
              {exp.startedAt && <span>Started: {exp.startedAt}</span>}
            </div>
          </div>
          <ProgressBar value={exp.progress} color={exp.color} showLabel size="md" />
        </div>

        {/* 설명 */}
        <section className="mb-8">
          <p className="text-base leading-relaxed">{exp.description}</p>
        </section>

        {/* Why */}
        {exp.whyText && (
          <section className="mb-8 p-5 bg-muted/30 rounded-xl border border-border">
            <h2 className="text-sm font-semibold mb-2 text-muted-foreground">🤔 왜 만들었는가</h2>
            <p className="text-sm leading-relaxed">{exp.whyText}</p>
          </section>
        )}

        {/* 2-칼럼: 타임라인 + Next Goals */}
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          {/* 타임라인 */}
          {exp.timeline && exp.timeline.length > 0 && (
            <div className="border border-border rounded-xl p-5 bg-white dark:bg-gray-900">
              <h2 className="text-lg font-bold mb-4">📅 Timeline</h2>
              <div className="space-y-3">
                {exp.timeline.map((t, i) => {
                  const m = STATUS_META[t.status]
                  const Icon = m?.icon || Clock
                  return (
                    <div key={i} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Icon className={`w-4 h-4 ${m?.color || ''} shrink-0`} />
                        <div className="min-w-0">
                          <span className="text-sm truncate block">{t.name}</span>
                          {t.result && (
                            <span className="text-[11px] text-muted-foreground/70 block truncate">{t.result}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {t.date && <span className="text-xs text-muted-foreground">{t.date}</span>}
                        <span className={`text-xs font-medium ${m?.color || ''}`}>{m?.label || t.status}</span>
                        {t.blogSlug && (
                          <a
                            href={t.blogSlug}
                            className="inline-flex items-center text-[10px] text-blue-500 hover:text-blue-700 no-underline ml-1"
                            title="관련 블로그 글"
                          >
                            →Blog
                          </a>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Next Goals */}
          {exp.nextGoals && exp.nextGoals.length > 0 && (
            <div className="border border-border rounded-xl p-5 bg-white dark:bg-gray-900">
              <h2 className="text-lg font-bold mb-4">🎯 Next Goals</h2>
              <div className="space-y-2">
                {exp.nextGoals.map((goal, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                    <span>{goal}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Links */}
        <section className="mb-8 border border-border rounded-xl p-5 bg-white dark:bg-gray-900">
          <h2 className="text-lg font-bold mb-4">🔗 Links</h2>
          <div className="flex flex-wrap gap-3">
            {relatedPosts.length > 0 && (
              relatedPosts.map(post => (
                <Link
                  key={post.slug}
                  href={`/${post.blog_id}/${post.slug}`}
                  className="inline-flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40 no-underline transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  {post.title.length > 40 ? post.title.slice(0, 40) + '…' : post.title}
                </Link>
              ))
            )}
            {exp.youtubeVideos && exp.youtubeVideos.length > 0 && (
              exp.youtubeVideos.map(vid => (
                <a
                  key={vid}
                  href={`https://youtube.com/watch?v=${vid}`}
                  target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/40 no-underline transition-colors"
                >
                  <Video className="w-4 h-4" />
                  YouTube
                </a>
              ))
            )}
            {exp.githubUrl && (
              <a
                href={exp.githubUrl}
                target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-muted-foreground hover:text-foreground no-underline transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                GitHub
              </a>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
