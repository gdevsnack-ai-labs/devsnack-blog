# Qwen3.6 YouTube Script Reliability Benchmark

이번에는 로컬 Qwen3.6을 실제 YouTube 자동화 대본 생성에 넣고, 결과가 얼마나 안정적으로 production 품질 게이트를 통과하는지 측정했다. 일반적인 토큰 속도 벤치가 아니라, **생성 → 검증 → 피드백 재생성**이라는 실제 운영 과정을 측정한 벤치마크다.

## 한 줄 결론

고정된 실제 입력 4회에서 첫 시도 통과율은 **50%**, production의 최대 5회 재시도 안 최종 통과율은 **75%**였다. 모델이 대본을 만들지 못하는 문제라기보다, 단어 수·팩트 참조·장면별 video prompt 조건을 한 번에 안정적으로 맞추는 문제가 남아 있었다.

## Target

| 항목 | 내용 |
|---|---|
| 측정 대상 | Qwen3.6-35B-A3B NVFP4 MTP HQ |
| 실제 사용 맥락 | YouTube Shorts 자동화의 대본 생성 단계 |
| 평가 목표 | 첫 시도 품질, 재시도 수렴성, 최종 통과율, 실패 유형 |
| 출력 계약 | JSON 대본, 4~6장면, 94~120단어, fact_refs, LTX video_prompt |

## Environment

| 항목 | 설정 |
|---|---|
| 하드웨어 | NVIDIA GB10, DGX Spark |
| 시스템 메모리 | 121GiB unified memory |
| 모델 | Qwen3.6-35B-A3B-NVFP4-MTP-HQ GGUF |
| llama.cpp | build 10582, commit `e85caa81e` |
| 실행 방식 | `llama-cli --single-turn` 직접 실행 |
| Context | 65,536 tokens |
| KV cache | Q8_0 / Q8_0 |
| GPU offload | 999 layers |
| MTP | `draft-mtp` |
| CPU threads | 16 |
| 생성 온도 | 첫 시도 0.7, 재시도 0.5 |

기존 Qwen/Hindsight 서버는 유지한 채 별도 `llama-cli` 프로세스로 대본 단계만 실행했다. 이미지·TTS·영상·음악·Whisper·YouTube 업로드는 호출하지 않았다.

## Method / Protocol

1. 실제 `youtube-automation/projects/`에서 시간순으로 가장 빠른 완료 프로젝트를 프로필별로 하나씩 선택했다.
2. Science와 History의 실제 `research.json`을 고정 입력으로 사용했다.
3. production `s02_script`의 prompt builder와 validator를 그대로 사용했다.
4. 각 semantic attempt는 새 `llama-cli --single-turn` 프로세스로 실행했다.
5. 첫 시도는 temperature 0.7, 재시도는 0.5로 실행했다.
6. 최대 5회 안에 validator를 통과하는지 측정했다.
7. 모델 로딩 오류와 OOM은 품질 실패와 분리해 기록했다.

### Fixture

| 프로필 | 원본 프로젝트 | 기준 대본 |
|---|---|---:|
| Science | `20260824_0043_science_facts_auto` | 5장면 / 113단어 |
| History | `20260824_0106_history_mystery_auto` | 5장면 / 103단어 |

두 기준 대본 모두 현재 production validator를 통과했다.

## Baseline

비교 기준은 새로 만든 이상적인 대본이 아니라, 실제 production 파이프라인에서 이미 완성된 두 기준 대본이다. 따라서 이 벤치마크는 “모델이 기준 대본과 문장을 똑같이 재현하는가”가 아니라, **같은 입력 조건에서 production 출력 계약을 통과하는가**를 측정한다.

## Result

### 전체 결과

| 지표 | 결과 |
|---|---:|
| 유효 반복 수 | 4회 |
| 인프라 오류 | 0회 |
| 1차 통과 | 2 / 4 (50%) |
| 5회 내 최종 통과 | 3 / 4 (75%) |
| 평균 시도 횟수 | 2.5회 |

### 프로필별 결과

| 프로필 | 반복 수 | 1차 통과 | 5회 내 통과 | 평균 시도 | 해석 |
|---|---:|---:|---:|---:|---|
| Science | 2 | 1 / 2 | 1 / 2 (50%) | 3.0회 | 한 번은 5회 후에도 단어 수 조건을 넘지 못함 |
| History | 2 | 1 / 2 | 2 / 2 (100%) | 2.0회 | 재시도에서 최종 수렴했지만 편차가 큼 |
| 전체 | 4 | 2 / 4 (50%) | 3 / 4 (75%) | 2.5회 | 재시도 루프가 유효하지만 완전하지 않음 |

### 반복별 기록

| 프로필 | 반복 | 시도 | 결과 |
|---|---:|---:|---|
| History | 1 | 1회 | 첫 시도 통과 |
| History | 2 | 3회 | 3번째 통과 |
| Science | 1 | 5회 | 최종 실패 |
| Science | 2 | 1회 | 첫 시도 통과 |

## Failure Patterns

| 실패 유형 | 관찰 내용 |
|---|---|
| `fact_refs` 누락 | 사실을 설명하는 장면에서 `fact_refs`가 비어 있는 경우가 반복됨 |
| 단어 수 편차 | History에서 85 → 122 → 88 → 132 → 133단어로 흔들림 |
| video prompt 길이 | 일부 재시도에서 장면별 video prompt가 최소 길이 36단어를 충족하지 못함 |
| 피드백 과잉 보정 | 단어 수를 줄이라는 피드백 이후 오히려 목표보다 크게 짧아지거나 길어지는 현상 |

## Comparison

어제 production 실행에서 Science와 History 모두 대본 단계가 3번째 시도에 통과했다. 이번 독립 CLI 반복에서는 같은 fixture라도 1회에 통과하거나 5회 후 실패하는 결과가 나왔다.

이 차이는 모델이 무작위로 망가졌다는 뜻이라기보다, temperature와 샘플링 결과에 따라 **동일한 검증 조건까지 도달하는 경로가 달라진다**는 뜻에 가깝다. 따라서 production에서는 최종 결과만 저장하는 것보다 각 시도와 실패 이유를 함께 저장하는 편이 중요하다.

## Interpretation

이번 측정에서 Qwen3.6은 실제 YouTube 대본을 만드는 능력 자체는 충분했다. 문제는 첫 결과가 항상 production 계약을 만족하지 않는다는 점이다.

특히 재시도 프롬프트가 “이전 문제만 고치라”고 지시해도, 모델은 단어 수·장면 구성·팩트 참조를 동시에 유지하지 못하고 다른 조건을 흔들 때가 있었다. 이 결과는 모델 교체보다 먼저 다음을 측정해야 한다는 뜻이다.

- 조건별 실패 확률
- 피드백 문구별 수렴률
- 프로필별 재시도 편차
- 실패한 후보를 다음 재시도에서 얼마나 안정적으로 개선하는지

## Limitations

- 고정 fixture 2개, 유효 반복 4회로 표본이 작다.
- Qwen3.6 한 모델과 NVFP4 한 양자화만 측정했다.
- 사람의 문장 품질 평가나 의미 유사도 평가는 포함하지 않았다.
- 대본 이후의 이미지·영상·TTS 품질은 평가하지 않았다.
- MTP를 켠 조건만 측정했으므로 MTP ON/OFF 비교 결과는 아니다.
- 결과는 2026-08-24 KST의 특정 llama.cpp build와 특정 설정에 한정된다.

## Reproduction

벤치 프로젝트에서 다음 단계로 다시 실행할 수 있다.

```bash
cd youtube-automation-benchmark
PYTHONPATH=. python3 run_benchmark.py extract
PYTHONPATH=. python3 run_benchmark.py run --repeats 2 --allow-coresident
PYTHONPATH=. python3 run_benchmark.py report --run-dir results/<timestamp>
```

`--allow-coresident`는 기존 Qwen/Hindsight 서버를 유지한 채 실행하는 옵션이다. 이미지 생성 등 GPU-heavy 단계는 이 벤치마크에 포함하지 않는다.

## Measured Prompt and Result Samples

앞의 표만 보면 무엇을 넣고 무엇을 평가했는지 알기 어렵기 때문에, 실제 측정에 사용한 production prompt 원문과 대표 JSON 결과를 함께 공개한다. 모든 모델은 같은 profile별 prompt를 사용했고, prompt는 모델별 실행 폴더에서 SHA-256을 대조해 동일함을 확인했다.

프롬프트는 **기본 접힘 상태**이며, 제목을 누르면 펼쳐진다. 결과 샘플도 모델별로 접어두었다.

<details>
<summary>Science fixture production prompt — 10563 characters · SHA-256 f03e52aec785d86217a3da4bf79f6dc6c4fde4f9062195b56c90747318fe679b</summary>

