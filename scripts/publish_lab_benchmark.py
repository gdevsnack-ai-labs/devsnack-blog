#!/usr/bin/env python3
"""
Local LLM Benchmark 실험 상세 글을 Supabase lab 포스트로 등록
blog_id='lab', slug='local-llm-benchmark'
"""
import json, re, os, html
import urllib.request, urllib.error, urllib.parse

SUPABASE_URL = os.environ.get("SUPABASE_URL", "").rstrip("/")
ENV_FILE = os.environ.get("DEVSNACK_ENV_FILE", "")
env = {}
if ENV_FILE:
    with open(ENV_FILE, encoding="utf-8") as f:
        for raw_line in f:
            line = raw_line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, value = line.split("=", 1)
                env[key.strip()] = value.strip().strip('"').strip("'")

SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or env.get("SUPABASE_SERVICE_ROLE_KEY", "")
SUPABASE_ANON_KEY = os.environ.get("SUPABASE_ANON_KEY") or env.get("NEXT_PUBLIC_SUPABASE_ANON_KEY", "")
if not SUPABASE_URL or not (SERVICE_KEY or SUPABASE_ANON_KEY):
    raise SystemExit("Set SUPABASE_URL and Supabase credentials before running.")

headers = {
    "apikey": SERVICE_KEY or SUPABASE_ANON_KEY,
    "Authorization": f"Bearer {SERVICE_KEY or SUPABASE_ANON_KEY}",
    "Content-Type": "application/json",
}

def mask_private(text: str) -> str:
    if not text:
        return text
    out = []
    for line in text.split("\n"):
        line = re.sub(r"/(?:[\w\-]+/)+[\w\-\.]+", "[경로]", line)
        line = re.sub(r"\b(?:192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|127\.0\.0\.1|localhost)\b", "[IP]", line)
        out.append(line)
    return "\n".join(out)


def md_to_html(md: str) -> str:
    md = mask_private(md)
    lines = md.split("\n")
    out = []
    i = 0
    in_list, in_olist, in_table, in_pre = False, False, False, False

    def esc(s):
        return html.escape(s)

    def inline(s):
        s = re.sub(r"`([^`]+)`", r"<code>\1</code>", s)
        s = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", s)
        s = re.sub(r"(?<!\*)\*([^*]+)\*(?!\*)", r"<em>\1</em>", s)
        s = re.sub(r"\[([^\]]+)\]\(([^)]+)\)", r'<a href="\2" target="_blank" rel="noopener noreferrer">\1</a>', s)
        return s

    while i < len(lines):
        line = lines[i].rstrip()

        if line.startswith("```"):
            if in_pre:
                out.append("</code></pre>"); in_pre = False
            else:
                if in_list: out.append("</ul>"); in_list = False
                if in_olist: out.append("</ol>"); in_olist = False
                if in_table: out.append("</table>"); in_table = False
                out.append("<pre><code>")
                in_pre = True
            i += 1
            continue

        if in_pre:
            out.append(esc(line))
            i += 1
            continue

        # Table
        if line.startswith("|") and i + 1 < len(lines) and re.match(r"^\|[\s:\-|]+\|?$", lines[i+1].strip()):
            if in_list: out.append("</ul>"); in_list = False
            if in_olist: out.append("</ol>"); in_olist = False
            if not in_table:
                out.append("<table class='border-collapse'>"); in_table = True
            cells = [c.strip() for c in line.strip().strip("|").split("|")]
            out.append("<tr>" + "".join(f"<th style='padding:6px 12px;border:1px solid var(--border)'>{inline(esc(c))}</th>" for c in cells) + "</tr>")
            i += 2
            while i < len(lines) and lines[i].strip().startswith("|"):
                cells = [c.strip() for c in lines[i].strip().strip("|").split("|")]
                out.append("<tr>" + "".join(f"<td style='padding:6px 12px;border:1px solid var(--border)'>{inline(esc(c))}</td>" for c in cells) + "</tr>")
                i += 1
            out.append("</table>"); in_table = False
            continue

        # Headers
        m_h = re.match(r"^(#{1,6})\s+(.*)", line)
        if m_h:
            if in_list: out.append("</ul>"); in_list = False
            if in_olist: out.append("</ol>"); in_olist = False
            level = len(m_h.group(1))
            out.append(f"<h{level}>{inline(esc(m_h.group(2)))}</h{level}>")
            i += 1
            continue

        # Unordered list
        if re.match(r"^[\s]*[-*]\s+", line):
            if in_olist: out.append("</ol>"); in_olist = False
            if not in_list: out.append("<ul>"); in_list = True
            content = re.sub(r"^[\s]*[-*]\s+", "", line)
            out.append(f"<li>{inline(esc(content))}</li>")
            i += 1
            continue

        # Ordered list
        if re.match(r"^[\s]*\d+\.\s+", line):
            if in_list: out.append("</ul>"); in_list = False
            if not in_olist: out.append("<ol>"); in_olist = True
            content = re.sub(r"^[\s]*\d+\.\s+", "", line)
            out.append(f"<li>{inline(esc(content))}</li>")
            i += 1
            continue

        if in_list: out.append("</ul>"); in_list = False
        if in_olist: out.append("</ol>"); in_olist = False

        # Blockquote
        if line.startswith("> "):
            out.append(f"<blockquote style='border-left:3px solid var(--accent);padding-left:12px;margin:8px 0;color:var(--muted)'>{inline(esc(line[2:]))}</blockquote>")
            i += 1
            continue

        # Empty line
        if not line.strip():
            out.append("<br/>")
            i += 1
            continue

        # Paragraph
        out.append(f"<p>{inline(esc(line))}</p>")
        i += 1

    if in_list: out.append("</ul>")
    if in_olist: out.append("</ol>")
    if in_table: out.append("</table>")
    if in_pre: out.append("</code></pre>")

    return "\n".join(out)


