import Link from 'next/link'
import { BlogHeader } from '@/components/blog-header'
import { ArrowLeft } from 'lucide-react'
import { buildRouteMetadata } from '@/lib/seo/metadata'

export const metadata = buildRouteMetadata({
  title: '개인정보처리방침 — DevSnack',
  description: 'DevSnack의 광고, 분석, 로그 및 문의 처리에 관한 개인정보처리방침입니다.',
  canonicalPath: '/privacy',
})

export default function PrivacyPage() {
  return (
    <div className="min-h-screen">
      <BlogHeader title="DevSnack Blog" subtitle="개발자의 시선으로 보는 AI" icon="terminal" color="blue" />
      <main className="max-w-3xl mx-auto px-4 py-10">
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 no-underline">
          <ArrowLeft className="w-4 h-4" /> 홈으로
        </Link>
        <article className="prose dark:prose-invert max-w-none">
          <h1>개인정보처리방침 (Privacy Policy)</h1>
          <p>본 블로그는 Google AdSense 광고 서비스를 이용하고 있습니다.</p>
          <h2>쿠키(Cookie)의 수집 및 이용</h2>
          <p>구글 및 제3자 벤더는 쿠키를 사용하여 사용자가 해당 웹사이트나 다른 웹사이트에 과거에 방문한 기록을 바탕으로 광고를 게재합니다.</p>
          <p>사용자는 <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer">광고 설정</a>을 방문하여 맞춤형 광고를 사용 중지할 수 있습니다. (또는 <a href="https://www.aboutads.info" target="_blank">aboutads.info</a>를 방문하여 제3자 벤더의 맞춤형 광고 사용을 중지할 수 있습니다.)</p>
          <h2>로그 파일</h2>
          <p>다른 많은 웹사이트와 마찬가지로 본 블로그는 로그 파일을 사용합니다. 로그 파일 내부의 정보에는 인터넷 프로토콜(IP) 주소, 브라우저 유형, 인터넷 서비스 제공 업체(ISP), 날짜/시간 스탬프, 참조/종료 페이지, 클릭 수가 포함됩니다. 이 정보는 트렌드를 분석하고, 사이트를 관리하고, 사이트 내 사용자의 움직임을 추적하고, 인구 통계학적 정보를 수집하는 데 사용됩니다.</p>
          <h2>사이트 이용 데이터</h2>
          <p>사이트는 Vercel Analytics를 통해 방문·사용 패턴을 집계하고, 게시물 조회수 표시를 위해 조회 요청을 기록할 수 있습니다. 댓글 작성 기능은 제공하지 않습니다.</p>
          <h2>문의</h2>
          <p>개인정보 처리 방침에 관한 문의는 <strong>gdevsnack@gmail.com</strong>으로 연락 주세요.</p>
        </article>
      </main>
    </div>
  )
}
