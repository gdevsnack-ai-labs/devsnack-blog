import { LabDashboard } from '@/components/lab-dashboard'
import { LabProjectCard } from '@/components/lab-project-card'
import { experiments, type ExperimentCategory } from '@/data/experiments'
import { supabase } from '@/lib/supabase'

export const revalidate = 60

const GROUPS: Array<{ key: ExperimentCategory; label: string; description: string }> = [
  { key: 'running',   label: '🟢 Running',   description: '현재 진행 중인 실험' },
  { key: 'planning',  label: '🟡 Planning',  description: '계획 중인 실험' },
  { key: 'completed', label: '✅ Completed', description: '완료된 실험' },
]

async function getStats() {
  const { count: totalPosts } = await supabase
    .from('posts')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'live')

  const running = experiments.filter(e => e.category === 'running').length
  const nonDummy = experiments.filter(e => !e.isDummy)
  const completed = nonDummy.filter(e => e.category === 'completed').length

  return {
    runningProjects: running,
    totalPosts: totalPosts || 0,
    totalVideos: 17,
    modelsTested: 40,
    benchmarkRuns: 19,
  }
}

export default async function LabPage() {
  const stats = await getStats()
  const nonDummy = experiments.filter(e => !e.isDummy)

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* 페이지 타이틀 */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">🧪 DevSnack Lab</h1>
          <p className="text-sm text-muted-foreground mt-1">
            AI와 함께 진행 중인 실험과 연구 프로젝트
          </p>
        </div>

        {/* 대시보드 */}
        <LabDashboard stats={stats} />

        {/* 상태별 그룹 */}
        <div className="mt-12 space-y-10">
          {GROUPS.map(group => {
            const groupExperiments = experiments.filter(e => e.category === group.key)
            if (groupExperiments.length === 0) return null

            return (
              <section key={group.key}>
                <div className="mb-4">
                  <h2 className="text-xl font-bold">{group.label}</h2>
                  <p className="text-sm text-muted-foreground">{group.description}</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {groupExperiments.map(exp => (
                    <LabProjectCard key={exp.id} experiment={exp} />
                  ))}
                </div>
              </section>
            )
          })}
        </div>

        {/* 더미/예정 실험 안내 */}
        {experiments.filter(e => e.isDummy).length > 0 && (
          <div className="mt-12 border border-dashed border-border rounded-xl p-6 text-center">
            <p className="text-sm text-muted-foreground">
              🔮 {experiments.filter(e => e.isDummy).length}개의 추가 실험이 준비 중입니다.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
