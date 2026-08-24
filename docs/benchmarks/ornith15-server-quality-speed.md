# Ornith-1.5 서버 품질·실사용 속도 Benchmark

Ornith-1.5-35B-A3B를 DGX Spark GB10에 올리고, 실제 YouTube 자동화 대본 생성 요청에서 품질과 속도를 함께 측정했다. 이번에는 `llama-cli`처럼 시도마다 모델을 다시 로드하지 않고, 양자화 모델마다 `llama-server`를 한 번만 시작했다.

짧은 합성 문장으로 속도만 재는 방식이 아니라, 실제 production 대본 prompt와 validator 재시도 과정에서 나온 속도를 기록했다.

## 한눈에 보는 결론

- **Q5_K_M**: 5회 내 품질 통과 2/2, generation 64.6 tok/s로 가장 균형적인 결과를 보였다.
- **Q6_K**: generation은 59.8 tok/s로 조금 느렸지만 평균 3회 만에 두 fixture를 모두 통과했다.
- **Q8_0**: 파일 크기와 로딩 시간이 가장 컸지만 두 fixture 모두 5회 후에도 품질 게이트를 통과하지 못했다.
- 높은 비트 수가 structured output 품질과 재시도 수렴성을 자동으로 보장하지는 않았다.
- 세 모델 모두 로드·실행은 성공했고 OOM과 인프라 오류는 없었다.

## Target

| 항목 | 내용 |
|---|---|
| 측정 대상 | Ornith-1.5-35B-A3B-MTP Q5_K_M / Q6_K / Q8_0 |
| 실제 사용 맥락 | YouTube Shorts 자동화 대본 생성 |
| 평가 목표 | production 품질 게이트 통과율과 실제 긴 요청의 속도 |
| 품질 입력 | Science·History 실제 production fixture |
| 출력 계약 | JSON 대본, 4~6장면, 94~120단어, fact_refs, LTX video_prompt |

## Environment

| 항목 | 설정 |
|---|---|
| 하드웨어 | NVIDIA DGX Spark GB10 |
| 메모리 | 121GiB unified memory |
| 런타임 | llama.cpp `llama-server` |
| Context | 65,536 tokens |
| KV cache | Q8_0 / Q8_0 |
| GPU offload | 999 layers |
| MTP | `draft-mtp` |
| Reasoning | off |
| 서버 요청 | OpenAI-compatible streaming JSON |

모델별로 서버를 한 번만 로드한 뒤 warm-up을 수행하고, 같은 서버 프로세스 안에서 Science·History 품질 요청과 validator 재시도를 실행했다. 기존 운영 Qwen 서버와는 별도 프로세스로 분리했다.

## Method / Protocol

1. 동일한 Science·History production prompt를 사용했다.
2. 첫 시도는 temperature 0.7, 재시도는 0.5로 고정했다.
3. 최대 5회까지 이전 validator 오류를 다음 요청에 전달했다.
4. 매 요청은 스트리밍으로 실행해 첫 출력 토큰 시각을 기록했다.
5. 서버가 반환하는 prompt·generation timings와 MTP draft acceptance를 함께 저장했다.
6. 속도 측정을 위해 별도의 synthetic prompt나 짧은 토큰 테스트를 추가하지 않았다.

따라서 아래 속도는 완성된 대본만의 속도가 아니라, 실제 긴 prompt·JSON 구조·video prompt 생성 조건을 처리한 요청의 실사용 측정값이다.

## Result

### 품질 결과

| 모델 | 파일 크기 | 서버 로드 | 1차 통과 | 5회 내 통과 | 평균 시도 |
|---|---:|---:|---:|---:|---:|
| Ornith Q5_K_M | 23.61GiB | 28.1초 | 0/2 | **2/2** | 4.0회 |
| Ornith Q6_K | 27.20GiB | 32.0초 | 0/2 | **2/2** | **3.0회** |
| Ornith Q8_0 | 35.21GiB | 44.1초 | 0/2 | 0/2 | 5.0회 |

Q5_K_M은 History 3번째 시도, Science 5번째 시도에서 통과했다. Q6_K은 History 2번째, Science 4번째 시도에서 통과했다.

