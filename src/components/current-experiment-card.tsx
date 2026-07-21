import { CheckCircle2, Sparkles, Calendar, Clock } from 'lucide-react'
import { ProgressBar } from './progress-bar'
import { currentExperiment } from '@/data/current-experiment'

const STATUS_META: Record<string, { icon: typeof CheckCircle2; color: string; label: string }> = {
  '완료':   { icon: CheckCircle2, color: 'text-green-600 dark:text-green-400', label: '완료' },
  '진행중': { icon: Sparkles,     color: 'text-blue-600 dark:text-blue-400',   label: '진행중' },
  '예정':   { icon: Calendar,     color: 'text-orange-500 dark:text-orange-400', label: '예정' },
  '예약':   { icon: Clock,        color: 'text-gray-400',                       label: '예약' },
}

export function CurrentExperimentCard() {
  const exp = currentExperiment
  return (
    <div className="border border-border rounded-xl p-6 bg-white dark:bg-gray-900">
      <div className="flex items-start justify-between mb-2 gap-2">
        <h3 className="text-lg font-bold">{exp.title}</h3>
        <span className="shrink-0 px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
          {exp.status}
        </span>
      </div>
      <p className="text-sm text-muted-foreground mb-4">{exp.subtitle}</p>
      <div className="mb-4">
        <ProgressBar value={exp.progress} color="green" showLabel />
      </div>
      <ul className="space-y-2 mb-4">
        {exp.parts.map((p, i) => {
          const m = STATUS_META[p.status]
          const Icon = m.icon
          return (
            <li key={i} className="flex items-center justify-between text-sm gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Icon className={`w-4 h-4 ${m.color} shrink-0`} />
                <span className="truncate">{p.name}</span>
              </div>
              <span className={`text-xs font-medium shrink-0 ${m.color}`}>{m.label}</span>
            </li>
          )
        })}
      </ul>

      {/* Lab 상세 페이지로 연결 */}
      <a
        href={exp.link}
        className="inline-flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400 hover:underline"
      >
        <Sparkles className="w-3.5 h-3.5" />
        Lab에서 보기 →
      </a>
    </div>
  )
}
