#!/usr/bin/env python3
"""Publish or update the long-running Hermes Memory Experiment Lab record."""
from __future__ import annotations

import argparse
import html
import json
import os
import re
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

SUPABASE_URL = "https://qbkfwnddxycixnqvfokq.supabase.co"
SLUG = "hermes-memory-experiment"
TITLE = "Hermes Memory Experiment — 기억하는 AI와 검색하는 AI 사이"
PUBLISHED = "2026-08-23T12:00:00+09:00"
ENV_FILE = Path(__file__).resolve().parents[1] / ".env.local"


def load_env(path: Path) -> dict[str, str]:
    values: dict[str, str] = {}
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        values[key.strip()] = value.strip().strip('"').strip("'")
    return values


ENV = load_env(ENV_FILE)
SERVICE_KEY = ENV.get("SUPABASE_SERVICE_ROLE_KEY", "")
ANON_KEY = ENV.get("NEXT_PUBLIC_SUPABASE_ANON_KEY", "")
TOKEN = SERVICE_KEY or ANON_KEY
if not TOKEN:
    raise RuntimeError("Supabase write credential is missing from .env.local")

HEADERS = {
    "apikey": TOKEN,
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json",
}

MARKDOWN_CONTENT = r"""## 기억이 늘고 있는데, 왜 덜 기억하는 것처럼 느껴질까

Hermes를 며칠 동안 실제 비서처럼 사용했다. 기억은 계속 쌓이고 있었다.

그런데 이상했다.

나를 기억한다는 느낌이 강해지지 않았다. 정확히는, 기억하는 게 아니라 매번 나에 대해 검색하는 것 같았다.

이 실험은 그 어색함에서 시작했다.

> 더 많은 기억이 반드시 더 좋은 기억을 의미하지 않는다.

## 이번 실험의 질문

기억을 더 많이 저장하는 대신, 항상 알고 있어야 하는 기억부터 정리하면 AI 에이전트의 기억 경험이 달라질까?

이번 페이지는 최종 결과 보고서가 아니다. Hermes Memory Experiment라는 장기 실험의 첫 번째 공개 기록이다. 앞으로 Phase 2부터 Phase 6까지 같은 실험 페이지에 이어서 기록한다.

현재 상태는 다음과 같다.

**Phase 1 implementation complete / evaluation pending**

구조 변경은 끝났지만, 새로운 Hermes 세션에서 실제로 사용해 본 뒤 체감과 데이터를 평가하지 않았다.

이 실험은 [Hermes Memory Experiment Project](/labs/hermes-memory) 아래에서 계속 이어진다. 이번 글은 첫 번째 [Phase 1 Lab Note](/lab/hermes-memory-experiment)이며, 다음 Phase도 같은 실험의 timeline과 본문을 갱신하는 방식으로 추가한다.

## 왜 이 실험을 시작했는가

Hindsight에는 실제 대화와 작업 기록이 쌓이고 있었다. 진단 시점의 역사적 스냅샷에는 661 facts, 293 observations, 7,339 links, 826 sessions가 있었다.

숫자만 보면 기억은 충분해 보인다.

하지만 자동 recall이 한 번에 많은 observation을 가져오고, 그 안에 사용자 선호·프로젝트 상태·과거 작업·일회성 오류·Assistant의 실행 기록이 함께 섞였다. 관련된 것을 찾을 수는 있었다. 다만 그것은 안정적인 사용자 모델이라기보다, 필요할 때 꺼내 보는 사건 검색에 가까웠다.

문제는 Hindsight가 고장 난 것이 아니었다. 각 계층이 무엇을 기억해야 하는지 역할이 겹쳐 있었고, episodic memory가 항상 주입되는 working memory로 승격되는 경로가 없었다.

## 진단에서 확인한 기존 구조

기존 Hermes 기억 구조는 크게 네 부분으로 나뉘었다.

| 계층 | 당시 역할 | 문제 |
|---|---|---|
| `USER.md` | 사용자 프로필과 행동·응답 선호 | 사용자 모델과 운영 규칙이 섞임 |
| `MEMORY.md` | 작업 원칙·안전 경계·현재 지식 | 프로젝트 상태를 담을 공간이 부족함 |
| Hindsight | 대화·작업 사건의 episodic memory | 사용자 성향과 일회성 사건이 경쟁함 |
| Wiki | 프로젝트 문서와 절차 | 필요한 경우에만 검색됨 |

Hermes의 system prompt에는 `USER.md`와 `MEMORY.md`가 새 세션 시작부터 들어간다. Hindsight의 실제 memory record는 별도의 recall 결과로 들어온다.

즉, 항상 알고 시작하는 카드와 필요할 때 검색하는 사건 저장소가 병렬로 존재했다. 두 계층 사이에 “이건 계속 기억할 내용인가?”를 판단하는 통합 단계는 없었다.

## Phase 1 가설

**Hindsight를 건드리지 않고, 항상 주입되는 working memory의 품질만 높여도 기억 경험이 달라질 수 있다.**

이를 확인하기 위해 이번 Phase에서는 recall 방식, Hindsight bank, embedding, reranker, Docker container를 변경하지 않았다. 먼저 `USER.md`와 `MEMORY.md`가 담당하는 일을 분리했다.

## Before / After

### Before

```text
SOUL
  └─ Hermes 정체성

USER.md
  └─ 사용자 정보 + 대화 선호 + 행동 규칙 + 작업 규칙

MEMORY.md
  └─ 운영 원칙 + 안전 규칙 + 프로젝트 지식 + 일부 현재 상태

Hindsight
  └─ 사용자 선호 + 프로젝트 사건 + Assistant 실행 기록 + 과거 상태
```

`USER.md`는 “나는 어떤 사람인가”와 “AI가 어떻게 일해야 하는가”를 동시에 들고 있었다. `MEMORY.md`도 운영 규칙이 대부분을 차지해, 지금 무엇이 active인지와 어떤 결정이 현재 기준인지 담을 공간이 작았다.

### After

```text
SOUL.md
  └─ Hermes의 정체성·말투·큰 원칙

USER.md
  ├─ 사용자 신원
  ├─ 안정적인 선호
  ├─ 대화 방식
  └─ 오래 유지되는 협업 관계

MEMORY.md
  ├─ 현재 프로젝트 상태
  ├─ 현재 canonical architecture
  ├─ 최근 결정과 보호 경계
  └─ 현재 실험 Phase

Hindsight
  └─ 구체적인 과거 사건·증거·대화 기록

Wiki
  └─ 상세 절차·근거·postmortem·월별 기록
```

핵심은 Hindsight의 기억을 삭제하거나 줄이는 것이 아니다. 항상 주입해야 하는 정보와 검색해서 확인해야 하는 정보를 먼저 나누는 것이다.

## 실제로 바꾼 것

### 1. `USER.md` 역할 재정의

사용자 신원, 한국어와 존댓말 선호, 검증 우선 성향, UI 품질 기준, 글쓰기 방식, 보안 민감도처럼 오래 유지되는 내용을 남겼다.

반대로 특정 프로젝트의 현재 상태나 일회성 운영 절차는 이 카드에서 제거했다.

### 2. `MEMORY.md` 역할 재정의

`MEMORY.md`는 현재 working memory가 되도록 바꿨다.

- Hermes 현재 모델과 운영 경계
- DevSnack의 현재 canonical publishing 구조
- StockPulse의 현재 자기개선 루프
- Hindsight의 현재 역할과 보호 범위
- 현재 Memory Experiment Phase
- Wiki와 Hindsight에 상세 정보를 두는 원칙

여기에 과거 사건과 긴 절차를 다시 쌓지 않도록 명시했다.

### 3. 다섯 계층의 역할 분리

```text
SOUL → 정체성
USER → 안정적인 사용자 모델
MEMORY → 현재 working memory
Hindsight → episodic memory
Wiki → 상세 지식과 증거
```

이것이 이번 Phase의 실질적인 변경이다.

## 사용량 변화

| 카드 | Before | After | 변화 |
|---|---:|---:|---:|
| `USER.md` | 1,190 / 1,375자 · 86.5% | 705 / 1,375자 · 51.3% | −485자 |
| `MEMORY.md` | 2,085 / 2,200자 · 94.8% | 1,807 / 2,200자 · 82.1% | −278자 |

문자 수를 줄이는 것 자체가 목표는 아니다. 중요한 내용이 들어갈 자리를 확보하고, 서로 다른 종류의 기억이 같은 카드에서 경쟁하지 않도록 하는 것이 목표다.

After 상태는 `USER.md` 6개 카드, `MEMORY.md` 12개 카드로 읽힌다. 카드는 Hermes가 사용하는 `§` 구분 구조를 그대로 유지했다.

## volatile telemetry를 MEMORY에서 제거한 이유

Phase 1 직전 live 확인에서는 Hindsight에 818 nodes, 358 observations, 9,151 links, pending consolidation 2가 있었다.

처음에는 이 수치를 MEMORY에 넣을 수도 있다고 생각했다. 하지만 이 세션 자체가 Hindsight에 저장되면서 수치가 곧바로 820 nodes, 360 observations로 변했다.

이 경험은 중요한 경계를 보여줬다.

- 현재 운영 방식과 보호 경계는 MEMORY에 둘 수 있다.
- node·observation·link 수처럼 계속 변하는 telemetry는 실험 기록에 둬야 한다.
- 숫자가 바뀔 때마다 built-in memory를 다시 쓰면 working memory가 다시 stale state 저장소가 된다.

그래서 최종 MEMORY에서는 변동 카운터를 제거하고, 실험 문서와 로그에만 Before 수치를 남겼다.

## 의도적으로 바꾸지 않은 것

이번 Phase는 범위를 좁혔다.

- Hindsight bank를 초기화하지 않았다.
- Hindsight Docker container를 교체하지 않았다.
- LLM·embedding·reranker backend를 바꾸지 않았다.
- `recall_sync`나 recall budget을 바꾸지 않았다.
- 기존 episodic memory를 삭제하거나 invalidation하지 않았다.
- Vercel과 Blogger의 production publishing 구조를 바꾸지 않았다.

이렇게 해야 다음 Phase에서 working memory 변경 효과와 recall 변경 효과를 구분할 수 있다.

## 실제 검증

Phase 1 적용 후 다음을 확인했다.

- Hermes `MemoryStore`가 `USER.md` 6개 카드와 `MEMORY.md` 12개 카드를 정상 로드
- 두 카드 모두 system prompt용 frozen snapshot 생성
- snapshot 생성 문자 수: USER 854자, MEMORY 1,956자
- `hermes memory status`: built-in memory와 Hindsight provider 모두 available
- Hindsight health: `healthy`, database `connected`
- Hindsight health·config·stats snapshot 보존

Hermes focused pytest는 실행 환경에 pytest가 설치되어 있지 않아 실행하지 못했다. 대신 실제 Hermes `MemoryStore`를 직접 로드하는 smoke test와 파일 read-back은 통과했다.

이것은 구조가 정상적으로 읽힌다는 뜻이지, 사용자의 기억 경험이 좋아졌다는 뜻은 아니다.

## 앞으로의 Roadmap

### Phase 1 — Working Memory Restructure · 현재

`USER.md`와 `MEMORY.md`의 역할을 분리한다.

상태: **Implementation complete / evaluation pending**

### Phase 2 — Recall Diet

동일한 질문 세트로 recall 결과의 양을 줄여 본다. 정확성·관련성·stale memory 혼입·noise intrusion·latency·토큰량을 비교한다.

### Phase 3 — Current-turn Recall

이전 turn의 background prefetch와 현재 질문을 즉시 검색하는 synchronous recall, 그리고 topic-change fallback을 비교한다.

### Phase 4 — Memory Consolidation

Hindsight observation을 바로 USER/MEMORY에 복사하지 않는다. 반복성, proof count, 최근성, 충돌 여부, 사용자 직접 발언 여부를 평가해 안정적인 user model 또는 current project state 후보로 승격한다.

### Phase 5 — Forgetting

commit hash, 일회성 오류, 임시 상태, Assistant의 사소한 실행 기록을 Stable·Current·Episodic·Transient·Expired lifecycle로 나누고, 오래된 정보가 현재 기억을 방해하지 않도록 한다.

### Phase 6 — Blind Memory Test

30문항 테스트 세트로 user model, current state, episode recall, conflict handling, stale memory, noise intrusion을 Before/After 비교한다. 모든 것을 즉시 답하는 것이 좋은 기억인지도 함께 평가한다.

## 지금은 결론을 내리지 않는다

이번 Phase에서 확인한 것은 구조 변경과 검증 가능한 로딩 상태다.

아직 새로운 Hermes 세션을 충분히 사용하지 않았다. 따라서 “더 자연스러워졌다”, “기억력이 좋아졌다”라고 말할 단계가 아니다.

다음 기록은 실제 사용 중 발생한 질문과 답변, recall 주입량, 오래된 기억 혼입, 현재 상태 충돌을 기준으로 이어진다.

이번 실험이 먼저 확인하려는 것은 단순하다.

> 에이전트에게 필요한 것은 더 큰 기억 저장소가 아니라, 무엇을 항상 알고 있어야 하는지에 대한 더 나은 구분일 수 있다.

**현재 상태: Phase 1 implementation complete / evaluation pending**
"""


