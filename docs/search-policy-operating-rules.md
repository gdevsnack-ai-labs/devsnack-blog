# DevSnack Search Policy 운영 규칙

> DevSnack의 장기 검색 품질·공개면 운영 규칙입니다. AdSense 심사에만 쓰는 임시 패치가 아니며, 새 콘텐츠가 들어올 때 공개 여부와 검색 노출 여부를 일관되게 판정하기 위한 기준입니다.

## 1. 목적과 적용 범위

DevSnack은 Story, Lab, Benchmark, Knowledge, Feed, Data, Showcase가 함께 있는 개인 AI 개발 연구실입니다. 이 구조에서는 콘텐츠가 공개되어 있다는 사실만으로 검색엔진에 노출할 이유가 생기지 않습니다.

이 규칙은 다음 공개면에 적용합니다.

- Story / Lab / Benchmark / Knowledge / Feed / Data / Showcase
- 자동 생성 Feed와 raw 실행 기록
- 영어 번역 파일럿
- static HTML 실행 artifact
- utility·telemetry·운영 현황 페이지
- sitemap, robots metadata, canonical, hreflang/alternate, JSON-LD

이번 규칙 정리에서는 기존 콘텐츠를 대량 재분류하거나 DB를 변경하지 않습니다. 현재 route와 lifecycle에서 확인 가능한 명백한 사례는 공통 helper가 자동 처리하고, 의미 판단이 필요한 콘텐츠는 명시적 결정과 사람 검토로 남깁니다.

## 2. 서로 분리해야 하는 축

다음 값은 같은 의미로 취급하지 않습니다.

| 축 | 질문 | 예시 |
|---|---|---|
| `publication_status` / 기존 `status` | 발행 가능한가? | draft, live |
| `lifecycle_status` | 콘텐츠의 수명·보존 단계는 무엇인가? | live, consolidated, archived |
| `public` | 접근 권한이 공개인가? | public, private |
| `search_policy` | 검색엔진에 노출할 것인가? | `index`, `noindex`, `private` |
| `search_policy_reason` | 왜 이 결정을 했는가? | 직접 측정, 반복 raw 기록, 미검수 번역 |
| `provenance` | 어떻게 만들어졌는가? | human, ai_assisted, automated, data_generated |
| `human_reviewed` | 사람이 검수했는가? | true, false |

핵심 원칙:

- `PUBLIC + NOINDEX`는 정상적인 조합입니다.
- `NOINDEX`는 접근제어가 아닙니다.
- `PRIVATE` 콘텐츠는 route 자체를 없애거나 인증 뒤에 둬야 합니다.
- `robots.txt`의 `Disallow`만으로 내부 데이터를 보호하지 않습니다.

대표 사례:

- Operations: `PUBLIC + NOINDEX`
- AITech archive detail: `PUBLIC + NOINDEX`
- StockPulse daily raw note: `PUBLIC + NOINDEX`
- 대표 Benchmark: `PUBLIC + INDEX`
- Admin·draft·candidate queue: `PRIVATE`

## 3. 단일 판정 source of truth

현재 canonical 구현은 다음 파일입니다.

```text
src/lib/seo/search-policy.ts
```

주요 API:

```ts
searchPolicyDecisionForPath(pathname)
searchPolicyForPath(pathname)
searchPolicyDecisionForPost(post)
searchPolicyForPost(post)
validateSearchPolicyPost(post)
isIndexablePostSitemapEntry(post)
robotsForSearchPolicy(policy)
```

판정 결과는 다음 구조를 사용합니다.

```ts
type SearchPolicy = 'index' | 'noindex' | 'private'

type SearchPolicyDecision = {
  policy: SearchPolicy
  reason: string
  source: 'automatic' | 'override' | 'default'
  reviewRequired: boolean
}
```

사용 규칙:

- 정적 route metadata는 `buildRouteMetadata()`가 `searchPolicyForPath()`를 기본 사용합니다.
- 동적 post metadata는 `searchPolicyForPost(post)` 결과를 전달합니다.
- dynamic sitemap entry는 `isIndexablePostSitemapEntry(post)`만 사용합니다.
- noindex/private 결과는 sitemap에 넣지 않습니다.
- noindex 영어 route는 hreflang·alternate로도 다시 노출하지 않습니다.
- route별로 임시 `robots` 조건문을 새로 만들지 않습니다. 예외는 helper 또는 명시적 override에 추가합니다.

