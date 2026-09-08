# Benchmark IA Baseline

> 기준일: 2026-09-09 (KST)
> 상태: 현재 DevSnack Benchmark 공개 구조의 기준점

이 문서는 표준 Benchmark와 표준 밖의 Custom Benchmark를 분리한 현재 정보 구조(IA), 공개 경로, 유지 원칙을 기록합니다. 이후 benchmark 개편은 이 기준을 유지하거나, 변경 이유와 함께 갱신합니다.

## 공개 구조

```text
Benchmarks
├── Standard Benchmark       /benchmarks
└── Custom Benchmarks        /benchmarks/custom
```

### Standard Benchmark — `/benchmarks`

`/benchmarks`는 비교 가능한 공식 Benchmark의 canonical 페이지입니다.

- DGX Spark GB10 + llama.cpp 기준
- 현재 7개 suite
- 현재 19개 model variant
- 모델·variant·quantization·MTP 조건 비교
- 검색·필터·정렬 가능한 matrix
- 모델 제품군 페이지(`/benchmarks/models/[modelSlug]`) 연결
- 현재 공개 projection JSON과 동일한 결과를 사용

표준 suite와 공통 실행 조건으로 직접 비교할 수 있는 결과만 이 영역에 추가합니다. 날짜별 release 페이지를 새로 만들어 공개 탐색 구조를 확장하지 않고, 최신 통합 projection과 기존 release의 호환 경로를 사용합니다.

### Custom Benchmarks — `/benchmarks/custom`

`/benchmarks/custom`은 표준 7-suite matrix에 넣기 어려운 개별 측정과 분석을 위한 공개 영역입니다.

포함할 수 있는 콘텐츠:

- 특정 모델 showcase
- 특정 모델·quantization 심층 분석
- serving·reliability·실사용 성능 측정
- coding·tool-call 등 목적별 특화 실험
- MTP 적용 전후 분석
- 특정 prompt·project·workflow 기반 결과
- 표준 Benchmark에 편입되지 않은 개별 DevSnack benchmark 원문
- 관련 Knowledge와 Benchmark Project 자료

각 결과는 고유한 protocol을 사용할 수 있으므로 Standard Benchmark와 직접 순위를 비교하지 않습니다. `Legacy`나 `Archive`가 아니라 현재도 확장 가능한 Custom Benchmark로 분류합니다.

## 제거한 구조

- 사용자-facing `Benchmark Hub` 메뉴는 두지 않습니다.
- `/benchmarks`는 별도 Hub가 아니라 Standard Benchmark 본문 자체입니다.
- production에 공개된 적이 없는 `/benchmarks/archive`는 route와 redirect를 만들지 않습니다.
- `/benchmarks/archive` 요청은 404이며 sitemap에도 포함하지 않습니다.

## 호환 경로

이미 공개된 통합·날짜별 release URL 중 필요한 경로만 `/benchmarks`로 permanent redirect합니다.

- `/benchmarks/gb10-local-llm-benchmark` → `/benchmarks`
- `/benchmarks/gb10-llm-benchmark-v1-20260906` → `/benchmarks`
- `/benchmarks/archive` → 404

새로운 legacy/archive URL은 추가하지 않습니다.

## 공개·내부 경계

공개 화면에는 독자가 결과를 해석하고 비교하는 데 필요한 정보만 둡니다.

공개하지 않는 내부 정보:

- source run ID
- revalidated/reused 상태와 내부 run 수
- raw run 공개 여부
- evaluator version과 contract/calibration 세부 내용
- dataset hash와 내부 provenance 메타데이터
- 로컬 경로, 내부 host/port, 인증정보, raw prompt/response

raw run, manifest, log, source evidence는 benchmark platform에서 내부 immutable evidence로 보존합니다. 공개 projection은 필요한 경우 새 revision으로 생성하며 기존 release snapshot의 수치를 조용히 덮어쓰지 않습니다.

## 유지·확장 원칙

1. Standard와 Custom의 목적을 섞지 않습니다.
2. Standard 결과는 공통 조건과 7-suite contract를 만족할 때만 추가합니다.
3. 고유 protocol, 특정 모델 showcase, 심층 분석은 Custom으로 연결합니다.
4. 새 모델·variant·quantization·MTP 조건은 가능하면 기존 Standard matrix와 model-family 페이지를 갱신합니다.
5. Custom 콘텐츠가 늘어나도 Standard Benchmark가 메인에서 더 중요하게 보이는 구조를 유지합니다.
6. `Benchmark Hub`를 다시 추가하기보다 실제 목적이 생긴 메뉴나 route를 직접 추가합니다.
7. 공개 UI는 짧고 직접적으로 유지하고, 내부 provenance는 공개 문구에 반복하지 않습니다.

## 기준점 검증

2026-09-09 로컬 기준으로 다음을 확인했습니다.

- `/benchmarks`: HTTP 200
- `/benchmarks/custom`: HTTP 200
- `/benchmarks/archive`: HTTP 404
- 기존 통합·날짜별 호환 URL: `/benchmarks`로 redirect
- sitemap: `/benchmarks/custom` 포함, `/benchmarks/archive` 제외
- `npm run lint`: 통과
- `npm test`: 통과
- `npm run build`: 통과

이 문서는 benchmark IA와 route 정책의 기준 기록이며, 측정 원자료나 내부 run manifest를 대체하지 않습니다.
