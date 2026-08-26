# Phase 3 AI Tech Quality Pipeline v2 + Weekly Digest — Shadow Result

- Date: 2026-08-26 KST
- Status: Quality v2 implementation and shadow validation complete; public publish paused
- Scope: AI Tech source-aware generation, claim telemetry, historical Weekly editorial compression
- Explicitly not performed: new AI Tech public article publish, Weekly public publish, daily lifecycle transition, redirect/404/410, 90-day purge/delete

## 1. Decision first

AI Tech 신규 public publish는 Quality v2와 Weekly editorial compression 검증이 충분해질 때까지 일시 중지했다.

수집·crawl·generation·fact validation·regeneration·telemetry는 계속 수행한다. 현재 Hermes cron은 실제 publish 경로가 아니라 `main.py --dry-run` shadow 경로를 강제한다. 수동 실행도 `AI_TECH_PUBLIC_PUBLISH_ENABLED=false` 기본 gate를 통과하지 못하면 public publisher에 도달하지 않는다.

기존 AI Tech public content 185개는 삭제하거나 lifecycle 변경하지 않았다.

## 2. Pre-change audit

기존 AI Tech pipeline의 실제 흐름은 다음과 같았다.

```text
SearXNG search / Google News RSS fallback
→ readability crawl
→ LLM summary
→ long-form article generation
→ rule + LLM SEO validation
→ binary fact-check
→ regeneration
→ direct Supabase publish
→ AI Tech snapshot refresh
```

기존 저장 telemetry는 `history.db/news_history`의 source URL, RSS summary, generated content, SEO 점수, retry/error/status 정도였다.

다음 데이터는 지속적으로 저장되지 않았다.

- crawl 성공/실패와 crawl character count
- RSS-summary-only 여부
- source evidence hash 또는 bounded evidence excerpt
- claim별 결과
- `SUPPORTED`와 `INFERENCE`의 구분
- `UNSUPPORTED`와 `CONTRADICTED`의 구분
- regeneration 전후 claim 결과
- Report/Brief/Reject decision

2026-08-18~24 historical period에는 14개 daily article과 history row가 매칭됐지만, 당시 crawl 전문과 article별 원래 fact-check 결과는 재구성할 수 없었다. 따라서 historical Weekly는 claim support rate를 소급하지 않고 `NEWS_BRIEF`로 제한했다.

## 3. Quality Pipeline v2 changes

### Source quality decision

| Decision | 기준 | 생성 방식 |
|---|---|---|
| `FULL_REPORT` | 유효 source URL + crawl evidence가 configurable minimum 이상 | 원문 evidence 범위 안에서 장문 Report |
| `NEWS_BRIEF` | 유효 source URL + bounded RSS/short-crawl evidence | 500~900자 내외의 보수적 Brief, 장문 summary 호출 생략 |
| `REJECT` | source URL이 없거나 evidence가 brief minimum 미만 | generation/publish 중단 |

현재 기본 threshold:

- full crawl minimum: 1,200 chars
- brief evidence minimum: 120 chars
- brief SEO minimum: 55

### Claim classification

기존 `verified=true/false` 단일 결과를 다음 네 가지로 확장했다.

- `SUPPORTED`: source에 해당 사실이 명시됨
- `INFERENCE`: source facts에서 합리적으로 도출한 해석이지만 source가 그대로 말하지 않음
- `UNSUPPORTED`: source에서 확인할 근거가 없음
- `CONTRADICTED`: source가 반대 사실을 말하거나 주장을 부정함

`UNSUPPORTED`·`CONTRADICTED`는 blocking claim으로 취급한다. regeneration maximum 이후에도 남으면 `REJECT`한다. fact-check 응답 배열에 포함되지 않은 claim도 보수적으로 `UNSUPPORTED`로 보완한다.

### Article structure

새 generation/improve prompt는 다음 경계를 요구한다.

```html
<h2>확인된 사실</h2>
<h2>AI의 해석</h2>
<h2>출처</h2>
```

`확인된 사실`에는 source에 명시된 내용만, 의미·전망·추론은 `AI의 해석` 아래에만 둔다. FULL_REPORT만 `필자의 생각` 장문 섹션을 유지한다.