```text
You are a professional YouTube scriptwriter.
Channel: "SciNova"
Tone: curious, engaging, slightly humorous
Audience: curious adults 18-45

TOPIC: Floating Solar Farms: The Unexpected Avian Havens
ANGLE: We usually think of solar farms as sterile deserts, but new 2026 data from California shows they are becoming accidental bird sanctuaries. We explore the surprising behavior of night herons and cormorants using these structures for rest and social interaction, challenging our view of renewable energy infrastructure.

VERIFIED FACTS:
[
  {
    "fact_ref": 0,
    "fact": "California biologists have observed black-crowned night herons resting on floating solar structures before dawn.",
    "confidence": "high",
    "source": "Helping Birds and Floating Solar Energy Coexist | UC Davis",
    "source_url": "https://www.ucdavis.com/climate/news/helping-birds-and-floating-solar-energy-coexist",
    "evidence": "During their field work, the authors have seen black-crowned night herons resting on a floating solar structure before dawn",
    "source_type": "searxng"
  },
  {
    "fact_ref": 1,
    "fact": "Double-crested cormorants have been observed jockeying for favorable sites on floating solar structures.",
    "confidence": "high",
    "source": "Helping Birds and Floating Solar Energy Coexist | UC Davis",
    "source_url": "https://www.ucdavis.com/climate/news/helping-birds-and-floating-solar-energy-coexist",
    "evidence": "double-breasted cormorants jockeying for a favorable site",
    "source_type": "searxng"
  },
  {
    "fact_ref": 2,
    "fact": "Black phoebes have been observed nesting under floating solar panels.",
    "confidence": "high",
    "source": "Helping Birds and Floating Solar Energy Coexist | UC Davis",
    "source_url": "https://www.ucdavis.com/climate/news/helping-birds-and-floating-solar-energy-coexist",
    "evidence": "black phoebes nesting under panels, and more.",
    "source_type": "searxng"
  },
  {
    "fact_ref": 3,
    "fact": "Floating solar panels in California are becoming 'artificial islands' for waterbirds such as herons and egrets.",
    "confidence": "medium",
    "source": "California scientists have discovered how to turn floating solar panels ...",
    "source_url": "https://energiesmedia.com/floating-solar-panels-islands-egrets-herons/",
    "evidence": "California's floating solar panels are becoming 'artificial islands' for waterbirds, such as herons and egrets.",
    "source_type": "searxng"
  },
  {
    "fact_ref": 4,
    "fact": "Los Angeles surveyed Encino Reservoir 8 times before covering 10 acres with floating solar in 2025.",
    "confidence": "medium",
    "source": "In 2025, Los Angeles surveyed Encino Reservoir 8 times...",
    "source_url": "https://www.msn.com/en-in/news/other/in-2025-los-angeles-surveyed-encino-reservoir-8-times-before-covering-10-acres-with-floating-solar-biologists-documented-60-wildlife-species/ar-AA2arAMK?ocid=BingNewsVerp",
    "evidence": "In 2025, Los Angeles surveyed Encino Reservoir 8 times before covering 10 acres with floating solar",
    "source_type": "searxng"
  },
  {
    "fact_ref": 5,
    "fact": "Biologists documented 60 wildlife species at the Encino Reservoir floating solar site.",
    "confidence": "medium",
    "source": "In 2025, Los Angeles surveyed Encino Reservoir 8 times...",
    "source_url": "https://www.msn.com/en-in/news/other/in-2025-los-angeles-surveyed-encino-reservoir-8-times-before-covering-10-acres-with-floating-solar-biologists-documented-60-wildlife-species/ar-AA2arAMK?ocid=BingNewsVerp",
    "evidence": "biologists documented 60 wildlife species",
    "source_type": "searxng"
  },
  {
    "fact_ref": 6,
    "fact": "Special attention was paid to the federally protected Least Bell's Vireo at the Encino Reservoir site.",
    "confidence": "medium",
    "source": "In 2025, Los Angeles surveyed Encino Reservoir 8 times...",
    "source_url": "https://www.msn.com/en-in/news/other/in-2025-los-angeles-surveyed-encino-reservoir-8-times-before-covering-10-acres-with-floating-solar-biologists-documented-60-wildlife-species/ar-AA2arAMK",
    "evidence": "Special attention was paid to the federally protected Least Bell's Vireo, which,",
    "source_type": "searxng"
  },
  {
    "fact_ref": 7,
    "fact": "New Jersey revived a floating-solar project in 2026 with a 10 MW incentive after rejecting a waiver in 2024.",
    "confidence": "medium",
    "source": "New Jersey rejected a floating-solar waiver in 2024...",
    "source_url": "https://www.ecoportal.net/en/new-jersey-floating-solar-waiver-eagle/33008/",
    "evidence": "New Jersey rejected a floating-solar waiver in 2024, then revived the project with a 10 MW incentive in 2026",
    "source_type": "searxng"
  },
  {
    "fact_ref": 8,
    "fact": "India approved the PM Surya Sarovar Yojana scheme in 2026 for 5,000 MW of floating solar projects.",
    "confidence": "medium",
    "source": "New government scheme 2026: PM Surya Sarovar Yojana approved...",
    "source_url": "https://www.msn.com/en-in/news/other/new-government-scheme-2026-pm-surya-sarovar-yojana-approved-5000-mw-floating-solar-projects-to-be-developed/ar-AA29LhZk?ocid=BingNewsVerp",
    "evidence": "PM Surya Sarovar Yojana approved, 5,000 MW floating solar projects to be developed",
    "source_type": "searxng"
  }
]

KEY STATS: [{"stat": "60 wildlife species documented at Encino Reservoir", "fact_ref": 5}, {"stat": "10 acres of floating solar at Encino Reservoir", "fact_ref": 4}, {"stat": "8 surveys conducted before installation at Encino Reservoir", "fact_ref": 4}]
HOOK IDEAS: ["How floating solar panels are turning reservoirs into 'artificial islands' for birds like herons and cormorants.", "The surprising behavior of black phoebes nesting directly under solar panels in California.", "Why Los Angeles surveyed a reservoir 8 times before installing floating solar to protect species like the Least Bell's Vireo."]

FORMAT: YouTube Shorts (approximately 50 seconds)
STRUCTURE: hook → fact → explanation → mind-blow → CTA
IMAGE ORIENTATION: vertical (9:16 portrait)
LANGUAGE: en




Each scene gets ONE visual starting frame displayed while narration plays.
For generated images, describe a specific static composition that can be animated later.
All subjects required for later interaction must already be visible in the frame.
IMAGE STYLE: photorealistic scientific visualization, dramatic lighting, deep space blue and gold palette
IMAGE NEGATIVE CONSTRAINTS: text, watermark, cartoon, anime, low quality, blurry
Never include channel logos, channel names, brand names, watermarks, readable text,
captions, letters, or signage in image_prompt. Do not borrow visual identity from any
other channel or from previous examples.
LTX VIDEO PROMPT (ALL scenes):
- EVERY scene MUST include "video_prompt": an image-to-video motion prompt for LTX 2.3
- CRITICAL: write an ORIGINAL motion prompt specific to EACH scene's image_prompt subject
  (DO NOT copy any example below verbatim)
- Describe a coherent TIME-BASED MOTION SEQUENCE that fits the scene's duration_estimate.
- Divide each scene into 3-4 sequential beats from beginning to end
  (for example: [0-2s] approach, [2-5s] action, [5-8s] reaction, [8-10s] final state).
- The video_prompt MUST contain explicit bracketed time markers in this exact style:
  [0-2s] ... [2-5s] ... [5-8s] ...; do not write an un-timestamped prose paragraph.
- Every beat must describe visible subject action, one clear camera movement,
  and what becomes visible as a result of that movement.
- Use present-tense physical verbs: charges, pivots, unfolds, collides, rotates,
  cracks, recoils, bursts, drifts, tracks, whip-pans, pulls back.
- Motion style cue to adapt, not copy: clear directional camera movement, visible subject motion, decisive push-in, tracking or orbital movement, noticeable environmental motion
- FORBIDDEN weak words: slow, slowly, gentle, subtle, slight, barely, calm, smooth
- Use ACTIVE, VISIBLE motion, but keep it physically plausible and appropriate to the channel.
- The reference image is authoritative: animate only subjects already visible in it.
  NEVER introduce a new person, creature, object, logo, or setting in video_prompt.
- Do not restate the image's static appearance; describe only action, camera,
  environmental movement, and the resulting change in view.
- Write a connected natural-language sequence of roughly 80-150 words, not keywords.
- Avoid abrupt resets, teleportation, impossible body transformations, and unrelated actions.

Generate script as JSON ONLY:
{
  "title": "engaging YouTube title",
  "description": "2-3 sentence YouTube description with keywords",
  "tags": ["relevant", "seo", "tags"],
  "scenes": [
    {
      "scene_number": 1,
      "narration": "exact words spoken aloud",
      "duration_estimate": 35.0,
      "fact_refs": [0],
      "image_prompt": "detailed visual description for AI image generation",
      "video_prompt": "time-based LTX motion sequence, 80-150 words, fitted to this scene",
      "sfx_description": "sound effect or null",
      "transition": "cut"
    }
  ],
  "music_prompt": "background music style",
  "music_tags": ["genre", "mood"]
}

DURATION REQUIREMENTS:
- FINAL COMPOSED VIDEO TARGET: approximately 50 seconds.
- The final video includes short pauses and scene transitions, so aim for narration
  near 47 seconds. Actual TTS duration is checked and mildly speed-corrected later.
- TOTAL NARRATION WORD TARGET: 94-120 words; aim near the middle,
  not the upper bound.
- Each scene narration: 1-3 concise sentences, normally 5-11 seconds when spoken.
- Use 4-6 scenes total and make each scene advance the story or explanation.
- Do not add filler sentences merely to increase duration.

RULES:
- Narration must sound natural when read aloud
- Hook MUST grab attention in first 2 seconds
- Every fact must come from the verified facts above
- Never invent dates, numbers, names, or causal claims not supported by the verified facts
- Each scene MUST include `fact_refs`, a list of zero-based fact_ref values used by its narration.
  Use an empty list only for a genuinely pure hook, transition, atmosphere, or CTA scene.
  If a scene contains any factual claim or interpretation before its CTA, it MUST have refs.
- Image prompts: be specific, static, visually coherent, and use only the supplied style
- duration_estimate: calculate from word count divided by 2.1
- Follow STRUCTURE exactly. Add a subscribe CTA only when the structure or profile style calls for it
- NO markdown, ONLY valid JSON
```