def protect_public_urls(text: str) -> tuple[str, list[str]]:
    saved: list[str] = []

    def hold(match: re.Match[str]) -> str:
        saved.append(match.group(0))
        return f"\x00PUBLIC_URL_{len(saved) - 1}\x00"

    # Protect Markdown links and public routes before private-path masking.
    protected = re.sub(r"https?://[^\s)]+|/(?:labs?|research|devsnack|demos|api)/[A-Za-z0-9_./?=&%-]+", hold, text)
    return protected, saved


def restore_public_urls(text: str, saved: list[str]) -> str:
    for index, value in enumerate(saved):
        text = text.replace(f"\x00PUBLIC_URL_{index}\x00", value)
    return text


def mask_private(text: str) -> str:
    protected, saved = protect_public_urls(text)
    lines = []
    for line in protected.split("\n"):
        line = re.sub(r"/(?:[\w\-]+/)+[\w\-\.]+", "[경로]", line)
        line = re.sub(r"\b(?:192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|127\.0\.0\.1|localhost)\b", "[IP]", line)
        lines.append(line)
    return restore_public_urls("\n".join(lines), saved)


def md_to_html(markdown: str) -> str:
    lines = mask_private(markdown).split("\n")
    out: list[str] = []
    in_list = False
    in_ordered_list = False
    in_table = False
    in_pre = False

    def close_lists() -> None:
        nonlocal in_list, in_ordered_list
        if in_list:
            out.append("</ul>")
            in_list = False
        if in_ordered_list:
            out.append("</ol>")
            in_ordered_list = False

    def inline(value: str) -> str:
        value = html.escape(value)
        value = re.sub(r"`([^`]+)`", r"<code>\1</code>", value)
        value = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", value)
        value = re.sub(r"(?<!\*)\*([^*]+)\*(?!\*)", r"<em>\1</em>", value)
        value = re.sub(r"\[([^\]]+)\]\(([^)]+)\)", r'<a href="\2" class="text-blue-600 hover:underline">\1</a>', value)
        return value

    i = 0
    while i < len(lines):
        line = lines[i].rstrip()
        if line.startswith("```"):
            close_lists()
            if in_pre:
                out.append("</code></pre>")
            else:
                out.append("<pre><code>")
            in_pre = not in_pre
            i += 1
            continue
        if in_pre:
            out.append(html.escape(line))
            i += 1
            continue

        if line.startswith("|") and i + 1 < len(lines) and re.match(r"^\|[\s:\-|]+\|?$", lines[i + 1].strip()):
            close_lists()
            out.append("<table>")
            for row_index in range(i, len(lines)):
                row = lines[row_index].strip()
                if not row.startswith("|"):
                    i = row_index
                    break
                if row_index == i + 1:
                    continue
                cells = [cell.strip() for cell in row.strip("|").split("|")]
                tag = "th" if row_index == i else "td"
                out.append("<tr>" + "".join(f"<{tag}>{inline(cell)}</{tag}>" for cell in cells) + "</tr>")
                i = row_index + 1
            else:
                i = len(lines)
            out.append("</table>")
            continue

        heading = re.match(r"^(#{1,6})\s+(.*)", line)
        if heading:
            close_lists()
            level = len(heading.group(1))
            out.append(f"<h{level}>{inline(heading.group(2))}</h{level}>")
            i += 1
            continue

        if re.match(r"^\s*[-*]\s+", line):
            if in_ordered_list:
                out.append("</ol>")
                in_ordered_list = False
            if not in_list:
                out.append("<ul>")
                in_list = True
            item = re.sub(r"^\s*[-*]\s+", "", line)
            out.append(f"<li>{inline(item)}</li>")
            i += 1
            continue

        if re.match(r"^\s*\d+\.\s+", line):
            if in_list:
                out.append("</ul>")
                in_list = False
            if not in_ordered_list:
                out.append("<ol>")
                in_ordered_list = True
            item = re.sub(r"^\s*\d+\.\s+", "", line)
            out.append(f"<li>{inline(item)}</li>")
            i += 1
            continue

        close_lists()
        if not line.strip():
            i += 1
            continue
        if line.startswith("> "):
            out.append(f"<blockquote>{inline(line[2:])}</blockquote>")
        else:
            out.append(f"<p>{inline(line)}</p>")
        i += 1

    close_lists()
    if in_pre:
        out.append("</code></pre>")
    return "\n".join(out)


