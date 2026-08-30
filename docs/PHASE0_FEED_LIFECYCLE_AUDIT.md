---
title: DevSnack Feed Lifecycle Phase 0 Audit
created: 2026-08-26
updated: 2026-08-26
status: audit-only
phase: 0
tags: [devsnack, feed, lifecycle, snapshot, aitech, stockpulse, stories]
---

# DevSnack Feed Lifecycle — Phase 0 Audit

## 0. 결론

현재 구조는 Feed Lifecycle 설계와 **기본 방향은 호환**된다. 다만 Phase 1을 시작하기 전에 다음 세 가지를 설계 계약으로 고정해야 한다.

1. 기존 `posts.status`와 Research POC의 `workflow_state`를 Feed 보존 수명주기로 재사용하지 않는다.
2. DB 상태가 바뀌면 정적 snapshot, RSS, sitemap, Home/Data/Lab public hub, Search가 같은 공개 가능성 판정을 사용해야 한다.
3. 현재 snapshot 스크립트는 GitHub push까지 확인하지만, GitHub push 뒤의 비동기 Vercel 배포와 production read-back까지는 기다리지 않는다. 따라서 lifecycle 완료 판정에는 별도의 production projection gate가 필요하다.

이번 Phase 0에서는 migration, DB row 변경, snapshot 재생성, cron 변경, commit/push, production 상태 변경을 수행하지 않았다.

## 1. 감사 범위와 기준 시각

- 기준 시각: `2026-08-26T18:45:02+09:00`
- 설계서: `DevSnack_Feed_Lifecycle_Quality_Pipeline_Design.docx`
- 저장소: `/home/kahros/workspace/vercel-blog/devsnack-blog`
- 현재 HEAD: `e28b370 perf: make AI Tech and Stories feeds static`
- 관련 기준 문서:
  - `~/wiki/designs/devsnack-final-status-handoff-2026-08-25.md`
  - `~/wiki/designs/devsnack-phase2plus-roadmap-renumbered-2026-08-26.md`
  - `~/wiki/designs/devsnack-publishing-phase1-direct-vercel-2026-08-25.md`
  - `~/wiki/postmortems/stockpulse-direct-publish-content-safety-2026-08-26.md`
  - `~/wiki/designs/devsnack-phase3-project-feed-relations-result-2026-08-26.md`

## 2. 현재 production / repository 기준 상태

### 2.1 Feed 목록 구조

| Feed | 현재 목록 경로 | 현재 source | 갱신 정책 | 검증 결과 |
|---|---|---|---|---|
| AI Tech | `/aitech` | `src/data/aitech-snapshot.json` | 자동 publish batch 후 refresh | `--check` 통과 |
| StockPulse | `/stock` | `src/data/stockpulse-snapshot.json` | morning/evening publish 후 refresh | `--check` 통과 |
| DevSnack Stories | `/devsnack` | `src/data/devsnack-snapshot.json` | 수동/event-driven 변경 때만 명시적 refresh | `--check` 통과 |

세 목록 route는 `dynamic = 'force-static'`, `revalidate = false`다. 목록의 tag/month filter와 pagination도 runtime Supabase query가 아니라 snapshot 배열을 브라우저에서 필터링한다.

Stories snapshot은 cron에 연결되어 있지 않다. 현재 `scripts/sync_devsnack.py`도 LIVE 동기화 후 명시적으로 `refresh_feed_snapshot.py --feed devsnack`를 실행하라는 정책을 문서화하고 있다.

### 2.2 현재 snapshot 실측

| Snapshot | post 수 | 파일 크기 | 비고 |
|---|---:|---:|---|
| AI Tech | 185 | 208,815 bytes | excerpt 최대 300자, 평균 249.4자, cover 166개 |
| StockPulse | 67 | 40,920 bytes | posts + prediction card 데이터 |
| Stories | 29 | 29,981 bytes | 현재 `devsnack` live 집합과 일치 |

현재 DB의 live 집합과 snapshot slug 집합은 세 Feed 모두 차이가 0개였다.

