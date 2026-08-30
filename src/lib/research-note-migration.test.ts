// @ts-expect-error Node's strip-types runner requires the explicit extension.
import { MIGRATED_RESEARCH_SLUGS, RESEARCH_NOTE_REDIRECTS } from './research-note-migration.ts'

if (MIGRATED_RESEARCH_SLUGS.size !== 30) {
  throw new Error(`Expected 30 legacy Research slugs (21 individual + 9 M), got ${MIGRATED_RESEARCH_SLUGS.size}`)
}
if (Object.keys(RESEARCH_NOTE_REDIRECTS).length !== 30) {
  throw new Error('Redirect map and migrated Research slug set must have the same size')
}
const pagesBase = 'https://gdevsnack-ai-labs.github.io/devsnack-research-notes/notes/'
if (!Object.values(RESEARCH_NOTE_REDIRECTS).every(url => url.startsWith(pagesBase) && url.endsWith('.html'))) {
  throw new Error('Every Research redirect must target a GitHub Pages HTML Note')
}
if (RESEARCH_NOTE_REDIRECTS['moss-tts-gguf'] !== `${pagesBase}dgx-spark-local-tts-status-matrix.html`) {
  throw new Error('MOSS-TTS provenance must redirect to the integrated TTS matrix')
}
if (RESEARCH_NOTE_REDIRECTS['ternary-bonsai-27b'] !== `${pagesBase}download-only-models-triage.html`) {
  throw new Error('Download-only model provenance must redirect to the integrated triage Note')
}
if (RESEARCH_NOTE_REDIRECTS['hyperframes-voicebox'] !== `${pagesBase}media-automation-tools-comparison.html`) {
  throw new Error('Media automation provenance must redirect to the integrated comparison Note')
}

console.log(`research migration map tests passed: ${MIGRATED_RESEARCH_SLUGS.size}`)