def request(method: str, url: str, body: dict | None = None) -> tuple[int, bytes]:
    data = json.dumps(body, ensure_ascii=False).encode("utf-8") if body is not None else None
    req = urllib.request.Request(url, data=data, headers=HEADERS, method=method)
    with urllib.request.urlopen(req, timeout=30) as response:
        return response.status, response.read()


def build_body(content_html: str) -> dict:
    return {
        "slug": SLUG,
        "title": TITLE,
        "content": content_html,
        "excerpt": "Hermes를 실제 비서처럼 사용하며 느낀 ‘기억’과 ‘검색’의 차이에서 시작한 장기 실험. Phase 1은 Hindsight를 건드리지 않고 USER.md와 MEMORY.md의 역할부터 분리한다.",
        "labels": ["진행중", "Hermes", "Hindsight", "AI Agent", "Memory", "Long-term Experiment"],
        "published": PUBLISHED,
        "updated": PUBLISHED,
        "status": "live",
        "blog_id": "lab",
        "cover_image": None,
        "blogger_id": "lab-hermes-memory-experiment",
    }


def validate_public_content(content_html: str) -> None:
    forbidden = ["/home/", "~/", "192.168.", "service_role", "SUPABASE_", "HINDSIGHT_API_KEY", "[[", "[경로]"]
    found = [token for token in forbidden if token in content_html]
    if found:
        raise RuntimeError(f"public safety check failed: {found}")
    if "Phase 1 implementation complete / evaluation pending" not in content_html:
        raise RuntimeError("status line missing")
    if "improved" in content_html.lower() and "not" not in content_html.lower():
        raise RuntimeError("possible premature conclusion")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    content_html = md_to_html(MARKDOWN_CONTENT)
    validate_public_content(content_html)
    body = build_body(content_html)
    print(f"slug={SLUG}")
    print(f"title={TITLE}")
    print(f"content_chars={len(content_html)}")
    print(f"status={body['status']} blog_id={body['blog_id']}")
    print(f"labels={len(body['labels'])}")
    if args.dry_run:
        print("dry_run=yes")
        return

    status, _ = request("POST", f"{SUPABASE_URL}/rest/v1/posts?on_conflict=slug", body)
    if status not in (200, 201, 204):
        raise RuntimeError(f"unexpected upsert status: {status}")

    query = urllib.parse.urlencode({"slug": f"eq.{SLUG}", "select": "slug,title,status,blog_id,content,labels,updated", "limit": "1"})
    read_status, raw = request("GET", f"{SUPABASE_URL}/rest/v1/posts?{query}")
    rows = json.loads(raw.decode("utf-8"))
    if read_status != 200 or len(rows) != 1:
        raise RuntimeError(f"read-back failed: status={read_status} rows={len(rows)}")
    row = rows[0]
    checks = {
        "slug": row.get("slug") == SLUG,
        "title": row.get("title") == TITLE,
        "status": row.get("status") == "live",
        "blog_id": row.get("blog_id") == "lab",
        "content": len(row.get("content") or "") == len(content_html),
        "phase_status": "Phase 1 implementation complete / evaluation pending" in (row.get("content") or ""),
    }
    if not all(checks.values()):
        raise RuntimeError(f"read-back mismatch: {checks}")
    print(f"upsert_status={status}")
    print(f"readback_status={read_status}")
    print(f"readback_checks={checks}")
    print(f"row_updated={row.get('updated')}")


if __name__ == "__main__":
    main()