AI Tech snapshot은 전문 `content`를 넣지는 않지만, 현재 목록에 필요한 것보다 긴 excerpt와 Feed별로 이미 고정된 `blog_id`/`status`를 함께 저장한다. 사용자 정책인 “목록에 필요하지 않은 전체 excerpt 등을 그대로 넣지 않는 최소 payload”에 맞추려면 Phase 1과 별도로 다음 정도의 작은 조정이 적절하다.

- `slug`, `title`, `published`, `labels`, `cover_image`는 현재 UI가 사용하므로 유지한다.
- excerpt는 전체 원문 대신 bounded summary로 줄인다. 현재 UI가 두 줄만 보여주므로 예를 들어 160자 상한을 둔다.
- Feed 파일 자체가 `aitech`/`stockpulse`/`devsnack`를 알고 있으므로 각 post의 invariant한 `blog_id`, `status`는 제거 검토 대상이다.
- snapshot metadata(`schema_version`, `feed`, `generated_at`)는 유지한다.

위 조정은 lifecycle 모델을 다시 설계하는 것이 아니라 현재 정적 목록 payload를 최소화하는 호환성 조정이다.

### 2.3 Publisher wiring

- AI Tech: `ai-news-blogger/main.py`가 실제 publish 결과의 `published > 0`인 경우 `refresh_aitech_snapshot()`을 호출한다. refresh subprocess가 실패하면 예외가 main까지 전파되어 wrapper exit code가 실패가 된다.
- StockPulse: `stockpulse_publish.py`가 publish, 저녁 분석/Lab, self-heal 이후 `refresh_stockpulse_snapshot()`을 호출한다. snapshot subprocess 실패는 pipeline 예외가 된다.
- 두 snapshot refresh는 허용된 snapshot 파일만 commit하고 `origin/main`으로 push한다. unrelated working-tree 변경이 있으면 commit을 거부한다.
- Stories: 자동 publish cron에 연결하지 않고, 수동/event-driven 콘텐츠 변경 후 명시적으로 실행한다.

현재 구현은 **snapshot 생성 실패와 Git push 실패를 publish pipeline 실패로 취급**한다. 그러나 snapshot script 자체에는 Vercel deployment 완료를 기다리거나 production 목록을 read-back하는 단계가 없다. GitHub push가 성공해도 Vercel build/deploy가 나중에 실패하거나 이전 snapshot이 계속 서빙될 가능성은 별도 감시 대상이다.

### 2.4 Supabase 실제 상태

2026-08-26 read-only REST/schema 조회 결과:

> 아래 수치는 `/misc` retirement 전인 2026-08-30 lifecycle audit 당시의 historical snapshot이다. Live `/misc` 데이터는 후속 retirement 작업에서 삭제됐다.

| blog_id | status | count |
|---|---|---:|
| `aitech` | `live` | 185 |
| `stockpulse` | `live` | 67 |
| `devsnack` | `live` | 29 |
| `devsnack` | `draft` | 1 |
| `lab` | `live` | 32 |
| `research` | `live` | 43 |
| `research` | `draft` | 5 |
| `misc` | `live` | 3 |
| `misc` | `archived` | 1 |
| 전체 | 전체 | 366 |

현재 `posts`에 존재하는 관련 column:

- 기존 publication/visibility: `status`, `published`, `updated`
- Research POC/editorial: `workflow_state`, `reviewed_at`, `reviewed_by`, `published_at`, `source_type`, `topic_fingerprint`
- Feed provenance: `provenance JSONB`
- legacy source: `blogger_id`

현재 존재하지 않는 lifecycle 후보 column:

- `lifecycle_status`
- `visibility`
- `consolidated_into`
- `weekly_asset_id`
- `consolidated_at`
- `archive_batch`
- `backup_verified_at`
- `purged_at`
- `original_hash`

중요한 현재 의미:

- 실제 publication timestamp는 `published`다. `published_at`은 현재 Feed 기준 source of truth가 아니며 read-only 조회에서 기존 row는 채워져 있지 않았다.
- anon `posts` RLS 정책은 현재 `status = 'live'`만 허용한다.
- `post_translations`는 `translation_status = 'published'`만 anon SELECT 가능하다.
- `workflow_state`는 Research draft cap과 POC editorial 흐름에 사용되므로 Feed retention 상태로 바꾸면 안 된다.
- `status = 'archived'`는 이미 Misc 자산에 사용되고 있으므로 status 하나에 `consolidated`를 추가해 모든 의미를 합치는 것도 피하는 편이 안전하다.

