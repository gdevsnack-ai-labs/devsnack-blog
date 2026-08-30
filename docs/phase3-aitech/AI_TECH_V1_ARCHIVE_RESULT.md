---
title: AI Tech v1 Archive and v2 Source Pipeline Preparation Result
created: 2026-08-26
updated: 2026-08-26
status: v1-archived-v2-preparation
phase: ai-tech-policy-transition
tags: [ai-tech, archive, lifecycle, source-evidence, searxng, devsnack]
---

# AI Tech v1 종료·아카이빙 및 v2 Source Pipeline 준비 결과

> 이 문서의 본문 결과는 2026-08-26 기준 archive baseline입니다. 2026-08-30 URL lifecycle 후속 결과는 마지막 섹션에 추가했습니다.

## 0. 결론

기존 AI Tech 자동 발행 실험을 `v1`으로 종료하고, 기존 article body를 개별 개선하거나 소급 재검증하지 않은 채 lifecycle archive로 전환했다. AI Tech `/aitech`는 유지하되, 일반 Feed 목록 대신 v1 실험 안내와 compact historical index를 표시한다.

새 public article publish는 계속 중지한다. v2는 Quality Pipeline v2를 재사용하되, 작성 모델보다 source discovery·원문 확보·독립 evidence 수집 계층을 먼저 강화하는 설계 단계다.

## 1. Exact archive target and database result

작업 전 Supabase에서 다음 조건으로 현재 대상을 다시 조회했다.

```text
blog_id = aitech
status = live
lifecycle_status = live
```

조회 결과:

```text
정확한 대상: 185개
```

명시적 lifecycle PATCH를 실행한 뒤 read-back:

```text
patched_count: 185
status: live: 185
lifecycle_status: archived: 185
workflow_state: published: 185
status preserved: true
workflow preserved: true
```

보존 정책:

- `posts` row DELETE 없음
- article body 삭제 없음
- `status` 의미 변경 없음
- `workflow_state` 변경 없음
- `lifecycle_status`만 `live → archived`
- 90-day purge 미실행
- redirect/404/410 미실행

따라서 기존 상세 URL은 lifecycle archive 이후에도 기존 URL 정책에 따라 직접 접근할 수 있다.

## 2. `/aitech` result

`/aitech` route 자체는 유지했다. 기존 185개 Feed card를 client에 싣지 않고 다음 정적 archive page를 표시한다.

### 안내 내용

- AI Tech는 AI 뉴스 수집·분석·자동 발행 가능성을 실험한 프로젝트였음
- 생성 자체는 가능했지만 입력 source/evidence 품질이 안정성의 핵심 한계였음
- 제한된 RSS summary에서 분석을 확장하면 사실과 AI 추론의 경계가 약해질 수 있었음
- 현재 자동 발행은 중지하고 SearXNG discovery, primary source 탐색, 원문 crawl, 독립 evidence 확보를 재정비 중임
- 충분히 검증한 뒤 v2를 다시 진행함

표현은 실패를 과장하거나 v2가 완벽하다고 주장하지 않고, 실험 → 관찰 → 한계 확인 → 개선 중이라는 흐름으로 정리했다.

### Historical index

Public archive snapshot:

```text
src/data/aitech-v1-archive.json
```

항목 수와 필드:

```text
entries: 185
fields per entry: date, title
(date, title) duplicates: 0
```

항목에는 다음을 넣지 않았다.

- article body
- excerpt
- cover image
- slug
- detail URL
- source/evidence 원문

월별 `<details>` 그룹으로 접거나 펼칠 수 있으며, 제목 목록에서 archived detail URL로 새 링크를 만들지 않았다. archive는 일반 discovery surface가 아니라 v1 실험의 index/log로 유지한다.

## 3. Snapshot result

기존 live Feed snapshot:

```text
src/data/aitech-snapshot.json
posts: 0
```

새 archive index:

```text
src/data/aitech-v1-archive.json
entries: 185
```

따라서 기존 185개 body/excerpt를 `/aitech` client에 싣지 않고, title/date만 담은 별도 작은 snapshot으로 분리했다.

## 4. Public projection read-back

Production:

```text
https://devsnack-blog.vercel.app
```

### AI Tech page

```text
/aitech: HTTP 200
archive marker: present
archive dates rendered: 185
new /aitech/[slug] links in archive: 0
```

### General discovery surfaces

```text
/rss.xml: HTTP 200, 50 items, AI Tech detail links 0
/sitemap.xml: HTTP 200, 195 loc, AI Tech detail URLs 0
/api/search?q=뤼튼: HTTP 200, results 0, AI Tech results 0
/: HTTP 200, archived AI Tech latest title absent
/data: HTTP 200, AI Tech Feed card absent
/labs/blog: HTTP 200, archived Feed Outputs absent
```

`/sitemap.xml`에는 `/aitech` hub route 자체는 남겨두었다. page가 살아 있고 v1 안내/index를 제공하기 때문이다. archived article detail URL은 sitemap에서 제외했다.

### Existing detail URL

대표 archived article detail을 확인했다.

```text
/aitech/post-1784461354: HTTP 200
기존 제목 본문: present
```

이는 archive index에서 새로 링크하지 않는 것과 기존 URL을 즉시 404/410으로 만들지 않는 것을 동시에 만족한다.

## 5. Public publish pause

현재 public publish는 계속 fail-closed다.

- `AI_TECH_PUBLIC_PUBLISH_ENABLED=false` 기본값
- `main.py` direct 실행은 publisher 전에 중단
- `VercelPublisher.publish()` direct 호출도 동일 gate 적용
- Hermes wrapper는 `PUBLISH_TARGET=shadow`와 `main.py --dry-run` 사용
- Weekly publish는 `--allow-public-publish` 없이는 차단

