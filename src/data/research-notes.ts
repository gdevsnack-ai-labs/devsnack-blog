export type ResearchNoteCategory = 'models' | 'tools' | 'agents' | 'media' | 'infra' | 'misc'
export type ResearchNoteStatus = 'research-complete' | 'experiment-candidate' | 'awaiting-test' | 'archived'

export interface ResearchNote {
  researched_date: string
  published_date: string
  category: ResearchNoteCategory
  title: string
  summary: string
  status: ResearchNoteStatus
  external_url: string
  promoted_asset_url: string | null
  original_devsnack_url: string
}

// Static snapshot generated from the GitHub Pages manifest. No DB/API read is used by the Board.
export const RESEARCH_NOTES: ResearchNote[] = [
  {
    "researched_date": "2026-07-31",
    "published_date": "2026-08-30",
    "category": "agents",
    "title": "agent-swarm (desplega-ai)",
    "summary": "Company Agentic OS 형태의 멀티 에이전트 오케스트레이션 구조를 Hermes Kanban과 비교한 조사다.",
    "status": "research-complete",
    "external_url": "https://gdevsnack-ai-labs.github.io/devsnack-research-notes/notes/agent-swarm-desplega-ai.html",
    "promoted_asset_url": null,
    "original_devsnack_url": "https://devsnack-blog.vercel.app/research/agent-swarm-desplega-ai"
  },
  {
    "researched_date": "2026-08-20",
    "published_date": "2026-08-30",
    "category": "agents",
    "title": "DeepSeek Harness (dsh) — Everything is a Plugin 에이전트 런타임",
    "summary": "plugin 조합과 세션 로그를 중심으로 에이전트 실행 환경을 분해하는 Developer Preview 런타임이다.",
    "status": "research-complete",
    "external_url": "https://gdevsnack-ai-labs.github.io/devsnack-research-notes/notes/deepseek-harness-dsh.html",
    "promoted_asset_url": null,
    "original_devsnack_url": "https://devsnack-blog.vercel.app/research/deepseek-harness-dsh-everything-is-a-plugin"
  },
  {
    "researched_date": "2026-08-12",
    "published_date": "2026-08-30",
    "category": "agents",
    "title": "Herdr — 에이전트 런타임/멀티플렉서 (YC F26)",
    "summary": "여러 AI 에이전트의 상태와 pane을 관리하는 Rust 기반 런타임으로, Hermes와 보완 관계인지 확인이 필요한 조사 후보다.",
    "status": "awaiting-test",
    "external_url": "https://gdevsnack-ai-labs.github.io/devsnack-research-notes/notes/herdr-yc-f26.html",
    "promoted_asset_url": null,
    "original_devsnack_url": "https://devsnack-blog.vercel.app/research/herdr-yc-f26"
  },
  {
    "researched_date": "2026-08-19",
    "published_date": "2026-08-30",
    "category": "agents",
    "title": "Oh My Hermes (OMH) — Hermes Agent 운영 레이어",
    "summary": "Hermes를 대체하는 에이전트가 아니라 workflow·routing·handoff·evidence 경계를 보강하는 운영 레이어다.",
    "status": "experiment-candidate",
    "external_url": "https://gdevsnack-ai-labs.github.io/devsnack-research-notes/notes/oh-my-hermes-omh.html",
    "promoted_asset_url": null,
    "original_devsnack_url": "https://devsnack-blog.vercel.app/research/oh-my-hermes-omh-hermes-agent"
  },
  {
    "researched_date": "2026-08-11",
    "published_date": "2026-08-30",
    "category": "agents",
    "title": "TencentDB Agent Memory — 텐센트 에이전트 메모리 시스템",
    "summary": "Mermaid 기반 단기 메모리 오프로딩과 L0~L3 계층 기억을 결합한 로컬 우선 에이전트 메모리 조사다.",
    "status": "experiment-candidate",
    "external_url": "https://gdevsnack-ai-labs.github.io/devsnack-research-notes/notes/tencentdb-agent-memory.html",
    "promoted_asset_url": null,
    "original_devsnack_url": "https://devsnack-blog.vercel.app/research/tencentdb-agent-memory"
  },
  {
    "researched_date": "2026-07-02",
    "published_date": "2026-08-30",
    "category": "media",
    "title": "ACE-Step 리페인트 (Repaint)",
    "summary": "기존 오디오 일부만 다시 생성하는 가이드이며, 원본 prompt·가사 재투입 조건을 실제로 검증해야 한다.",
    "status": "experiment-candidate",
    "external_url": "https://gdevsnack-ai-labs.github.io/devsnack-research-notes/notes/ace-step-repaint.html",
    "promoted_asset_url": null,
    "original_devsnack_url": "https://devsnack-blog.vercel.app/research/ace-step-repaint"
  },
  {
    "researched_date": "2026-07-04",
    "published_date": "2026-08-30",
    "category": "media",
    "title": "AI Avatar / VTuber (SadTalker 등)",
    "summary": "TTS+아바타 영상 자동화 후보를 조사했지만 ARM64 로컬 의존성과 실제 생성은 확인 전이다.",
    "status": "awaiting-test",
    "external_url": "https://gdevsnack-ai-labs.github.io/devsnack-research-notes/notes/ai-avatar-vtuber-sadtalker.html",
    "promoted_asset_url": null,
    "original_devsnack_url": "https://devsnack-blog.vercel.app/research/ai-avatar-vtuber-sadtalker"
  },
  {
    "researched_date": "2026-08-18",
    "published_date": "2026-08-30",
    "category": "media",
    "title": "Airy Studio (에어리 스튜디오) — 무료 웹 TTS",
    "summary": "무료 웹 TTS와 공개 voice 목록 API를 조사했지만 API·SDK와 음질은 확인 전이다.",
    "status": "research-complete",
    "external_url": "https://gdevsnack-ai-labs.github.io/devsnack-research-notes/notes/airy-studio-tts.html",
    "promoted_asset_url": null,
    "original_devsnack_url": "https://devsnack-blog.vercel.app/research/airy-studio-tts"
  },
  {
    "researched_date": "2026-07-27",
    "published_date": "2026-08-30",
    "category": "media",
    "title": "DGX Spark Local TTS Status Matrix",
    "summary": "여러 TTS 조사 페이지를 하나의 설치·실행·사양 matrix로 통합한다. 설치됨과 생성 검증됨을 구분한다.",
    "status": "awaiting-test",
    "external_url": "https://gdevsnack-ai-labs.github.io/devsnack-research-notes/notes/dgx-spark-local-tts-status-matrix.html",
    "promoted_asset_url": null,
    "original_devsnack_url": "https://devsnack-blog.vercel.app/research/moss-tts-gguf"
  },
  {
    "researched_date": "2026-08-12",
    "published_date": "2026-08-30",
    "category": "media",
    "title": "FLUX 3 (Black Forest Labs 멀티모달)",
    "summary": "이미지·비디오·오디오·액션을 통합하고 최대 20초 영상을 내세우지만, 조사 시점에는 오픈웨이트가 없어 API 보조 후보였다.",
    "status": "research-complete",
    "external_url": "https://gdevsnack-ai-labs.github.io/devsnack-research-notes/notes/flux-3.html",
    "promoted_asset_url": null,
    "original_devsnack_url": "https://devsnack-blog.vercel.app/research/flux-3-black-forest-labs"
  },
  {
    "researched_date": "2026-07-05",
    "published_date": "2026-08-30",
    "category": "media",
    "title": "Media Automation Tools Comparison — HyperFrames · VoiceBox",
    "summary": "HTML→MP4와 로컬 AI 음성 스튜디오를 비교했지만, 대규모 자동화 사례와 즉시 도입 근거는 부족하다.",
    "status": "research-complete",
    "external_url": "https://gdevsnack-ai-labs.github.io/devsnack-research-notes/notes/media-automation-tools-comparison.html",
    "promoted_asset_url": null,
    "original_devsnack_url": "https://devsnack-blog.vercel.app/research/hyperframes-voicebox"
  },
  {
    "researched_date": "2026-08-13",
    "published_date": "2026-08-30",
    "category": "media",
    "title": "MiniMax H3 Turbo LoRA — 4-Step 가속 3종 비교 + 2-Stage 샘플링",
    "summary": "구세대 4-step 실패 기록과 새 LoRA·2-stage 조합을 분리해, GB10 재테스트 후보로 남긴다.",
    "status": "experiment-candidate",
    "external_url": "https://gdevsnack-ai-labs.github.io/devsnack-research-notes/notes/minimax-h3-turbo-lora-4-step-3-2-stage.html",
    "promoted_asset_url": null,
    "original_devsnack_url": "https://devsnack-blog.vercel.app/research/minimax-h3-turbo-lora-4-step-3-2-stage"
  },
  {
    "researched_date": "2026-07-31",
    "published_date": "2026-08-30",
    "category": "media",
    "title": "PixelGPT 24×24 픽셀아트 LoRA 학습",
    "summary": "픽셀아트 데이터 전처리와 학습 준비는 끝났지만 학습 실행 승인을 기다리는 상태다.",
    "status": "awaiting-test",
    "external_url": "https://gdevsnack-ai-labs.github.io/devsnack-research-notes/notes/pixelgpt-24-24-lora.html",
    "promoted_asset_url": null,
    "original_devsnack_url": "https://devsnack-blog.vercel.app/research/pixelgpt-24-24-lora"
  },
  {
    "researched_date": "2026-08-07",
    "published_date": "2026-08-30",
    "category": "media",
    "title": "Wan-Dancer-14B (Music-to-Dance)",
    "summary": "사진과 음악으로 댄스 영상을 만드는 워크플로우는 준비됐지만 서브그래프 flatten 문제로 실행 대기 중이다.",
    "status": "awaiting-test",
    "external_url": "https://gdevsnack-ai-labs.github.io/devsnack-research-notes/notes/wan-dancer-14b-music-to-dance.html",
    "promoted_asset_url": null,
    "original_devsnack_url": "https://devsnack-blog.vercel.app/research/wan-dancer-14b-music-to-dance"
  },
  {
    "researched_date": "2026-08-12",
    "published_date": "2026-08-30",
    "category": "models",
    "title": "DeepSeek V4 Pro 0813 (1.6T 플래그십 GA)",
    "summary": "API 중심의 플래그십 GA와 비용·컨텍스트 조사를 정리했으며 0813 오픈웨이트의 GB10 실행은 대상이 아니다.",
    "status": "research-complete",
    "external_url": "https://gdevsnack-ai-labs.github.io/devsnack-research-notes/notes/deepseek-v4-pro-0813-1-6t-ga.html",
    "promoted_asset_url": null,
    "original_devsnack_url": "https://devsnack-blog.vercel.app/research/deepseek-v4-pro-0813-1-6t-ga"
  },
  {
    "researched_date": "2026-08-18",
    "published_date": "2026-08-30",
    "category": "models",
    "title": "DFlash 2 + Qwen3.8-27B — 블록 디퓨전 병렬 드래프팅 vs MTP 비교",
    "summary": "DFlash 2가 MTP 대비 높은 수락률·처리량을 보인다는 원문을 바탕으로, GB10 로컬과 H200 서버 후속 비교가 필요한 후보로 남긴다.",
    "status": "experiment-candidate",
    "external_url": "https://gdevsnack-ai-labs.github.io/devsnack-research-notes/notes/dflash-2-qwen3-8-27b.html",
    "promoted_asset_url": null,
    "original_devsnack_url": "https://devsnack-blog.vercel.app/research/dflash-2-qwen3-8-27b-vs-mtp"
  },
  {
    "researched_date": "2026-07-30",
    "published_date": "2026-08-30",
    "category": "models",
    "title": "Download-only Models Triage — Ternary-Bonsai-27B · Qwopus 3.6-27B",
    "summary": "다운로드·백업 보관은 확인됐지만 benchmark·실사용 결과가 없어 개별 Note 대신 triage로 통합 보존한다.",
    "status": "archived",
    "external_url": "https://gdevsnack-ai-labs.github.io/devsnack-research-notes/notes/download-only-models-triage.html",
    "promoted_asset_url": null,
    "original_devsnack_url": "https://devsnack-blog.vercel.app/research/ternary-bonsai-27b"
  },
  {
    "researched_date": "2026-07-24",
    "published_date": "2026-08-30",
    "category": "models",
    "title": "Kanana-2-30B Abliteration + 파인튜닝",
    "summary": "Kanana-2-30B에 OBLITERATUS와 Unsloth LoRA를 적용하는 가이드 조사이며 실제 실행은 아직 없다.",
    "status": "experiment-candidate",
    "external_url": "https://gdevsnack-ai-labs.github.io/devsnack-research-notes/notes/kanana-2-30b-abliteration.html",
    "promoted_asset_url": null,
    "original_devsnack_url": "https://devsnack-blog.vercel.app/research/kanana-2-30b-abliteration"
  },
  {
    "researched_date": "2026-08-12",
    "published_date": "2026-08-30",
    "category": "models",
    "title": "Muse Glimmer 30B (Meta 오픈 에이전트 모델)",
    "summary": "툴콜링·비전 보조 모델 후보로 GB10 fit 가능성이 조사됐지만, 직접 실행과 주력 모델 비교는 남아 있다.",
    "status": "experiment-candidate",
    "external_url": "https://gdevsnack-ai-labs.github.io/devsnack-research-notes/notes/muse-glimmer-30b-meta.html",
    "promoted_asset_url": null,
    "original_devsnack_url": "https://devsnack-blog.vercel.app/research/muse-glimmer-30b-meta"
  },
  {
    "researched_date": "2026-08-12",
    "published_date": "2026-08-30",
    "category": "models",
    "title": "Qwen3.8-2.4T-A95B (Qwen3.8-Max 오픈웨이트)",
    "summary": "대규모 Qwen3.8 오픈웨이트와 클라우드 Max를 구분한 조사이며 GB10 로컬 실행 후보는 아니다.",
    "status": "research-complete",
    "external_url": "https://gdevsnack-ai-labs.github.io/devsnack-research-notes/notes/qwen3-8-2-4t-a95b-qwen3-8-max.html",
    "promoted_asset_url": null,
    "original_devsnack_url": "https://devsnack-blog.vercel.app/research/qwen3-8-2-4t-a95b-qwen3-8-max"
  },
  {
    "researched_date": "2026-08-13",
    "published_date": "2026-08-30",
    "category": "tools",
    "title": "Karakeep — 북마크-에브리씽 셀프호스팅 앱 (구 Hoarder)",
    "summary": "링크·노트·이미지·PDF를 저장하고 로컬 LLM으로 태깅·검색하는 셀프호스팅 수집 도구 후보다.",
    "status": "experiment-candidate",
    "external_url": "https://gdevsnack-ai-labs.github.io/devsnack-research-notes/notes/karakeep-hoarder.html",
    "promoted_asset_url": null,
    "original_devsnack_url": "https://devsnack-blog.vercel.app/research/karakeep-hoarder"
  },
  {
    "researched_date": "2026-07-30",
    "published_date": "2026-08-30",
    "category": "tools",
    "title": "TokenChaser Lab Note 패턴",
    "summary": "프롬프트 원문·산출물·검증 결과를 함께 공개하는 Lab Note 패턴을 DevSnack 참고 자료로 분석했다.",
    "status": "research-complete",
    "external_url": "https://gdevsnack-ai-labs.github.io/devsnack-research-notes/notes/tokenchaser-lab-note.html",
    "promoted_asset_url": null,
    "original_devsnack_url": "https://devsnack-blog.vercel.app/research/tokenchaser-lab-note"
  },
  {
    "researched_date": "2026-08-18",
    "published_date": "2026-08-30",
    "category": "tools",
    "title": "TokenChaser 벤치마크 프롬프트 팩 + 자체 설계 Self Bench Pack — GB10 로컬 LLM 테스트",
    "summary": "외부 84개 프롬프트를 참고해 자체 24개 팩과 실행·검증기를 준비했지만 전체 실행은 남아 있다.",
    "status": "experiment-candidate",
    "external_url": "https://gdevsnack-ai-labs.github.io/devsnack-research-notes/notes/tokenchaser-self-bench-pack-gb10-llm.html",
    "promoted_asset_url": null,
    "original_devsnack_url": "https://devsnack-blog.vercel.app/research/tokenchaser-self-bench-pack-gb10-llm"
  },
  {
    "researched_date": "2026-07-05",
    "published_date": "2026-08-30",
    "category": "tools",
    "title": "tool-eval-bench (툴콜링 평가)",
    "summary": "결정론적 84개 툴콜링 시나리오를 기존 속도·품질 벤치에 통합하는 후보 조사다.",
    "status": "experiment-candidate",
    "external_url": "https://gdevsnack-ai-labs.github.io/devsnack-research-notes/notes/tool-eval-bench.html",
    "promoted_asset_url": null,
    "original_devsnack_url": "https://devsnack-blog.vercel.app/research/tool-eval-bench"
  }
]