</details>

<details>
<summary>History fixture production prompt — 10828 characters · SHA-256 ab5fd424edf507e8040ec874e6d250b1408b594432822eb7fa36334490871c02</summary>

```text
You are a professional YouTube scriptwriter.
Channel: "Epoch Unseen"
Tone: dramatic, mysterious, documentary-style gravitas
Audience: history enthusiasts 18-50, mystery lovers

TOPIC: Lake Mead's Receding Waters: Unearthing the Sunken Towns of Crystal and St. Thomas
ANGLE: While many focus on the environmental crisis of drought, this video explores the 'Archaeology of Exposure.' As water levels hit historic lows in 2026, the ghost towns of Crystal and St. Thomas are re-emerging. We will investigate the specific artifacts being washed ashore—the pianos, cars, and personal effects of a civilization that was deliberately erased by the Hoover Dam—and analyze how modern LiDAR is mapping these submerged ruins to understand the social disruption of mid-20th-century forced relocation, presenting it not as a conspiracy, but as a poignant, physical manifestation of progress's hidden costs.

VERIFIED FACTS:
[
  {
    "fact_ref": 0,
    "fact": "Lake Mead has reached its lowest water level since the reservoir was created approximately 90 years ago.",
    "confidence": "high",
    "source": "Lake Mead hits historic low water level as Colorado River struggles",
    "source_url": "https://apnews.com/article/colorado-river-lake-mead-record-low-fa402842e76ed624f71360f467b2579d",
    "evidence": "The largest reservoir in the United States has plummeted to its lowest water level since it was created some 90 years ago.",
    "source_type": "searxng"
  },
  {
    "fact_ref": 1,
    "fact": "Lake Mead's water levels have dipped below the previous record low set in 2022.",
    "confidence": "high",
    "source": "Lake Mead plummets to historic low water level as Colorado River struggles",
    "source_url": "https://www.theguardian.com/us-news/2026/aug/09/lake-mead-record-low-water-level-colorado-river",
    "evidence": "Levels at reservoir along Arizona-Nevada border dipped below previous record set in 2022, amid water crisis in west ...",
    "source_type": "searxng"
  },
  {
    "fact_ref": 2,
    "fact": "The town of St. Thomas, Nevada, is visible again as lower water levels expose its ruins.",
    "confidence": "high",
    "source": "A lost town resurfaces near Lake Mead as drought exposes the remains of ...",
    "source_url": "https://wheninyourstate.com/nevada/a-lost-town-resurfaces-near-lake-mead-as-drought-exposes-the-remains-of-st-thomas/",
    "evidence": "Now, the St. Thomas Ruins inside Lake Mead National Recreation Area are visible again as lower water levels expose foun",
    "source_type": "searxng"
  },
  {
    "fact_ref": 3,
    "fact": "St. Thomas disappeared beneath Lake Mead after Hoover Dam created the reservoir.",
    "confidence": "high",
    "source": "A lost town resurfaces near Lake Mead as drought exposes the remains of ...",
    "source_url": "https://wheninyourstate.com/nevada/a-lost-town-resurfaces-near-lake-mead-as-drought-exposes-the-remains-of-st-thomas/",
    "evidence": "St. Thomas, Nevada, disappeared beneath Lake Mead after Hoover Dam created the reservoir and reshaped how the Colorado River is managed in the region.",
    "source_type": "searxng"
  },
  {
    "fact_ref": 4,
    "fact": "Lake Mead's dropping waters have revealed human remains, including a sixth set found recently and a notable unsolved murder case from 2022.",
    "confidence": "high",
    "source": "Grim discoveries emerge as Lake Mead's water levels drop",
    "source_url": "https://www.dispatch.com/in-depth/graphics/2026/08/20/lake-mead-bodies-discovered-drought/91385455007/",
    "evidence": "A sixth set of human remains has been found as Lake Mead nears the water level that revealed a series of startling discoveries in 2022.",
    "source_type": "searxng"
  },
  {
    "fact_ref": 5,
    "fact": "The 2022 revelation at Lake Mead involved an unsolved murder case linked to the era when the mob ran Las Vegas.",
    "confidence": "medium",
    "source": "When Lake Mead hits new lows, its waters unveil mysteries. Last time, it revealed a murder case that is still unsolved",
    "source_url": "https://www.msn.com/en-us/news/us/when-lake-mead-hits-new-lows-its-waters-unveil-mysteries-last-time-it-revealed-a-murder-case-that-is-still-unsolved/ar-AA2aCHGJ",
    "evidence": "Investigators have gone to great lengths to solve the case, while true crime enthusiasts foster theories about the killing that happened when the mob ran Las Vegas.",
    "source_type": "searxng"
  },
  {
    "fact_ref": 6,
    "fact": "Lake Mead is located along the Arizona-Nevada border and is one of the largest manmade lakes in North America.",
    "confidence": "high",
    "source": "Lake Mead - Nature, Culture and History at the Grand Canyon",
    "source_url": "https://grcahistory.org/sites/beyond-park-boundaries/lake-mead/",
    "evidence": "At the southwestern edge of Grand Canyon National Park, on the Arizona-Nevada line, the Colorado River flows into Lake Mead, one of the largest manmade lakes in North America.",
    "source_type": "searxng"
  },
  {
    "fact_ref": 7,
    "fact": "Lake Mead's water levels have dropped to just above 1,000 feet.",
    "confidence": "medium",
    "source": "Lake Mead nears historic low as water crisis worsens",
    "source_url": "https://www.nbcnews.com/video/lake-mead-nears-historic-low-as-water-crisis-worsens-268348485937",
    "evidence": "Lake Mead, the nation's largest reservoir and a critical water source for millions across seven states, has seen water levels drop to just above 1,000 feet, raising concerns about the Colorado River's future.",
    "source_type": "searxng"
  }
]

KEY STATS: [{"stat": "Water level dropped to just above 1,000 feet", "fact_ref": 7}, {"stat": "Sixth set of human remains found in recent drought exposure", "fact_ref": 5}]
HOOK IDEAS: ["The 'Ghost Town' Effect: How a historic drought is literally unearthing the submerged ruins of St. Thomas, Nevada.", "Murder in the Reservoir: The unsolved mob-related killing exposed by Lake Mead's receding waters in 2022.", "Record Lows: Lake Mead hits its lowest point in 90 years, revealing grim mysteries and lost history."]

FORMAT: YouTube Shorts (approximately 50 seconds)
STRUCTURE: hook → mystery setup → key evidence → revelation → CTA
IMAGE ORIENTATION: vertical (9:16 portrait)
LANGUAGE: en




Each scene gets ONE visual starting frame displayed while narration plays.
For generated images, describe a specific static composition that can be animated later.
All subjects required for later interaction must already be visible in the frame.
IMAGE STYLE: cinematic historical photography, dramatic ancient ruins, moody fog and dust particles, archaeological sites, weathered textures, photorealistic, epic scale
IMAGE NEGATIVE CONSTRAINTS: text, watermark, cartoon, anime, low quality, blurry, modern objects, bright cheerful
Never include channel logos, channel names, brand names, watermarks, readable text,
captions, letters, or signage in image_prompt. Do not borrow visual identity from any
other channel or from previous examples.
LTX VIDEO PROMPT (ALL scenes):
- EVERY scene MUST include "video_prompt": an image-to-video motion prompt for LTX 2.3
- CRITICAL: write an ORIGINAL motion prompt specific to EACH scene's image_prompt subject
  (DO NOT copy any example below verbatim)
- Describe a coherent TIME-BASED MOTION SEQUENCE that fits the scene's duration_estimate.
- Divide each scene into 3-4 sequential beats from beginning to end
  (for example: [0-2s] approach, [2-5s] action, [5-8s] reaction, [8-10s] final state).
- The video_prompt MUST contain explicit bracketed time markers in this exact style:
  [0-2s] ... [2-5s] ... [5-8s] ...; do not write an un-timestamped prose paragraph.
- Every beat must describe visible subject action, one clear camera movement,
  and what becomes visible as a result of that movement.
- Use present-tense physical verbs: charges, pivots, unfolds, collides, rotates,
  cracks, recoils, bursts, drifts, tracks, whip-pans, pulls back.
- Motion style cue to adapt, not copy: clear directional camera movement, visible subject motion, decisive push-in, tracking or orbital movement, noticeable environmental motion
- FORBIDDEN weak words: slow, slowly, gentle, subtle, slight, barely, calm, smooth
- Use ACTIVE, VISIBLE motion, but keep it physically plausible and appropriate to the channel.
- The reference image is authoritative: animate only subjects already visible in it.
  NEVER introduce a new person, creature, object, logo, or setting in video_prompt.
- Do not restate the image's static appearance; describe only action, camera,
  environmental movement, and the resulting change in view.
- Write a connected natural-language sequence of roughly 80-150 words, not keywords.
- Avoid abrupt resets, teleportation, impossible body transformations, and unrelated actions.

Generate script as JSON ONLY:
{
  "title": "engaging YouTube title",
  "description": "2-3 sentence YouTube description with keywords",
  "tags": ["relevant", "seo", "tags"],
  "scenes": [
    {
      "scene_number": 1,
      "narration": "exact words spoken aloud",
      "duration_estimate": 35.0,
      "fact_refs": [0],
      "image_prompt": "detailed visual description for AI image generation",
      "video_prompt": "time-based LTX motion sequence, 80-150 words, fitted to this scene",
      "sfx_description": "sound effect or null",
      "transition": "cut"
    }
  ],
  "music_prompt": "background music style",
  "music_tags": ["genre", "mood"]
}

DURATION REQUIREMENTS:
- FINAL COMPOSED VIDEO TARGET: approximately 50 seconds.
- The final video includes short pauses and scene transitions, so aim for narration
  near 47 seconds. Actual TTS duration is checked and mildly speed-corrected later.
- TOTAL NARRATION WORD TARGET: 94-120 words; aim near the middle,
  not the upper bound.
- Each scene narration: 1-3 concise sentences, normally 5-11 seconds when spoken.
- Use 4-6 scenes total and make each scene advance the story or explanation.
- Do not add filler sentences merely to increase duration.

RULES:
- Narration must sound natural when read aloud
- Hook MUST grab attention in first 2 seconds
- Every fact must come from the verified facts above
- Never invent dates, numbers, names, or causal claims not supported by the verified facts
- Each scene MUST include `fact_refs`, a list of zero-based fact_ref values used by its narration.
  Use an empty list only for a genuinely pure hook, transition, atmosphere, or CTA scene.
  If a scene contains any factual claim or interpretation before its CTA, it MUST have refs.
- Image prompts: be specific, static, visually coherent, and use only the supplied style
- duration_estimate: calculate from word count divided by 2.1
- Follow STRUCTURE exactly. Add a subscribe CTA only when the structure or profile style calls for it
- NO markdown, ONLY valid JSON
```