## 4. Persisted telemetry

기존 `news_history`의 의미는 바꾸지 않고 별도 `quality_telemetry` table을 추가했다.

저장 필드:

- source quality, generation mode, quality decision
- source URL/count
- crawl status/chars
- RSS summary chars
- evidence basis/hash
- bounded `source_evidence_json`
- all normalized claims
- `supported_claims_json`
- `inference_claims_json`
- claim counts
- fact-validation attempts
- regeneration attempts
- final outcome/reason

Claim 원문과 evidence excerpt는 내부 history DB에만 저장한다. direct Vercel provenance에는 aggregate quality fields만 넣고 claim 원문·evidence hash는 넣지 않는다.

## 5. Real shadow verification

실제 local LLM (`localhost:8080`)과 SearXNG (`localhost:8888`) health check 후 `main.py --dry-run`을 실행했다.

```text
실행 시간: 152.9초
shadow validation: 2건
public publish: 0건
실패: 0건
```

대표적인 실제 결과:

### Shadow article A

- source quality: `NEWS_BRIEF`
- evidence basis: `rss_summary`
- claim counts: `INFERENCE 4`, `SUPPORTED 0`, `UNSUPPORTED 0`, `CONTRADICTED 0`
- final outcome: `shadow_validated`

### Shadow article B

- source quality: `NEWS_BRIEF`
- evidence basis: `short_crawl`
- crawl evidence excerpt persisted
- claim counts: `SUPPORTED 11`, `INFERENCE 0`, `UNSUPPORTED 0`, `CONTRADICTED 0`
- final outcome: `shadow_validated`

이 결과는 새 분류가 실제 generation 결과에 적용되고, source evidence와 supported/inference lane이 SQLite read-back되는 것을 확인한다. 단, 2건은 public publish 재개를 판단하기에는 작은 표본이다.

## 6. Historical Weekly editorial compression

대상 기간:

```text
2026-08-18 ~ 2026-08-24 KST
```

Selection:

- daily article: 14개
- persisted source URL + summary match: 14개
- historical source quality: `NEWS_BRIEF` 14개
- `FULL_REPORT`: 0개
- `REJECT`: 0개
- event/topic cluster: 14개
- duplicate event merge: 0개
- core event: 5개
- compact roundup: 9개

### Core selection rule

각 event cluster에 대해 다음을 점수화했다.

```text
evidence quality + AI Tech relevance + event significance
```

Historical period는 crawl 전문이 없기 때문에 evidence quality는 모두 `NEWS_BRIEF`였다. 따라서 relevance/significance가 core selection의 차이를 만들었다. 확인된 core event는 다음과 같다.

1. Patton Township, 데이터센터 조닝 조례 개정
2. Fortinet, Virtue AI 인수
3. 프랑스 공공 조달에서 Mistral 우선 방침 보도
4. 라운드힐 뮤직, Anthropic·Suno 상대 소송 제기
5. OpenAI, 보안 사고 이후 학습·테스트 일시 중단 보도

Stripe–OpenRouter 인수설은 `미확인` 성격 때문에 core에서 제외하고 roundup으로 처리했다.

### Neutral event title

Daily의 해석형 제목을 그대로 계승하지 않고 source fact에 가까운 event title을 생성했다.

예:

```text
AI 보안의 패러다임 전환: 포트나이트, 자율 에이전트 '실전 검증'을 위한 버추얼 AI 인수
→ Fortinet, Virtue AI 인수

Stripe의 OpenRouter 인수설: AI 시대의 '데이터 관세'와 개발자 생태계 장악 전략
→ Stripe–OpenRouter 인수설 보도 (미확인)
```

### Facts / interpretation boundary

Historical source summary에는 publisher-side interpretation이 혼입돼 있을 수 있으므로, Weekly는 이를 독립적으로 확인된 사실이라고 표시하지 않는다.

- core: source-summary evidence 수준의 짧은 fact record
- core: 사건별 DevSnack/AI interpretation을 별도 줄에 배치
- roundup: source-summary 단서 한 줄 + source reference만 배치
- claim support rate: historical data에서 생성하지 않음

### Compression metrics

