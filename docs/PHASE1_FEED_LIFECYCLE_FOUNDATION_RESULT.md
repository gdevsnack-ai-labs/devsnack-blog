---
title: DevSnack Feed Lifecycle Phase 1 Foundation Result
created: 2026-08-26
updated: 2026-08-26
status: completed-foundation
phase: 1
tags: [devsnack, feed, lifecycle, snapshot, aitech, stockpulse, projection]
---

# DevSnack Feed Lifecycle — Phase 1 Foundation Result

## 0. 범위와 결론

Phase 1의 **lifecycle foundation과 public projection consistency**를 구현하고 production에 반영했다.

이번 Phase에서 수행한 것:

- `lifecycle_status` schema 추가
- `status`, `workflow_state`, `lifecycle_status` 의미 분리
- Feed inclusion predicate와 detail URL accessibility 분리
- snapshot/RSS/sitemap/Home/Data/Lab/Search projection에 정책 적용
- AI Tech snapshot bounded payload 적용
- read-only lifecycle dry-run planner 추가
- local build/test와 production read-back 검증

이번 Phase에서 수행하지 않은 것:

- 실제 Feed row의 `consolidated` 전환
- Weekly Digest / Weekly Lab Note 생성
- 대량 lifecycle update
- URL redirect/404/410 결정
- body purge 또는 DELETE

현재 production DB의 `consolidated` row는 0개다. 따라서 이번 결과는 실제 콘텐츠 전환 결과가 아니라, 다음 Phase에서 안전하게 전환할 수 있는 기반과 검증 경계를 배포한 결과다.

## 1. Commit / deployment

- Phase 0 audit: `9ddaa84 docs: add Feed Lifecycle Phase 0 audit`
- Schema migration: `da41f18 feat: add Feed lifecycle status column`
- Phase 1 foundation: `f5a93d1 feat: apply Feed lifecycle projection policy`
- `f5a93d1`을 실제 Vercel 연결 repository의 `origin/main`에 push했다.
- production에서 새 AI Tech snapshot payload marker와 전체 projection을 read-back했다.

## 2. Schema 변경

Migration:

`supabase/migrations/202608270002_add_feed_lifecycle.sql`

추가된 column:

```text
posts.lifecycle_status TEXT NOT NULL DEFAULT 'live'
```

허용값:

```text
live | consolidated | archived | purge_candidate
```

추가된 index:

```text
idx_posts_feed_lifecycle (blog_id, lifecycle_status, published DESC)
```

의미 분리:

```text
status          = 기존 publication / visibility 호환 상태
workflow_state  = 기존 Research/editorial workflow 상태
lifecycle_status = Feed retention lifecycle
```

기존 DB read-back:

- 전체 posts: 366개
- AI Tech live: 185개
- StockPulse live: 67개
- DevSnack Stories live: 29개
- 기존 `status`/`workflow_state` 조합 유지
- `lifecycle_status` non-live row: 0개
- 기존 `workflow_state=research_draft` 5개 유지
- 기존 Misc `status=archived` row 유지

`supabase db push --linked --dry-run` 결과는 migration 적용 후 `Remote database is up to date`였다.

## 3. Shared lifecycle policy

구현 파일:

`src/lib/ia/feed-lifecycle.ts`

주요 helper:

- `isAutomatedFeedBlog()`
- `feedListFilters()`
- `feedDetailFilters()`
- `publicFeedOrFilter()`
- `isFeedListable()`
- `isFeedDetailAccessible()`

자동 lifecycle 대상은 현재 다음 둘로 제한했다.

```text
AI Tech      blog_id = aitech
StockPulse   blog_id = stockpulse
```

Stories는 사람이 관리하는 event-driven 콘텐츠이므로 automated Feed lifecycle과 분리했다.

### Feed inclusion

```text
automated Feed list/index
  = status = 'live'
  AND lifecycle_status = 'live'

Stories / 장기 Lab / Knowledge
  = 기존 status = 'live' 정책
```

### Detail URL accessibility

```text
Feed detail accessible
  = status = 'live'
  AND expected blog identity matches
```

따라서 `lifecycle_status='consolidated'`여도 `status='live'`인 동안 기존 상세 URL은 살아 있다. 실제 archive notice, redirect, 404/410, body 제거는 Phase 4/6에서 별도로 결정한다.

## 4. 적용 surface

### Static Feed

- `/aitech`
- `/stock`
- `/devsnack`

AI Tech와 StockPulse snapshot source query는 `lifecycle_status='live'`를 사용한다. Stories는 기존 manual refresh와 status-only 정책을 유지한다.

### Runtime public projections

다음 surface는 공통 global predicate를 사용한다.

- `/rss.xml`
- `/en/rss.xml`
- `/sitemap.xml`
- `/api/search`

Feed-specific Hub/Project query는 `feedListFilters()`를 사용한다.

- Home `/`의 AI Tech/StockPulse latest card
- Data `/data`
- `/labs/blog`
- `/labs/stockpulse-ai-self-improvement`

### Detail routes

다음 상세 route에는 `feedDetailFilters()`를 적용했다.

- `/aitech/[slug]`
- `/stock/[slug]`
- `/devsnack/[slug]`

상세 query에는 lifecycle filter를 넣지 않았다. 이것이 목록 제외와 URL 보존을 분리하는 핵심이다.

## 5. Snapshot payload 조정

AI Tech snapshot은 목록에 필요한 데이터만 남겼다.

```text
slug
 title
excerpt: 최대 160자
labels
published
cover_image
```

source 검증 단계에서는 `status`와 `lifecycle_status`를 확인하지만, public JSON payload에는 invariant한 Feed metadata를 넣지 않는다.