Q8_0은 History가 마지막에 123단어, Science가 151단어와 첫 장면 `fact_refs` 누락을 남겨 최종 실패했다. 문장과 장면 구조 자체가 붕괴한 것은 아니지만 현재 production 출력 계약을 끝까지 맞추지 못했다.

### 실제 품질 요청에서 측정한 속도

| 모델 | 실제 prompt 평균 | 생성 토큰 평균 | Prompt 처리 | Generation | TTFT | 요청 시간 | MTP acceptance |
|---|---:|---:|---:|---:|---:|---:|---:|
| Ornith Q5_K_M | 2,920 tokens | 1,654 tokens | 1,208 tok/s | **64.6 tok/s** | 0.738초 | **26.4초** | 44.7% |
| Ornith Q6_K | 2,927 tokens | 1,641 tokens | **1,237 tok/s** | 59.8 tok/s | 1.032초 | 28.4초 | 43.3% |
| Ornith Q8_0 | 2,922 tokens | 1,594 tokens | 1,176 tok/s | 54.4 tok/s | 0.836초 | 30.1초 | 46.0% |

`요청 시간`은 클라이언트가 실제 응답을 받는 데 걸린 평균 시간이다. 모델 로딩 시간은 별도로 기록했으며 위 요청 시간에는 포함하지 않았다.

## Comparison

Q5_K_M은 가장 작은 파일 크기와 가장 빠른 generation 속도를 함께 보여줬다. Q6_K은 속도가 조금 낮지만 Q5보다 적은 재시도로 품질 게이트에 수렴했다. 현재 구조에서 대본을 반복 생성하는 비용까지 고려하면 Q6_K도 충분히 실용적인 후보다.

Q8_0은 일반적으로 품질 상한선 후보로 생각하기 쉽지만, 이번 결과에서는 그렇지 않았다. 파일 크기와 로딩 시간은 증가했지만 첫 시도 통과율과 최종 통과율 모두 개선되지 않았다.

이 결과는 양자화 비트 수만으로 모델을 판단하기보다 다음 항목을 함께 봐야 한다는 점을 보여준다.

- 구조화된 JSON 출력 준수
- 단어 수와 시간 예산 유지
- `fact_refs` 완전성
- 재시도 피드백 수렴성
- prompt 처리 속도와 generation 속도
- 모델 로딩 시간과 메모리 여유

## Interpretation

이번 첫 측정에서는 **Q5_K_M이 속도·용량·최종 통과율의 균형이 가장 좋았다.** Q6_K은 조금 느리지만 재시도 효율이 더 나아 품질 우선 운영 후보로 볼 수 있다. Q8_0은 현재 YouTube 대본 구조에서는 추가 검증 우선순위가 낮다.

다만 모델당 두 fixture와 한 번의 반복만 사용했으므로 최종 양자화 순위를 선언할 수는 없다. 특히 사람의 의미 품질·사실성 평가는 이번 validator에 포함하지 않았다.

## Limitations and next tracks

- fixture는 Science·History 두 개뿐이다.
- 모델당 반복은 1회다.
- reasoning on/off 비교는 하지 않았다.
- MTP off와의 직접 비교는 하지 않았다.
- 코딩·tool call·에이전트 작업 성공률은 측정하지 않았다.
- 이미지·TTS·영상 생성 이후 품질은 포함하지 않았다.

다음 비교에서는 Q5_K_M과 Q6_K_M을 동일 fixture에 대해 여러 번 반복하고, 이후 reasoning on 및 coding/tool-call lane을 별도 측정하는 것이 적절하다.

## Related

- [Qwen3.6 YouTube Script Reliability Benchmark](/lab/qwen36-youtube-script-reliability-benchmark)
- [Ornith-1.5 GGUF Knowledge](/research/ornith-1-5-gguf-gb10)
- [Local LLM Benchmark Project](/labs/local-llm-benchmark)
- [Qwen3.8-27B NVFP4 MTP — GB10 로컬 테스트](/research/qwen3-8-27b-nvfp4-mtp-gguf-gb10)
