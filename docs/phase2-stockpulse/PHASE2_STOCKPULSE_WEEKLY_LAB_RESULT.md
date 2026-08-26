---
title: StockPulse Weekly Lab Note Phase 2 Result
created: 2026-08-26
updated: 2026-08-26
status: completed
phase: 2
tags: [devsnack, stockpulse, weekly-lab, prediction, evaluation, lifecycle, consolidation]
---

# StockPulse Weekly Lab Note — Phase 2 Result

## 0. 결론

완결된 과거 주간인 **2026-08-18~21 KST**를 대상으로 StockPulse daily Feed를 단순 합본하지 않고, `predictions` 원시 예측·evaluation row와 daily Lab Note의 실제 개선 기록을 주간 자기개선 실험 기록으로 재구성했다.

Weekly Lab Note를 먼저 Supabase에 발행하고 Vercel production에서 section·지표·Project link를 read-back한 뒤, 원본 StockPulse daily Feed 8개만 `lifecycle_status=consolidated`로 전환했다. 모든 daily row는 `status=live`와 기존 slug를 유지하며, prediction/evaluation raw data와 daily Lab Note는 수정·삭제하지 않았다.

- Weekly Lab Note: [StockPulse 주간 자기개선 실험 — 2026-08-18~21](https://devsnack-blog.vercel.app/lab/stockpulse-weekly-2026-08-18)
- Supabase Weekly row: `id=3290`, `blog_id=lab`, `status=live`, `lifecycle_status=live`
- 통합된 daily Feed output: **8개**
- 원자료로 참조한 daily Lab Note: **4개**
- prediction/evaluation raw row: **8개**
- 현재 StockPulse lifecycle: `live/live=59`, `live/consolidated=8`

## 1. 대상 selection

현재 시각은 2026-08-26 KST이고 2026-08-24~26은 아직 완결 주간이 아니므로, 가장 최근 완결된 거래 구간을 선택했다.

- 주간 범위: **2026-08-18~21 KST**
- 2026-08-17: 광복절 대체공휴일, `is_trading_day.py` 기준 휴장
- 날짜 기준: publication timestamp가 아니라 StockPulse report date와 `predictions.date`
- 날짜별 StockPulse daily Feed: 2개씩 × 4일 = 8개
- 날짜별 daily Lab Note: 1개씩 × 4일 = 4개
- 날짜별 prediction session: `morning` 1개 + `ml` 1개
- 직전 비교 주간: **2026-08-11~14 KST**

선정된 StockPulse daily row는 다음 8개다.

| id | report date | slug | final lifecycle |
|---:|---|---|---|
| 2723 | 2026-08-18 | `2026-08-18-7000-69507100-kospi-7000` | consolidated |
| 2728 | 2026-08-18 | `2026-08-18-155-6869-kospi-6869-market_01042512239` | consolidated |
| 2731 | 2026-08-19 | `2026-08-19-6750-sox` | consolidated |
| 2854 | 2026-08-19 | `2026-08-19-580-6471-kospi-6471-market` | consolidated |
| 2896 | 2026-08-20 | `2026-08-20-58-6400-kospi-6400-morning` | consolidated |
| 2981 | 2026-08-20 | `2026-08-20-589-6852-kospi-6852-market` | consolidated |
| 3238 | 2026-08-21 | `2026-08-21-589-6900-sk-kospi-6900` | consolidated |
| 3249 | 2026-08-21 | `2026-08-21-088-463` | consolidated |

## 2. Weekly Lab Note 구성

Weekly 본문은 daily article 전문을 이어 붙이지 않고 다음 구조로 생성했다.

- 실험 질문과 범위
- 실행 수·평가 수·성공 수·정확도·평균 accuracy score
- LLM/ML lane 분리 지표
- 날짜별 실제 KOSPI와 LLM·ML 판정이 들어간 compact result
- 큰 오차 사례와 성공 사례
- daily evaluation row가 제안한 prompt·feature/model 개선 내용
- 직전 주간 대비 변화
- 다음 주에 확인할 변경사항
- 표본 한계와 비투자 조언 판정
- 원본 Daily Lab Note와 StockPulse daily Feed 링크

Weekly artifact는 `docs/phase2-stockpulse/stockpulse-weekly-2026-08-18.md`에 저장했고, deterministic generator는 같은 원자료에 대해 같은 본문을 생성한다.

## 3. 계산된 주간 지표

| Lane | 실행 수 | 평가 수 | 성공 | 정확도 | 평균 accuracy score |
|---|---:|---:|---:|---:|---:|
| LLM morning | 4 | 4 | 2 | 50.0% | 0.4875 |
| ML | 4 | 4 | 1 | 25.0% | 0.2125 |
| 전체 | 8 | 8 | 3 | 37.5% | 0.3500 |

### 전주 대비

| 지표 | 전주(2026-08-11~14) | 이번 주(2026-08-18~21) | 변화 |
|---|---:|---:|---:|
| LLM accuracy | 25.0% | 50.0% | +25.0%p |
| LLM mean score | 0.5375 | 0.4875 | -0.0500 |
| ML accuracy | 0.0% | 25.0% | +25.0%p |
| ML mean score | 0.0000 | 0.2125 | +0.2125 |
| 전체 accuracy | 12.5% | 37.5% | +25.0%p |
| 전체 mean score | 0.2687 | 0.3500 | +0.0813 |

해석은 제한적으로 한다. 전체 정확도는 12.5%에서 37.5%로 높아졌지만, LLM 평균 score는 오히려 0.5375에서 0.4875로 낮아졌다. 이번 주에는 8월 20일 급반등처럼 극단적인 반전이 포함됐고 표본도 4거래일뿐이므로, 개선 효과의 확정 결론이 아니라 관찰 결과로 기록한다.

## 4. 큰 오차와 성공 사례

### 큰 오차

- **2026-08-20 LLM·ML 동시 실패**: LLM은 `하락 / 6,400~6,500`, ML은 `하락 / -1.9%`를 예측했지만 실제 KOSPI는 6,853, `+5.89%` 상승했다. 외국인 매수 전환, 대형주 개별 호재, 과매도 반등을 사전에 충분히 반영하지 못했다.
- **2026-08-18 ML 실패**: 보합 `+0.0%`를 예측했지만 실제 방향은 하락, KOSPI 6,870이었다. 갭업 뒤 상승분을 반납하는 전강후약을 놓쳤다.
- **2026-08-19 LLM의 정량 오차**: 하락 방향은 맞았으나 목표 범위 `6,750~6,870`이 실제 6,471보다 높아 하락 폭을 과소평가했다.

### 성공

- **2026-08-21 LLM**: 상승 `6,900~7,000` 예측, 실제 6,913 상승, score 0.85.
- **2026-08-19 ML**: 하락 `-2.2%` 예측, 실제 하락 방향 일치, score 0.85. 단, 실제 하락폭 `-5.80%`를 과소평가했다.
- **2026-08-19 LLM**: 하락 방향 일치, score 0.65. 목표 범위 정밀도는 부족했다.

## 5. 자기개선 기록

원자료에 반복해서 나타난 개선 방향을 두 lane으로 분리했다.

- **LLM prompt lane**: 전강후약, 목표 범위 하단 이탈, Breadth, 야간 해외시장 급락, 전일 저가 붕괴, 패닉 셀링 후 반등, 대형주 중심의 지수 왜곡, 외국인 순매도 지속을 조건부 시나리오로 포함
- **ML feature/model lane**: 장중 고저차·갭률·변동성 계수, VIX, 외국인·기관 수급 급변, 거래량 변화, 실시간 뉴스 감성, 섹터별 편차, 대형주 weighted impact, adaptive ensemble·다중 target 전략을 다음 입력/학습에서 확인
- 다음 주 검증 기준: 개선안이 문서에 기록됐는지와 실제 다음 prediction 입력에 적용됐는지를 구분

## 6. 순서·lifecycle 결과

실행 순서는 설계서대로 지켰다.

1. 대상 selection: 2026-08-18~21의 8 daily row + 8 prediction row + 4 daily Lab Note
2. Weekly 생성: deterministic generator와 public-content validation
3. Weekly DB publish: Supabase `posts`에 `blog_id=lab`, `status=live`, `lifecycle_status=live`
4. Weekly production read-back: route 200, 지표·section·Project link 확인
5. daily lifecycle transition: 8개 exact id에만 `lifecycle_status=consolidated`
6. snapshot refresh/push: StockPulse snapshot이 67개에서 59개로 갱신되고 `origin/main` push
7. Vercel deployment/read-back: 새 snapshot과 projection 확인

최종 DB read-back:

- 선택된 8개: 모두 `status=live`, `lifecycle_status=consolidated`
- 기존 slug/title 유지
- StockPulse 전체: `status=live/lifecycle_status=live` 59개, `status=live/lifecycle_status=consolidated` 8개
- Weekly row: `id=3290`, `blog_id=lab`, `status=live`, `lifecycle_status=live`
- prediction raw row canonical hash 비교: **변경 없음**

## 7. Public projection 검증

| Surface | 결과 |
|---|---|
| Weekly `/lab/stockpulse-weekly-2026-08-18` | HTTP 200; `주간 지표`, `일별 compact result`, `전주 대비 변화`, `다음 주 변경사항`, 37.5%, 0.4875, 0.2125 read-back |
| StockPulse `/stock` | hydrated production page에서 전체 59개·3페이지 표시; target 8개 비노출 확인 |
| local StockPulse snapshot | 59개; target slug 0개 |
| Stock detail `/stock/[slug]` | target 8개 모두 HTTP 200 + 기존 title read-back |
| Korean RSS `/rss.xml` | HTTP 200; target slug 0개; Weekly slug 노출 |
| sitemap `/sitemap.xml` | HTTP 200; target slug 0개; Weekly slug 노출 |
| Home `/` | HTTP 200; target slug 0개 |
| Data `/data` | HTTP 200; target slug 0개 |
| Lab Project `/labs/stockpulse-ai-self-improvement` | HTTP 200; Weekly slug timeline link 노출 |
| public Search `/api/search?q=StockPulse` | HTTP 200; target slug 0개; Weekly slug 검색 결과 노출 |

`/stock?page=2`는 client-side `useSearchParams` fallback 특성 때문에 curl/harness의 raw HTML만으로는 hydrated page2를 판정하지 않았다. 전체 slug exclusion은 DB predicate, 59개 local snapshot, sitemap/RSS, target detail route read-back으로 교차 검증했다.

## 8. rollback / reconciliation 검증

첫 guarded 실행에서 실제 장애가 발생했다. DB PATCH 후 snapshot script가 자기 소유 파일의 정상 porcelain 상태 ` M src/data/stockpulse-snapshot.json`을 `stdout.strip()`로 선행 공백을 제거한 뒤 unrelated change로 오판했다.

- 첫 실행: transition 실패를 fail-closed로 표면화
- DB: pipeline rollback PATCH 후 8개 `status=live/lifecycle_status=live` read-back 확인
- snapshot: 당시 parser bug 때문에 자동 snapshot push까지는 완료되지 않음. local generated timestamp를 repository baseline으로 되돌리고 `--check`로 DB와 snapshot 일치 확인
- 수정: `unexpected_status_lines()`를 추가해 owned snapshot 변경은 허용하고 다른 dirty file만 거부
- regression: `test_refresh_stockpulse_snapshot.py` 통과
- synthetic rollback: snapshot 실패를 주입했을 때 `consolidated → live` rollback, snapshot 재시도, production projection/detail 검증 순서 통과
- 재실행: 같은 8개 transition 성공, snapshot push와 Vercel projection 검증 성공

따라서 첫 장애 당시에는 DB rollback은 확인됐지만 snapshot rollback은 parser bug 때문에 완전 자동 성공이 아니었다. 원인을 수정하고 regression·synthetic rollback·최종 실전 재실행을 모두 통과시켜, 최종 상태에서는 DB와 snapshot이 분리되지 않음을 확인했다.

## 9. 검증 명령과 commit

통과한 검증:

- `python3 scripts/test_stockpulse_weekly.py`
- `python3 scripts/test_refresh_stockpulse_snapshot.py`
- `python3 scripts/test_stockpulse_lifecycle_preflight.py`
- `python3 scripts/test_stockpulse_transition_rollback.py`
- `python3 scripts/stockpulse_weekly_pipeline.py` (dry-run, consolidated 상태 재실행 read-only)
- 관련 Python `py_compile`
- `npx tsc --noEmit`
- `npm run build`
- StockPulse snapshot `--check`

Phase 2 관련 주요 commit:

- `6731607` — Weekly generator/pipeline, artifact, Lab Project weekly projection
- `5d0b87d` — Weekly publish production read-back gate
- `16b1bc7` — owned snapshot update parser fix + regression test
- `0a00edc` — first successful StockPulse consolidated snapshot push
- `b0bcf6a` — lifecycle selection idempotence + mixed-state fail-close

Phase 4 redirect/404/410 정책과 Phase 6 purge/delete는 이번 Phase에서 변경하지 않았다.