`supabase db push --linked --dry-run` 결과는 `Remote database is up to date`였다.

## 3. 현재 public projection 경로

현재 상태 변경이 영향을 주는 public projection은 다음과 같다.

| Surface | 현재 구현 | 현재 live 판정 | lifecycle 도입 시 필요한 조정 |
|---|---|---|---|
| `/aitech` | static snapshot | snapshot 생성 시 `status=live` | snapshot source와 동일한 lifecycle predicate 사용 |
| `/stock` | static snapshot | snapshot 생성 시 `status=live` | prediction card 포함 snapshot도 동일 predicate 기준 |
| `/devsnack` | static snapshot | snapshot 생성 시 `status=live`, Story classification | Stories는 자동 Feed lifecycle과 분리 유지 |
| `/aitech/[slug]` | Supabase runtime | `status=live` | Phase 1에서는 direct URL 보존 정책을 위해 consolidated detail 접근을 보수적으로 유지할지 명시 |
| `/stock/[slug]` | Supabase runtime | `status=live` | 동일 |
| `/devsnack/[slug]` | Supabase runtime | `status=live` | Stories lifecycle과 별도 유지 |
| `/` Home | `getRecentStories`, `getDataHubSnapshot` runtime | `status=live` | AI Tech/StockPulse latest card는 lifecycle live만 사용 |
| `/data` | `getDataHubSnapshot` runtime | `status=live` | Feed latest title/date에 lifecycle predicate 적용 |
| `/labs/blog` | `getProjectFeedOutputs('blog')` runtime | AI Tech `status=live` | consolidated AI Tech output 제외 |
| `/labs/stockpulse-ai-self-improvement` | Feed outputs + Lab Notes runtime | StockPulse/Lab 모두 `status=live` | StockPulse daily Feed만 lifecycle 적용; 장기 Lab Note는 기존 status 정책 유지 |
| `/rss.xml` | runtime Supabase query, 최대 50개 | `status=live` | consolidated Feed를 RSS에서 제외 |
| `/en/rss.xml` | translation + source post runtime query | source `status=live` | 현재 pilot에는 AI Tech/StockPulse 번역이 없지만 source filter는 동일 정책으로 보호 |
| `/sitemap.xml` | runtime Supabase query, 전체 live post | `status=live` | consolidated Feed detail URL은 sitemap에서 제외, hub URL은 유지 |
| `/api/search` | runtime Supabase FTS | `status=live` | consolidated Feed가 검색 결과에 남지 않도록 동일 predicate 적용 |

추가로 `asset-catalog.ts`의 `lifecycleFromStatus()`는 현재 `status=live`를 `active`, 그 외를 `archived`로 해석한다. Feed의 `consolidated`를 별도 field로 도입하면 이 adapter도 새 lifecycle을 읽도록 보완해야 하며, 그렇지 않으면 IA projection과 DB 상태가 서로 다른 의미를 표시할 수 있다.

## 4. Production read-back

현재 production read-only 확인:

- `/`, `/aitech`, `/stock`, `/devsnack`, `/data`, `/labs/blog`, `/labs/stockpulse-ai-self-improvement`: HTTP 200
- 최신 AI Tech/StockPulse/Stories detail route: 각각 HTTP 200
- `/rss.xml`: HTTP 200, 50 items
- `/en/rss.xml`: HTTP 200, 7 items
- `/sitemap.xml`: HTTP 200, 387 `<loc>`
- 현재 snapshot `--check`: AI Tech 185개, StockPulse 67개, Stories 29개 모두 current
- 최신 snapshot slug와 production page-1의 해당 route 링크는 세 Feed 모두 일치

이는 현재 `status=live` 모델 아래의 정상 상태를 검증한 것이다. 아직 lifecycle 상태를 변경한 뒤의 projection 일관성을 검증한 것은 아니다.

## 5. 설계서와 현재 구조의 충돌/조정 판단

### 5.1 그대로 유지

