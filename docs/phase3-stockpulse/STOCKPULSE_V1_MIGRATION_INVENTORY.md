---
title: StockPulse v1 Daily Report and Experiment Migration Inventory
created: 2026-08-30
updated: 2026-08-30
status: inventory-and-strategy-only
phase: stockpulse-v1-to-v2
tags: [stockpulse, migration, github-pages, daily-report, weekly-lab, lifecycle]
---

# StockPulse v1 Daily Report·실험 기록 Migration Inventory

> 기준 시각: 2026-08-30T23:20:06+09:00 KST. 이 문서는 **읽기 전용 조사 결과와 실행 전 전략**이다. DB·Vercel·GitHub Pages·크론 변경은 아직 실행하지 않았다.

## 0. 결론

StockPulse Daily Report는 raw 내부 데이터로 축소하지 않는다. 기존 Daily Report를 GitHub Pages 기반 외부 publication으로 보존하고, DevSnack/Vercel은 publication의 매일 Feed가 아니라 프로젝트·Finding·외부 링크를 보여주는 구조로 전환한다.

기존 `/labs/stockpulse-ai-self-improvement`는 migration 완료 뒤 **StockPulse v1 완료 페이지**로 바꾸고, 별도의 `/labs/stockpulse-v2`를 새 실험으로 만든다.

## 1. 현재 상태 — read-back

| 영역 | 확인 결과 | 근거 |
|---|---:|---|
| StockPulse posts 전체 | 68개 | Supabase `blog_id=stockpulse` |
| 현재 `/stock` snapshot | 60개 | `src/data/stockpulse-snapshot.json` |
| lifecycle live / consolidated | 60 / 8 | Supabase read-back |
| Daily Lab Note | 26개 | `blog_id=lab`, `stockpulse-self-*` |
| Weekly Lab Note | 1개 | `stockpulse-weekly-2026-08-18` |
| prediction raw | 54개 | morning 28 + ml 26, 2026-07-21~2026-08-27 |
| current `/stock` | HTTP 200 | static Feed 60개 노출 |
| current StockPulse detail | HTTP 200 | `/stock/2026-08-27` |
| current Project page | HTTP 200 | Feed Outputs + Daily Lab Notes 병합 중 |

현재 8월 28일 00:13경 아침 분석·모닝 발행·장마감·watchdog 등 StockPulse 관련 크론은 pause 상태이고, 데이터 수집+ML 학습만 enabled 상태다. 이번 inventory에서는 resume하지 않았다.

## 2. Migration 원칙

- Daily Report 전문은 외부 publication에 보존한다. 단순 raw DB 보관이나 제목만 남기는 compact history가 아니다.
- 외부 publication은 실제 매일 읽는 서비스이므로 최신 Morning/Close, 전망·범위·방향·Confidence·핵심 변수·핵심 종목·Archive를 우선 UI로 제공한다.
- GitHub Pages에는 DB post slug를 그대로 복제하지 않고 날짜·리포트 유형 기반의 안정적인 경로를 사용한다.
- 예측·평가·변경·실패 raw data는 계속 누적하되, Vercel에 Daily Lab Note를 새로 만들지 않는다.
- Weekly Lab Note 전문은 GitHub Pages에 두고, DevSnack에는 핵심 Finding 카드와 링크만 둔다.
- 기존 row와 URL은 외부 대상 read-back 전에는 삭제·410·redirect하지 않는다.

## 3. Daily Report exact inventory

분류 규칙: slug의 ISO 날짜를 우선하고, legacy slug에는 본문 `AI Market Watch — YYYY-MM-DD` 날짜를 우선 적용했다. type은 provenance session, 제목의 예측/Morning Brief·시황 분석/Market Close marker를 사용하며, 확정되지 않은 legacy는 `unknown`으로 남겼다.

