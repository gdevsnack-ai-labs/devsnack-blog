import { supabase } from '@/lib/supabase'
import { experiments } from '@/data/experiments'

export interface LabStats {
  runningProjects: number
  totalPosts: number
  totalVideos: number
  modelsTested: number
  benchmarkRuns: number
}

export async function getStats(): Promise<LabStats> {
  const { count: totalPosts } = await supabase
    .from('posts')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'live')

  const running = experiments.filter(e => e.category === 'running').length

  // YouTube: 여러 채널 총 영상 수 (실제 수치는 주기적 업데이트 필요)
  const totalVideos = 17

  // 벤치마크: content-factory/benchmark 실제 DB 기준 (2026-07-22)
  const modelsTested = 40
  const benchmarkRuns = 19

  return {
    runningProjects: running,
    totalPosts: totalPosts || 0,
    totalVideos,
    modelsTested,
    benchmarkRuns,
  }
}
