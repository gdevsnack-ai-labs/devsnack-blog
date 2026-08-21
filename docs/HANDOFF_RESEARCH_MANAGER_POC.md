# Research 관리자 시스템 POC — Handoff

작성일: 2026-08-21
상태: POC 구현·테스트·Vercel 반영 완료
다음 단계: Supabase Auth + Google 로그인 연동

## 1. 현재 결론

인증과 실제 발행 기능을 다음 페이즈로 미룬 상태에서, Research 수집 → draft 제한 → 후보군 전환 → 관리자 피드백의 실제 흐름을 공개 POC로 구현했다.

- 관리자 POC: https://devsnack-blog.vercel.app/admin/research
- 공개 Research: https://devsnack-blog.vercel.app/research
- POC는 공개 접근이며 인증이 없다.
- `draft → live` Publisher는 구현하지 않았고 UI 버튼도 disabled 상태다.
- `/research`는 기존처럼 `status='live'` 글만 표시한다.

## 2. 현재 원격 데이터 상태

Supabase 읽기 검증 결과:

```text
Research live: 43건
POC draft: 5건
활성 후보군(new/reviewing/deferred): 5건
not_interested suppression: 1건
discarded 후보: 1건
```

5개 draft 슬롯은 현재 가득 찬 상태다. 이는 cap 검증을 완료한 결과이며, 다음 페이즈에서 Publisher 또는 별도 정리 정책을 추가하기 전까지 새 정식 draft는 생성되지 않고 후보군으로 간다.

## 3. 데이터 흐름

```text
arXiv Scout
  └─ source record 수집
      └─ ~/.hermes/data/research-poc/inbox/*.json

POC Researcher
  └─ source record → POC draft payload 변환
      └─ Vercel /api/poc/research/intake

Intake API
  ├─ suppression 확인
  ├─ 동일 topic fingerprint 확인
  ├─ PostgreSQL reserve_research_draft() 호출
  │    ├─ draft < 5: posts(status=draft, workflow_state=research_draft)
  │    └─ draft = 5: research_candidates
  └─ /admin/research에 표시
```

## 4. 주요 파일

### Vercel Next.js 프로젝트

```text
devsnack-blog/
├─ supabase/migrations/20260821_research_poc.sql
├─ src/lib/supabase-admin.ts
├─ src/lib/research-poc.ts
├─ src/app/api/poc/research/intake/route.ts
├─ src/app/api/poc/research/candidates/[id]/route.ts
├─ src/app/admin/page.tsx
├─ src/app/admin/research/page.tsx
├─ src/app/admin/research/research-poc-client.tsx
└─ docs/research-poc-plan.md
```

### 로컬 에이전트

```text
~/workspace/vercel-blog/scripts/research_poc_agent.py
~/workspace/vercel-blog/scripts/tests/test_research_poc_agent.py
~/.hermes/scripts/research-poc-agent.sh
```

실행 로그 경로:

```text
~/.hermes/logs/research-poc-agent.log
```

현재 Research Hermes 크론은 등록하지 않았다. 검색 주기가 정해지지 않았기 때문에 수동 실행만 사용한다.

## 5. DB 구조

### posts 추가 컬럼

```text
workflow_state
reviewed_at
reviewed_by
published_at
source_type
topic_fingerprint
```

POC draft는 다음 조건으로 구분한다.

```text
blog_id = 'research'
status = 'draft'
workflow_state = 'research_draft'
```

### research_candidates

```text
id
title
kind                 keyword | cardnews
summary
keywords[]
source_urls[]
topic_fingerprint
normalized_title
related_entities[]
card_slides jsonb
status               new | reviewing | deferred | not_interested | promoted | discarded
feedback
snooze_until
created_at
updated_at
last_seen_at
```

### research_suppressions

```text
topic_fingerprint PK
normalized_title
keywords[]
related_entities[]
reason
source_candidate_id
created_at
updated_at
```

### draft cap

`reserve_research_draft()` PostgreSQL RPC가 advisory lock을 사용해 동시 실행을 직렬화한다.

- `research_draft` 개수가 5개 이상이면 draft insert를 거부
- 결과값 `reason='draft_cap_reached'`
- API는 이 경우 후보군 insert로 전환

### 공개 RLS

기존 `anon_select_posts` 정책을 live-only로 변경했다.

```sql
USING (status = 'live')
```

검증 결과 anon REST에서 Research draft 조회는 0건이었다.

## 6. API

### Intake

```text
POST /api/poc/research/intake
```

주요 payload:

```json
{
  "title": "Research topic",
  "slug": "research-topic-abcdef12",
  "content": "POC draft markdown",
  "summary": "Short source-backed summary",
  "keywords": ["LLM", "memory"],
  "source_urls": ["https://arxiv.org/abs/..."],
  "topic_fingerprint": "sha256...",
  "normalized_title": "research topic",
  "kind": "keyword",
  "source_type": "arxiv-poc-agent"
}
```

응답 흐름:

```text
draft 생성        → route=draft
기존 draft        → route=draft-existing
cap 초과 후보     → route=candidate
기존 후보         → route=candidate-existing
suppression 일치 → route=suppressed
```

### 후보 피드백