</details>

<details>
<summary>Representative JSON result samples — Science fixture</summary>

첫 번째 통과 결과를 우선 선택했고, 5회 내 통과하지 못한 모델은 마지막 시도 결과를 표시했다.

<details>
<summary>Qwen3.6 NVFP4 MTP TURBO — passed candidate</summary>

```json
{
  "title": "Solar Panels Are Secret Bird Sanctuaries! 🐦☀️",
  "description": "Floating solar farms in California are becoming accidental bird havens. See how herons and cormorants use these 'artificial islands' for rest and nesting, with new 2026 data revealing 60+ wildlife species thriving.",
  "tags": [
    "floating solar",
    "bird sanctuary",
    "renewable energy",
    "wildlife conservation",
    "California nature",
    "SciNova",
    "solar power facts"
  ],
  "scenes": [
    {
      "scene_number": 1,
      "narration": "We think of solar farms as sterile deserts. But in California, floating panels are turning reservoirs into artificial islands for birds.",
      "duration_estimate": 7.1,
      "fact_refs": [
        3
      ],
      "image_prompt": "Photorealistic wide shot of a calm reservoir surface at dawn. A cluster of modern floating solar panels forms a geometric grid on the water. In the foreground, a black-crowned night heron stands perched on the edge of a panel, silhouetted against the soft blue and gold morning light. The water is still, reflecting the panels and the bird. Deep space blue and gold color palette. No text or logos.",
      "video_prompt": "[0-2s] The camera slowly drifts forward over the calm water surface, approaching the floating solar array. [2-5s] The camera tilts up slightly to reveal the black-crowned night heron standing still on the panel edge, its feathers ruffling slightly in the breeze. [5-8s] The camera continues a gentle push-in toward the bird, highlighting its silhouette against the glowing horizon. [8-10s] The scene holds on the heron as the water ripples subtly around the panel structure.",
      "sfx_description": "Ambient morning birdsong, gentle water lapping",
      "transition": "cut"
    },
    {
      "scene_number": 2,
      "narration": "Biologists spotted double-crested cormorants jockeying for prime real estate on these structures, while black phoebes nest directly underneath.",
      "duration_estimate": 8.1,
      "fact_refs": [
        1,
        2
      ],
      "image_prompt": "Close-up, low-angle shot looking up at the underside of floating solar panels. A black phoebe is perched on a structural beam beneath the panel, looking out. Above, through the gaps in the panel grid, the sky is visible. The lighting is dramatic, with shadows cast by the panels and warm sunlight hitting the bird's feathers. Deep space blue and gold palette. No text or logos.",
      "video_prompt": "[0-2s] The camera pans slowly from left to right, revealing the structural beams under the solar panels. [2-5s] The black phoebe turns its head sharply, looking around, its beak slightly open as if calling. [5-8s] The camera tracks the bird's movement, keeping it centered as it shifts its weight on the beam. [8-10s] The camera pulls back slightly to show the bird's position relative to the panel grid above, emphasizing the sheltered space.",
      "sfx_description": "Bird chirp, subtle mechanical hum of water",
      "transition": "cut"
    },
    {
      "scene_number": 3,
      "narration": "Los Angeles surveyed this reservoir eight times before installing ten acres of floating solar in 2025 to protect species like the Least Bell's Vireo.",
      "duration_estimate": 8.6,
      "fact_refs": [
        4,
        6
      ],
      "image_prompt": "Aerial top-down view of a large reservoir section covered with floating solar panels. The panels form a dense, geometric pattern on the blue water. In the distance, the shoreline is visible with green vegetation. The lighting is bright and clear, highlighting the contrast between the dark panels and the blue water. Deep space blue and gold palette. No text or logos.",
      "video_prompt": "[0-2s] The camera descends rapidly from a high altitude, focusing on the grid of solar panels. [2-5s] The camera rotates slowly clockwise, tracking the geometric pattern of the panels as they float on the water. [5-8s] The camera zooms in slightly on a specific section of the array, showing the stability of the structure. [8-10s] The camera holds steady, showing the vast scale of the installation against the natural reservoir backdrop.",
      "sfx_description": "Whoosh of descent, ambient wind",
      "transition": "cut"
    },
    {
      "scene_number": 4,
      "narration": "The result? Biologists documented sixty wildlife species at the site, proving these 'green' energy sites are also biodiversity hotspots.",
      "duration_estimate": 7.6,
      "fact_refs": [
        5
      ],
      "image_prompt": "A vibrant, dynamic scene showing multiple bird species interacting near the floating solar panels. A heron stands on a panel, a cormorant flaps its wings nearby, and fish jump from the water in the foreground. The sunlight creates a golden glow on the water and birds. Deep space blue and gold palette. No text or logos.",
      "video_prompt": "[0-2s] The camera pans quickly from left to right, capturing the heron on the panel. [2-5s] The camera follows the cormorant as it flaps its wings and lands on an adjacent panel, creating ripples in the water. [5-8s] The camera tilts down to show fish jumping from the water, then pans back up to the birds. [8-10s] The camera pulls back to reveal the lively interaction between the birds and the solar infrastructure.",
      "sfx_description": "Bird calls, water splashing, wing flaps",
      "transition": "cut"
    },
    {
      "scene_number": 5,
      "narration": "From New Jersey to India, floating solar is expanding globally. Are you ready to see more unexpected nature meets tech stories? Subscribe for more SciNova insights!",
      "duration_estimate": 8.1,
      "fact_refs": [
        7,
        8
      ],
      "image_prompt": "A split-screen composition. On the left, a floating solar farm in a lush, green landscape (representing New Jersey or India). On the right, a stylized, glowing globe with solar icons connecting different continents. The background is a deep space blue with gold accents. No text or logos.",
      "video_prompt": "[0-2s] The left side of the screen shows a slow pan across a floating solar farm in a green landscape. [2-5s] The right side reveals a rotating globe with glowing gold lines connecting solar icons across continents. [5-8s] The two scenes merge seamlessly, with the globe becoming the central focus, pulsing with light. [8-10s] The camera zooms in on the globe, highlighting the global reach of the technology.",
      "sfx_description": "Upbeat, futuristic synth tone, subtle chime",
      "transition": "fade out"
    }
  ],
  "music_prompt": "Upbeat, curious, and slightly humorous electronic track with a steady rhythm. Features synth pads and light percussion. Starts mysterious and builds to an energetic, positive conclusion.",
  "music_tags": [
    "electronic",
    "curious",
    "upbeat",
    "documentary"
  ]
}
```

