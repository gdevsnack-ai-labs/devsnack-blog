// @ts-expect-error Node's strip-types runner requires the explicit extension.
import { englishMirrorPath, sourceContentHash, effectiveTranslationStatus } from './translation-core.ts'

function expectEqual(actual: unknown, expected: unknown, message: string) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${message}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`)
  }
}

const source = {
  title: 'Qwen3.8-27B NVFP4 MTP GGUF',
  content: '<p>17~19.5 t/s · MTP 93.1%</p>',
  excerpt: 'GB10 test',
  seo_desc: null,
  labels: ['LLM', 'DGX Spark'],
}

expectEqual(sourceContentHash(source), 'sha256:c858b67463623bb777975e495edcc32eae7495e0dc7f5ce012487c579989994f', 'source hash must be deterministic')
expectEqual(englishMirrorPath('/research/qwen3-8-27b-nvfp4-mtp-gguf-gb10'), '/en/research/qwen3-8-27b-nvfp4-mtp-gguf-gb10', 'English mirror path')
expectEqual(effectiveTranslationStatus({ translation_status: 'published', source_content_hash: sourceContentHash(source) }, source), 'published', 'fresh translation')
expectEqual(effectiveTranslationStatus({ translation_status: 'published', source_content_hash: 'sha256:stale' }, source), 'stale', 'source changes must mark translation stale')

console.log('translation helper tests passed')
