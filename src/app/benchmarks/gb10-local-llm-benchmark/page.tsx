import { permanentRedirect } from 'next/navigation'

export default function LegacyIntegratedBenchmarkRoute() {
  permanentRedirect('/benchmarks')
}
