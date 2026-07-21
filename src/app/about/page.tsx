import Link from 'next/link'
import { BlogHeader } from '@/components/blog-header'
import { ArrowLeft } from 'lucide-react'

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      <BlogHeader title="DevSnack Blog" subtitle="개발자의 시선으로 보는 AI" icon="terminal" color="blue" />
      <main className="max-w-3xl mx-auto px-4 py-10">
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 no-underline">
          <ArrowLeft className="w-4 h-4" /> 홈으로
        </Link>
        <article className="prose dark:prose-invert max-w-none">
          <h1>블로그 소개 (About)</h1>
          <p>안녕하세요. <strong>DevSnack</strong>에 오신 것을 환영합니다.</p>
          <p>NVIDIA GB10 Superchip (Grace+Blackwell) 기반의 <strong>DGX Spark GB10</strong> 개인 AI 슈퍼컴퓨터를 직접 운영하며, 로컬 LLM 추론, GGUF 양자화 모델 벤치마크, AI 이미지 생성, 오픈소스 모델 분석을 다루는 기술 블로그입니다.</p>
          <h2>🔬 이 블로그에서 다루는 내용</h2>
          <ul>
            <li><strong>로컬 LLM 벤치마크</strong> — DGX Spark에서 Qwen, Gemma, Nex-N2 등 다양한 GGUF 모델의 실제 성능 측정 및 비교</li>
            <li><strong>AI 인프라 구축</strong> — Hermes Agent, SearXNG, ComfyUI, llama.cpp, vLLM 등 로컬 AI 스택 운영/최적화</li>
            <li><strong>이미지 생성</strong> — Krea 2 Turbo on ComfyUI</li>
            <li><strong>오픈소스 모델 분석</strong> — MoE 구조, 양자화, 최신 공개 모델 실전 성능 검증</li>
            <li><strong>주식 AI 분석</strong> — KOSPI/KOSDAQ ML 예측 모델, 일일 리포트</li>
            <li><strong>부동산 실거래 분석</strong> — 국토부 API 기반 아파트 실거래가 동향</li>
          </ul>
          <h2>🛠 사용 장비 및 기술 스택</h2>
          <table><thead><tr><th>항목</th><th>내용</th></tr></thead>
          <tbody>
            <tr><td>하드웨어</td><td>NVIDIA DGX Spark GB10 (Grace ARM 20C + Blackwell sm_121, 128GB 통합메모리)</td></tr>
            <tr><td>LLM 엔진</td><td>llama.cpp (GGUF), vLLM, llama-server</td></tr>
            <tr><td>이미지 생성</td><td>ComfyUI + Krea 2 Turbo</td></tr>
            <tr><td>AI 에이전트</td><td>Hermes Agent (Nous Research)</td></tr>
            <tr><td>블로그 플랫폼</td><td>Next.js + Supabase + Vercel</td></tr>
          </tbody></table>
          <h2>📊 콘텐츠 철학</h2>
          <p>모든 벤치마크와 성능 데이터는 <strong>직접 측정</strong>한 실제 값입니다. 추정치나 리뷰어 자료를 재가공하지 않습니다. 사용된 명령어, 설정값, 환경 정보는 모두 공개하여 누구나 재현 가능하도록 기록합니다.</p>
          <h2>📬 연락처</h2>
          <p>블로그 콘텐츠, 협업 제안, 오류 제보는 이메일로 연락 주세요.</p>
          <p><strong>Email:</strong> gdevsnack@gmail.com</p>
        </article>
      </main>
    </div>
  )
}