```text
POST /api/poc/research/candidates/{id}
```

지원 action:

```text
review
 defer
not_interested
discard
memo
```

`not_interested`는 후보 상태 변경과 동시에 `research_suppressions`에 fingerprint·키워드·관련 엔티티를 저장한다.

## 7. 에이전트 실행

실제 production intake를 호출하는 수동 실행:

```bash
bash ~/.hermes/scripts/research-poc-agent.sh \
  "large language model memory" \
  cardnews \
  6
```

직접 실행할 때:

```bash
python3 ~/workspace/vercel-blog/scripts/research_poc_agent.py \
  run \
  --query "large language model memory" \
  --max-results 6 \
  --kind cardnews \
  --endpoint https://devsnack-blog.vercel.app/api/poc/research/intake
```

역할 분리:

- Scout: arXiv source record를 inbox JSON으로 수집
- Researcher: inbox JSON을 POC draft/candidate payload로 변환
- Reviewer: 아직 별도 자동 단계 없음. 현재는 관리자 POC UI에서 상태·메모로 수동 검토
- Publisher: 다음 페이즈에서 구현

## 8. 검증 완료 항목

```text
python3 -m unittest scripts.tests.test_research_poc_agent -v  → 3 passed
npx tsc --noEmit                                             → passed
npm run build                                                 → passed
로컬 /admin/research                                           → HTTP 200
로컬 /research                                                 → HTTP 200
production /admin/research                                    → HTTP 200
production /research                                           → HTTP 200
anon REST draft 조회                                           → 0건
```

실제 재수집 검증:

```text
첫 실행: draft 5개 + candidate 1개
동일 inbox 재실행: draft-existing 5개 + suppressed 1개
검색어가 달라도 같은 정규화 제목: 동일 fingerprint로 dedupe
```

## 9. 다음 페이즈 작업 순서

### 9-1. Google Auth 설정 확인

현재 확인된 상태:

```text
Supabase Auth: enabled
Google provider: disabled
Auth users: 0
Google identities: 0
```

필요한 외부 설정:

- Google Cloud OAuth Client ID/Secret
- Supabase Auth Google provider 활성화
- production callback URL allowlist
- 허용 관리자 Google 이메일 주소

실제 허용 이메일 주소는 현재 기록에 없으므로 추측하지 않는다.

### 9-2. Next.js Auth 기반 추가

- `@supabase/ssr` 설치
- Google 로그인 페이지
- `/auth/callback` route
- Next.js 16 기준 `proxy.ts` 또는 동등한 세션 보호 계층
- `/admin` 및 관리자 API 세션 확인
- 관리자 이메일 allowlist

### 9-3. RLS 강화

현재 POC API는 service_role을 사용하고 인증이 없다. Auth 페이즈에서는 다음을 적용해야 한다.

- authenticated 관리자만 draft/candidate SELECT
- 관리자만 candidate UPDATE
- 관리자만 review 상태 변경
- service_role은 로컬 Scout/Researcher 전용
- 브라우저에 service_role 절대 노출 금지

### 9-4. Publisher 활성화

필수 조건:

```text
검토 완료 기록(reviewed_at/reviewed_by) 존재
AND blog_id='research'
AND status='draft'
AND workflow_state='research_draft'
```

조건을 만족할 때만:

```text
status: draft → live
workflow_state: research_draft → published
published_at 기록
```

그 전까지는 현재처럼 발행 버튼을 disabled 상태로 유지한다.

### 9-5. 크론 등록

검색 주기와 후보 수집량을 정한 뒤에만 Hermes 크론을 등록한다.

권장 운영 방향:

- Scout: `no_agent=True`, 성공 출력은 local log
- Researcher: draft 슬롯이 있을 때만 실행
- draft가 5개면 후보군 수집만 수행
- Telegram delivery는 사용하지 않고 `local` 로그 사용

## 10. 주의사항

1. 현재 `/api/poc/research/intake`와 후보 mutation API에는 인증이 없다. 외부 공개 상태로 운영하면 안 된다.
2. POC draft 본문은 arXiv abstract 기반 자동 초안이며 공개 발행용 완성 글이 아니다.
3. 기존 `sync_research.py`는 여전히 wiki backlog 항목을 `status='live'`로 저장하는 legacy 흐름이다. POC draft를 이 스크립트로 보내면 안 된다.
4. 현재 draft 슬롯은 5/5다. Publisher 또는 명시적 정리 정책 없이 새 정식 draft를 만들 수 없다.
5. `research_poc_agent.py` parent 저장소는 로컬 저장소이며 별도 원격 push 대상이 아니다. Vercel 코드 저장소 `devsnack-blog`만 GitHub push로 배포된다.
6. 상위 `vercel-blog`에는 기존 미추적 파일이 있었으며, POC 작업에서 broad `git add`로 포함하지 않았다.

## 11. 관련 기록

- 위키 설계: `~/wiki/designs/research-backlog-system.md`
- 월별 로그: `~/wiki/log/2026-08.md`
- POC 계획: `devsnack-blog/docs/research-poc-plan.md`
- Vercel 최신 커밋: `4282a29`
- scripts parent 최신 관련 커밋: `8916beb`
- 위키 최신 커밋: `dfd4dd3`