| id | report date | type | lifecycle | migration class | old slug | external target (provisional) | note |
|---:|---|---|---|---|---|---|---|
| 40 | 2026-07-02 | daily | live | canonical_candidate | `8300-2-9-kospi-8300-breakdown` | `reports/2026-07-02/daily/` | legacy general daily report; original type marker was not preserved; legacy slug had no ISO date; report date parsed from article body |
| 39 | 2026-07-06 | daily | live | canonical_candidate | `511p-8000-26-kospi-8000-defense` | `reports/2026-07-06/daily/` | legacy general daily report; original type marker was not preserved; legacy slug had no ISO date; report date parsed from article body |
| 38 | 2026-07-07 | daily | live | canonical_candidate | `491-7389-314-kospi-7656-foreign-sell` | `reports/2026-07-07/daily/` | legacy general daily report; original type marker was not preserved; legacy slug had no ISO date; report date parsed from article body |
| 37 | 2026-07-08 | daily | live | canonical_candidate | `7246-535-2-kospi-7246` | `reports/2026-07-08/daily/` | legacy general daily report; original type marker was not preserved; legacy slug had no ISO date; report date parsed from article body |
| 36 | 2026-07-09 | daily | live | canonical_candidate | `7291-3-kospi-7291-roll` | `reports/2026-07-09/daily/` | legacy general daily report; original type marker was not preserved; legacy slug had no ISO date; report date parsed from article body |
| 35 | 2026-07-10 | daily | live | canonical_candidate | `252-7475-547-kospi-7475-recovery` | `reports/2026-07-10/daily/` | legacy general daily report; original type marker was not preserved; legacy slug had no ISO date; report date parsed from article body |
| 34 | 2026-07-13 | morning | live | canonical_candidate | `252-7475-18-kospi-7476-morning-brief` | `/reports/2026-07-13/morning/` | legacy slug had no ISO date; report date parsed from article body |
| 33 | 2026-07-13 | daily | live | canonical_candidate | `895-6800-kospi-6800-crash` | `reports/2026-07-13/daily/` | legacy general daily report; original type marker was not preserved; legacy slug had no ISO date; report date parsed from article body |
| 32 | 2026-07-14 | morning | live | canonical_candidate | `895-6800-kospi-6800-morning-brief` | `/reports/2026-07-14/morning/` | legacy slug had no ISO date; report date parsed from article body |
| 31 | 2026-07-14 | daily | live | canonical_candidate | `6856-749-kospi-6856-recovery` | `reports/2026-07-14/daily/` | legacy general daily report; original type marker was not preserved; legacy slug had no ISO date; report date parsed from article body |
| 30 | 2026-07-15 | morning | live | canonical_candidate | `685683-20-7000-kospi-6856-morning-brief` | `/reports/2026-07-15/morning/` | legacy slug had no ISO date; report date parsed from article body |
| 29 | 2026-07-15 | daily | live | canonical_candidate | `6-7284-33-kospi-7284-surge` | `reports/2026-07-15/daily/` | legacy general daily report; original type marker was not preserved; legacy slug had no ISO date; report date parsed from article body |
| 28 | 2026-07-16 | morning | live | canonical_candidate | `7284-20-kospi-7284-morning-brief` | `/reports/2026-07-16/morning/` | legacy slug had no ISO date; report date parsed from article body |
| 27 | 2026-07-16 | daily | live | canonical_candidate | `637-6820-kospi-6820-637-drop` | `reports/2026-07-16/daily/` | legacy general daily report; original type marker was not preserved; legacy slug had no ISO date; report date parsed from article body |
| 448 | 2026-07-20 | morning | live | canonical_candidate | `6820-637-kospi-6820-morning-brief` | `/reports/2026-07-20/morning/` | legacy slug had no ISO date; report date parsed from article body |
| 451 | 2026-07-20 | daily | live | canonical_candidate | `446-6500-9191-kospi-6516-drop` | `reports/2026-07-20/daily/` | legacy general daily report; original type marker was not preserved; legacy slug had no ISO date; report date parsed from article body |
| 452 | 2026-07-21 | morning | live | canonical_candidate | `6516-16-morning-brief` | `/reports/2026-07-21/morning/` | legacy slug had no ISO date; report date parsed from article body |
| 455 | 2026-07-21 | daily | live | canonical_candidate | `6748-356-kospi-6748-surge` | `reports/2026-07-21/daily/` | legacy general daily report; original type marker was not preserved; legacy slug had no ISO date; report date parsed from article body |
| 458 | 2026-07-22 | morning | live | canonical_candidate | `2026-07-22-356-6700-12-kospi-6700` | `/reports/2026-07-22/morning/` | 정상 canonical candidate |
| 461 | 2026-07-22 | close | live | canonical_candidate | `2026-07-22-kospi-marketclose` | `/reports/2026-07-22/close/` | 정상 canonical candidate |
| 463 | 2026-07-23 | morning | live | canonical_candidate | `2026-07-23-679770pt-074-23` | `/reports/2026-07-23/morning/` | 정상 canonical candidate |
| 466 | 2026-07-23 | close | live | canonical_candidate | `2026-07-23-440-7-5` | `/reports/2026-07-23/close/` | 정상 canonical candidate |
| 469 | 2026-07-24 | morning | live | canonical_candidate | `2026-07-24-7097-6950` | `/reports/2026-07-24/morning/` | 정상 canonical candidate |
| 472 | 2026-07-24 | close | live | canonical_candidate | `2026-07-24-572-6690-7000-kospi-6690` | `/reports/2026-07-24/close/` | 정상 canonical candidate |
| 476 | 2026-07-27 | morning | live | canonical_candidate | `2026-07-27-572-6500-kospi-6500-morning` | `/reports/2026-07-27/morning/` | 정상 canonical candidate |
| 479 | 2026-07-27 | close | live | canonical_candidate | `2026-07-27-6755` | `/reports/2026-07-27/close/` | 정상 canonical candidate |
| 481 | 2026-07-28 | morning | live | canonical_candidate | `2026-07-28-66006800-fomc` | `/reports/2026-07-28/morning/` | 정상 canonical candidate |
| 484 | 2026-07-28 | close | live | canonical_candidate | `2026-07-28-1084-6000-kospi-6000-market` | `/reports/2026-07-28/close/` | 정상 canonical candidate |
| 487 | 2026-07-29 | morning | live | canonical_candidate | `2026-07-29-6023-19` | `/reports/2026-07-29/morning/` | 정상 canonical candidate |
| 488 | 2026-07-29 | close | live | canonical_candidate | `2026-07-29-598-6000-kospi-6000-market` | `/reports/2026-07-29/close/` | 정상 canonical candidate |
| 491 | 2026-07-31 | morning | live | canonical_candidate | `2026-07-31-5590-5850-kospi-5590-morning` | `/reports/2026-07-31/morning/` | 정상 canonical candidate |
| 492 | 2026-07-31 | close | live | canonical_candidate | `2026-07-31-1791-6500-kospi-6500-market` | `/reports/2026-07-31/close/` | 정상 canonical candidate |
| 499 | 2026-08-03 | morning | live | canonical_candidate | `2026-08-03-1791-6300-kospi-6300-morning` | `/reports/2026-08-03/morning/` | 정상 canonical candidate |
| 502 | 2026-08-03 | close | live | canonical_candidate | `2026-08-03-512-6200-244-kospi-6200` | `/reports/2026-08-03/close/` | 정상 canonical candidate |
| 504 | 2026-08-04 | morning | live | canonical_candidate | `2026-08-04-63006500-kospi-6300-morning` | `/reports/2026-08-04/morning/` | 정상 canonical candidate |
| 506 | 2026-08-04 | close | live | canonical_candidate | `2026-08-04-162-3-780` | `/reports/2026-08-04/close/` | 정상 canonical candidate |
| 511 | 2026-08-05 | close | live | canonical_candidate | `2026-08-05-376-6600` | `/reports/2026-08-05/close/` | 정상 canonical candidate |
| 513 | 2026-08-05 | morning | live | canonical_candidate | `2026-08-05-6623-kospi-6623-morning-brief` | `/reports/2026-08-05/morning/` | 정상 canonical candidate |
| 514 | 2026-08-06 | morning | live | canonical_candidate | `2026-08-06-6598-kospi-6598-morning-brief` | `/reports/2026-08-06/morning/` | 정상 canonical candidate |
| 517 | 2026-08-06 | close | live | canonical_candidate | `2026-08-06-458-6238-800-kospi-6238` | `/reports/2026-08-06/close/` | 정상 canonical candidate |
| 519 | 2026-08-07 | morning | live | canonical_candidate | `2026-08-07-6296-63006450-kospi-6296` | `/reports/2026-08-07/morning/` | 정상 canonical candidate |
| 523 | 2026-08-07 | close | live | canonical_candidate | `2026-08-07-6258-6158-kospi-6258-market` | `/reports/2026-08-07/close/` | 정상 canonical candidate |
| 684 | 2026-08-10 | morning | live | canonical_candidate | `2026-08-10-6300-sox-kospi-6300-morning` | `/reports/2026-08-10/morning/` | 정상 canonical candidate |
| 687 | 2026-08-10 | close | live | canonical_candidate | `2026-08-10-6300-7-1418-kospi-6300` | `/reports/2026-08-10/close/` | 정상 canonical candidate |
| 689 | 2026-08-11 | morning | live | canonical_candidate | `2026-08-11-6200-sox-kospi-6200-morning` | `/reports/2026-08-11/morning/` | 정상 canonical candidate |
| 692 | 2026-08-11 | close | live | canonical_candidate | `2026-08-11-073-6345-kospi-6345-market` | `/reports/2026-08-11/close/` | 정상 canonical candidate |
| 777 | 2026-08-12 | morning | live | canonical_candidate | `2026-08-12-6420-kospi-6420-morning-brief` | `/reports/2026-08-12/morning/` | 정상 canonical candidate |
| 780 | 2026-08-12 | close | live | canonical_candidate | `2026-08-12-368-28` | `/reports/2026-08-12/close/` | 정상 canonical candidate |
| 900 | 2026-08-13 | morning | live | canonical_candidate | `2026-08-13-60-6600-6720-kospi-6600` | `/reports/2026-08-13/morning/` | 정상 canonical candidate |
| 1247 | 2026-08-13 | close | live | canonical_candidate | `2026-08-13-6800-kospi-6800-market-close` | `/reports/2026-08-13/close/` | 정상 canonical candidate |
| 1448 | 2026-08-14 | morning | live | canonical_candidate | `2026-08-14-6813` | `/reports/2026-08-14/morning/` | 정상 canonical candidate |
| 1689 | 2026-08-14 | close | live | canonical_candidate | `2026-08-14-7000-6977` | `/reports/2026-08-14/close/` | 정상 canonical candidate |
| 2723 | 2026-08-18 | morning | consolidated | canonical_candidate | `2026-08-18-7000-69507100-kospi-7000` | `/reports/2026-08-18/morning/` | already excluded from current /stock snapshot; still archive externally |
| 2728 | 2026-08-18 | close | consolidated | canonical_candidate | `2026-08-18-155-6869-kospi-6869-market_01042512239` | `/reports/2026-08-18/close/` | already excluded from current /stock snapshot; still archive externally |
| 2731 | 2026-08-19 | morning | consolidated | canonical_candidate | `2026-08-19-6750-sox` | `/reports/2026-08-19/morning/` | already excluded from current /stock snapshot; still archive externally |
| 2854 | 2026-08-19 | close | consolidated | canonical_candidate | `2026-08-19-580-6471-kospi-6471-market` | `/reports/2026-08-19/close/` | already excluded from current /stock snapshot; still archive externally |
| 2896 | 2026-08-20 | morning | consolidated | canonical_candidate | `2026-08-20-58-6400-kospi-6400-morning` | `/reports/2026-08-20/morning/` | already excluded from current /stock snapshot; still archive externally |
| 2981 | 2026-08-20 | close | consolidated | canonical_candidate | `2026-08-20-589-6852-kospi-6852-market` | `/reports/2026-08-20/close/` | already excluded from current /stock snapshot; still archive externally |
| 3238 | 2026-08-21 | morning | consolidated | canonical_candidate | `2026-08-21-589-6900-sk-kospi-6900` | `/reports/2026-08-21/morning/` | already excluded from current /stock snapshot; still archive externally |
| 3249 | 2026-08-21 | close | consolidated | canonical_candidate | `2026-08-21-088-463` | `/reports/2026-08-21/close/` | already excluded from current /stock snapshot; still archive externally |
| 3261 | 2026-08-24 | morning | live | canonical_candidate | `2026-08-24-6900-kosdaq-800-kospi-6900` | `/reports/2026-08-24/morning/` | 정상 canonical candidate |
| 3267 | 2026-08-24 | close | live | canonical_candidate | `2026-08-24-3-6600-kospi-6600-market` | `/reports/2026-08-24/close/` | 정상 canonical candidate |
| 3271 | 2026-08-25 | morning | live | canonical_candidate | `2026-08-25-312-6700-kospi-6700-morning` | `/reports/2026-08-25/morning/` | 정상 canonical candidate |
| 3274 | 2026-08-25 | close | live | canonical_candidate | `2026-08-25-068-3` | `/reports/2026-08-25/close/` | 정상 canonical candidate |
| 3283 | 2026-08-26 | morning | live | duplicate_candidate | `2026-08-26-6400-6700-kospi-6400-morning-brief` | `/reports/2026-08-26/morning/` | same report date/type has multiple source rows; preserve both and choose canonical after content comparison |
| 3284 | 2026-08-26 | morning | live | duplicate_candidate | `2026-08-26-6-742pt` | `/reports/2026-08-26/morning/` | same report date/type has multiple source rows; preserve both and choose canonical after content comparison |
| 3288 | 2026-08-26 | close | live | canonical_candidate | `2026-08-26-6-800` | `/reports/2026-08-26/close/` | 정상 canonical candidate |
| 3291 | 2026-08-27 | morning | live | canonical_candidate | `2026-08-27` | `/reports/2026-08-27/morning/` | latest morning exists; corresponding close report is absent after upstream failure |

