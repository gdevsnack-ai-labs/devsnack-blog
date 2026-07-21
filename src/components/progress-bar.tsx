type Color = 'blue' | 'green' | 'orange' | 'purple' | 'gray'

const COLOR_CLASS: Record<Color, string> = {
  blue:   'bg-blue-500',
  green:  'bg-green-500',
  orange: 'bg-orange-500',
  purple: 'bg-purple-500',
  gray:   'bg-gray-300 dark:bg-gray-600',
}

export function ProgressBar({
  value,
  color = 'green',
  showLabel = false,
  size = 'md',
}: {
  value: number
  color?: Color
  showLabel?: boolean
  size?: 'sm' | 'md'
}) {
  const safe = Math.max(0, Math.min(100, value))
  const heightClass = size === 'sm' ? 'h-1.5' : 'h-2'
  return (
    <div className="flex items-center gap-2">
      <div className={`flex-1 ${heightClass} bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden`}>
        <div
          className={`h-full ${COLOR_CLASS[color]} rounded-full transition-all duration-500`}
          style={{ width: `${safe}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-medium text-muted-foreground min-w-[2.5rem] text-right">
          {safe}%
        </span>
      )}
    </div>
  )
}