## 4. 판정 순서

새 콘텐츠는 다음 순서로 판단합니다.

### 4.1 접근 권한과 발행 상태

먼저 검색보다 공개 가능 여부를 확인합니다.

1. `public=false`인가?
2. `status` 또는 `publication_status`가 `live`/`published`가 아닌가?
3. 인증·관리자·write/mutation 기능인가?

그렇다면 결과는 `PRIVATE`입니다.

```text
PRIVATE → route 제거 또는 인증 필요 → sitemap 제외
```

명시적 `search_policy=index`가 있어도 비공개 발행 상태를 공개로 바꾸지 못합니다.

### 4.2 명백한 자동 판정

다음은 사람이 매번 기억하지 않아도 helper가 자동 판정합니다.

- AITech v1 `lifecycle_status=archived` detail → `410 Gone` (public URL retired)
- StockPulse `lifecycle_status=consolidated` detail → `noindex, follow`
- `blog_id=lab`이면서 `stockpulse-self-*`인 daily raw note → `noindex, follow`
- English route 또는 `locale=en` + `human_reviewed=false` → `noindex, follow`
- `raw_artifact` 또는 raw static artifact path → `noindex, follow`
- 빈 Showcase category → `noindex, follow`
- Search, Links, Operations, telemetry utility → `noindex, follow`
- 현재 thin Knowledge override인 `research:unsloth-gguf` → `noindex, follow`

### 4.3 사람 가치 판단이 필요한 콘텐츠

자동 분류기가 글자 수나 상태만 보고 Knowledge 전체를 자르지 않습니다.

다음은 기본적으로 `reviewRequired=true`인 영역입니다.

- Research / Knowledge
- 새 Story·Lab·Benchmark·Showcase wrapper
- 새 Feed 또는 Data report
- 검수된 영어 번역
- 기존 규칙에 없는 새 `content_type`

사람은 `search_policy`와 `search_policy_reason`을 명시해야 합니다. 기존 legacy row는 호환을 위해 runtime에서 기본 index를 유지할 수 있지만, 신규 발행 gate에서는 명시적 결정을 요구합니다.

## 5. INDEX 기준

다음 사용자 가치 중 하나 이상이 있고, 페이지가 독립적으로 읽을 가치가 있으면 `INDEX` 후보입니다.

- 직접 측정한 결과
- 직접 실행한 실험
- 직접 구축·적용한 경험
- 독자적인 분석·해석
- 명확한 결론 또는 판단
- 비교 가능한 데이터
- 검증 방법·환경·프로토콜
- 실패했더라도 확인한 사실과 배운 점
- 충분하고 명확한 출처·근거
- 다른 페이지를 단순 요약하지 않은 DevSnack 고유의 추가 가치

대표적인 INDEX 유형:

- Stories
- 핵심 Lab Project
- Benchmark result와 protocol
- 충분한 Knowledge
- 대표 Data Hub
- 주간·월간 종합 분석
- 결과·제작 방법·검증·한계를 설명하는 Showcase wrapper
- AITech archive Hub의 실험 회고

단, 타입만으로 자동 INDEX하지 않습니다. 예를 들어 Benchmark라는 이름이어도 실제 결과·조건·해석이 없으면 사람 판단을 다시 받아야 합니다.

## 6. NOINDEX 기준

다음은 `PUBLIC + NOINDEX` 후보입니다.

- 자동 생성 반복 daily Feed
- raw run log
- archived Feed detail
- consolidated history record
- 매우 짧은 조사 메모
- 실행하지 않은 후보 조사
- 설치·검증 예정 수준의 메모
- 외부 프로젝트 소개 위주이며 독자 검증이 거의 없는 글
- human review 전 AI-assisted 번역
- 콘텐츠가 없는 category
- 검색 결과·utility page
- aggregate telemetry/statistics utility
- raw static HTML/game artifact
- 공개는 필요하지만 검색 landing 가치가 낮은 Operations 기록

