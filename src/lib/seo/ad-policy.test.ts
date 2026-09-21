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

for (const path of ['/', '/data', '/demos', '/demos/html', '/research', '/benchmarks']) {
  if (!shouldLoadAdSenseForPath(path)) throw new Error(`AdSense should remain available on ${path}`)
}

console.log('Ad policy tests passed')