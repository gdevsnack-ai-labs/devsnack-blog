import { ExternalLink, Route, Music, FlaskConical, BrainCircuit } from 'lucide-react'
import { BlogHeader } from '@/components/blog-header'
import Link from 'next/link'

const channels = [
  { title: 'AI 연구 결과', sub: '@DevsnackAILab', url: 'https://www.youtube.com/@DevsnackAILab',
    icon: Route, desc: 'LLM 벤치마크, AI 인프라 실험, 오픈소스 모델 분석.', color: 'text-red-500', bg: 'bg-red-100 dark:bg-red-900/30' },
  { title: 'AI 음악 (MelodyPie 90s)', sub: '@MelodyPie90s', url: 'https://www.youtube.com/@MelodyPie90s',
    icon: Music, desc: 'AI로 생성한 90년대 감성의 음악과 사운드트랙.', color: 'text-purple-500', bg: 'bg-purple-100 dark:bg-purple-900/30' },
  { title: 'Epoch Unseen', sub: '@EpochUnseen', url: 'https://www.youtube.com/@EpochUnseen',
    icon: FlaskConical, desc: '역사/과학 단편 애니메이션 쇼츠.', color: 'text-cyan-500', bg: 'bg-cyan-100 dark:bg-cyan-900/30' },
  { title: '과학/기술 (SciNova)', sub: '@SciNovaScience', url: 'https://www.youtube.com/@SciNovaScience',
    icon: FlaskConical, desc: '과학 기술, 혁신, 미래 트렌드 분석.', color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  { title: '심리/철학 (PsycheKiln)', sub: '@PsycheKiln', url: 'https://www.youtube.com/@PsycheKiln',
    icon: BrainCircuit, desc: '심리학, 철학, 인간의 마음 탐구.', color: 'text-amber-500', bg: 'bg-amber-100 dark:bg-amber-900/30' },
]

export default function LinksPage() {
  return (
    <div className="min-h-screen">
      <BlogHeader title="DevSnack Blog" subtitle="개발자의 시선으로 보는 AI" icon="terminal" color="blue" />
      <main className="max-w-2xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold mb-2">링크 / 정보</h1>
        <p className="text-muted-foreground mb-8">DevSnack 블로그 및 관련 채널, 소스 코드를 소개합니다.</p>

        <h2 className="text-xl font-semibold mb-4">YouTube 채널</h2>
        <div className="space-y-3 mb-10">
          {channels.map((ch) => {
            const Icon = ch.icon
            return (
              <a key={ch.url} href={ch.url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-4 p-4 rounded-xl border bg-white dark:bg-gray-900 hover:shadow-md transition-all no-underline group">
                <div className={`w-10 h-10 rounded-lg ${ch.bg} flex items-center justify-center shrink-0`}>
                  <Icon className={`w-5 h-5 ${ch.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {ch.title}
                  </div>
                  <div className="text-xs text-muted-foreground">{ch.desc}</div>
                </div>
                <ExternalLink className="w-4 h-4 text-muted-foreground shrink-0" />
              </a>
            )
          })}
        </div>

        <h2 className="text-xl font-semibold mb-4">오픈소스 / GitHub</h2>
        <a href="https://github.com/gdevsnack-ai-labs/devsnack-blog" target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-4 p-4 rounded-xl border bg-white dark:bg-gray-900 hover:shadow-md transition-all no-underline group mb-10">
          <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <span className="text-lg font-bold text-gray-600 dark:text-gray-300">&lt;/&gt;</span>
          </div>
          <div className="flex-1">
            <div className="font-medium group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              DevSnack Blog — GitHub 저장소
            </div>
            <div className="text-xs text-muted-foreground">Next.js + Supabase + Vercel — 4개 블로그 통합</div>
          </div>
          <ExternalLink className="w-4 h-4 text-muted-foreground shrink-0" />
        </a>

        <h2 className="text-xl font-semibold mb-4">블로그</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Link href="/devsnack" className="p-4 rounded-xl border bg-white dark:bg-gray-900 hover:shadow-md transition-all no-underline group">
            <div className="font-medium group-hover:text-blue-600 transition-colors">DevSnack</div>
            <div className="text-xs text-muted-foreground">로컬 LLM, AI 인프라, 벤치마크</div>
          </Link>
          <Link href="/stock" className="p-4 rounded-xl border bg-white dark:bg-gray-900 hover:shadow-md transition-all no-underline group">
            <div className="font-medium group-hover:text-green-600 transition-colors">StockPulse</div>
            <div className="text-xs text-muted-foreground">AI 기반 주식 시장 분석</div>
          </Link>
          <Link href="/realestate" className="p-4 rounded-xl border bg-white dark:bg-gray-900 hover:shadow-md transition-all no-underline group">
            <div className="font-medium group-hover:text-orange-600 transition-colors">부동산 실거래</div>
            <div className="text-xs text-muted-foreground">아파트 실거래가 동향</div>
          </Link>
          <Link href="/aitech" className="p-4 rounded-xl border bg-white dark:bg-gray-900 hover:shadow-md transition-all no-underline group">
            <div className="font-medium group-hover:text-purple-600 transition-colors">AI Tech Insight</div>
            <div className="text-xs text-muted-foreground">AI 뉴스 및 산업 분석</div>
          </Link>
        </div>
      </main>
      <footer className="border-t mt-12">
        <div className="max-w-6xl mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          Built with Next.js, Supabase & Vercel · © 2026 DevSnack
        </div>
      </footer>
    </div>
  )
}
