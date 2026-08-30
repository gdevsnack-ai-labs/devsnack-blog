const AITECH_DETAIL_PREFIX = '/aitech/'

export function isRetiredAitechDetailPath(pathname: string): boolean {
  const path = pathname.split(/[?#]/, 1)[0]
  return path.startsWith(AITECH_DETAIL_PREFIX)
}

export function createAitechGoneResponse(): Response {
  return new Response('AI Tech v1 detail retired.\n', {
    status: 410,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Robots-Tag': 'noindex, follow',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  })
}
