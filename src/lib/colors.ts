// DevSnack Blog — 블로그별 색상 토큰
// docs/DESIGN.md 참조

export type BlogId = 'devsnack' | 'stockpulse' | 'aitech' | 'lab' | 'research' | 'misc'
export type BlogColor = 'blue' | 'green' | 'orange' | 'purple' | 'amber'

export const BLOG_COLORS: Record<BlogId, {
  primary: BlogColor
  text: string
  bg: string
  border: string
  hover: string
}> = {
  devsnack: {
    primary: 'blue',
    text: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    border: 'border-blue-200 dark:border-blue-800',
    hover: 'hover:border-blue-300 dark:hover:border-blue-700',
  },
  stockpulse: {
    primary: 'green',
    text: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-100 dark:bg-green-900/30',
    border: 'border-green-200 dark:border-green-800',
    hover: 'hover:border-green-300 dark:hover:border-green-700',
  },

  aitech: {
    primary: 'purple',
    text: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    border: 'border-purple-200 dark:border-purple-800',
    hover: 'hover:border-purple-300 dark:hover:border-purple-700',
  },
  lab: {
    primary: 'blue',
    text: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    border: 'border-blue-200 dark:border-blue-800',
    hover: 'hover:border-blue-300 dark:hover:border-blue-700',
  },
  research: {
    primary: 'purple',
    text: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    border: 'border-purple-200 dark:border-purple-800',
    hover: 'hover:border-purple-300 dark:hover:border-purple-700',
  },
  misc: {
    primary: 'amber',
    text: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    border: 'border-amber-200 dark:border-amber-800',
    hover: 'hover:border-amber-300 dark:hover:border-amber-700',
  },
}

export const BLOG_LABEL: Record<BlogId, string> = {
  devsnack: 'Stories',
  stockpulse: 'StockPulse',

  aitech: 'AI Tech',
  lab: 'Lab',
  research: 'Knowledge',
  misc: '잡동사니',
}

export const BLOG_PATH: Record<BlogId, string> = {
  devsnack: '/devsnack',
  stockpulse: '/stock',

  aitech: '/aitech',
  lab: '/lab',
  research: '/research',
  misc: '/misc',
}
