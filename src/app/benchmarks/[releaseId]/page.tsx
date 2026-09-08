import { notFound, permanentRedirect } from 'next/navigation'

const LEGACY_RELEASE_IDS = new Set([
  'gb10-llm-benchmark-v1-20260906',
])

export default async function LegacyBenchmarkReleasePage({ params }: { params: Promise<{ releaseId: string }> }) {
  const { releaseId } = await params
  if (!LEGACY_RELEASE_IDS.has(releaseId)) notFound()
  permanentRedirect('/benchmarks')
}
