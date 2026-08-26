---
title: AI Tech v2 Source & Evidence Pipeline Improvement Proposal
created: 2026-08-26
updated: 2026-08-26
status: design-only
phase: v2-preparation
tags: [ai-tech, source-discovery, evidence, searxng, crawling, quality]
---

# AI Tech v2 Source & Evidence Pipeline Improvement Proposal

## 0. Decision

AI Tech v1 자동 발행을 종료한 뒤, v2는 작성 모델보다 **source/evidence acquisition 계층을 먼저 강화**한다. 이번 문서는 현재 구조와 live sample을 audit한 결과이며, SearXNG 설정이나 crawler를 대규모로 바꾸지는 않는다.

목표는 검색 결과 숫자를 늘리는 것이 아니다.

```text
event 발견
→ primary/official source 탐색
→ 독립 source 추가 탐색
→ 원문 확보
→ evidence 추출
→ claim 검증
→ 기사 작성
```

Phase 3에서 만든 `FULL_REPORT / NEWS_BRIEF / REJECT`, claim classification, fail-closed, shadow mode, Weekly compression, lifecycle/reconciliation은 그대로 재사용한다. v2의 우선순위는 그 구조에 들어가기 전 입력 evidence를 더 안정적으로 만드는 것이다.

## 1. Audit scope and current architecture

### Current path

```text
config.py themes
→ SearXNG JSON search
→ title/URL exact deduplication
→ DB processed URL filter
→ readability-lxml HTTP crawl
→ RSS/short-crawl fallback evidence
→ LLM summary and article generation
→ rule + LLM quality check
→ claim classification/regeneration
→ shadow or paused publisher
```

Current AI Blogger runtime configuration uses the live SearXNG instance at `localhost:8888`. The code calls SearXNG with `engine=google`, `categories=news`, `time_range=day`, and a client timeout of 10 seconds. The configured RSS/theme environment contains 22 English-oriented topics; a Korean theme adds `theme AI` and `theme news` variants, while an English theme adds `theme 인공지능`.

The current `search_by_theme()` executes up to three related queries, requests up to 10 results per query, and merges by exact URL while filtering exact lower-cased titles. A second LLM deduplication step runs when more than one item remains. The current processed check is URL-based and does not yet represent event identity or source independence.

## 2. SearXNG audit

### Configuration read-back

The local `settings.yml` declares 281 engines; 95 are enabled. Ten enabled entries are news-oriented or explicitly categorized for news. Relevant runtime values:

- server port: `8888`
- server bind address in settings: `127.0.0.1`
- Docker host mapping: `0.0.0.0:8888 → container 8888`
- SearXNG outgoing request timeout: 3 seconds
- connection pool: 100 connections / 20 keep-alive slots
- HTTP/2 enabled
- JSON format enabled; the current settings contain a duplicate `json` format entry
- safe search: off
- instance limiter/public-instance mode: off

The AI Blogger `.env` resolves `SEARXNG_BASE_URL` to `http://localhost:8888`. Port `8800` is not serving the current instance and must not be treated as the canonical endpoint.

### Live query sample

A direct live sample used seven queries: `artificial intelligence`, `AI technology`, `machine learning`, `OpenAI security`, `AI chip GPU`, `인공지능`, and `생성형 AI`.

Observed results:

- total result rows: 73
- unique URLs after query aggregation: 63
- duplicate URL groups across queries: 8
- `artificial intelligence`: 26 results, 10 domains, Reuters 16
- `AI technology`: 27 results, 10 domains, Reuters 17
- `machine learning`: 7 results, 5 domains
- `OpenAI security`: 3 results, 2 domains
- `AI chip GPU`: 9 results, 8 domains
- `인공지능`: 0 results
- `생성형 AI`: 1 result

The result set is not uniformly diverse. Reuters/Bing News dominate broad English queries, while Korean query coverage is sparse. Duplicate URLs and repeated title groups show that broader result counts do not equal independent evidence.

### Current discovery limitations

