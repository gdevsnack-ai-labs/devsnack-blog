import { permanentRedirect } from 'next/navigation'

export default function LegacyBenchmarkReleasePage() {
  permanentRedirect('/benchmarks/gb10-local-llm-benchmark')
}