### Inventory findings

- 18개 legacy slug는 DB slug에 ISO 날짜가 없으므로 본문 날짜를 우선해 복원했다. published timestamp만 쓰면 id=40이 7월 6일로 잘못 매핑되는 오류가 생긴다.
- 2026-08-26에는 morning 유형 row가 2개(id 3283, 3284)이고 close row가 1개(id 3288)다. 둘 다 보존하되 하나를 조용히 덮어쓰지 않고 duplicate candidate로 별도 archive target을 만든다.
- 2026-08-27에는 morning row(id 3291)만 있고 close row는 upstream `loop_web_search_cap` 실패로 생성되지 않았다. 외부 publication에는 close를 만들어내지 않고 “close report unavailable” 상태를 표시한다.
- 8개 `lifecycle_status=consolidated` row는 현재 `/stock`에서 빠져 있지만 Daily Report 공개 보존 대상에서는 제외하지 않는다.

## 4. Experiment / Lab inventory

| 종류 | 수량 | 현재 처리 | 제안 |
|---|---:|---|---|
| Daily Lab Note `stockpulse-self-*` | 26 | Vercel `blog_id=lab`, project timeline에 동적 병합 | 기존은 source/archive로 보존, 새로 생성하지 않음, 주간 Pages Note의 원자료로 사용 |
| Weekly Lab Note `stockpulse-weekly-*` | 1 | Vercel full Note가 live | Pages로 전문 이전 후 DevSnack compact Finding으로 대체 |
| prediction raw | 54 | Supabase 누적, 8/27은 미평가 | 계속 누적; 주간 집계·평가에 사용 |

