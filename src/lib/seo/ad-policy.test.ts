// @ts-expect-error Node's strip-types runner requires the explicit extension.
import { shouldLoadAdSenseForPath } from './ad-policy.ts'

for (const path of [
  '/search',
  '/search/results',
  '/tools/operations',
  '/tools/operations/status',
  '/operations/status',
  '/data/hermes-usage',
  '/data/hermes-usage/model',
  '/stock',
  '/stock/2026-09-21',
]) {
  if (shouldLoadAdSenseForPath(path)) throw new Error(`AdSense must be excluded from ${path}`)
}

for (const path of ['/', '/demos/html', '/demos/music', '/demos/shortmovie', '/research', '/benchmarks']) {
  if (!shouldLoadAdSenseForPath(path)) throw new Error(`AdSense should remain available on ${path}`)
}

for (const path of ['/data', '/demos', '/labs/stockpulse-v1-fixed/runs', '/research/tokenchaser-self-bench-pack-gb10-llm', '/research/wan-dancer-14b-music-to-dance']) {
  if (shouldLoadAdSenseForPath(path)) throw new Error(`AdSense must be excluded from ${path}`)
}

if (!shouldLoadAdSenseForPath('/research/qwen-image-21-local-first-impressions')) {
  throw new Error('AdSense should remain available on measured Research content')
}

console.log('Ad policy tests passed')