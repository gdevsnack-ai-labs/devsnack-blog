import { createClient } from '@supabase/supabase-js'
import { experiments } from '@/data/experiments'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

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

  // YouTube: 여러 채널의 총 영상 수
  // DevSnackAI Lab, Epoch Unseen, SciNova, PsycheKiln, MelodyPie90s 등
  // 실제 수치는 주기적으로 업데이트 필요
  const totalVideos = 17

  // 벤치마크: content-factory/benchmark 실제 데이터 기준 (2026-07-22)
  // models: 40, benchmark_runs: 19
  // 빌드 타임엔 로컬 DB 접근 불가하므로 정적 값 사용
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