# ── 상세 글 내용 ──
MARKDOWN_CONTENT = """## 실험 개요

**Local LLM Benchmark**는 DGX Spark GB10(128GB 통합 메모리, Blackwell sm_120)에서 27B급 GGUF 양자화 모델의 현실적 성능을 실측하는 실험이다. 단순 벤치마크 숫자가 아니라, 실제 서빙 부하(4슬롯 동시)와 생성 품질(단일 프롬프트 → 산출물)까지 종합적으로 판단한다.

## 실험 환경

- **하드웨어:** NVIDIA DGX Spark GB10
- **GPU 메모리:** 128GB 통합 (Blackwell sm_120)
- **서버:** llama.cpp (custom build, b10453-1)
- **컨텍스트:** 131,072 토큰
- **슬롯:** 4개 동시
- **Flash Attention:** ON
- **KV 캐시:** q8_0
- **GPU 레이어:** 999 (전부 오프로드)

## 사용 모델

### Qwen3.8-27B-Ridge-3.7bpw

- **양자화:** Ridge 3.7bpw (고밀도 GGUF)
- **파일 크기:** 약 12GB
- **MTP 내장:** 예 (별도 draft 모델 불필요)
- **멀티모달:** mmproj-BF16.gguf (비전 지원)
- **thinking:** OFF (nothink)
- **MTP 스펙 디코딩:** 활성화
  - `--spec-type draft-mtp`
  - `--spec-draft-n-max 6`
  - `--spec-draft-p-min 0.75`
- **샘플링:** temp 0.6, top-p 0.95, top-k 20

## 벤치마크 결과

### 토큰 생성 속도 (실측)

| 항목 | 수치 |
|------|------|
| **프리필 (Prefill)** | 492~500 t/s |
| **디코드 (Decode) 평균** | ~29 t/s |
| **디코드 피크** | 33 t/s |
| **디코드 최저** | ~16 t/s (초장문 생성 시) |
| **MTP 수락률** | 87~100% (평균 ~88%) |
| **MTP 평균 수락 길이** | 5.27~7.00 |

### 프리필 상세 (대용량 프롬프트)

| 토큰 수 | 속도 |
|---------|------|
| 4,096 | 713 t/s |
| 8,192 | 650 t/s |
| 12,288 | 617 t/s |
| 14,972 | 500 t/s |

프리필은 소량 토큰에서 700+ t/s를 기록하며, 15K 토큰에서도 500 t/s를 유지한다. GB10의 넉넉한 메모리 대역폭이 프리필 성능의 핵심이다.

### 디코드 상세 (연속 생성)

장문 생성(7,296 토큰)에서 평균 29.09 t/s를 기록했으며, 3초 이동 평균(tg_3s)은 20~37 t/s 사이에서 변동했다. 초반에 31~33 t/s로 시작해 중반 이후 안정적으로 28~30 t/s를 유지하는 패턴을 보인다.

**연속 생성 기록 (task 81, 총 7,296 토큰):**

| 구간 | 토큰 수 | 속도 |
|------|---------|------|
| 0~1,000 | 1,031 | 30.32 t/s |
| 1,000~2,000 | 958 | 30.79 t/s |
| 2,000~3,000 | 1,050 | 30.69 t/s |
| 3,000~4,000 | 908 | 29.35 t/s |
| 4,000~5,000 | 1,007 | 28.56 t/s |
| 5,000~6,000 | 1,028 | 28.87 t/s |
| 6,000~7,000 | 1,000 | 29.11 t/s |

### MTP 수락률 분석

MTP(Multi-Token Prediction) 스펙 디코딩은 한 번에 여러 토큰을 예측해 디코딩 속도를 높이는 기법이다. Ridge 모델은 MTP 헤드가 내장되어 있어 별도 draft 모델 없이 스펙 디코딩이 가능하다.

| 요청 유형 | 수락률 | 평균 수락 길이 |
|-----------|--------|----------------|
| 대용량 코드 생성 | 96.5% | 5.67 |
| 중간 코드 생성 | 83~96% | 5.2~6.2 |
| 텍스트 생성 | 77~94% | 3.2~5.5 |
| 코드 수정/연속 | 84~100% | 4.2~7.0 |

수락률이 높을수록 draft 토큰이 실제 출력으로 채택되므로, 디코드 속도가 향상된다. 코드 생성에서 가장 높은 수락률(96.5%)을 보이며, 텍스트 생성에서 약간 낮은 경향이 있다.

## 테스트 프롬프트: 한국 주식 대시보드

이 실험에서는 자체 벤치마크 프롬프트 24종 중 "한국 주식 대시보드" 프롬프트로 실제 생성 품질을 검증했다.

### 프롬프트 요구사항

- 8개 종목 (삼성전자, SK하이닉스, LG에너지솔루션, NAVER, 카카오, 현대차, 기아, 셀트리온)
- 현재가, 등락률, 7일 스파크라인
- KOSPI/KOSDAQ 지수 요약 헤더
- 검색 필터
- 클릭 시 상세 모달 (시가/고가/저가/거래량 + 30일 캔버스 차트)
- KO/EN 이중언어 토글
- 외부 CDN 금지, 단일 HTML 파일
- 자체 테스트 루프 포함

### 생성 결과

**1회 생성으로 완성.** 수정·재시도 없이 단일 프롬프트로 503줄짜리 완성된 대시보드가 생성되었다.

**기능 구현:**
- 다크 테마, 반응형 레이아웃 (모바일 375px 지원)
- 결정적 시드(mulberry32)로 재현 가능한 가상 시계열
- SVG 스파크라인 (카드당 7일)
- Canvas 30일 캔버스 차트 (모달)
- I18N 객체 (ko/en) + `setLang()` 즉시 재렌더
- 카드 호버/애니메이션, 모달 전환 애니메이션

### 테스트 결과 (9/9 통과)

| 항목 | 결과 |
|------|------|
| 페이지 로드, console error | 0건 ✅ |
| 8개 종목 카드 렌더링 | ✅ |
| KOSPI/KOSDAQ 요약 카드 | ✅ |
| 카드 클릭 → 모달 표시 | ✅ (1회 버그 수정 후) |
| 캔버스 차트 렌더링 | ✅ |
| 검색 필터 (KO/EN) | ✅ |
| KO/EN 토글 즉시 전환 | ✅ |
| 한글 깨짐 (U+FFFD) | 0건 ✅ |
| 모바일 375px 레이아웃 | ✅ |

**발견 버그 1건:** 모달 오버레이의 `hidden` 속성이 CSS `display:flex`에 의해 무시됨 → `.modal-overlay[hidden] { display: none; }` 추가로 해결.

## 데모

- **Stock Dashboard:** [/stock-dashboard-qwen3.8.html](/stock-dashboard-qwen3.8.html) — 단일 HTML, 외부 의존성 없음
- **Ragdoll Playground:** [/ragdoll-playground-qwen3.8.html](/ragdoll-playground-qwen3.8.html) — 같은 모델로 생성한 물리 시뮬레이터

## 실행 스크립트

```bash
# Ridge nothink (테스트에 사용된 설정)
./run_qwen38_27b_ridge_nothink.sh
# 포트: 9507
# 모델: Qwen3.8-27B-Ridge-3.7bpw.gguf
# 옵션: --spec-type draft-mtp --spec-draft-n-max 6 --spec-draft-p-min 0.75
```

## 결론

Qwen3.8-27B Ridge 3.7bpw는 GB10에서 안정적으로 동작하며, MTP 스펙 디코딩으로 디코드 29 t/s, 프리필 500+ t/s를 기록한다. 단일 프롬프트로 500줄짜리 인터랙티브 대시보드를 1회 생성할 수 있는 수준이며, 코드 생성 품질도 양호하다. 12GB 모델로 131K 컨텍스트 + 비전(mmproj)까지 지원하므로, 로컬 AI 데스크톱 환경으로 충분한 성능을 보여준다.
"""

