// @ts-expect-error Node's strip-types runner requires the explicit extension.
import { englishMirrorPath, sourceContentHash, effectiveTranslationStatus } from './translation-core.ts'
// @ts-expect-error Node's strip-types runner requires the explicit extension.
import { getLanguageRoute, getEnglishNavigationPath, EN_PILOT_SOURCE_PATHS } from './i18n/english-pilot.ts'

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
expectEqual(getLanguageRoute('/'), { koreanPath: '/', englishPath: '/en' }, 'Korean home must switch to English pilot home')
expectEqual(getLanguageRoute('/en'), { koreanPath: '/', englishPath: '/en' }, 'English pilot home must switch back to Korean home')
expectEqual(getLanguageRoute('/devsnack/ai-built-gomoku-engine-vs-rapfi'), {
  koreanPath: '/devsnack/ai-built-gomoku-engine-vs-rapfi',
  englishPath: '/en/devsnack/ai-built-gomoku-engine-vs-rapfi',
}, 'Korean pilot content must map to its English mirror')
expectEqual(getLanguageRoute('/en/devsnack/ai-built-gomoku-engine-vs-rapfi'), {
  koreanPath: '/devsnack/ai-built-gomoku-engine-vs-rapfi',
  englishPath: '/en/devsnack/ai-built-gomoku-engine-vs-rapfi',
}, 'English pilot content must map back to its Korean source')
expectEqual(getLanguageRoute('/research'), null, 'Korean-only hubs must not expose a fake English pair')
expectEqual(getEnglishNavigationPath('/'), '/en', 'English navigation home must stay in English')
expectEqual(getEnglishNavigationPath('/benchmarks'), '/en/benchmarks', 'English navigation must use an available benchmark mirror')
expectEqual(getEnglishNavigationPath('/research'), '/en', 'Unsupported English hubs must fall back to the pilot home')

for (const sourcePath of EN_PILOT_SOURCE_PATHS) {
  const route = getLanguageRoute(sourcePath)
  if (!route) throw new Error(`Missing language route for ${sourcePath}`)
  expectEqual(getLanguageRoute(route.englishPath), route, `Language route must round-trip for ${sourcePath}`)
}

console.log('translation helper tests passed')