| 비교 기준 | 길이 | 결과 |
|---|---:|---:|
| 14개 daily generated content | 44,194 chars | baseline |
| persisted source summaries | 9,518 chars | historical evidence baseline |
| revised Weekly Digest | 8,946 chars | core 5 + roundup 9 |
| daily generated content 대비 | — | **79.76% 감소** |
| source summary 대비 | — | **6.01% 감소** |

Artifact:

```text
docs/phase3-aitech/aitech-weekly-2026-08-18.md
```

## 7. Public publish pause implementation

### Cron wrapper

`~/.hermes/scripts/ai-blog-pipeline.sh`를 다음으로 변경했다.

```text
ai-news-blogger/main.py --dry-run
PUBLISH_TARGET=shadow
```

이 job은 계속 10:00에 수집·shadow를 수행하지만 public Supabase/Vercel publish는 수행하지 않는다.

현재 Hermes job:

- id: `3313d1a5681d`
- name: AI 블로그 자동 게시
- schedule: `0 10 * * *`
- `no_agent=true`
- script: `ai-blog-pipeline.sh`
- state: scheduled

Gateway가 꺼져 있어 현재 즉시 자동 실행 중인 job은 없다. 재기동되어도 wrapper가 shadow mode를 강제한다.

### Manual publish hard gate

`AI_TECH_PUBLIC_PUBLISH_ENABLED=false`가 기본값이다. `main.py`를 직접 실행해도 `--dry-run`이 아니면 public publisher 전에 fail-closed한다.

### Weekly publish hard gate

Weekly pipeline도 기본 publish를 막고 다음 명시적 flag가 있어야만 publish 경로에 들어간다.

```text
--allow-public-publish
```

따라서 현재 revised Weekly는 local artifact로만 존재하며 Supabase에 publish하지 않았다.

## 8. Tests

Passed:

```text
AI Tech quality policy tests
AI Tech quality telemetry tests
AI Tech quality-aware BlogPost tests
AI Tech main quality recording tests
AI Tech public quality provenance tests
AI Tech public publish gate tests
17 passed, 1 skipped — existing search flow
AI Tech weekly digest tests
AI Tech lifecycle rollback tests
Python compile
Real shadow run: exit 0, public publish 0
```

## 9. Not performed

이번 단계에서는 다음을 하지 않았다.

- Weekly Digest Supabase INSERT
- Weekly production `/lab/...` read-back
- AI Tech daily `lifecycle_status=consolidated` transition
- AI Tech snapshot refresh/push
- Vercel deployment triggered by lifecycle transition
- RSS/sitemap/Home/Data/Lab/Search post-transition verification
- existing 185 AI Tech row deletion or arbitrary update
- redirect/404/410 policy
- 90-day purge/delete

이는 public publish pause 결정과 일치한다. Daily consolidation은 Weekly가 production에서 정상 read-back된 뒤에만 허용해야 하므로, 현재 transition은 의도적으로 보류했다.

## 10. Resume recommendation

현재 shadow 표본은 2건이다. 한 건은 `INFERENCE` 중심, 한 건은 `SUPPORTED` 중심으로 결과가 갈렸고, source quality는 모두 `NEWS_BRIEF`였다. 이 자체는 pipeline이 작동한다는 증거이지만, public publish 재개를 승인할 만큼 충분한 품질 표본은 아니다.

권고:

1. public publish pause 유지
2. shadow run을 계속해 source quality 분포와 claim classification을 누적
3. 최소 여러 실행 창에서 source evidence 저장률, unsupported/contradicted reject, regeneration 후 안정성을 확인
4. shadow 결과를 다시 Weekly evidence에서 재구성할 수 있는지 확인
5. 그 후 별도 승인으로 public publish 재개 여부 결정

## 11. Changed files

AI Tech internal pipeline:

- `quality_policy.py`
- `config.py`
- `db.py`
- `blog_generator.py`
- `main.py`
- `vercel_publisher.py`
- quality policy/telemetry/gate tests

DevSnack public repo:

- `scripts/aitech_weekly.py`
- `scripts/aitech_weekly_pipeline.py`
- AI Tech Weekly/lifecycle/pause tests
- `src/app/labs/[id]/page.tsx`
- `docs/phase3-aitech/aitech-weekly-2026-08-18.md`
- this result document
