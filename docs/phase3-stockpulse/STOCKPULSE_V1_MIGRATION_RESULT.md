---
title: StockPulse v1 Migration Result
created: 2026-08-30
updated: 2026-08-30
status: completed
phase: stockpulse-v1-to-external-publication
tags: [stockpulse, migration, github-pages, redirect, vercel, lifecycle]
---

# StockPulse v1 정리·외부 Publication 전환 결과

## 0. 결론

StockPulse v1을 현재 결과로 종료하고, Daily Report 전문을 전용 GitHub Pages publication으로 분리했다. DevSnack `/stock`은 Feed 전문을 직접 렌더링하지 않고 상태·Archive Gateway·외부 원문 링크를 제공한다.

StockPulse v2는 생성하지 않았고, v2 실험·파라미터 변경·Feed 자동 발행 크론도 재개하지 않았다.

## 1. 외부 Publication

- Repository: `gdevsnack-ai-labs/stockpulse-publication`
- URL: <https://gdevsnack-ai-labs.github.io/stockpulse-publication/>
- Pages source: `main:/`
- Pages visibility: public
- HTTPS enforcement: enabled
- Publication commit: `17011e4`

구성:

- 최신 Morning / Market Close
- Daily Report 전체 목록
- 월별 Archive
- General Daily legacy report
- Weekly Lab Notes
- responsive UI와 유형·월 필터
- 날짜/type 기반 stable path
- 기존 DevSnack URL migration map

## 2. Daily Report 이전

Supabase `posts`에서 `blog_id=stockpulse` 전체를 읽어 68개를 이전했다.

| 유형 | 개수 |
|---|---:|
| Morning | 32 |
| Market Close | 24 |
| General Daily legacy | 12 |
| 전체 | 68 |

보존 처리:

- 기존 Daily Report 전문은 모두 Pages HTML로 보존
- 2026-08-26 Morning 중복 후보 2개 모두 보존
- 중복 후보 중 하나는 canonical date/type path, 다른 하나는 `archive/legacy/post-3284/`에 별도 보존
- 2026-08-27 Close는 upstream report 실패로 생성되지 않았으므로 새로 만들지 않음
- legacy 18개는 slug가 아니라 원문 본문 날짜를 우선해 복원
- public manifest에 원래 DevSnack URL과 lifecycle/provenance metadata 유지
- public content scan에서 private absolute path·internal endpoint·credential-like value 0건

## 3. Supabase lifecycle

외부 Pages target과 HTTP 200을 먼저 확인한 뒤 변경했다.

- `blog_id=stockpulse`, `status=live`, `lifecycle_status=live` 60개 → `archived`
- 이미 `lifecycle_status=consolidated`인 8개는 consolidated 유지
- 최종: `archived=60`, `consolidated=8`, 전체 68개
- `status=live` 유지
- slug와 content 변경 없음
- DELETE/PURGE 없음

## 4. DevSnack Vercel 전환

Vercel commit: `bd04cee`

변경:

- `/stock`을 public + `noindex, follow` Feed Hub/Archive Gateway로 전환
- 전문은 Pages에 두고 Vercel에는 날짜·유형·제목·요약·외부 링크 Board만 표시
- `/stock/[slug]` 68개를 migration map 기반 permanent redirect로 전환
- StockPulse Feed Output의 Lab 자동 연결 제거
- `/labs/stockpulse-ai-self-improvement`를 `StockPulse v1` Completed, 100%로 전환
- v1 결론·누적 결과·한계·외부 Publication·Weekly Lab Notes 링크 표시
- legacy `/lab`의 Daily Lab Note 목록 제거
- 기존 Weekly Lab Note는 Pages로 이전하고 Vercel URL을 permanent redirect
- StockPulse archived post는 noindex 정책으로 분리
- Data Hub에서 StockPulse를 Publication으로 표시

보존:

- 기존 Daily Lab Note 26개는 DB/source 원자료로 보존
- Daily Lab Note 새 글 생성 없음
- prediction raw 54개는 삭제·변경하지 않음
- v2 Lab은 생성하지 않음

## 5. Redirect read-back

HTTP redirect를 따라가지 않는 client로 확인했다.

- 기존 StockPulse URL: **68/68 HTTP 308**
- 68개 Location: migration map의 Pages target과 **68/68 exact match**
- Pages target: **68/68 HTTP 200**
- Weekly `/lab/stockpulse-weekly-2026-08-18`: Pages Weekly Note로 **HTTP 308**
- redirect loop: 0건

## 6. Search surface

- `/stock`: HTTP 200, public Hub, `noindex, follow`
- `/stock` 내부 old detail link: 0개
- `/sitemap.xml`: StockPulse Hub/detail URL 0개
- `/rss.xml`: DB lifecycle 전환 후 cache refresh 대상이며 최종 read-back에서 StockPulse item 0개를 확인해야 함
- Daily Lab Note: 기존 policy에 따라 noindex, 새 project main surface에서는 노출하지 않음

## 7. Firecrawl 기본 인프라

- 원인: Docker daemon은 active였지만 Firecrawl compose 프로젝트 컨테이너가 종료되어 있었고, 장기 서비스 restart policy가 없었음
- `api`, Playwright, Redis, RabbitMQ, NUQ Postgres, FoundationDB에 `restart: unless-stopped` 적용
- optional `foundationdb-init`는 one-shot `restart: no` 의미를 유지
- compose 재기동 결과: 장기 컨테이너 모두 running
- API root: HTTP 200
- Hermes `web_extract https://example.com`: 실제 본문 반환 확인
- StockPulse 크론은 재개하지 않음

## 8. 검증

통과:

- GitHub remote main과 local HEAD 일치
- Pages API source `main:/`, public, HTTPS read-back
- Pages home HTTP 200 및 68개 marker
- Pages report target 68/68 HTTP 200
- Vercel TypeScript `tsc --noEmit`
- Vercel ESLint
- Next production build
- StockPulse migration mapping test
- search policy test
- feed project mapping test
- public content safety scan
- migration map unique target 68/68
- old URL redirect 68/68
- Weekly redirect exact match

## 9. 남은 작업 — 의도적으로 미실행

- RSS stale cache 최종 read-back 및 필요 시 Vercel cache refresh
- Daily Lab Note 기존 route의 장기 redirect/410 여부 별도 결정
- DevSnack compact Weekly Finding 카드/Notes Board 자산 추가
- StockPulse v1 raw/evaluation 재분석
- StockPulse v2 실험 가설·평가 방법 설계
- v2 Lab 생성
- v2 Feed 자동 발행 재개

이번 결과의 종료선은 **StockPulse v1 정리와 Daily publication 분리**이며, v2 실험 시작이 아니다.