NOINDEX는 삭제가 아닙니다. 기존 URL 접근, 내부 링크, 원문 보존은 필요에 따라 유지할 수 있습니다.

### 글자 수 규칙에 대한 제한

다음과 같은 자동 규칙은 사용하지 않습니다.

- `in_progress = noindex`
- `archived = 항상 삭제`
- `AI generated = noindex`
- `N자 미만 = noindex`

글자 수는 후보 조사에 사용할 수 있지만 최종 결정 근거가 아닙니다. 현재 `unsloth-gguf`만 실제 후보 검토 후 명시적 override로 noindex입니다. `ternary-bonsai-27b`, `qwopus-3-6-27b`, `hyperframes-voicebox` 등 다른 후보는 자동으로 자르지 않습니다.

## 7. Feed와 대표 분석 분리

자동화 Feed를 AI라는 이유로 제거하지 않습니다. 검색 surface에서 대표 결과와 반복 원자료를 구분합니다.

### StockPulse

| 영역 | 기본 정책 |
|---|---|
| `/stock` dashboard | `INDEX` |
| 충분한 current market report | `INDEX` 후보 |
| weekly/monthly synthesis | `INDEX` |
| daily raw Lab run | `NOINDEX` |
| consolidated old detail | `NOINDEX` |

### AITech

| 영역 | 기본 정책 |
|---|---|
| `/aitech` archive Hub·experiment retrospective | `INDEX` |
| historical automated detail | `NOINDEX` |
| 향후 source/evidence가 충분한 대표 글 | 사람 검토 후 `INDEX` 후보 |

## 8. Showcase 정책

Showcase의 탐색 wrapper와 실행 artifact는 서로 다른 자산입니다.

```text
/demos
/demos/html
```

결과·제작 방법·모델·검증·한계를 설명하는 wrapper는 `INDEX` 후보입니다.

raw HTML/game/video 실행 artifact는 기본 `NOINDEX, FOLLOW`입니다. 직접 실행과 링크 보존은 유지할 수 있습니다.

실제 콘텐츠가 없는 `/demos/music`, `/demos/image`는 `NOINDEX`이며, `/demos` category navigation에서도 노출하지 않습니다. 콘텐츠가 생기면 category metadata를 명시적으로 `index`로 전환하고 sitemap 포함 여부를 함께 검증합니다.

## 9. 번역 정책

AI-assisted 번역을 자동으로 INDEX하지 않습니다.

기본 흐름:

```text
human_reviewed=false
  → NOINDEX, FOLLOW

human_reviewed=true
  + 정상 collection IA
  + 원문 관계 확인
  + self canonical 확인
  + hreflang/alternate 검증
  → INDEX 후보
```

현재 English pilot은 `/en`과 현재 detail/projection route를 모두 noindex로 유지합니다. 존재하지 않는 `/en/devsnack`, `/en/research`, `/en/labs`, `/en/lab` Hub를 breadcrumb·JSON-LD가 가리키지 않도록 실제 `/en` pilot root 또는 존재하는 route만 참조합니다.

## 10. Provenance 정책

가능하면 신규 콘텐츠 입력에 다음을 기록합니다.

```text
human
ai_assisted
automated
data_generated
```

가능한 콘텐츠 타입에는 `human_reviewed`도 기록합니다.

단, provenance만으로 검색 정책을 결정하지 않습니다.

- AI-assisted라도 직접 실행·측정·분석 가치가 충분하면 INDEX 가능합니다.
- 사람이 작성했어도 반복 raw log나 짧은 utility 기록이면 NOINDEX일 수 있습니다.
- provenance가 없다고 자동 삭제하거나 자동 noindex하지 않습니다. 다만 신규 발행 gate에서 검토 필요 사유가 될 수 있습니다.

## 11. Override 규칙

사람의 명시적 결정은 자동 분류보다 우선합니다.

권장 logical fields:

```text
search_policy: index | noindex | private
search_policy_reason: 사람이 이해할 수 있는 결정 근거
```