- AI Tech/StockPulse daily output을 소비성 Feed로 취급한다.
- StockPulse prediction/evaluation 원시 데이터는 기사 HTML과 분리하고 기존 `predictions`를 source of truth로 유지한다.
- Weekly Digest / Weekly Lab Note를 장기 public asset으로 취급한다.
- Stories는 사람이 추가·수정·발행하는 event-driven 자산으로 두고 자동 Feed cron에 연결하지 않는다.
- 기존 direct publisher의 public-content safety gate와 exact Supabase read-back을 유지한다.
- 기존 URL은 Phase 4 URL 정책이 확정되기 전까지 보수적으로 보존한다.

### 5.2 Phase 0에서 조정해야 하는 부분

#### A. lifecycle field는 기존 status/workflow와 분리

권장 방향은 다음과 같다.

```text
status          = publication/visibility compatibility
workflow_state  = Research/editorial workflow compatibility
lifecycle_status = automated Feed retention lifecycle
```

Phase 1 migration 후보는 `lifecycle_status`를 additive하게 추가하고 허용값을 `live`, `consolidated`, `archived`, `purge_candidate`로 제한하는 것이다. 기존 public AI Tech/StockPulse rows는 `live`로 backfill한다. 기존 `status='draft'` 행은 기존 status gate로 계속 숨기며, existing Research `workflow_state` 값은 건드리지 않는다.

`published`/`updated`를 timestamp source of truth로 유지하고 `published_at`을 새 lifecycle timestamp로 오용하지 않는다. `consolidated_at`, `archive_batch`, `backup_verified_at`, `purged_at`, `original_hash`, weekly asset relation은 Phase 1/6의 실제 요구가 확정될 때 additive metadata로 검토한다. `provenance`에 retention 상태를 섞어 넣지는 않는다.

#### B. public predicate를 하나로 고정

자동 Feed 목록/색인 가능성은 다음 의미를 가져야 한다.

```text
Feed listable/indexable
  = status = 'live'
  AND lifecycle_status = 'live'
```

이 predicate는 다음에 공통으로 적용되어야 한다.

- AI Tech/StockPulse snapshot source
- RSS
- sitemap detail entries
- Home/Data latest Feed card
- Lab Project recent Feed Output
- public Search

Stories와 장기 Lab Note/Benchmark/Knowledge는 자동 Feed lifecycle 대상과 분리하고 기존 `status='live'` 정책을 유지한다.

#### C. consolidated detail 정책은 Phase 4와 연결

Phase 1에서 일괄적으로 `status='archived'`로 바꾸면 현재 detail route가 404가 되어 설계서의 “기존 URL을 보수적으로 유지” 원칙과 충돌한다. 따라서 Phase 1에서는 다음을 우선 확정하는 편이 안전하다.

- `consolidated`: 목록/RSS/sitemap/Search/Hub output에서는 제외
- direct detail URL: 당분간 원문 접근 또는 archive notice + Weekly/Lab Note 링크를 제공
- `archived`/`purge_candidate`: 실제 URL 처리와 body 제거는 Phase 4/6 결정 이후

즉, DB visibility(`status`)와 Feed retention(`lifecycle_status`)을 분리해야 이 보수적 URL 정책을 구현할 수 있다.

#### D. snapshot 갱신은 lifecycle transition의 일부

DB row만 `consolidated`로 바꾸고 snapshot을 그대로 두면 `/aitech` 또는 `/stock`에는 이미 통합된 daily 글이 계속 표시된다. 반대로 snapshot만 먼저 바꾸면 detail/RSS/Hub와 시점이 어긋난다.

따라서 Phase 1 state transition acceptance는 다음을 모두 포함해야 한다.

1. exact 대상 row selection과 idempotent state update
2. 대상 Feed snapshot의 동일 predicate 기반 refresh
3. snapshot commit/push
4. Vercel deployment 후 list page read-back
5. RSS/sitemap/Home/Data/Lab/Search의 대상 slug 부재 또는 의도한 archive projection 확인
6. 실패 시 stale snapshot과 DB 상태가 조용히 갈라지지 않도록 rollback 또는 명시적인 reconciliation 상태 기록

현재 publish path는 1~3을 일부 수행하지만 4~5를 snapshot subprocess 안에서 확인하지 않는다. 이 gap은 기존 설계를 다시 뜯는 것이 아니라 lifecycle 전환의 검증 경계를 명시하는 조정이다.

## 6. Phase 1에 넘길 최소 migration/projection 제안

