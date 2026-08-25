export const EN_NAVIGATION = {
  home: 'Home',
  stories: 'Stories',
  lab: 'Lab',
  experiments: 'Experiments',
  showcase: 'Showcase',
  benchmarks: 'Benchmarks',
  knowledge: 'Knowledge',
  data: 'Data',
  switchToKorean: '한국어',
  switchToEnglish: 'English',
} as const

export const EN_PILOT_SOURCE_PATHS = [
  '/devsnack/i-read-ai-written-news',
  '/devsnack/ai-built-gomoku-engine-vs-rapfi',
  '/labs/stockpulse-ai-self-improvement',
  '/lab/stockpulse-self-2026-08-21',
  '/lab/stockpulse-self-2026-08-25',
  '/lab/ornith15-server-quality-speed-benchmark',
  '/research/qwen3-8-27b-nvfp4-mtp-gguf-gb10',
  '/research/wiki-embedding-search',
  '/benchmarks',
]

export function isEnglishPilotSourcePath(pathname: string): boolean {
  return EN_PILOT_SOURCE_PATHS.includes(pathname)
}

export const EN_PROJECT_PROJECTIONS = {
  'stockpulse-ai-self-improvement': {
    name: 'StockPulse AI Self-Improvement Experiment',
    description: 'A live experiment in which StockPulse stores a morning KOSPI forecast, evaluates it after the market close, analyzes failure patterns, and applies changes to prompts, ML parameters, and data features for the next run.',
    domain: 'Self-improving AI · Finance · Automation',
    nature: 'A continuous experiment: prediction → evaluation → failure analysis → applied improvement.',
    currentFinding: 'The loop is operating in production: forecast, evaluate, diagnose, apply a change, and run the next forecast with the changed environment.',
    evaluationHeading: 'Prediction and evaluation',
    evaluationDescription: 'These values are read from the existing predictions table. The Lab page does not duplicate accuracy or confidence into translated content.',
    labNotesHeading: 'Translated Lab Notes in this pilot',
    labNotesDescription: 'The pilot includes one successful and one failed run so the English page preserves both outcomes rather than showing only a polished result.',
  },
} as const

export const EN_BENCHMARK_OVERVIEW = {
  eyebrow: 'Measurement protocol',
  title: 'Local LLM Benchmark',
  description: 'A reproducible measurement project for local GGUF models on an NVIDIA DGX Spark GB10, combining serving speed, structured-output reliability, and real production prompts.',
  protocolHeading: 'Production contract calibration',
  protocol: [
    ['Target', 'YouTube Shorts script generation'],
    ['Fixtures', 'Science and History production prompts'],
    ['Hard gate', 'JSON scenes, word budget, fact_refs, image_prompt, video_prompt, and time beats'],
    ['External lane', 'One-shot external LLM JSON injection without retry or validator feedback'],
  ],
  selectedHeading: 'Pilot benchmark',
  selectedDescription: 'Ornith-1.5 Q5_K_M, Q6_K, and Q8_0 were tested with the same production prompts, server protocol, validator retry budget, and GB10 environment.',
  limitations: 'Two fixtures and one repetition per model are directional evidence, not a final quantization ranking. Human semantic quality review, reasoning on/off, MTP off, and coding/tool-call lanes remain separate tracks.',
} as const

export const EN_STATIC_LOCALE_METADATA = {
  locale: 'en',
  language: 'English',
  inLanguage: 'en-US',
  experiment: 'English Content SEO/GEO Experiment',
} as const
