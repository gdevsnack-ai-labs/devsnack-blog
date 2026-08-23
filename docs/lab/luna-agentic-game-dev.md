# Luna Agentic Game Development Lab

> Hermes Agent와 GPT-5.6 Luna가 로컬 LLM worker, Godot, Forgejo를 연결해 실제 개발팀처럼 작업할 수 있는지 검증하는 DevSnack Lab 실험입니다.

## 한눈에 보는 결론

- 빈 Git 저장소에서 시작해 Phase 0 환경 감사부터 실제로 진행했습니다.
- Qwen3.6 35B A3B worker가 Godot 변경안을 생성하고 독립 branch에 commit했습니다.
- Forgejo protected `main`에서 PR 생성, Luna review 기록, merge, post-merge smoke test까지 완료했습니다.
- 관리자 계정의 `main` 직접 push도 Forgejo pre-receive hook에서 거부되어, 프롬프트가 아닌 서버 규칙으로 main을 보호할 수 있음을 확인했습니다.
- 현재 결과는 첫 번째 trivial task의 성공입니다. 일반적인 AI 개발 능력이나 장기 자율 운영을 증명한 것은 아닙니다.

## 이 실험은 무엇을 검증하는가

게임을 빠르게 만들어내는 것이 첫 번째 목적은 아닙니다. 이 실험의 관심사는 AI가 실제 소프트웨어 프로젝트를 이어받고, 작은 작업을 수행하고, 검증과 review를 거쳐 안전하게 통합할 수 있는가입니다.

핵심 질문은 다음과 같습니다.

1. Luna가 worker의 역할과 작업 범위를 실제 결과를 기준으로 조정할 수 있는가?
2. 로컬 LLM worker가 기존 Godot 구조를 보존하면서 작은 변경을 완성할 수 있는가?
3. 독립 workspace·clone·branch·PR 구조가 AI 작업의 안전성을 높이는가?
4. review·merge·post-merge test까지 다음 세션이 이어받을 수 있는 형태로 남는가?
5. 단순 성공 여부를 넘어 worker의 작업 데이터를 다음 배정에 사용할 수 있는가?

## 설계

```text
Hermes Scheduler
      ↓
GPT-5.6 Luna
Lead · Planner · Reviewer · Merge Authority
      ↓
Worker Registry
      ↓
Local LLM Worker
독립 workspace · clone · branch
      ↓
Godot test · commit · push
      ↓
Forgejo Pull Request
      ↓
Luna review
      ↓
Protected main merge
      ↓
Post-merge smoke · handoff · log
```

역할은 의도적으로 분리했습니다.

| 역할 | 책임 |
|---|---|
| Luna | 상태 확인, task 정의, worker 선택, diff review, merge, handoff |
| Worker | 자신의 workspace에서 구현, 테스트, commit, branch push, PR 생성 |
| Hermes | 세션·도구·스케줄 오케스트레이션 |
| Forgejo | remote, branch, PR, protection, merge history |
| Godot | 실제 제품에 가까운 검증 대상 |

## Phase 0 — 환경 감사

처음부터 구현하지 않고 현재 환경과 설계 문서의 차이를 확인했습니다.

- Hermes Agent 0.20.4
- Hermes gateway와 cron 동작 확인
- workdir 기반 scheduled agent 실행 방식 확인
- delegation/subagent read-only probe 완료
- NVIDIA GB10 환경 확인
- Qwen3.6 35B A3B OpenAI-compatible endpoint 확인
- Godot 4.4.1 CLI 확인
- Forgejo 14.0.3 API·SSH·repository 상태 확인
- Git SSH authentication 확인
- Orinith worker는 model file과 endpoint가 없어 비활성화

환경 감사 결과, 설계 문서의 모든 worker가 이미 준비되어 있다고 가정하지 않았습니다. 실제로 확인된 Qwen만 첫 loop에 사용했고, Orinith는 unavailable 상태로 남겼습니다.

## 실제 구현

빈 repository에 다음 기반을 만들었습니다.

### Worker와 workspace

- YAML worker registry
- verified/unavailable 상태 분리
- worker별 workspace path guard
- worker branch naming guard
- clone/update와 clean workspace 검사
- OpenAI-compatible health/model probe
- shared Qwen systemd service를 worker가 임의로 재시작하지 않는 healthcheck-only 모드

### Forgejo integration

- repository metadata read-back
- branch protection 상태 검증
- PR 생성·조회
- PR 변경 파일 조회
- review 조회·생성
- merge payload를 명시한 protected merge
- 외부 쓰기 후 remote 상태 read-back

### Luna review와 session

- PASS / REWORK / REJECT local review gate
- `WAKE → RECOVER_CONTEXT → PLAN → WORKING → REVIEWING → MERGE → HANDOFF → LOG` 상태 머신
- 60분 예산의 new-task lock과 handoff reserve 정책
- atomic boundary 기반 safe-stop 정책 모델
- session log, worker observation, review log, current handoff

### Godot baseline

첫 제품은 기능이 아니라 deterministic smoke scene으로 시작했습니다.

- Godot headless 실행
- 기존 smoke marker 유지
- worker task marker 확인
- 종료 code와 출력 marker를 함께 검증

## 첫 번째 실제 E2E

첫 task는 의도적으로 작게 잡았습니다. worker가 기존 Godot smoke 동작을 보존하면서 marker 한 줄을 추가하는 작업입니다.

