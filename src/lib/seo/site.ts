export const SITE_URL = 'https://devsnack-blog.vercel.app'
export const EDITORIAL_AUTHOR = 'DevSnack Lab'
export const EDITORIAL_AUTHOR_URL = `${SITE_URL}/about`

export function absoluteSiteUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${SITE_URL}${normalized}`
}
