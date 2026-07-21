// DevSnack Blog — 블로그별 색상 토큰
// docs/DESIGN.md 참조

export type BlogId = 'devsnack' | 'stockpulse' | 'realestate' | 'aitech' | 'lab'
export type BlogColor = 'blue' | 'green' | 'orange' | 'purple'

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
  realestate: {
    primary: 'orange',
    text: 'text-orange-500 dark:text-orange-400',
    bg: 'bg-orange-100 dark:bg-orange-900/30',
    border: 'border-orange-200 dark:border-orange-800',
    hover: 'hover:border-orange-300 dark:hover:border-orange-700',
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
}

export const BLOG_LABEL: Record<BlogId, string> = {
  devsnack: 'DevSnack',
  stockpulse: 'StockPulse',
  realestate: '부동산',
  aitech: 'AI Tech',
  lab: 'Lab',
}

export const BLOG_PATH: Record<BlogId, string> = {
  devsnack: '/devsnack',
  stockpulse: '/stock',
  realestate: '/realestate',
  aitech: '/aitech',
  lab: '/lab',
}