현재 helper는 이 필드를 optional compatibility field로 지원합니다. DB 전체 migration은 이번 작업에 포함하지 않았습니다.

우선순위는 다음과 같습니다.

```text
1. non-public publication → PRIVATE
2. unreviewed English → NOINDEX
3. 명시적 search_policy + search_policy_reason → OVERRIDE
4. 명백한 lifecycle/path 자동 규칙
5. default decision + reviewRequired
```

즉, archived AITech도 사람이 실험 회고 대표 글로 선정해 `search_policy=index`와 이유를 남기면 INDEX override가 가능합니다. 반대로 draft/private 콘텐츠를 `index` override로 공개할 수는 없습니다.

코드에 고정된 현재 예외 map은 다음입니다.

```ts
SEARCH_POLICY_OVERRIDES['research:unsloth-gguf']
```

새 예외를 추가할 때는 반드시 다음을 함께 남깁니다.

- stable key (`blog_id:slug` 또는 route key)
- policy
- 사람이 읽을 수 있는 reason
- 후보 목록과 판단 근거
- metadata와 sitemap read-back

Override를 자동으로 날짜 만료시키거나 classifier가 임의로 뒤집지 않습니다. 사람이 변경하기 전까지 유지합니다.

## 12. 신규 콘텐츠 발행 Gate

새 글·실험·Feed·Knowledge·Benchmark·Showcase·번역은 발행 전에 다음 입력을 준비합니다.

```text
content_type
publication_status 또는 기존 status
public/private
lifecycle_status
provenance
human_reviewed
locale
search_policy
search_policy_reason
```

판정 예시:

```ts
const errors = validateSearchPolicyPost(input)
if (errors.length > 0) {
  // 발행 중단 또는 review_required 큐로 보냄
}

const decision = searchPolicyDecisionForPost(input)
// decision.policy, decision.reason, decision.source, decision.reviewRequired 기록
```

운영 순서:

1. content type과 공개 목적 분류
2. draft/private 여부 확인
3. lifecycle·locale·human review 확인
4. 명백한 자동 규칙 적용
5. 직접 측정·실행·출처·결론·한계 확인
6. `search_policy`와 `search_policy_reason` 명시
7. validation 통과 후 publish
8. metadata robots·canonical·JSON-LD 확인
9. sitemap inclusion 또는 exclusion 확인
10. production route를 읽어 실제 결과 확인

기존 데이터는 새 gate를 소급해 대량 수정하지 않습니다. 새 pipeline부터 이 gate를 사용하고, 기존 row의 예외는 점진적으로 명시합니다.

## 13. Metadata·Sitemap 일치 규칙

다음은 절대적인 기술 규칙입니다.

| Search Policy | robots metadata | sitemap |
|---|---|---|
| `index` | `index, follow` | 포함 가능하며 route policy와 함께 확인 |
| `noindex` | `noindex, follow` | 반드시 제외 |
| `private` | 공개 route 없음 또는 인증 필요 | 반드시 제외 |

추가 규칙:

- noindex URL을 hreflang·alternate에서 다시 연결하지 않습니다.
- redirect route는 sitemap에서 제외합니다.
- `/lab` legacy Hub는 `/labs`로 redirect하고 `/lab/[id]` content permalink는 보존합니다.
- canonical은 실제 self URL을 가리킵니다.
- JSON-LD의 `url`, `mainEntityOfPage`, breadcrumb, `isPartOf`는 실제 존재하는 URL만 사용합니다.
- sitemap query가 lifecycle을 필터링하더라도 최종 post decision을 다시 확인합니다.

## 14. 현재 확정 사례

