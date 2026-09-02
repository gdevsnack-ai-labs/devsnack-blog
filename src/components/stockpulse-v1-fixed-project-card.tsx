import Link from 'next/link'
import { ArrowUpRight, CircleDot, FlaskConical } from 'lucide-react'

export function StockpulseV1FixedProjectCard() {
  return (
    <Link href="/labs/stockpulse-v1-fixed" className="group flex h-full min-h-[286px] flex-col rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 via-white to-white p-5 no-underline transition-all hover:-translate-y-0.5 hover:border-blue-400 hover:shadow-md dark:border-blue-900/60 dark:from-blue-950/30 dark:via-gray-900 dark:to-gray-900 dark:hover:border-blue-600">
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300"><FlaskConical className="h-4 w-4" aria-hidden="true" />Experiment</span>
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-[11px] font-semibold text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"><CircleDot className="h-3 w-3" aria-hidden="true" />Active</span>
      </div>
      <h3 className="mt-4 text-xl font-bold tracking-tight group-hover:text-blue-700 dark:group-hover:text-blue-300">StockPulse V1 Fixed</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">예측·실제 결과·평가·개선 상태를 Run Board로 확인하는 별도 Live Shadow 실험 대시보드입니다.</p>
      <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-lg border border-blue-100 bg-white/80 p-2.5 dark:border-blue-900/50 dark:bg-gray-900/70"><span className="block text-muted-foreground">Day</span><strong className="mt-1 block text-foreground">1 · Live Shadow</strong></div>
        <div className="rounded-lg border border-blue-100 bg-white/80 p-2.5 dark:border-blue-900/50 dark:bg-gray-900/70"><span className="block text-muted-foreground">Latest finding</span><strong className="mt-1 block text-foreground">없음</strong></div>
      </div>
      <div className="mt-auto flex items-center justify-between gap-3 border-t border-blue-100 pt-4 text-xs text-muted-foreground dark:border-blue-900/50"><span>Morning 하락 · ML 50 pending</span><span className="inline-flex items-center gap-1 font-medium text-blue-700 group-hover:text-blue-900 dark:text-blue-300 dark:group-hover:text-blue-100">Project 보기 <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" /></span></div>
    </Link>
  )
}