### Weekly Note가 담을 내용

- 실험 조건과 평가 규칙
- 일별 Morning/ML 결과와 실제 결과
- 정확도·평균 score·성공/실패
- prompt/ML/features 변경사항과 적용 여부
- 전주 대비 변화
- 실패 원인과 다음 주 Action
- raw row 및 private telemetry와 public narrative의 분리

## 5. 현재 연결 구조와 전환 대상

- `/stock`는 `stockpulse-snapshot.json`을 읽는 static Feed다.
- `/stock/[slug]`는 Supabase live row를 읽어 개별 detail을 렌더링한다.
- `feed-projects.ts`와 `feed-output-projection.ts`가 StockPulse daily Feed를 자기개선 Project에 연결한다.
- `/labs/stockpulse-ai-self-improvement`는 현재 Feed Outputs와 `stockpulse-self-*`, `stockpulse-weekly-*` Lab Note를 모두 Project 화면에 병합한다.
- `stockpulse_weekly_pipeline.py`는 Vercel/Supabase weekly publish·lifecycle transition용이며 GitHub Pages publication writer가 아니다.
- 기존 `devsnack-research-notes`는 README에서 StockPulse/AITech output을 제외하므로 publication target으로 재사용하지 않는다.

## 6. 목표 구조 제안

