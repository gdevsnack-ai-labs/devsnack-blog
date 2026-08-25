import Link from 'next/link'
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BookOpen,
  Database,
  FileText,
  FlaskConical,
  Info,
  Play,
  Server,
} from 'lucide-react'
import { buildRouteMetadata } from '@/lib/seo/metadata'

export const metadata = buildRouteMetadata({
  title: 'About DevSnack',
  description: 'AI와 개발을 직접 조사하고, 만들고, 측정하고, 기록하는 DevSnack의 작업 공간과 정보 구조를 소개합니다.',
  canonicalPath: '/about',
})

const areas = [
  {
    title: 'Stories',
    href: '/devsnack',
    icon: FileText,
    description: '사람의 경험과 해석을 중심으로 편집한 DevSnack의 기술 이야기입니다.',
    action: 'Stories 읽기',
  },
  {
    title: 'Lab',
    href: '/labs',
    icon: FlaskConical,
    description: '직접 만들고, 돌려보고, 실패하면서 확인한 Experiment·Build·System·Creative Test를 모읍니다.',
    action: 'Lab 둘러보기',
  },
  {
    title: 'Benchmarks',
    href: '/benchmarks',
    icon: BarChart3,
    description: 'Target·Environment·Protocol·Result를 확인할 수 있는 published 측정 결과입니다.',
    action: '측정 결과 보기',
  },
  {
    title: 'Knowledge',
    href: '/research',
    icon: BookOpen,
    description: '나중에 다시 찾아볼 기술 지식과 조사 자료를 주제와 관계 중심으로 정리합니다.',
    action: 'Knowledge 찾기',
  },
  {
    title: 'Data',
    href: '/data',
    icon: Database,
    description: 'AI Tech·StockPulse Feed와 부동산·Mining Tracker처럼 자동 갱신되는 정보를 보여줍니다.',
    action: 'Data Hub 보기',
  },
  {
    title: 'Showcase',
    href: '/demos',
    icon: Play,
    description: 'Lab과 생성 작업에서 나온 HTML·이미지·영상 등 직접 실행하거나 재생할 수 있는 결과물입니다.',
    action: '결과물 보기',
  },
] as const

