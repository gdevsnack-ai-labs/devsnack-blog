// @ts-expect-error Node's strip-types runner requires the explicit extension.
import { formatGeneratedAt, normalizeProvenance, sourceCountLabel } from './provenance.ts'

function expectEqual(actual: unknown, expected: unknown, message: string) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${message}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`)
  }
}

const ai = normalizeProvenance({
  kind: 'automated_feed',
  pipeline: 'ai-tech-news',
  generated_at: '2026-08-26T01:00:00.000Z',
  source_urls: ['https://example.com/a', 'https://example.com/a', 'not-a-url'],
  human_reviewed: false,
})
expectEqual(ai?.kind, 'automated_feed', 'AI feed kind must survive normalization')
expectEqual(ai?.source_urls, ['https://example.com/a'], 'source URLs must be deduplicated and validated')
expectEqual(sourceCountLabel(ai), '출처 1개', 'structured source count must be visible')
expectEqual(formatGeneratedAt(ai?.generated_at), '2026. 8. 26. 10:00', 'generated time must use Korean locale output')

const legacy = normalizeProvenance(null)
expectEqual(legacy, null, 'legacy posts without metadata must use null fallback')
expectEqual(sourceCountLabel(legacy), '본문 출처 섹션', 'legacy posts must have a safe source fallback')
expectEqual(formatGeneratedAt(null), null, 'missing generated time must stay absent')

console.log('provenance tests passed')
