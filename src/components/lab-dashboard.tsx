import {
  FlaskConical, FileText, Video, Cpu, BarChart3,
} from 'lucide-react'

interface LabStats {
  runningProjects: number
  totalPosts: number
  totalVideos: number
  modelsTested: number
  benchmarkRuns: number
}

const STATS_CARDS: Array<{ key: keyof LabStats; icon: typeof FlaskConical; label: string }> = [
  { key: 'runningProjects', icon: FlaskConical, label: '진행 중' },
  { key: 'totalPosts',      icon: FileText,     label: '블로그' },
  { key: 'totalVideos',     icon: Video,        label: '영상' },
  { key: 'modelsTested',    icon: Cpu,          label: '모델' },
  { key: 'benchmarkRuns',   icon: BarChart3,    label: '벤치마크' },
]

export function LabDashboard({ stats }: { stats: LabStats }) {
  return (
    <section className="max-w-4xl mx-auto">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {STATS_CARDS.map(({ key, icon: Icon, label }) => (
          <div
            key={key}
            className="border border-border rounded-xl p-4 bg-white dark:bg-gray-900 text-center"
          >
            <Icon className="w-5 h-5 mx-auto mb-1.5 text-muted-foreground" />
            <div className="text-2xl font-bold tracking-tight">
              {stats[key]}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground text-right mt-2">
        Updated: Today
      </p>
    </section>
  )
}
