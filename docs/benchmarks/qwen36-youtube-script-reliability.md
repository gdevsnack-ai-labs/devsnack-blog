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

## Related

- `/benchmarks` — 공개 Benchmark 모음
- `/labs/local-llm-benchmark` — 로컬 LLM 실험 프로젝트
- `/research/qwen3-8-27b-nvfp4-mtp-gguf-gb10` — 관련 모델 조사 자료
