import { notFound } from 'next/navigation'
import Link from 'next/link'
import { supabase, type Post } from '@/lib/supabase'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Calendar, Clock, TrendingUp } from 'lucide-react'
import { ViewCounter } from '@/components/view-counter'
import { BlogHeader } from '@/components/blog-header'

export const revalidate = 60

async function getPost(slug: string): Promise<Post | null> {
  const { data } = await supabase
    .from('posts')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'live')
    .eq('blog_id', 'stockpulse')
    .single()

  return data
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getPost(slug)
  if (!post) return { title: 'Not Found' }
  return {
    title: `${post.title} — StockPulse AI Lab`,
    description: post.seo_desc ?? post.excerpt ?? post.title,
  }
}

export default async function StockPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getPost(slug)
  if (!post) notFound()

  const readingTime = Math.max(1, Math.ceil((post.content?.length || 0) / 2000))

  return (
    <div className="min-h-screen">
      <BlogHeader title="StockPulse AI Lab" subtitle="AI가 분석한 한국 주식 시장" icon="trending" color="green" />

      <div className="max-w-3xl mx-auto px-4 py-4">
        <Link href="/stock" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors no-underline">
          <ArrowLeft className="w-4 h-4" />
          StockPulse 목록으로
        </Link>
      </div>

      <article className="max-w-3xl mx-auto px-4 py-8">
        {post.cover_image && (
          <div className="aspect-[16/7] rounded-xl overflow-hidden mb-8 bg-gray-100 dark:bg-gray-800">
            <img src={post.cover_image} alt={`${post.title} — 대표 이미지`} className="w-full h-full object-cover" />
          </div>
        )}

        <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-4">{post.title}</h1>

        <div className="flex flex-wrap items-center gap-3 mb-8 text-sm text-muted-foreground">
          {post.published && (
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              {new Date(post.published).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            약 {readingTime}분
          </span>
          <ViewCounter slug={post.slug} views={post.views} />
          {post.labels && post.labels.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {post.labels.map((label) => (
                <Badge key={label} variant="secondary" className="text-xs font-normal">{label}</Badge>
              ))}
            </div>
          )}
        </div>

        <div className="border-t mb-8" />

        <div className="prose-devsnack" dangerouslySetInnerHTML={{ __html: post.content }} />
      </article>

      <footer className="border-t mt-16">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <Link href="/stock" className="inline-flex items-center gap-1.5 text-sm text-green-600 dark:text-green-400 hover:underline">
            <ArrowLeft className="w-4 h-4" />
            StockPulse AI Lab 목록으로
          </Link>
        </div>
      </footer>
    </div>
  )
}