현재 실행 허용 범위:

```text
뉴스 수집
→ source/evidence 확보
→ Quality Pipeline v2
→ shadow/dry-run
```

실제 publish, Weekly INSERT, lifecycle consolidation은 실행하지 않았다.

## 6. Existing Phase 3 assets retained

다음 Phase 3 자산은 폐기하지 않았다.

- `FULL_REPORT / NEWS_BRIEF / REJECT`
- `SUPPORTED / INFERENCE / UNSUPPORTED / CONTRADICTED`
- blocking claim fail-closed
- regeneration gate
- shadow mode
- evidence/claim telemetry
- Weekly editorial compression
- lifecycle/reconciliation

이번 단계의 판단은 generator/validator 구조만으로는 source/evidence 부족을 해결할 수 없다는 것이며, v2의 첫 작업을 acquisition 계층 audit/design으로 정했다.

## 7. Source acquisition audit summary

별도 설계 문서:

```text
docs/phase3-aitech/AI_TECH_V2_SOURCE_EVIDENCE_PIPELINE.md
```

확인된 현재 구조:

- SearXNG live endpoint: `localhost:8888`
- AI Blogger 호출: `engine=google`, `categories=news`, `time_range=day`
- client timeout: 10초
- theme query는 최대 3개 변형으로 확장
- query당 최대 10개 결과 요청
- dedup은 exact URL·exact lower-cased title 중심
- event identity/source independence 모델 없음
- official/primary source domain 우선 pass 없음
- 독립 source 최소 2개 gate 없음
- Google News RSS decoder 실패 시 wrapper URL이 남을 수 있음
- canonical URL/redirect/source identity 공통 resolver 없음
- crawler: 15초 timeout, 최대 3회 retry, 401/403 즉시 종료, readability 100자 미만은 empty
- JS shell/paywall/bot challenge/consent/parser failure가 세분화되지 않음

Live SearXNG query sample:

```text
7 queries
73 result rows
63 unique URLs
8 duplicate URL groups across queries
인공지능: 0 results
생성형 AI: 1 result
```

Broad English query는 Reuters/Bing News 편중이 확인됐다. `artificial intelligence`는 26건 중 Reuters 16건, `AI technology`는 27건 중 Reuters 17건이었다.

Live crawl sample 12개에서는:

```text
usable: 7
HTTP error: 4 (401 × 2, 403 × 2)
too short: 1
HTTP 200: 8
```

이는 검색 결과 수보다 primary source, 독립 source, canonical resolution, typed crawl failure를 별도로 관리해야 한다는 근거다. 이번 단계에서는 SearXNG settings와 crawler를 변경하지 않았다.

## 8. Verification

통과:

```text
archive planner exact target: 185
archive PATCH/read-back: 185, status/workflow preserved
archive snapshot check: 185 entries
live AI Tech snapshot check: 0 posts
archive grouping test
Python compile
npx tsc --noEmit
focused ESLint
npm run build
Weekly digest tests
lifecycle rollback tests
Weekly public pause tests
AI Tech publish CLI gate
production projection read-back
```

Build 결과:

```text
Next.js 16.2.10
30 static pages generated
/aitech: static route
/aitech/[slug]: dynamic detail route preserved
```

## 9. Commit and deployment

Public repository:

```text
devsnack-blog commit: df9c1f0
origin/main: df9c1f0
```

Vercel production read-back은 위 projection 결과와 같이 완료했다.

## 10. Explicitly excluded

이번 작업에서 다음은 하지 않았다.

- 기존 article DB DELETE
- 90-day purge
- 대규모 redirect/404/410
- archived detail body 제거
- archived detail URL 정책 변경
- Weekly public publish
- 신규 AI Tech public article publish
- AI Tech lifecycle consolidation
- snapshot/RSS/sitemap 외 projection의 임의 bulk rewrite
- SearXNG 설정의 무작위 변경
- crawler 대규모 수정

다음 단계는 별도 승인 후 v2 Source & Evidence Pipeline 설계안을 실제 observability·resolver·source-role·independent-source 수집 계층으로 나누어 구현하는 것이다. public publish 재개는 구현 완료와 분리해 별도로 판단한다.

## 11. URL lifecycle 후속 결과 — 2026-08-30

v1 전문을 별도 archive로 복제하지 않고 `/aitech` compact history에만 흔적을 남긴다는 정책을 확정해, 기존 AI Tech detail URL 185개를 전부 public retirement 처리했다.

```text
185개 old detail URL → HTTP 410 Gone
redirect → 0개
```

검증 결과:

- DB 기준 185개 slug 전체가 production에서 HTTP 410
- `/aitech`는 HTTP 200 유지
- `/aitech` compact history record 185개 유지
- compact history의 detail link 0개
- RSS의 AI Tech detail link 0개
- sitemap의 AI Tech detail URL 0개, `/aitech` hub는 유지
- public search에서 대표 v1 제목 결과 0개
- `/labs/blog`는 AI Tech Feed Output을 노출하지 않음

Vercel DevSnack에는 Season 2부터 단순 AI Tech Feed 전용 slug를 생성하지 않는다. Season 2 실제 기사는 GitHub Pages에 발행하고, Vercel Lab에는 source·evidence·quality·reject·pipeline 개선과 같은 실험 기록만 남긴다.

DB row와 article body purge는 이번 URL retirement와 분리했으며 실행하지 않았다.