| URL 또는 유형 | 정책 | 근거 |
|---|---|---|
| `/tools/operations` | PUBLIC + NOINDEX | 운영 투명성은 유지하되 search landing 아님 |
| `/aitech` | INDEX | 자동 발행 실험 archive Hub·회고 |
| `/aitech/[slug]` archived v1 | GONE (410) | 반복 historical automated detail은 compact history만 유지 |
| `/stock` | INDEX | current dashboard와 대표 Data surface |
| `/stock/[slug]` live | INDEX 기본 | current rich report 보존 |
| `/stock/[slug]` consolidated | NOINDEX | 보관 history |
| `/lab/stockpulse-self-*` | NOINDEX | daily raw run |
| `/lab/stockpulse-weekly-*` | INDEX | 종합 분석 |
| Benchmark Lab note | INDEX | 측정 조건·결과·한계 |
| `/research` | INDEX | Knowledge Hub |
| `research:unsloth-gguf` | NOINDEX override | 실제 검토된 극단적 thin memo |
| 충분한 Knowledge | INDEX 후보 | 독립 가치와 근거 검토 |
| `/en` 및 English pilot detail | NOINDEX | human review 전 |
| `/demos`, `/demos/html` | INDEX 후보 | wrapper·curation |
| raw static artifact | NOINDEX | 실행 artifact |
| `/demos/music`, `/demos/image` | NOINDEX | 빈 category |
| `/search`, `/links` | NOINDEX | utility |
| `/data/hermes-usage` | NOINDEX | aggregate telemetry utility |
| Admin·draft·candidate queue | PRIVATE | 검색 지시가 아닌 접근제어 대상 |

## 15. DB·schema 원칙

이번 규칙 정리에서는 DB migration을 추가하지 않았습니다.

현재는 다음을 재사용합니다.

- 기존 `status`
- 기존 `lifecycle_status`
- 기존 `blog_id`·slug
- 기존 provenance·translation fields
- 코드의 explicit override map

장기적으로는 다음 additive fields를 고려할 수 있지만, 필요성이 확인될 때 별도 migration으로 진행합니다.

```text
publication_status
content_type
lifecycle_status
provenance
human_reviewed
search_policy
search_policy_reason
```

`status`, `workflow_state`, `lifecycle_status`의 의미를 서로 바꾸지 않습니다. 특히 Research editorial workflow와 Feed retention lifecycle을 혼용하지 않습니다.

## 16. 테스트와 release 확인

정책 변경 시 최소 다음을 실행합니다.

```bash
npx tsc --noEmit
node --experimental-strip-types src/lib/seo/search-policy.test.ts
node --experimental-strip-types src/lib/seo/sitemap-policy.test.ts
node --experimental-strip-types src/lib/seo/metadata.test.ts
npm run build
npm run audit:links -- --base-url https://devsnack-blog.vercel.app
```

고정된 fixture:

- Story → index
- Benchmark → index
- AITech v1 archived detail → 410 Gone
- StockPulse consolidated → noindex
- StockPulse daily Lab → noindex
- StockPulse weekly Lab → index
- English unreviewed → noindex
- Operations → noindex
- Search utility → noindex
- Thin Knowledge override → noindex
- 충분한 Knowledge → 명시적 index + reason
- noindex dynamic post → sitemap 제외
- explicit override는 자동 규칙보다 우선
- draft/private는 index override보다 우선

production release 뒤에는 최소한 다음을 read-back합니다.

- 핵심 Hub와 대표 detail HTTP status
- robots metadata
- self canonical
- redirect status
- JSON-LD의 collection URL
- sitemap URL 수와 noindex URL 부재
- robots.txt
- ads.txt
- internal link audit

## 17. 이 문서의 운영 의미

이 규칙은 “AdSense를 통과하기 위해 글을 숨기는 방법”이 아닙니다.

DevSnack의 검색 surface를 다음처럼 오래 유지하기 위한 공개 품질 정책입니다.

- 사람이 읽을 대표 결과는 발견 가능하게 유지
- 반복·보관·실행 raw 자료는 URL과 기록을 보존하되 검색 surface에서 분리
- AI 사용 여부가 아니라 독자에게 남는 추가 가치로 판단
- 내부 기능은 noindex가 아니라 PRIVATE 경계로 보호
- 새 콘텐츠가 들어와도 metadata·sitemap·canonical이 같은 정책을 따름
- 사람이 결정한 예외는 자동 분류기가 임의로 뒤집지 않음

최종 기준은 항상 같습니다.

> 이 페이지가 독립적으로 사용자에게 어떤 추가 가치를 주는가?