1. **Engine selection is effectively narrow.** Although many SearXNG engines are enabled, the caller fixes `engine=google` and `categories=news`. The live sample mostly returned Reuters and Bing News results rather than a deliberate source mix.
2. **Official-source priority is absent.** There is no source registry, domain role map, official-domain query, or `site:`-based primary-source pass.
3. **Independent-source minimum is absent.** The pipeline does not group results by event and does not require two independent sources or one primary source plus corroboration.
4. **Deduplication is lexical/URL-based.** Exact lower-cased title and exact URL checks miss syndicated rewrites, tracking variants, URL redirects, and paraphrased titles.
5. **Query generation is topic-oriented, not event-oriented.** A theme is expanded with only a small fixed set of variants. It does not extract entities, organizations, dates, claims, or event terms and then perform a second discovery pass.
6. **Search failure fallback is not fail-open.** `SearchFetcher.search()` returns immediately when the first engine request raises a `RequestException` or returns a primary-engine 429, so the fallback engine list is not reached for those primary failures.
7. **Date quality is inconsistent.** Many live results had no `published_date`; the current caller may substitute current time when a date is absent, which can make freshness look stronger than the source metadata supports.
8. **Source metadata is weak.** `source`/`engine_meta` is optional and is not normalized into publisher identity, ownership, or source role.

## 3. RSS → URL resolution audit

Google News RSS stores a wrapper URL and the current `RSSFetcher` calls `googlenewsdecoder`. When decoding fails, it returns the wrapper URL itself. The record does not persist a typed resolution state such as `resolved`, `wrapper_fallback`, `redirected`, or `resolution_failed`.

SearXNG results usually arrive with direct URLs, but the two ingestion paths do not share one canonical URL resolver. There is no common normalization for:

- tracking parameters
- mobile/AMP variants
- trailing slash and redirect aliases
- syndicated copies
- canonical `<link>` values discovered during fetch
- publisher identity after redirect

As a result, URL-level uniqueness can overcount the same article and can also fail to connect a wrapper result to its eventual canonical source.

## 4. Crawl audit

The current `ContentScraper` uses `requests` plus `readability-lxml`:

- request timeout: 15 seconds
- maximum crawl retries: 3
- 401/403: immediate empty result, no retry
- other request/parser errors: retry up to three attempts with short linear sleep
- extracted text shorter than 100 characters: treated as empty
- returned crawl text capped at 5,000 characters
- separate OG-image request: 10 seconds, errors silently swallowed

### Live crawl sample

A 12-URL sample drawn from current SearXNG results produced:

- usable readability text: 7
- HTTP errors: 4
  - HTTP 401: 2, both Reuters
  - HTTP 403: 2, both TechEdt
- HTTP 200 but too-short extracted text: 1, MSN
- HTTP statuses overall: 200 × 8, 401 × 2, 403 × 2

This is a small sample, not a global failure rate. It does show that anti-bot/paywall/JS-like outcomes are currently collapsed into an empty string or a generic crawl failure. The current telemetry can record success/failure and character counts after Phase 3, but it does not yet preserve a detailed failure taxonomy or the complete attempt chain needed to improve source selection.

### Crawl limitations

- No bounded browser/JS fallback exists for pages that require client rendering.
- 401/403 are treated as terminal without trying an alternate official or independent source.
- Redirect chains and final canonical URLs are not part of the stored evidence contract.
- Paywall, consent wall, bot challenge, empty shell, parser failure, timeout, and malformed HTML are not distinct outcomes.
- A single readability extraction strategy is used for all publishers.
- Crawl retry policy is global rather than source-aware.

## 5. Proposed v2 acquisition pipeline

### Stage A — event candidate creation

Create an event candidate from one or more discovery results, retaining:

```text
event_id
observed_at
query
source_result_ids
entity hints
published-date confidence
candidate status
```

Do not write a daily article at this stage. The candidate is only a hypothesis that an event may be worth researching.

### Stage B — primary/official pass

For each candidate, derive a bounded entity/event query set and search official domains first:

- company newsroom and investor-relations domains
- government/regulator/legislative domains
- standards bodies and project repositories
- university/lab or paper landing pages
- official product/security advisories

The domain registry should be explicit and reviewable. A result may be marked `primary`, `official_secondary`, `independent_secondary`, `syndicated`, or `unknown`; the label must not be inferred only from the hostname string.

### Stage C — independent-source expansion

Run a second query pass that excludes already selected domains and known syndicated copies. Prefer a different publisher family and preserve publisher identity after redirects.

Recommended acquisition gate:

```text
publishable evidence:
  one verified primary/official source
  + one independent corroborating source

or:
  two independent sources with clear agreement

single-source evidence:
  NEWS_BRIEF only when the claim scope is explicitly bounded
  otherwise REJECT
```

The minimum is a quality gate, not a request to inflate result counts.

### Stage D — canonical resolution

Introduce one resolver shared by RSS and SearXNG:

```text
raw_url
→ wrapper decode
→ HTTP redirect resolution
→ publisher canonical tag
→ normalized canonical_url
→ publisher/source identity
→ resolution status
```

Persist the raw URL and the canonical URL separately. Never replace the raw input silently.

### Stage E — typed fetch attempts

Store each attempt with:

```text
source_id
attempt_number
requested_url
final_url
http_status
elapsed_ms
failure_class
content_type
raw_chars
extracted_chars
parser
```

Suggested `failure_class` values:

```text
timeout
connection_error
http_401
http_403
http_429
http_5xx
redirect_loop
robots_or_consent
paywall
bot_challenge
js_shell
empty_document
parser_error
unsupported_content
success
```

A bounded browser fallback can be added later for `js_shell` and selected consent flows. It should not be a default second crawler for every URL.

### Stage F — evidence extraction

Evidence items should point to a source and retain bounded excerpts:

```text
evidence_id
source_id
role: primary | independent_secondary
excerpt
excerpt_hash
locator: paragraph/title/table/metadata
captured_at
```

The generation layer receives evidence items, not an undifferentiated concatenated summary. Source quality and evidence basis remain compatible with Phase 3 `FULL_REPORT / NEWS_BRIEF / REJECT`.

### Stage G — claim validation and writing

Every generated claim must reference one or more evidence IDs. The existing claim classes remain:

```text
SUPPORTED
INFERENCE
UNSUPPORTED
CONTRADICTED
```

`UNSUPPORTED` and `CONTRADICTED` remain blocking. Missing evaluator results are filled by source claim identity/index, not array length. Facts and AI interpretation remain separate in the article structure.

## 6. Metrics required before v2 public resume

The shadow pipeline must accumulate real data for:

- event discovery success rate by query family
- primary/official source hit rate
- independent-source acquisition rate
- canonical URL resolution success rate
- crawl success rate by publisher and failure class
- average independent source count per event
- `FULL_REPORT / NEWS_BRIEF / REJECT` distribution
- `SUPPORTED / INFERENCE / UNSUPPORTED / CONTRADICTED` distribution
- blocking claim count before/after regeneration
- title entailment and interpretation-boundary quality
- duplicate/syndication rate after canonicalization
- evidence persistence completeness

Public publish remains paused until these metrics can be read back from shadow runs. The existing fail-closed publisher and lifecycle policies remain active.

## 7. Implementation order

1. Add read-only source/result/event observability and typed failure fields.
2. Implement shared URL resolution and publisher identity normalization.
3. Add official-domain registry and primary-source query pass.
4. Add event grouping and independent-source expansion.
5. Add bounded source-aware crawl fallback.
6. Feed evidence items into the existing Quality Pipeline v2.
7. Run multiple shadow windows and evaluate the metrics above.
8. Decide on public resume separately; do not couple it to implementation completion.

## 8. Explicit non-goals for this task

- no blind SearXNG settings change
- no broad crawler rewrite
- no public publish resume
- no historical article revalidation
- no database DELETE or purge
- no redirect/404/410 rollout