</details>

<details>
<summary>Qwen3.6 Q8_0 — passed candidate</summary>

```json
{
  "title": "Solar Panels Are Secret Bird Sanctuaries!",
  "description": "Discover how floating solar farms in California are becoming unexpected havens for herons, cormorants, and 60+ wildlife species. See the science behind these artificial islands.",
  "tags": [
    "floating solar",
    "bird sanctuary",
    "renewable energy",
    "California wildlife",
    "Encino Reservoir",
    "night herons",
    "cormorants",
    "green energy",
    "wildlife conservation"
  ],
  "scenes": [
    {
      "scene_number": 1,
      "narration": "We usually think of solar farms as sterile deserts, but new 2026 data from California reveals they are actually becoming accidental bird sanctuaries.",
      "duration_estimate": 9.5,
      "fact_refs": [
        0,
        1,
        3
      ],
      "image_prompt": "Photorealistic wide shot of a floating solar farm on a calm reservoir at dawn. Black-crowned night herons are perched on the edges of the floating panels, silhouetted against the rising sun. The palette is deep space blue and gold. High contrast, dramatic lighting, sharp focus on the birds and panels.",
      "video_prompt": "[0-2s] Camera slowly pushes forward over the water surface toward the floating solar arrays. [2-5s] A black-crowned night heron shifts its weight on a panel edge, turning its head to scan the surroundings. [5-8s] Camera tracks right, revealing a double-crested cormorant jockeying for position on an adjacent panel. [8-10s] The heron settles back down, wings slightly flared for balance, as the camera holds steady on the interaction.",
      "sfx_description": "Soft water lapping, distant bird call",
      "transition": "cut"
    },
    {
      "scene_number": 2,
      "narration": "Black phoebes have been observed nesting directly under these panels, turning infrastructure into artificial islands for waterbirds like herons and egrets.",
      "duration_estimate": 9.0,
      "fact_refs": [
        2,
        3
      ],
      "image_prompt": "Close-up low-angle shot looking up from beneath a floating solar panel. A black phoebe is perched on a structural beam, with a nest visible in the shadows. Sunlight filters through the panel gaps, creating dappled gold light on the bird's feathers. Deep blue shadows in the background. Photorealistic, high detail.",
      "video_prompt": "[0-2s] Camera tilts up from the water line to reveal the underside of the solar panel structure. [2-5s] A black phoebe hops along a metal beam, adjusting its position near a small nest. [5-8s] Camera orbits slightly to the left, showing the dappled sunlight patterns shifting as the panel floats gently. [8-10s] The bird settles into the nest, tucking its head, while the camera pulls back slowly to frame the entire under-structure.",
      "sfx_description": "Subtle mechanical hum, bird chirp",
      "transition": "cut"
    },
    {
      "scene_number": 3,
      "narration": "Los Angeles surveyed the Encino Reservoir eight times before covering ten acres with solar, documenting sixty wildlife species including the protected Least Bell's Vireo.",
      "duration_estimate": 11.0,
      "fact_refs": [
        4,
        5,
        6
      ],
      "image_prompt": "Aerial top-down view of the Encino Reservoir floating solar farm. The geometric grid of solar panels contrasts with the natural water. A small inset graphic overlay (non-textual, just a subtle icon) indicates a bird detection zone. The lighting is bright daylight with deep blue water and gold panel reflections. Photorealistic, scientific visualization style.",
      "video_prompt": "[0-3s] Camera descends rapidly from a high altitude toward the reservoir surface. [3-6s] The view stabilizes over the solar array, showing the grid pattern. [6-9s] A subtle ripple moves across the water, and a bird flies low over the panels, triggering a visual pulse effect. [9-12s] Camera zooms in slightly on a specific cluster of panels where wildlife activity is implied, holding the shot.",
      "sfx_description": "Whoosh of descent, electronic ping",
      "transition": "cut"
    },
    {
      "scene_number": 4,
      "narration": "From New Jersey to India, floating solar is expanding globally, proving that renewable energy and nature can coexist in unexpected ways.",
      "duration_estimate": 9.5,
      "fact_refs": [
        7,
        8
      ],
      "image_prompt": "Split composition: Left side shows a floating solar farm in New Jersey with a modern city skyline in the distance. Right side shows a large-scale floating solar project in India with lush greenery. A golden light beam connects the two sides. Deep space blue and gold palette. Photorealistic, cinematic lighting.",
      "video_prompt": "[0-3s] Camera pans left to right, starting with the New Jersey scene. [3-6s] The golden light beam intensifies, bridging the gap between the two locations. [6-9s] The camera continues panning to reveal the Indian landscape, with panels reflecting the sun. [9-12s] The two scenes merge visually as the camera pulls back, showing the global scale of the technology.",
      "sfx_description": "Ethereal swell, subtle wind",
      "transition": "cut"
    },
    {
      "scene_number": 5,
      "narration": "Nature is adapting faster than we expect. What other hidden ecosystems are hiding in plain sight? Subscribe to SciNova for more surprising science.",
      "duration_estimate": 11.0,
      "fact_refs": [],
      "image_prompt": "A single black-crowned night heron perched on a floating solar panel, looking directly at the camera. The background is a soft blur of blue water and gold sunlight. The bird's eyes are sharp and engaging. Photorealistic, portrait orientation, dramatic lighting.",
      "video_prompt": "[0-3s] Camera slowly pushes in on the heron's face. [3-6s] The heron blinks slowly, maintaining eye contact. [6-9s] The camera pulls back slightly, framing the bird against the vast reservoir. [9-12s] The heron turns its head away, looking out over the water, as the scene fades to black.",
      "sfx_description": "Bird call, fade out",
      "transition": "fade to black"
    }
  ],
  "music_prompt": "Curious, upbeat electronic ambient track with a sense of discovery and wonder",
  "music_tags": [
    "ambient",
    "electronic",
    "curious",
    "uplifting"
  ]
}
```

</details>

<details>
<summary>Qwen3.6 APEX MTP-I Balanced — last candidate after max retries — validator failed</summary>