현재 snapshot post keys:

- AI Tech: `cover_image`, `excerpt`, `labels`, `published`, `slug`, `title`
- StockPulse: `excerpt`, `labels`, `published`, `slug`, `title`
- Stories: 기존 payload 유지

AI Tech snapshot 파일은 bounded excerpt 적용 후 약 208KB에서 약 162KB 수준으로 줄어드는 형태다. 전문 `content`는 포함하지 않는다.

## 6. Dry-run

read-only planner:

`scripts/feed_lifecycle_dry_run.py`

현재는 `--apply`/PATCH/DELETE 경로가 없다. 실행 결과는 항상 `NO WRITE`를 출력한다.

검증 결과:

- AI Tech `live → consolidated`, `published < 2026-08-20`: 171개 후보
- StockPulse `live → consolidated`, `published < 2026-08-20`: 57개 후보
- StockPulse `consolidated → live` 복구 후보: 0개
- 실제 DB lifecycle state 변경: 0개

dry-run 출력에는 후보 수, preview slug, snapshot/RSS/sitemap/Hub/Search/detail projection 요구사항을 함께 기록한다.

## 7. Verification

### Local

- `node --experimental-strip-types src/lib/ia/feed-lifecycle.test.ts` → 통과
- 기존 `feed-projects.test.ts` → 통과
- 기존 `provenance.test.ts` → 통과
- `npx tsc --noEmit` → 통과
- `npm run build` → 통과
- 관련 Python `py_compile` → 통과
- AI Tech/StockPulse/Stories snapshot `--check` → 모두 current
- snapshot contract → 통과
- `git diff --check` → 통과

직접 실행하는 `sitemap-policy.test.ts`는 기존 extensionless import 문제로 실패했다. 이번 변경으로 발생한 오류가 아니며, 기존 Phase 3 문서에 기록된 baseline test runner 문제와 동일하다. 이 Phase에서는 unrelated test runner를 수정하지 않았다.

Node strip-types fixture test에서는 package type 미지정 warning이 발생했지만 test result는 통과했다.

### Database / PostgREST

실제 REST query로 다음 global predicate를 확인했다.

```text
status = live
AND (blog_id NOT IN (aitech, stockpulse) OR lifecycle_status = live)
```

현재 결과:

- public rows: 359개
- AI Tech/StockPulse 포함: 252개
- non-live status 반환: 0개

### Production

production URL:

`https://devsnack-blog.vercel.app`

read-back 결과:

- `/aitech`: HTTP 200, page-1 snapshot link subset 일치
- `/stock`: HTTP 200, page-1 snapshot link subset 일치
- `/devsnack`: HTTP 200, page-1 snapshot link subset 일치
- 최신 AI Tech 상세: HTTP 200
- 최신 StockPulse 상세: HTTP 200
- 최신 Stories 상세: HTTP 200
- `/`: HTTP 200, AI Tech/StockPulse/Stories 최신 제목 확인
- `/data`: HTTP 200, AI Tech/StockPulse 최신 제목 확인
- `/labs/blog`: HTTP 200, AI Tech 최신 Feed Output 확인
- `/labs/stockpulse-ai-self-improvement`: HTTP 200, StockPulse 최신 Feed Output 확인
- `/api/search?q=AI`: HTTP 200, 20개 결과 반환
- `/rss.xml`: HTTP 200, 50 items
- `/en/rss.xml`: HTTP 200, 7 items
- `/sitemap.xml`: HTTP 200, 387 loc

이번 배포에는 실제 consolidated 대상이 없으므로 “제외된 slug가 production에서 사라지는” transition read-back은 fixture와 predicate 수준에서 검증했다. 실제 transition read-back은 첫 Weekly asset이 생성된 뒤 별도 실행해야 한다.

## 8. Phase 2 진입 시 주의사항

1. **실제 전환 executor는 아직 실행하지 않는다.** 이번 Phase의 planner는 read-only다. Weekly consolidation 설계와 대상 selection이 확정된 뒤 apply path를 별도로 추가한다.
2. **status를 바꾸지 않는다.** `consolidated`를 `status='archived'`로 표현하면 기존 상세 URL이 즉시 404가 되므로 Phase 4 URL 정책과 충돌한다.
3. **workflow_state를 건드리지 않는다.** Research draft/editorial workflow와 Feed retention은 다른 축이다.
4. **Weekly asset production read-back이 먼저다.** Weekly Digest/Lab Note가 실제 production에서 200이고 expected content를 반환한 뒤에만 대상 Feed lifecycle을 바꾼다.
5. **DB와 snapshot은 하나의 transition contract로 처리한다.** DB만 바꾸거나 snapshot만 바꾸는 부분 성공을 허용하지 않는다.
6. **GitHub push 성공을 Vercel 완료로 간주하지 않는다.** 현재 snapshot script는 generation/commit/push까지 처리하지만, deployment polling은 별도다. 실제 transition executor에는 Vercel production read-back gate 또는 실패 시 reconciliation/rollback을 넣어야 한다.
7. **첫 전환은 소수 representative rows로 한다.** 대량 7일/90일 전환 전에 임시 또는 소수 대상에서 목록, 상세, RSS, sitemap, Home/Data/Lab/Search를 모두 확인한다.
8. **Stories는 automated Feed cron에 연결하지 않는다.** 글 추가·수정·발행 때만 명시적으로 snapshot을 갱신한다.
9. **Purge는 계속 금지한다.** backup/export/manifest/hash/restore dry-run/backup_verified 순서가 완성되기 전에는 body 제거와 DELETE를 하지 않는다.
