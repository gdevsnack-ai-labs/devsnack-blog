import type { Metadata } from 'next'
import { OperationsDashboard } from './operations-dashboard'
import { normalizeOperationsSnapshot } from '@/lib/operations-types'
import { supabase } from '@/lib/supabase'

export const metadata: Metadata = {
  title: '운영중인 시스템 — DevSnack',
  description: 'DGX Spark에서 실행 중인 서비스, 포트, Docker, systemd, Hermes 크론잡과 설치된 도구 현황',
}

export const revalidate = 60

async function getOperationsSnapshot() {
  const { data, error } = await supabase
    .from('system_snapshots')
    .select('snapshot, captured_at')
    .order('captured_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error || !data?.snapshot) {
    return { snapshot: normalizeOperationsSnapshot(null), available: false }
  }

  return {
    snapshot: normalizeOperationsSnapshot(data.snapshot),
    available: true,
  }
}

export default async function OperationsPage() {
  const { snapshot, available } = await getOperationsSnapshot()
  return <OperationsDashboard snapshot={snapshot} available={available} />
}