```json
{
  "title": "Solar Farms Are Secret Bird Sanctuaries! 🐦☀️",
  "description": "Floating solar panels in California are becoming accidental bird havens. See how herons, cormorants, and phoebes use these artificial islands. Discover the 60+ wildlife species thriving at Encino Reservoir.",
  "tags": [
    "floating solar",
    "bird sanctuary",
    "renewable energy",
    "California wildlife",
    "Encino Reservoir",
    "night herons",
    "cormorants",
    "green tech",
    "nature meets technology"
  ],
  "scenes": [
    {
      "scene_number": 1,
      "narration": "We usually picture solar farms as sterile, silent deserts. But new 2026 data reveals a surprising twist: floating panels are turning into accidental bird sanctuaries.",
      "duration_estimate": 11.4,
      "fact_refs": [
        3
      ],
      "image_prompt": "Photorealistic wide shot of a large California reservoir covered in floating solar panel arrays. The water is deep blue, reflecting a golden sunrise. Several black-crowned night herons are perched on the edges of the panels, silhouetted against the bright light. The composition is vertical, emphasizing the vastness of the array and the scale of the birds.",
      "video_prompt": "[0-2s] Camera slowly pushes in toward the central panel cluster where herons stand. [2-5s] One heron stretches its neck and looks left, while another shifts its weight. [5-8s] Camera orbits slightly right, revealing more panels shimmering in the golden light. [8-11s] Final static shot of the herons resting calmly on the floating structures.",
      "sfx_description": "Subtle water lapping and distant bird call",
      "transition": "cut"
    },
    {
      "scene_number": 2,
      "narration": "Biologists observed double-crested cormorants aggressively jockeying for the most favorable spots on these structures. They treat these panels like prime real estate for social interaction and rest.",
      "duration_estimate": 11.4,
      "fact_refs": [
        1
      ],
      "image_prompt": "Close-up vertical shot of two double-crested cormorants on a floating solar panel. One cormorant is flapping its wings aggressively toward the other, creating a dynamic scene of territorial behavior. The water below is dark blue, and the panel surface is dark and reflective. The lighting is dramatic, highlighting the texture of their feathers.",
      "video_prompt": "[0-2s] Camera tracks left, following the aggressive cormorant as it lunges forward. [2-5s] The second cormorant flaps its wings defensively, splashing water droplets into the air. [5-8s] Camera pulls back slightly to show both birds on the same panel. [8-11s] The aggressive bird settles down, claiming the spot, while the other retreats slightly.",
      "sfx_description": "Bird squawking and water splash",
      "transition": "cut"
    },
    {
      "scene_number": 3,
      "narration": "Even black phoebes have started nesting directly under the panels. This behavior challenges our view of renewable infrastructure as purely industrial.",
      "duration_estimate": 10.5,
      "fact_refs": [
        2
      ],
      "image_prompt": "Low-angle vertical shot looking up at the underside of a floating solar panel array. A small black phoebe is perched on a support beam, building a nest with twigs. The background is the deep blue water and the dark underside of the panels. The lighting is dim and moody, emphasizing the hidden nature of the nest.",
      "video_prompt": "[0-2s] Camera tilts up slowly from the water surface to the panel underside. [2-5s] The black phoebe hops along the beam, carrying a twig in its beak. [5-8s] Camera zooms in slightly on the bird as it places the twig into the nest structure. [8-10.5s] The bird settles into the nest, tucking its head in.",
      "sfx_description": "Soft wind and subtle nesting sounds",
      "transition": "cut"
    },
    {
      "scene_number": 4,
      "narration": "At Los Angeles' Encino Reservoir, biologists documented sixty wildlife species after covering ten acres with floating solar. They even protected the federally endangered Least Bell's Vireo.",
      "duration_estimate": 11.4,
      "fact_refs": [
        5,
        4,
        6
      ],
      "image_prompt": "Vertical split composition: top half shows a lush green shoreline with dense vegetation, bottom half shows the blue water with floating solar panels. A small Least Bell's Vireo is visible perched on a branch near the water's edge. The lighting is bright and natural, highlighting the coexistence of nature and technology.",
      "video_prompt": "[0-2s] Camera pans down from the green shoreline to the water. [2-5s] The Least Bell's Vireo flits from branch to branch near the water. [5-8s] Camera tracks right, following the bird as it moves closer to the solar panels. [8-11.4s] Final shot shows the bird perched safely between the vegetation and the floating array.",
      "sfx_description": "Bird chirping and gentle water flow",
      "transition": "cut"
    },
    {
      "scene_number": 5,
      "narration": "From India's new five-gigawatt schemes to New Jersey's revived projects, floating solar is expanding. But here, it's proving to be a haven for wildlife. Subscribe for more unexpected science!",
      "duration_estimate": 10.5,
      "fact_refs": [
        8,
        7
      ],
      "image_prompt": "Vertical shot of a diverse collage: top section shows a massive floating solar farm in India, middle section shows a New Jersey reservoir with panels, bottom section shows a close-up of a bird flying over water. The lighting is golden and hopeful, symbolizing global expansion and harmony.",
      "video_prompt": "[0-2s] Camera zooms out rapidly from the bird close-up to reveal the global collage. [2-5s] The India section glows with bright sunlight, then transitions to the New Jersey section. [5-8s] Camera pans down to the bird flying over the water. [8-10.5s] Final static shot of the bird soaring into the golden sky.",
      "sfx_description": "Uplifting musical swell and bird wing flap",
      "transition": "fade out"
    }
  ],
  "music_prompt": "Curious, engaging, slightly humorous background track with a modern electronic feel",
  "music_tags": [
    "curious",
    "engaging",
    "electronic",
    "light",
    "uplifting"
  ]
}
```

</details>

<details>
<summary>Qwopus3.6 APEX MTP-I Balanced — passed candidate</summary>

```json
{
  "title": "Solar Panels Are Secret Bird Sanctuaries",
  "description": "Floating solar farms in California are becoming accidental bird havens, with herons and cormorants using them as artificial islands. Discover how renewable energy is coexisting with wildlife.",
  "tags": [
    "floating solar",
    "bird sanctuaries",
    "California wildlife",
    "renewable energy",
    "night herons",
    "cormorants",
    "Encino Reservoir"
  ],
  "scenes": [
    {
      "scene_number": 1,
      "narration": "We think of solar farms as sterile deserts, but new 2026 data reveals they are becoming accidental bird sanctuaries.",
      "duration_estimate": 7.1,
      "fact_refs": [
        3
      ],
      "image_prompt": "A photorealistic wide shot of a floating solar farm on a calm reservoir, with black-crowned night herons perched on the edges of the panels, dramatic lighting with deep space blue and gold tones, vertical composition.",
      "video_prompt": "[0-2s] Camera slowly pushes in toward the water surface, revealing the dark blue water and gold reflections on the solar panels. [2-5s] A night heron shifts its weight and looks around, its feathers catching the light. [5-8s] Another heron flaps its wings and lands nearby, creating ripples in the water. [8-10s] The camera pulls back slightly to show the two herons resting together on the floating structure.",
      "sfx_description": "Gentle water lapping, distant bird call",
      "transition": "cut"
    },
    {
      "scene_number": 2,
      "narration": "Double-crested cormorants are even jockeying for the best spots on these artificial islands.",
      "duration_estimate": 6.7,
      "fact_refs": [
        1
      ],
      "image_prompt": "A close-up of two double-crested cormorants on a floating solar panel, one standing tall while the other is slightly lower, dramatic lighting with deep space blue and gold tones, vertical composition.",
      "video_prompt": "[0-2s] Camera focuses on the two cormorants, one standing tall and looking around. [2-5s] The second cormorant nudges forward, trying to get closer to the edge of the panel. [5-8s] The first cormorant turns its head, acknowledging the intrusion. [8-10s] The second cormorant settles down next to the first, both now facing the same direction.",
      "sfx_description": "Bird squawks, water splashing slightly",
      "transition": "cut"
    },
    {
      "scene_number": 3,
      "narration": "Even black phoebes are nesting directly under these panels, challenging our view of renewable energy infrastructure.",
      "duration_estimate": 7.1,
      "fact_refs": [
        2
      ],
      "image_prompt": "A black phoebe building a nest under the edge of a floating solar panel, with water visible below, dramatic lighting with deep space blue and gold tones, vertical composition.",
      "video_prompt": "[0-2s] Camera zooms in on the edge of a solar panel, where a black phoebe is carrying twigs. [2-5s] The phoebe drops a twig into the nest it is building under the panel. [5-8s] The phoebe looks up, startled by a sound. [8-10s] The phoebe returns to the nest, settling down to rest.",
      "sfx_description": "Bird chirping, twig snapping",
      "transition": "cut"
    },
    {
      "scene_number": 4,
      "narration": "At Encino Reservoir, biologists documented 60 wildlife species after installing 10 acres of floating solar.",
      "duration_estimate": 7.6,
      "fact_refs": [
        4,
        5
      ],
      "image_prompt": "A wide shot of the Encino Reservoir floating solar farm, with various birds flying and resting on the panels, dramatic lighting with deep space blue and gold tones, vertical composition.",
      "video_prompt": "[0-2s] Camera pans across the reservoir, showing the extent of the floating solar panels. [2-5s] A flock of birds takes off from the panels, their wings catching the light. [5-8s] The camera follows the birds as they fly over the water. [8-10s] The camera returns to the panels, showing more birds landing and resting.",
      "sfx_description": "Birds flying, water lapping",
      "transition": "cut"
    },
    {
      "scene_number": 5,
      "narration": "Los Angeles surveyed the reservoir eight times before installation to protect species like the Least Bell's Vireo.",
      "duration_estimate": 7.6,
      "fact_refs": [
        4,
        6
      ],
      "image_prompt": "A scientist in a field vest looking through binoculars at a Least Bell's Vireo in the trees near the reservoir, with floating solar panels in the background, dramatic lighting with deep space blue and gold tones, vertical composition.",
      "video_prompt": "[0-2s] Camera focuses on the scientist looking through binoculars. [2-5s] The scientist lowers the binoculars and looks at a notepad. [5-8s] The camera pans to the trees, where a Least Bell's Vireo is singing. [8-10s] The scientist smiles and nods, satisfied with the observation.",
      "sfx_description": "Bird song, pen scratching on paper",
      "transition": "cut"
    },
    {
      "scene_number": 6,
      "narration": "It turns out, renewable energy and wildlife can coexist. Subscribe for more surprising science!",
      "duration_estimate": 6.2,
      "fact_refs": [],
      "image_prompt": "A split screen showing a floating solar farm on one side and a lush wetland with birds on the other, dramatic lighting with deep space blue and gold tones, vertical composition.",
      "video_prompt": "[0-2s] Camera splits the screen, showing the solar farm on the left and the wetland on the right. [2-5s] Birds fly from the wetland toward the solar farm. [5-8s] The camera zooms in on the solar farm, showing birds resting on the panels. [8-10s] The camera pulls back to show both sides of the split screen, emphasizing the coexistence.",
      "sfx_description": "Birds flying, gentle music swell",
      "transition": "fade out"
    }
  ],
  "music_prompt": "Curious and engaging ambient music with a slight sense of wonder",
  "music_tags": [
    "ambient",
    "curious",
    "wonder"
  ]
}
```

