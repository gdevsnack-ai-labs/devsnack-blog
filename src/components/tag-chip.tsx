import { Cpu, FlaskConical, Settings, BarChart3 } from 'lucide-react'

const TAGS = {
  'local-llm':   { icon: Cpu,          label: 'Local LLM',     text: 'text-blue-600',   bg: 'bg-blue-50',   border: 'border-blue-200' },
  'experiments': { icon: FlaskConical, label: 'AI Experiments',text: 'text-green-600',  bg: 'bg-green-50',  border: 'border-green-200' },
  'automation':  { icon: Settings,     label: 'Automation',    text: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
  'data':        { icon: BarChart3,    label: 'Data & Insight',text: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
} as const

export type TagKey = keyof typeof TAGS

export function TagChip({ tag }: { tag: TagKey }) {
  const t = TAGS[tag]
  const Icon = t.icon
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${t.text} ${t.bg} ${t.border}`}>
      <Icon className="w-3.5 h-3.5" />
      {t.label}
    </span>
  )
}
