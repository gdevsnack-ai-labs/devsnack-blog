import { createAitechGoneResponse, isRetiredAitechDetailPath } from './aitech-url-policy'

const cases: Array<[string, boolean]> = [
  ['/aitech', false],
  ['/aitech/', true],
  ['/aitech/post-1784461354', true],
  ['/aitech/rytten-unicorn-platform-paradigm-shift-analysis', true],
  ['/aitech/old-slug/extra', true],
  ['/aitech-old/post-1784461354', false],
  ['/labs/blog', false],
]

for (const [pathname, expected] of cases) {
  const actual = isRetiredAitechDetailPath(pathname)
  if (actual !== expected) {
    throw new Error(`retired AI Tech path mismatch for ${pathname}: expected ${expected}, got ${actual}`)
  }
}

const response = createAitechGoneResponse()
if (response.status !== 410) throw new Error(`expected 410 response, got ${response.status}`)
if (response.headers.get('X-Robots-Tag') !== 'noindex, follow') throw new Error('410 response must remain out of search')

console.log('AI Tech retired URL policy tests passed')