</details>

<details>
<summary>Qwopus3.6 APEX MTP-I Quality — passed candidate</summary>

```json
{
  "title": "Solar Farms Are Secret Bird Sanctuaries! 🐦☀️",
  "description": "Floating solar farms in California are becoming accidental bird havens. Discover how herons and cormorants use these structures as artificial islands, and why Los Angeles surveyed a reservoir 8 times before installation.",
  "tags": [
    "floating solar",
    "bird sanctuary",
    "renewable energy",
    "California wildlife",
    "night herons",
    "cormorants",
    "solar farms",
    "nature documentary"
  ],
  "scenes": [
    {
      "scene_number": 1,
      "narration": "We usually think of solar farms as sterile deserts, but California’s floating panels are becoming accidental bird sanctuaries.",
      "duration_estimate": 6.7,
      "fact_refs": [
        3
      ],
      "image_prompt": "Photorealistic wide shot of a floating solar farm on a calm reservoir at dawn. The sky is a deep space blue fading into gold near the horizon. In the foreground, a black-crowned night heron stands on a floating solar panel, looking towards the camera. The water reflects the blue and gold hues. High contrast, dramatic lighting, 9:16 vertical composition.",
      "video_prompt": "[0-2s] Camera slowly pushes in towards the night heron perched on the floating solar panel. [2-5s] The heron turns its head slightly, revealing the vast expanse of the solar farm stretching into the distance. [5-8s] The camera tilts up to show the deep space blue sky meeting the gold horizon, emphasizing the serene yet artificial island environment. [8-10s] Final static shot of the heron against the dramatic sky.",
      "sfx_description": "Subtle water lapping, distant bird call",
      "transition": "cut"
    },
    {
      "scene_number": 2,
      "narration": "Biologists spotted double-crested cormorants jockeying for the best spots on these panels, treating them like prime real estate.",
      "duration_estimate": 7.1,
      "fact_refs": [
        1
      ],
      "image_prompt": "Photorealistic close-up of two double-crested cormorants on a floating solar panel. One cormorant is slightly larger, fluffing its feathers aggressively towards the other. The background shows the blue water and more solar panels. Dramatic lighting highlights the texture of their feathers. 9:16 vertical composition.",
      "video_prompt": "[0-2s] Camera tracks laterally along the edge of the solar panel, following the two cormorants. [2-5s] The larger cormorant puffs its chest and turns towards the smaller one, creating a dynamic interaction. [5-8s] The camera pulls back slightly to reveal the context of the panel floating on the water. [8-10s] The smaller cormorant shifts its weight, adjusting its position on the panel.",
      "sfx_description": "Low bird squawk, water ripple",
      "transition": "cut"
    },
    {
      "scene_number": 3,
      "narration": "Even black phoebes have been observed nesting directly under these panels, challenging our view of renewable infrastructure.",
      "duration_estimate": 7.1,
      "fact_refs": [
        2
      ],
      "image_prompt": "Photorealistic view looking up from the water towards the underside of a floating solar panel. A black phoebe is perched on the metal frame, with a small nest visible nearby. The underside of the panel is dark, contrasting with the bright blue sky above. Dramatic lighting creates shadows under the panel. 9:16 vertical composition.",
      "video_prompt": "[0-2s] Camera tilts up from the water surface to reveal the underside of the solar panel. [2-5s] The black phoebe hops along the metal frame, moving closer to the nest. [5-8s] The camera follows the bird's movement, keeping it in focus against the dark panel underside. [8-10s] The bird settles into the nest, completing the action.",
      "sfx_description": "Soft bird chirp, wind rustling",
      "transition": "cut"
    },
    {
      "scene_number": 4,
      "narration": "Los Angeles surveyed the Encino Reservoir eight times before installing ten acres of floating solar, documenting sixty wildlife species.",
      "duration_estimate": 8.6,
      "fact_refs": [
        4,
        5
      ],
      "image_prompt": "Photorealistic aerial view of the Encino Reservoir with a large section covered by floating solar panels. The water is a deep space blue, and the solar panels are dark with gold reflections. A few birds are visible on the panels. The surrounding area shows green vegetation. Dramatic lighting from above. 9:16 vertical composition.",
      "video_prompt": "[0-2s] Camera descends rapidly from a high altitude towards the reservoir. [2-5s] The camera stabilizes, showing the grid of solar panels on the water. [5-8s] The camera pans slowly across the panels, revealing the scale of the installation. [8-10s] A few birds are seen taking flight from the panels, adding life to the scene.",
      "sfx_description": "Whoosh of descent, ambient reservoir sounds",
      "transition": "cut"
    },
    {
      "scene_number": 5,
      "narration": "Special care was taken for the federally protected Least Bell's Vireo, proving that green energy and wildlife can coexist.",
      "duration_estimate": 7.6,
      "fact_refs": [
        6
      ],
      "image_prompt": "Photorealistic close-up of a Least Bell's Vireo perched on a thin branch near the edge of the solar farm. The bird is small and brown, blending with the vegetation. The background is a soft blur of blue water and solar panels. Dramatic lighting highlights the bird's delicate features. 9:16 vertical composition.",
      "video_prompt": "[0-2s] Camera focuses on the Least Bell's Vireo perched on the branch. [2-5s] The bird turns its head, looking around cautiously. [5-8s] The camera slowly zooms in on the bird's face, capturing its alert expression. [8-10s] The bird flutters its wings slightly, preparing to take off.",
      "sfx_description": "Bird chirp, gentle wind",
      "transition": "cut"
    },
    {
      "scene_number": 6,
      "narration": "With projects expanding globally, these artificial islands might just be the future of wildlife conservation. Subscribe for more!",
      "duration_estimate": 7.1,
      "fact_refs": [
        7,
        8
      ],
      "image_prompt": "Photorealistic composite image showing a floating solar farm in California on the left and a similar structure in India on the right, separated by a subtle transition. Both are set against deep space blue skies with gold accents. Birds are visible on both structures. Dramatic lighting unifies the scene. 9:16 vertical composition.",
      "video_prompt": "[0-2s] Camera pans from left to right, starting with the California solar farm. [2-5s] The pan continues, revealing the Indian solar farm on the right. [5-8s] Birds are seen flying between the two structures, symbolizing global connection. [8-10s] The camera stops, focusing on the Indian structure with birds resting on it.",
      "sfx_description": "Subtle transition sound, bird calls",
      "transition": "cut"
    }
  ],
  "music_prompt": "Curious, engaging, slightly humorous background music with a modern electronic feel. Deep space blue and gold palette in sound, with subtle nature sounds integrated.",
  "music_tags": [
    "electronic",
    "curious",
    "engaging",
    "slightly humorous"
  ]
}
```

</details>

<details>
<summary>Qwen3.6 UD-Q6_K_XL MTP — last candidate after max retries — validator failed</summary>

