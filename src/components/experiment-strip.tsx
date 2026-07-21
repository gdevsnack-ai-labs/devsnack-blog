import Link from 'next/link'
import { ProgressBar } from './progress-bar'
import { experiments } from '@/data/experiments'

export function ExperimentStrip() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
      {experiments.map((e) => {
        const isDummy = e.isDummy === true
        return (
          <Link
            key={e.id}
            href={isDummy ? '#' : `/lab/${e.id}`}
            className={`block border border-border rounded-lg p-4 bg-white dark:bg-gray-900 ${
              isDummy ? 'opacity-60 cursor-default' : 'hover:border-blue-200 dark:hover:border-blue-800 transition-colors'
            } no-underline text-foreground`}
          >
            <div className="flex items-start justify-between gap-2 mb-1">
              <h4 className="text-sm font-bold">{e.name}</h4>
              {isDummy && (
                <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                  예정
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mb-3 line-clamp-1">{e.description}</p>
            {isDummy ? (
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gray-300 dark:bg-gray-700"
                    style={{ width: '0%' }}
                  />
                </div>
                <span className="text-xs font-medium text-muted-foreground/60 min-w-[2.5rem] text-right">
                  —
                </span>
              </div>
            ) : (
              <ProgressBar value={e.progress} color={e.color} showLabel size="sm" />
            )}
          </Link>
        )
      })}
    </div>
  )
}