const environment = [
  ['하드웨어', 'NVIDIA DGX Spark GB10 · 128GB unified memory'],
  ['모델·추론', 'llama.cpp · GGUF · llama-server · vLLM'],
  ['생성·미디어', 'ComfyUI · GPT Image · LTX'],
  ['에이전트·자동화', 'Hermes Agent · 로컬 LLM · SearXNG'],
  ['서비스', 'Next.js · Supabase · Vercel'],
] as const

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-5xl px-4 py-8 md:py-12">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground no-underline transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          홈으로
        </Link>

        <header className="mt-10 max-w-3xl">
          <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">About DevSnack</p>
          <h1 className="mt-3 text-3xl font-bold leading-tight tracking-tight md:text-5xl">
            직접 조사하고, 만들고, 측정합니다.
          </h1>
          <p className="mt-5 text-base leading-relaxed text-muted-foreground md:text-lg">
            DevSnack은 로컬 AI와 개발 도구를 직접 다뤄보고, 그 과정에서 나온 실험·측정 결과·기술 지식·자동 갱신 데이터를 남기는 개인 작업 기록입니다.
            완성된 정답만 모으기보다, 무엇을 확인했고 어디서 막혔으며 다음에 무엇을 바꿀지까지 기록하려고 합니다.
          </p>
        </header>

        <section className="mt-12" aria-labelledby="about-areas-heading">
          <div className="mb-5">
            <h2 id="about-areas-heading" className="text-2xl font-bold">DevSnack의 구성</h2>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
              이 영역들은 단순한 메뉴 폴더가 아니라 정보의 목적을 나눈 것입니다. 하나의 Project가 Experiment·Benchmark·Knowledge·Showcase를 함께 만들 수 있으며, 관련된 기록은 서로 연결해 보여줍니다.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {areas.map(area => {
              const Icon = area.icon
              return (
                <Link
                  key={area.title}
                  href={area.href}
                  className="group rounded-2xl border border-border bg-white p-5 no-underline transition-colors hover:border-blue-300 dark:bg-gray-900 dark:hover:border-blue-700"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="rounded-xl bg-blue-100 p-2 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                  </div>
                  <h3 className="mt-4 text-lg font-bold group-hover:text-blue-600 dark:group-hover:text-blue-400">{area.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{area.description}</p>
                  <span className="mt-4 block text-xs font-semibold text-muted-foreground">{area.action} →</span>
                </Link>
              )
            })}
          </div>
        </section>

        <section className="mt-12 grid gap-4 md:grid-cols-2" aria-labelledby="about-principles-heading">
          <div className="rounded-2xl border border-border bg-muted/30 p-5 md:p-6">
            <div className="flex items-center gap-2">
              <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
              <h2 id="about-principles-heading" className="text-xl font-bold">기록하는 방식</h2>
            </div>
            <ul className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">
              <li><strong className="text-foreground">사실과 해석을 구분합니다.</strong> 확인한 사실, 로그에서 관찰한 현상, 그에 대한 판단, 아직 검증하지 않은 계획을 같은 문장처럼 섞지 않습니다.</li>
              <li><strong className="text-foreground">측정 조건을 남깁니다.</strong> 직접 실행한 결과는 가능한 범위에서 대상·환경·방법·비교 기준·한계를 함께 기록합니다.</li>
              <li><strong className="text-foreground">출처와 생성 방식을 구분합니다.</strong> 사람이 편집한 Story, AI-assisted 작업, 자동 생성 Feed, 공개 데이터를 갱신하는 Tracker를 같은 종류의 콘텐츠로 다루지 않습니다.</li>
              <li><strong className="text-foreground">실패도 결과로 취급합니다.</strong> 기대와 다르게 나온 결과는 숨기기보다 원인과 수정·재검증 과정을 남깁니다.</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-border bg-muted/30 p-5 md:p-6">
            <div className="flex items-center gap-2">
              <Server className="h-5 w-5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
              <h2 className="text-xl font-bold">주요 작업 환경</h2>
            </div>
            <dl className="mt-4 divide-y divide-border text-sm">
              {environment.map(([label, value]) => (
                <div key={label} className="grid gap-1 py-3 sm:grid-cols-[110px_1fr] sm:gap-3">
                  <dt className="font-semibold text-foreground">{label}</dt>
                  <dd className="text-muted-foreground">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="mt-12 rounded-2xl border border-blue-200 bg-blue-50/70 p-5 dark:border-blue-900/60 dark:bg-blue-950/20 md:p-6" aria-labelledby="about-start-heading">
          <h2 id="about-start-heading" className="text-xl font-bold">어디서 시작할까요?</h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            최근에 확인한 결과부터 보고 싶다면 Home의 대표 Asset을, 직접 만든 것과 실패 기록이 궁금하다면 Lab을, 재현 가능한 수치가 필요하다면 Benchmarks를 먼저 보시면 됩니다. 전체 기록은 Search에서 찾을 수 있습니다.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/" className="rounded-lg bg-foreground px-3 py-2 text-sm font-medium text-background no-underline hover:opacity-80">대표 기록 보기</Link>
            <Link href="/search" className="rounded-lg border border-border bg-white px-3 py-2 text-sm font-medium no-underline hover:border-foreground/25 dark:bg-gray-900">전체 기록 검색</Link>
          </div>
        </section>

        <section className="mt-12 border-t border-border pt-8" aria-labelledby="about-contact-heading">
          <h2 id="about-contact-heading" className="text-xl font-bold">연락처</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            콘텐츠 오류, 재현되지 않는 설명, 협업 제안은 이메일로 알려주세요.
          </p>
          <a href="mailto:gdevsnack@gmail.com" className="mt-3 inline-block font-semibold text-blue-600 no-underline hover:underline dark:text-blue-400">
            gdevsnack@gmail.com
          </a>
        </section>
      </main>
    </div>
  )
}