```json
{
  "title": "Solar Panels Are Secret Bird Sanctuaries",
  "description": "Discover how California's floating solar farms are becoming accidental havens for herons and cormorants. See the surprising wildlife data from Encino Reservoir.",
  "tags": [
    "floating solar",
    "bird sanctuary",
    "renewable energy",
    "California wildlife",
    "solar farms",
    "nature tech"
  ],
  "scenes": [
    {
      "scene_number": 1,
      "narration": "We think of solar farms as sterile deserts, but California’s floating panels are becoming accidental bird sanctuaries.",
      "duration_estimate": 8.1,
      "fact_refs": [
        3
      ],
      "image_prompt": "Photorealistic wide shot of a large floating solar farm on a calm reservoir at dawn. The sky is deep space blue with gold sunlight reflecting off the water and panel surfaces. Black-crowned night herons are perched on the edges of the floating platforms. The composition is static, focusing on the contrast between the industrial panels and the natural wildlife.",
      "video_prompt": "[0-2s] Camera tracks forward slowly over the water surface, revealing the floating solar panels. [2-5s] The camera pans right to reveal a black-crowned night heron resting on a panel edge. [5-8s] The camera pulls back slightly, showing multiple herons scattered across the structures, emphasizing their role as artificial islands.",
      "sfx_description": "Soft water lapping and distant bird call",
      "transition": "cut"
    },
    {
      "scene_number": 2,
      "narration": "Double-crested cormorants are jockeying for the best spots, while black phoebes nest directly under the panels.",
      "duration_estimate": 9.5,
      "fact_refs": [
        1,
        2
      ],
      "image_prompt": "Close-up view of floating solar panels on water. A double-crested cormorant stands prominently on a panel, looking alert. Below the panel edge, a black phoebe is visible nesting in the shadowed area underneath. The lighting is dramatic, highlighting the birds against the dark blue water and gold-tinged panels.",
      "video_prompt": "[0-2s] Camera focuses on the double-crested cormorant standing on the panel. [2-5s] The cormorant shifts its weight and looks around, jockeying for position. [5-8s] Camera tilts down to reveal the black phoebe nesting under the panel edge. [8-9s] Camera holds on the phoebe, showing the interaction between the structures and the nesting bird.",
      "sfx_description": "Bird squawks and rustling feathers",
      "transition": "cut"
    },
    {
      "scene_number": 3,
      "narration": "Los Angeles surveyed Encino Reservoir eight times before installing ten acres of solar, documenting sixty wildlife species.",
      "duration_estimate": 10.5,
      "fact_refs": [
        4,
        5
      ],
      "image_prompt": "Aerial view of the Encino Reservoir covered in floating solar panels. The water is calm, reflecting the blue sky. The panels are arranged in neat rows. In the foreground, a few wildlife species are visible on the banks or in the water. The scene is bright and clear, showing the scale of the installation.",
      "video_prompt": "[0-2s] Camera pulls back rapidly from a close-up of a panel to reveal the entire reservoir. [2-5s] Camera orbits slightly to show the extent of the ten-acre installation. [5-8s] Camera zooms in on the shoreline where wildlife is visible. [8-10s] Camera holds on the wide shot, emphasizing the integration of technology and nature.",
      "sfx_description": "Subtle electronic hum and nature sounds",
      "transition": "cut"
    },
    {
      "scene_number": 4,
      "narration": "Even the federally protected Least Bell's Vireo finds safety here. Renewable energy is creating unexpected ecological havens.",
      "duration_estimate": 9.0,
      "fact_refs": [
        6
      ],
      "image_prompt": "Close-up of a Least Bell's Vireo perched on a branch near the floating solar panels. The bird is small and detailed, with distinct markings. The background shows the blue water and gold-tinged panels. The lighting is soft and natural, highlighting the bird's delicate features.",
      "video_prompt": "[0-2s] Camera focuses on the Least Bell's Vireo perched on a branch. [2-5s] The bird looks around, alert and safe. [5-8s] Camera pans slightly to show the floating panels in the background. [8-9s] Camera holds on the bird, emphasizing its protected status and the safety of the habitat.",
      "sfx_description": "Bird chirp and gentle wind",
      "transition": "cut"
    },
    {
      "scene_number": 5,
      "narration": "Nature adapts. Subscribe to SciNova for more surprising science stories.",
      "duration_estimate": 7.9,
      "fact_refs": [],
      "image_prompt": "Wide shot of the floating solar farm at sunset. The sky is deep space blue with gold highlights. Birds are flying over the panels. The scene is serene and visually striking, with the panels reflecting the sunset colors.",
      "video_prompt": "[0-2s] Camera pans across the floating solar farm at sunset. [2-5s] Birds fly across the frame, adding movement. [5-7s] Camera holds on the wide shot, allowing the viewer to absorb the scene.",
      "sfx_description": "Uplifting music swell",
      "transition": "fade out"
    }
  ],
  "music_prompt": "Curious, engaging, slightly humorous background music with a modern electronic feel",
  "music_tags": [
    "electronic",
    "curious",
    "engaging"
  ]
}
```

</details>

</details>
## Additional Quantization Quality Comparison

기존 HQ 기준선에 이어 외장 미디어에 보관된 Qwen3.6 35B 파생 모델 6종을 같은 production 품질 게이트로 추가 측정했다. 품질만 비교하기 위해 토큰 속도나 이미지 생성은 평가하지 않았고, Science·History fixture를 모델마다 1회씩 실행했다.

### Protocol

- 모델당 2개 fixture: Science + History
- 모델당 반복: 1회
- 최대 재생성: 5회
- Context: 65,536
- KV cache: Q8_0 / Q8_0
- GPU offload: 999 layers
- 기존 8080 Qwen 서버와 동시 실행
- Q8_0은 모델 파일에 MTP 표기가 없어 `draft-mtp` 없이 실행
- 나머지 MTP 모델은 `--spec-type draft-mtp` 사용

### Model quality results

| 모델 | 파일 크기 | 1차 통과 | 5회 내 통과 | 평균 시도 | 평균 validator penalty |
|---|---:|---:|---:|---:|---:|
| Qwen3.6 NVFP4 MTP TURBO | 19.01GiB | 1/2 (50%) | 2/2 (100%) | 1.5 | 5.33 |
| Qwen3.6 Q8_0 | 35.21GiB | 0/2 (0%) | 2/2 (100%) | 2.0 | 8.00 |
| Qwen3.6 UD-Q6_K_XL MTP | 30.37GiB | 0/2 (0%) | 0/2 (0%) | 5.0 | 10.40 |
| Qwen3.6 APEX MTP-I Balanced | 24.27GiB | 1/2 (50%) | 1/2 (50%) | 3.0 | 6.83 |
| Qwopus3.6 APEX MTP-I Balanced | 24.27GiB | 0/2 (0%) | 2/2 (100%) | 4.0 | 5.62 |
| Qwopus3.6 APEX MTP-I Quality | 21.87GiB | 0/2 (0%) | 2/2 (100%) | 3.0 | 6.67 |

`validator penalty`는 production validator가 반환한 문제 수 기반 점수이며 **0점이 가장 좋다**. 완성된 후보만 보는 점수가 아니라, 각 모델의 첫 결과와 재시도 결과를 모두 포함한 평균이다.

### Reading the result

추가 6종 전체는 12회 fixture 실행에서 1차 통과 **2/12 (16.7%)**, 5회 내 최종 통과 **9/12 (75%)**, 평균 시도 **3.1회**였다. 인프라 오류는 없었다.

- **NVFP4 TURBO**: 최종 통과율 100%, 평균 시도 1.5회로 이번 추가 비교에서 가장 안정적이었다.
- **Q8_0**: 최종 통과율은 100%였지만 첫 시도는 0/2였고, 모델 크기 때문에 생성 시간도 가장 길었다.
- **APEX Balanced**: Science fixture가 5회 후에도 128단어로 남아 최종 실패했다. History는 첫 시도에 통과했다.
- **Qwopus Balanced**: 두 fixture 모두 최종 통과했지만 History가 5회까지 필요해 재시도 의존도가 높았다.
- **Qwen3.6 UD-Q6_K_XL MTP**: Science·History 모두 5회 재시도 후에도 통과하지 못했다. Science는 마지막에 77단어와 video prompt 길이 부족, History는 83단어와 40초 narration 부족으로 남았다.
- **Qwopus Quality**: 두 fixture 모두 최종 통과했지만 첫 시도 통과는 없었고, 평균 3회가 필요했다.

이번 결과만으로 “Quality”라는 이름의 변형이 production 품질이 더 좋다고 결론 내릴 수는 없다. 현재 표본은 모델당 2개 fixture뿐이며, 실제 차이는 더 많은 반복과 사람의 의미·사실성 평가를 함께 해야 한다.

## Related

- `/benchmarks` — 공개 Benchmark 모음
- `/labs/local-llm-benchmark` — 로컬 LLM 실험 프로젝트
- `/research/qwen3-8-27b-nvfp4-mtp-gguf-gb10` — 관련 모델 조사 자료
- `/lab/ornith15-server-quality-speed-benchmark` — Ornith-1.5 서버 품질·실사용 속도 비교