### 6.1 GitHub Pages StockPulse publication

권장 저장소: `gdevsnack-ai-labs/stockpulse-publication` (현재 로컬에는 전용 저장소가 없어 새로 준비해야 함).

권장 경로:

- `/` — 오늘의 Morning / Close, 최신 시장 요약, 외부 publication 안내
- `/reports/YYYY-MM-DD/morning/` — Morning Report
- `/reports/YYYY-MM-DD/close/` — Market Close
- `/archive/YYYY/MM/` — 날짜별 과거 Report Archive
- `/about/` — 데이터·실험·투자 조언 아님 안내

각 Report는 최소한 제목·작성일·리포트 유형·방향·Confidence·예상 범위·주요 변수·핵심 종목/시장 포인트·본문·출처를 가진다. 실패한 수집 과정의 내부 traceback, 경로, job ID, credential은 공개하지 않는다.

### 6.2 DevSnack Lab

- 기존 `/labs/stockpulse-ai-self-improvement`: `StockPulse v1` 완료, 100%, completed. 기존 daily Feed Output 연결은 제거한다.
- 새 `/labs/stockpulse-v2`: GitHub Pages Daily Publication + 주간 자기개선 실험의 현재 Project.
- DevSnack Lab 카드: Weekly Experiment Result, 핵심 수치, 전주 대비 변화, 변경 내용, 결과, 다음 Action.
- Lab Notes Board: GitHub Pages Weekly Lab Note 외부 링크를 게시판 형태로 노출한다.
- AI Tech도 동일하게 `/labs/blog`는 v1 completed로 유지하고, 새 `/labs/ai-tech-v2`를 별도 Project로 둔다.

