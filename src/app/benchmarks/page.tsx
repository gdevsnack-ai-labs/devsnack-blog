import { BenchmarkStandardPage } from '@/components/benchmark-standard-page'
import { buildRouteMetadata } from '@/lib/seo/metadata'

export const revalidate = 60

export const metadata = buildRouteMetadata({
  title: 'DGX Spark GB10 로컬 LLM Benchmark — DevSnack',
  description: 'NVIDIA DGX Spark GB10에서 GGUF·llama.cpp 모델을 같은 조건으로 비교한 최신 통합 local LLM Benchmark',
  canonicalPath: '/benchmarks',
  language: 'ko',
  section: 'Benchmarks',
  keywords: ['NVIDIA DGX Spark', 'GB10', 'local LLM benchmark', 'GGUF', 'llama.cpp', 'Qwen', 'Gemma', 'N2.5 Mini', 'N2 Mini', 'Ling 3.0', 'local AI'],
})

export default function BenchmarksPage() {
  return <BenchmarkStandardPage />
}