Phase 0 audit 기준의 최소 변경안은 다음이다.

1. `posts.lifecycle_status` additive field 추가
   - Feed 대상 기존 rows는 `live` backfill
   - 허용값: `live`, `consolidated`, `archived`, `purge_candidate`
   - `status`, `workflow_state`, `published`, `provenance`는 의미를 바꾸지 않음
2. shared server-side query/predicate helper 추가
   - Feed list/index query와 runtime Hub/RSS/sitemap/Search가 같은 조건을 사용
   - 장기 Story/Lab/Knowledge rows에는 자동 Feed 조건을 강제하지 않음
3. snapshot generator가 shared predicate를 반영
   - AI Tech/StockPulse lifecycle live만 snapshot에 포함
   - Stories는 현재처럼 명시적 manual refresh만 사용
   - AI Tech summary payload를 bounded하게 줄이고 invariant field 제거 검토
4. detail route는 Phase 1에서 URL을 보수적으로 유지
   - consolidated 표시용 notice/link는 별도 Phase 1 범위로 작게 추가 가능
   - 실제 404/redirect/410은 Phase 4에서 공식 SEO 근거와 함께 결정
5. projection read-back test 추가
   - representative row를 lifecycle별로 fixture/mock해 snapshot/RSS/sitemap/Hub/Search의 inclusion을 함께 검증
   - 실제 DB 상태를 바꾸는 destructive test는 하지 않음

## 7. 위험도와 Stop Gate

| 위험 | 영향 | Phase 1 전 판단 |
|---|---|---|
| DB만 lifecycle 전환 | 정적 목록에 stale daily Feed 노출 | 반드시 방지 |
| snapshot만 갱신 | detail/RSS/Hub와 불일치 | 반드시 방지 |
| `status` 재사용 | visibility·retention·Research 상태 의미 충돌 | 사용하지 않음 |
| Vercel deploy 미확인 | Git push 성공을 public 반영으로 오판 | production gate 추가 |
| AI Tech excerpt 과다 | snapshot payload 불필요 증가 | bounded summary로 소폭 조정 |
| 기존 URL 즉시 404 | Phase 4 URL 정책과 충돌 | Phase 1에서는 보수적 유지 |
| Lab Note까지 Feed lifecycle 적용 | 영구 실험 기록이 잘못 숨겨짐 | daily Feed와 분리 |

**Stop Gate 판단:** 현재 실제 구조는 설계서와 크게 다르지 않으므로 audit 단계에서 중단할 정도의 구조적 불일치는 없다. 다만 위의 field 분리와 projection contract를 확정하지 않은 상태에서 Phase 1 bulk update를 시작하면 stale public state가 생길 수 있으므로, Phase 1은 이 audit 결과를 반영한 migration/predicate/test부터 시작해야 한다.

## 8. 검증 명령과 결과

읽기/검증만 수행했다.

- `supabase db push --linked --dry-run` → `Remote database is up to date`
- `python3 scripts/refresh_feed_snapshot.py --feed aitech --check` → 185 posts, current
- `python3 scripts/refresh_feed_snapshot.py --feed devsnack --check` → 29 posts, current
- `python3 scripts/refresh_stockpulse_snapshot.py --check` → 67 posts, prediction snapshot current
- 관련 Python `py_compile` → 통과
- `npx tsc --noEmit` → 통과
- `npm run build` → 통과
  - 환경에 multiple lockfiles가 있어 Next.js workspace root warning이 발생했지만 build는 성공했다.
- `git diff --check` → 통과

## 9. 다음 실행 경계

이 문서는 Phase 0 audit 결과다. 다음 작업을 시작할 때는:

- 본 문서의 field/predicate/projection 결정을 기준으로 Phase 1 migration을 설계한다.
- Phase 1에서는 실제 daily row를 `consolidated`로 바꾸기 전에 dry-run selection과 projection fixture를 먼저 검증한다.
- 첫 실제 consolidation은 Weekly asset production read-back, snapshot deploy read-back, RSS/sitemap/Hub/Search read-back이 모두 가능한 경우에만 수행한다.
- Purge/DELETE/body 제거는 설계서대로 Phase 6과 별도 승인 checkpoint 전까지 수행하지 않는다.