```text
Qwen worker
→ unified diff 생성
→ 독립 worker branch 적용
→ Godot headless test
→ commit
→ worker branch push
→ PR #1
→ Luna local review PASS
→ Forgejo review comment 기록
→ protected main merge
→ clean checkout smoke test
```

실제 결과:

- 변경 파일: 1개
- 추가된 코드: 1줄
- worker branch commit: 성공
- PR #1: merged
- PR #2: adapter와 protection 정책 반영, merged
- PR #3: 보호 merge 증거와 handoff 기록, merged
- 전체 테스트: 25개 통과
- session dry-run: 15개 상태 전이 후 COMPLETE
- post-merge Godot smoke: PASS
- `LUNA_SMOKE_OK`: PASS
- `WORKER_TASK_001_OK`: PASS

## 가장 중요한 안전 검증

초기에는 로컬 main baseline을 push했지만, branch protection을 설정한 뒤에는 의도적으로 main direct push를 시도했습니다. Forgejo가 다음과 같이 거부했습니다.

```text
Not allowed to push to protected branch main
pre-receive hook declined
```

이 결과가 중요합니다. worker에게 “main에 push하지 말라”고 프롬프트로 말하는 것과, Git server가 실제로 main push를 거부하는 것은 전혀 다릅니다. 이 실험에서는 후자를 확인했습니다.

또한 이후 Luna의 문서·adapter 변경도 direct push하지 않고 Luna branch → PR → review → merge 경로로 반영했습니다. main protection은 worker뿐 아니라 Luna의 shortcut도 막는 상태로 유지했습니다.

## 한 계정 구조에서 확인한 한계

초기 Forgejo에는 사용자가 한 명뿐이었습니다. 그래서 다음 제한을 확인했습니다.

- 같은 계정은 자기 PR을 공식 APPROVED review할 수 없음
- 현재는 Luna application review gate를 먼저 통과시킨 뒤 Forgejo에는 COMMENT review로 기록
- merge는 Forgejo merge whitelist로 제한
- required approval은 두 번째 계정이 없으므로 0으로 설정

이 문제는 계정을 분리하면 해결됩니다.

```text
human/admin
luna/orchestrator + reviewer + merger
worker-qwen/non-admin implementation worker
```

다음 단계에서는 worker 계정과 Luna 계정을 분리하고, worker PR을 Luna가 공식 APPROVED review하는 구조를 검증합니다.

## 확인된 설계상의 교훈

### 1. 인증된 HTTP 200도 보호 설정을 의미하지 않는다

branch protection API는 인증된 상태에서 보호 규칙이 없어도 `HTTP 200 []`을 반환했습니다. 따라서 status code만 확인하면 안 되고, 실제 rule 목록과 effective branch 상태를 함께 읽어야 합니다.

### 2. 모델이 아니라 실행 경계도 평가해야 한다

첫 task의 결과만 보면 Qwen이 작은 변경을 잘 수행했습니다. 하지만 이 성공은 모델 능력만의 결과가 아닙니다. 명확한 task scope, 기존 파일 내용, deterministic test, branch guard, review gate가 함께 작동한 결과입니다.

### 3. shared model service와 worker-owned process는 다르다

현재 Qwen endpoint는 다른 로컬 도구와 공유하는 systemd service입니다. 이를 worker가 자유롭게 stop/start할 수 있는 것처럼 취급하지 않았습니다. 실제 worker process ownership은 별도 검증 과제로 남겼습니다.

### 4. 로그와 handoff는 기능이 아니라 다음 세션을 위한 상태다

PR 번호와 commit만 남기는 것이 아니라, 무엇을 확인했고 무엇을 아직 확인하지 않았는지 함께 남겨야 fresh Luna가 과장 없이 이어받을 수 있습니다.

## 현재 상태

완료된 것:

- Phase 0 environment audit
- Phase 1 repository/Godot baseline
- Phase 2 worker registry/workspace/health probe
- Phase 3 protected Forgejo PR lifecycle
- local review gate와 session state machine foundation

아직 하지 않은 것:

- non-trivial Godot task
- Orinith worker 실행
- 두 worker 동시 실행 resource probe
- conflict recovery
- live subprocess safe-stop watchdog
- persistent worker metrics/profile
- GitHub promotion

## 다음 실험

다음 task는 trivial marker보다 큰 작업으로 올리되, 한 세션에서 검증 가능한 범위로 제한합니다. 계정 분리 후 worker 계정이 feature branch와 PR을 만들고, Luna 계정이 공식 review·merge하는 흐름을 우선 검증합니다.

그 이후에야 병렬 worker와 conflict recovery를 추가합니다.

## 이 글의 결론

첫 번째 loop는 성공했습니다. 하지만 이것은 AI 개발팀의 완성이나 장기 자율성의 증명이 아닙니다.

이번 실험이 확인한 것은 더 작고 구체적입니다. 실제 환경을 먼저 감사하고, worker의 작업을 격리하고, server-side rule로 main을 보호하고, 테스트와 review와 handoff를 남기면 AI가 수행한 작은 변경을 사람이 추적 가능한 개발 흐름 안에 넣을 수 있다는 점입니다.

앞으로 확인해야 할 것은 그 다음입니다. 더 어려운 task에서도 같은 구조가 유지되는가. 실패했을 때 복구되는가. worker가 바뀌어도 기록만 보고 이어갈 수 있는가.
