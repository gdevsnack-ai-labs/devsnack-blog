import Link from 'next/link'
import { BlogHeader } from '@/components/blog-header'
import { ArrowLeft, Mail, MapPin } from 'lucide-react'

export default function ContactPage() {
  return (
    <div className="min-h-screen">
      <BlogHeader title="DevSnack Blog" subtitle="개발자의 시선으로 보는 AI" icon="terminal" color="blue" />
      <main className="max-w-3xl mx-auto px-4 py-10">
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 no-underline">
          <ArrowLeft className="w-4 h-4" /> 홈으로
        </Link>
        <article className="prose dark:prose-invert max-w-none">
          <h1>문의하기 (Contact)</h1>
          <p>블로그 콘텐츠, 협업 제안, 오류 제보 등 언제든지 연락 주세요.</p>
          <div className="not-prose bg-muted rounded-xl p-6 my-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Mail className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">이메일</div>
                <a href="mailto:gdevsnack@gmail.com" className="text-lg font-medium text-blue-600 dark:text-blue-400 no-underline hover:underline">gdevsnack@gmail.com</a>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <MapPin className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">위치</div>
                <div className="text-lg font-medium">대한민국</div>
              </div>
            </div>
          </div>
          <p>보통 영업일 기준 1~2일 이내에 답변 드립니다.</p>
        </article>
      </main>
    </div>
  )
}