## 7. 실행 순서와 보호 게이트

1. 이 inventory의 duplicate/legacy mapping을 검토하고 external publication schema/path를 확정한다.
2. 전용 GitHub Pages publication을 만들고 68개 Daily Report를 import한다. duplicate는 legacy archive로 보존하고, 8/27 close missing은 없는 그대로 표시한다.
3. 기존 Weekly Lab Note와 26개 Daily Lab Note를 raw/source로 사용해 주간 Pages Note를 만든다.
4. Pages 모든 canonical report와 weekly note의 HTTP·본문·날짜·유형·중복·public-safety를 검증한다.
5. Vercel `/stock`을 external publication landing으로 바꾸고 Feed Output projection을 제거한다.
6. 기존 `/stock/<slug>`는 exact mapping read-back 뒤 external report로 redirect한다. 대상 없는 경우에만 410을 검토한다.
7. 기존 Daily Lab Note는 DB/source 보존을 우선하고, 주간 external note 준비 뒤 old route redirect/noindex/410을 개별 결정한다.
8. v1 Project를 completed로 전환하고 v2 Project를 별도 생성한다.
9. 마지막에 source-acquisition health gate를 해결한 뒤 데이터→분석→external publication→weekly aggregation 순서로 StockPulse v2를 재개한다.

## 8. 현재 blocker / 판단 필요

- 현재 `web.extract_backend=firecrawl` 설정은 존재하지만 live probe에서 `127.0.0.1:3002` connection refused가 확인됐다. v2 재개 전에 extract service를 실제로 살리거나, StockPulse prompt에서 `web_extract`를 금지하고 SearXNG snippet·로컬 데이터만 사용하는 bounded fallback 중 하나를 정해야 한다.
- 크론은 현재 pause 상태다. migration과 publication read-back이 끝나기 전에는 resume하지 않는다.
- GitHub Pages 전용 repo는 아직 없다. `devsnack-research-notes`에 섞지 않고 전용 publication repo를 만드는 안을 권장한다.
- duplicate row의 canonical 선택은 제목·본문·예측 연결을 비교한 뒤 결정해야 하며, inventory 단계에서 자동 선택하지 않았다.

## 9. 이번 단계에서 실행하지 않은 것

- Supabase PATCH/DELETE/INSERT
- Vercel route·UI·snapshot 변경
- GitHub Pages repo 생성·publish
- redirect/410 rollout
- Lab completed 전환
- cron resume/prompt update
- StockPulse prediction/publishing 실행

## Evidence

- `docs/phase3-aitech/AI_TECH_V1_ARCHIVE_RESULT.md` — AI Tech v1 archive/transition precedent
- `docs/PHASE0_FEED_LIFECYCLE_AUDIT.md` — current Feed/snapshot/lifecycle boundaries
- `scripts/stockpulse_weekly.py` 및 `scripts/stockpulse_weekly_pipeline.py` — current weekly Lab implementation
- `~/wiki/postmortems/stockpulse-direct-publish-content-safety-2026-08-26.md` — public-content safety incident and fail-closed policy
- `~/wiki/designs/stockpulse-self-improvement-pipeline.md` — prediction/raw/self-improvement design
- `~/yura_workspace/projects/devsnack-research-notes/README.md` — Research Notebook excludes StockPulse/AITech output