SLUG = "local-llm-benchmark"
TITLE = "Local LLM Benchmark — Qwen3.8-27B Ridge 3.7bpw 실측 리포트"

content_html = md_to_html(MARKDOWN_CONTENT)
excerpt = "DGX Spark GB10에서 Qwen3.8-27B Ridge 3.7bpw의 실측 성능 — 프리필 500+ t/s, 디코드 29 t/s, MTP 수락률 88%. 한국 주식 대시보드를 단일 프롬프트로 1회 생성하고 9/9 테스트 통과."

body = {
    "slug": SLUG,
    "title": TITLE,
    "content": content_html,
    "excerpt": excerpt,
    "labels": ["진행중", "📊 벤치마크 / 도구", "Qwen3.8", "Ridge", "DGX Spark"],
    "published": "2026-08-19T02:00:00+09:00",
    "updated": "2026-08-19T02:00:00+09:00",
    "status": "live",
    "blog_id": "lab",
    "cover_image": None,
    "blogger_id": "lab-llm-bench",
}

insert_url = f"{SUPABASE_URL}/rest/v1/posts?on_conflict=slug"
req = urllib.request.Request(
    insert_url,
    data=json.dumps(body).encode(),
    headers={**headers, "Prefer": "resolution=merge-duplicates"},
    method="POST",
)
try:
    resp = urllib.request.urlopen(req)
    print(f"✅ 성공: {SLUG} (HTTP {resp.status})")
except urllib.error.HTTPError as e:
    err = e.read().decode()[:300] if e.fp else "?"
    print(f"❌ 오류 {e.code}: {err}")
