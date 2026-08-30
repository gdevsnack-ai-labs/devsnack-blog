export const RESEARCH_NOTE_PAGES_BASE = 'https://gdevsnack-ai-labs.github.io/devsnack-research-notes/notes/'

/**
 * Legacy DevSnack Research slugs migrated to the public Research Notebook.
 * Keep this map as the single source for UI exclusion, sitemap policy, and
 * the permanent redirects added after the release gate passes.
 */
export const RESEARCH_NOTE_REDIRECTS: Readonly<Record<string, string>> = {
  // Public R1
  'deepseek-harness-dsh-everything-is-a-plugin': `${RESEARCH_NOTE_PAGES_BASE}deepseek-harness-dsh.html`,
  'airy-studio-tts': `${RESEARCH_NOTE_PAGES_BASE}airy-studio-tts.html`,
  'herdr-yc-f26': `${RESEARCH_NOTE_PAGES_BASE}herdr-yc-f26.html`,
  'tencentdb-agent-memory': `${RESEARCH_NOTE_PAGES_BASE}tencentdb-agent-memory.html`,
  'agent-swarm-desplega-ai': `${RESEARCH_NOTE_PAGES_BASE}agent-swarm-desplega-ai.html`,
  'tokenchaser-lab-note': `${RESEARCH_NOTE_PAGES_BASE}tokenchaser-lab-note.html`,
  'deepseek-v4-pro-0813-1-6t-ga': `${RESEARCH_NOTE_PAGES_BASE}deepseek-v4-pro-0813-1-6t-ga.html`,
  'qwen3-8-2-4t-a95b-qwen3-8-max': `${RESEARCH_NOTE_PAGES_BASE}qwen3-8-2-4t-a95b-qwen3-8-max.html`,
  'flux-3-black-forest-labs': `${RESEARCH_NOTE_PAGES_BASE}flux-3.html`,
  'ai-avatar-vtuber-sadtalker': `${RESEARCH_NOTE_PAGES_BASE}ai-avatar-vtuber-sadtalker.html`,

  // Public R2
  'oh-my-hermes-omh-hermes-agent': `${RESEARCH_NOTE_PAGES_BASE}oh-my-hermes-omh.html`,
  'dflash-2-qwen3-8-27b-vs-mtp': `${RESEARCH_NOTE_PAGES_BASE}dflash-2-qwen3-8-27b.html`,
  'tokenchaser-self-bench-pack-gb10-llm': `${RESEARCH_NOTE_PAGES_BASE}tokenchaser-self-bench-pack-gb10-llm.html`,
  'karakeep-hoarder': `${RESEARCH_NOTE_PAGES_BASE}karakeep-hoarder.html`,
  'minimax-h3-turbo-lora-4-step-3-2-stage': `${RESEARCH_NOTE_PAGES_BASE}minimax-h3-turbo-lora-4-step-3-2-stage.html`,
  'muse-glimmer-30b-meta': `${RESEARCH_NOTE_PAGES_BASE}muse-glimmer-30b-meta.html`,
  'wan-dancer-14b-music-to-dance': `${RESEARCH_NOTE_PAGES_BASE}wan-dancer-14b-music-to-dance.html`,
  'kanana-2-30b-abliteration': `${RESEARCH_NOTE_PAGES_BASE}kanana-2-30b-abliteration.html`,
  'tool-eval-bench': `${RESEARCH_NOTE_PAGES_BASE}tool-eval-bench.html`,
  'pixelgpt-24-24-lora': `${RESEARCH_NOTE_PAGES_BASE}pixelgpt-24-24-lora.html`,
  'ace-step-repaint': `${RESEARCH_NOTE_PAGES_BASE}ace-step-repaint.html`,

  // M: integrated Notes
  'moss-tts-gguf': `${RESEARCH_NOTE_PAGES_BASE}dgx-spark-local-tts-status-matrix.html`,
  'higgs-tts-3-4b': `${RESEARCH_NOTE_PAGES_BASE}dgx-spark-local-tts-status-matrix.html`,
  'nvidia-magpietts-357m': `${RESEARCH_NOTE_PAGES_BASE}dgx-spark-local-tts-status-matrix.html`,
  'omnivoice-0-6b': `${RESEARCH_NOTE_PAGES_BASE}dgx-spark-local-tts-status-matrix.html`,
  'supertone-3': `${RESEARCH_NOTE_PAGES_BASE}dgx-spark-local-tts-status-matrix.html`,
  'moss-tts-family-8b-1-7b-realtime-2b-ttsd-8b': `${RESEARCH_NOTE_PAGES_BASE}dgx-spark-local-tts-status-matrix.html`,
  'ternary-bonsai-27b': `${RESEARCH_NOTE_PAGES_BASE}download-only-models-triage.html`,
  'qwopus-3-6-27b': `${RESEARCH_NOTE_PAGES_BASE}download-only-models-triage.html`,
  'hyperframes-voicebox': `${RESEARCH_NOTE_PAGES_BASE}media-automation-tools-comparison.html`,
}

export const MIGRATED_RESEARCH_SLUGS = new Set(Object.keys(RESEARCH_NOTE_REDIRECTS))

export function getResearchNoteRedirect(slug: string): string | undefined {
  return RESEARCH_NOTE_REDIRECTS[slug]
}

export function isMigratedResearchSlug(slug: string): boolean {
  return MIGRATED_RESEARCH_SLUGS.has(slug)
}
