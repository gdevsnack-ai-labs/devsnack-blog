# Research 관리자 POC 구현 계획

## 범위

인증과 실제 발행을 다음 페이즈로 미룬 공개 POC를 먼저 구축한다.

- `/admin/research`: 공개 더미 관리자 페이지
- Research draft와 후보군을 Supabase에 저장
- 미발행 정식 Research draft 최대 5개
- 5개 초과 주제는 `keyword` 또는 `cardnews` 후보군으로 저장
- 후보 상태·메모·관심없음 suppression 동작
- `draft -> live` 발행 API와 버튼은 POC에서 비활성화
- `/research`는 기존처럼 `status=live`만 공개

## 데이터 흐름

```text
arXiv Scout
  -> 로컬 inbox JSON
  -> POC Researcher
  -> Vercel intake API
  -> draft 슬롯 확인
       ├─ 5개 미만: posts(blog_id=research,status=draft)
       └─ 5개 도달: research_candidates
  -> /admin/research 공개 POC 화면
```

## DB 보호

- 기존 `posts` 공개 RLS는 `status='live'`만 허용하도록 제한
- POC 서버 API는 service_role로 DB를 읽고 쓰지만 인증은 붙이지 않음
- draft 상한은 PostgreSQL advisory lock을 사용하는 RPC에서 강제
- 후보 fingerprint는 unique 처리
- 관심없음 처리 시 `research_suppressions`에 fingerprint·키워드·엔티티 저장

## 구현 단계

1. migration + RPC + 순수 POC helper 테스트
2. intake·후보 피드백 API
3. 공개 관리자 POC UI
4. arXiv Scout/Researcher 연결 및 실제 데이터 투입
5. 로컬 build·통합 검증·Vercel 배포
6. wiki/log 기록 및 push

## 실행

```bash
bash ~/.hermes/scripts/research-poc-agent.sh "large language model memory" cardnews 6
```

실행 로그는 `~/.hermes/logs/research-poc-agent.log`에만 기록한다. 현재는 별도 Hermes 크론 스케줄을 만들지 않고 수동 실행으로 POC 흐름을 검증한다.

## 다음 페이즈

- Supabase Auth + Google OAuth
- 관리자 이메일 allowlist
- SSR session/middleware 보호
- authenticated RLS 정책
- 검토 완료 후에만 live 전환하는 Publisher 활성화
