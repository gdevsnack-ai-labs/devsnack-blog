#!/usr/bin/env python3
"""DevSnack 블로거에 Qwen3.8-27B MTP vs DFlash2 비교 글 드래프트 발행"""
import json, os, urllib.request
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request

TOKEN = os.environ.get("BLOGGER_TOKEN_PATH", "")
BLOG_ID = os.environ.get("BLOGGER_BLOG_ID", "")
if not TOKEN or not BLOG_ID:
    raise SystemExit("Set BLOGGER_TOKEN_PATH and BLOGGER_BLOG_ID before running.")

creds = Credentials.from_authorized_user_file(TOKEN, ["https://www.googleapis.com/auth/blogger"])
if not creds.valid:
    creds.refresh(Request())
    with open(TOKEN, "w") as f:
        f.write(creds.to_json())

# ── HTML 본문 ──
content = """
<style>
.post-body { font-family: 'Noto Sans KR', sans-serif; line-height: 1.8; color: #333; }
.post-body h2 { color: #1a1a2e; border-bottom: 2px solid #e94560; padding-bottom: 8px; margin-top: 32px; }
.post-body h3 { color: #16213e; margin-top: 24px; }
.post-body table { border-collapse: collapse; width: 100%; margin: 16px 0; }
.post-body th { background: #1a1a2e; color: #fff; padding: 10px 12px; text-align: left; }
.post-body td { padding: 8px 12px; border-bottom: 1px solid #ddd; }
.post-body tr:nth-child(even) { background: #f8f9fa; }
.post-body code { background: #f0f0f0; padding: 2px 6px; border-radius: 3px; font-size: 0.9em; }
.post-body .highlight { background: #fff3cd; padding: 12px 16px; border-left: 4px solid #ffc107; margin: 16px 0; border-radius: 4px; }
.post-body .verdict { background: #d4edda; padding: 12px 16px; border-left: 4px solid #28a745; margin: 16px 0; border-radius: 4px; }
</style>

<div class="post-body">

<h2>서론: 왜 추론 가속이 중요한가</h2>
<p>거대 언어 모델(LLM)을 실시간 서비스에 적용할 때 가장 큰 병목은 <strong>토큰을 하나씩 순차적으로 만드는 자동 순증가(Autoregressive) 디코딩</strong>이다. GPU 메모리 대역폭 제약 때문에 모델이 아무리 좋아도 디코딩 속도는 한계가 있다.</p>
<p>이 문제를 푸는 핵심 기술이 <strong>추측 디코딩(Speculative Decoding)</strong>이다. 가벼운 예비(Draft) 모델이 다가올 토큰을 미리 예측하면, 목표 모델이 한 번에 확인하여 디코딩 속도를 높인다.</p>
<p>Qwen3.8-27B는 이 방식을 두 가지로 지원한다:</p>
<ul>
<li><strong>내장 MTP (Multi-Token Prediction)</strong>: 모델 안에 보조 헤드가 내장되어 있어 별도 모델 없이 바로 사용</li>
<li><strong>DFlash 2</strong>: Inco AI가 만든 별도 예비 모델, 블록 전체를 한 번에 병렬로 만드는 블록 디퓨전 방식</li>
</ul>
<p>필자는 <strong>NVIDIA DGX Spark GB10</strong> 환경에서 Qwen3.8-27B의 MTP 성능을 직접 실측했으며, 이번 글에서 MTP vs DFlash 2의 아키텍처 차이, 공식 벤치마크, 그리고 로컬 실측 결과를 종합 분석한다.</p>

<h2>아키텍처 비교: MTP vs DFlash 2</h2>

<h3>내장 MTP — 모델 안의 보조 헤드</h3>
<p>MTP는 Qwen3.8-27B 백본의 히든 스테이트를 입력으로 받아 <strong>약 0.4B 파라미터의 가벼운 보조 헤드</strong>가 미래 토큰을 차례로 예측한다. 타겟 모델과 같은 메모리 안에 있어 별도의 VRAM 추가가 없지만, 예비 토큰을 만들 때 목표 모델 아래쪽 레이어 연산이 같이 일어난다.</p>

<h3>DFlash 2 — 블록 디퓨전 기반 병렬 드래프터</h3>
<p>DFlash 2는 <strong>약 2B 파라미터의 홀로 선 예비 모델</strong>이다. 핵심은 두 가지:</p>
<ul>
<li><strong>병렬 블록 생성</strong>: 블록 전체를 단일 패스로 한 번에 예측 (autoregressive 아님)</li>
<li><strong>Path Selector</strong>: 각 위치에서 상위 16개 후보를 남기고, 인접 쌍을 스코어링하여 가장 일관된 경로를 선택</li>
<li><strong>2탭 동적 합성곱</strong>: 블록 뒷부분의 품질 감퇴(Decay)를 방지하는 경량 모듈 (+16.5M 파라미터, +0.7% 지연)</li>
</ul>

<table>
<tr><th>비교 항목</th><th>내장 MTP</th><th>DFlash 2</th></tr>
<tr><td>파라미터</td><td>약 0.4B (보조 헤드)</td><td>약 2.0B (별도 모델)</td></tr>
<tr><td>추가 VRAM</td><td>없음</td><td>Q4: 약 1.1GB / BF16: 약 3.9GB</td></tr>
<tr><td>예측 방식</td><td>차례 다중 헤드</td><td>병렬 블록 + 후보 경로 선택</td></tr>
<tr><td>무손실 보장</td><td>O (수락-거절 검증)</td><td>O (수락-거절 검증)</td></tr>
<tr><td>엔진 지원</td><td>llama.cpp, Unsloth</td><td>SGLang, vLLM, llama.cpp (PR#27342), oMLX</td></tr>
</table>

<div class="highlight">
<strong>핵심:</strong> 두 방식 모두 최종 출력은 100% 동일하다 (무손실). 차이는 "얼마나 빨리 만드느냐"일 뿐, 출력 품질의 차이는 없다.
</div>

<h2>공식 벤치마크: NVIDIA H200 기준</h2>
<p>Inco AI가 SGLang + FlashAttention 3 환경에서 측정한 공식 데이터이다. 블록 크기 8 (7개 예비 토큰), Qwen3.8 공식 샘플링 설정 사용.</p>

<h3>수락 길이 (Acceptance Length)</h3>
<p>1회 확인 단계당 받아들여지는 평균 토큰 수. 높을수록 빠르다.</p>

<table>
<tr><th>벤치마크</th><th>MTP</th><th>DFlash 2</th><th>향상폭</th></tr>
<tr><td>GSM8K (수학 풀이)</td><td>5.02</td><td><strong>5.46</strong></td><td>+8.8%</td></tr>
<tr><td>MATH-500 (고급 수학)</td><td>4.72</td><td><strong>5.28</strong></td><td>+11.9%</td></tr>
<tr><td>HumanEval (코드 짓기)</td><td>3.91</td><td><strong>4.39</strong></td><td>+12.3%</td></tr>
<tr><td>MBPP (기초 코딩)</td><td>3.99</td><td><strong>4.79</strong></td><td>+20.1%</td></tr>
<tr><td>MT-Bench (대화)</td><td>3.74</td><td><strong>4.10</strong></td><td>+9.6%</td></tr>
</table>

<h3>처리량 (Concurrency 1, H200)</h3>

<table>
<tr><th>벤치마크</th><th>Autoregressive</th><th>MTP</th><th>DFlash 2</th></tr>
<tr><td>GSM8K</td><td>68.8 tok/s</td><td>178.5 (2.6x)</td><td><strong>236.1 (3.4x)</strong></td></tr>
<tr><td>MATH-500</td><td>68.8</td><td>172.8 (2.5x)</td><td><strong>230.7 (3.3x)</strong></td></tr>
<tr><td>HumanEval</td><td>69.0</td><td>151.9 (2.2x)</td><td><strong>214.6 (3.1x)</strong></td></tr>
<tr><td>MBPP</td><td>69.0</td><td>153.1 (2.2x)</td><td><strong>226.9 (3.3x)</strong></td></tr>
<tr><td>MT-Bench</td><td>68.9</td><td>134.9 (2.0x)</td><td><strong>184.0 (2.7x)</strong></td></tr>
</table>

<h3>고동시성(Concurrency 32) — MTP의 역전 현상</h3>
<p>가장 주목할 만한 결과는 <strong>동시 요청 32개 환경</strong>에서 나타나는 차이이다:</p>

<table>
<tr><th>벤치마크</th><th>MTP (vs AR)</th><th>DFlash 2 (vs AR)</th></tr>
<tr><td>GSM8K</td><td>1.04x</td><td><strong>1.45x</strong></td></tr>
<tr><td>MATH-500</td><td style="color:red">0.94x (역전!)</td><td><strong>1.30x</strong></td></tr>
<tr><td>HumanEval</td><td style="color:red">0.84x (역전!)</td><td><strong>1.16x</strong></td></tr>
<tr><td>MBPP</td><td style="color:red">0.87x (역전!)</td><td><strong>1.25x</strong></td></tr>
<tr><td>MT-Bench</td><td style="color:red">0.77x (역전!)</td><td><strong>1.01x</strong></td></tr>
</table>

<div class="highlight">
<strong>주의:</strong> MTP는 Concurrency 32에서 자동 순증가보다 오히려 느려지는 역전(Regression)이 발생한다. 타겟 모델 안의 보조 헤드가 배치마다 겹쳐 쌓이면서 오버헤드가 커지기 때문이다. DFlash 2는 독립된 패스에서 병렬로 만들므로 이 문제가 없다.
</div>

<h2>로컬 실측: NVIDIA DGX Spark GB10에서 MTP 직접 테스트</h2>
<p>공식 벤치마크는 H200 서버 환경이다. 필자는 <strong>NVIDIA DGX Spark GB10</strong>에서 Qwen3.8-27B의 두 가지 양자화 모델을 직접 구동하여 성능을 실측했다. 상세한 벤치마크 결과는 <a href="https://devsnack-blog.vercel.app/lab/local-llm-benchmark-report" target="_blank">로컬 LLM 벤치마크 실측 리포트</a>에서 확인할 수 있다.</p>

<h3>테스트 환경 (공통)</h3>
<table>
<tr><th>항목</th><th>사양</th></tr>
<tr><td>하드웨어</td><td>NVIDIA DGX Spark GB10 (Grace CPU + Blackwell GPU)</td></tr>
<tr><td>엔진</td><td>llama.cpp (최신 빌드)</td></tr>
<tr><td>MTP 설정</td><td><code>--spec-type draft-mtp --spec-draft-n-max 6 --spec-draft-p-min 0.75</code></td></tr>
<tr><td>컨텍스트</td><td>131,072 토큰</td></tr>
<tr><td>기타</td><td>Flash Attention, KV q8_0, mlock, reasoning OFF</td></tr>
</table>

<h3>모델 1: Qwen3.8-27B-NVFP4-MTP-HIGH (15.9GB)</h3>
<table>
<tr><th>항목</th><th>수치</th></tr>
<tr><td>프리필 (Prompt Processing)</td><td>680~930 tok/s</td></tr>
<tr><td>디코드 (Decode) 속도</td><td><strong>17~19.5 tok/s</strong> 지속</td></tr>
<tr><td>MTP 수락률</td><td><strong>93.1%</strong> (소스 기반 장문)</td></tr>
<tr><td>n-max 4 대비 디코드 향상</td><td>+50%</td></tr>
<tr><td>4슬롯 동시 부하 시</td><td>12.6~23.4 tok/s</td></tr>
<tr><td>초장문 생성 (8,287 토큰)</td><td>18.5 tok/s</td></tr>
<tr><td>메모리 사용량</td><td>약 16GB</td></tr>
</table>

<h3>모델 2: Qwen3.8-27B-Ridge-3.7bpw (12GB)</h3>
<table>
<tr><th>항목</th><th>수치</th></tr>
<tr><td>프리필 (Prefill)</td><td>492~500 tok/s</td></tr>
<tr><td>디코드 (Decode) 평균</td><td><strong>약 29 tok/s</strong></td></tr>
<tr><td>디코드 피크</td><td>33 tok/s</td></tr>
<tr><td>디코드 최저</td><td>약 16 tok/s (초장문 생성 시)</td></tr>
<tr><td>MTP 수락률</td><td><strong>87~100% (평균 약 88%)</strong></td></tr>
<tr><td>MTP 평균 수락 길이</td><td>5.27~7.00</td></tr>
<tr><td>프리필 상세</td><td>4K 토큰: 713 t/s, 8K: 650 t/s, 12K: 617 t/s, 15K: 500 t/s</td></tr>
<tr><td>메모리 사용량</td><td>약 12GB</td></tr>
</table>

<h3>두 모델 실측 비교</h3>
<table>
<tr><th>항목</th><th>NVFP4-MTP-HIGH (15.9GB)</th><th>Ridge 3.7bpw (12GB)</th></tr>
<tr><td>프리필</td><td><strong>680~930 t/s</strong></td><td>492~500 t/s</td></tr>
<tr><td>디코드 평균</td><td>17~19.5 t/s</td><td><strong>약 29 t/s</strong></td></tr>
<tr><td>디코드 피크</td><td>-</td><td><strong>33 t/s</strong></td></tr>
<tr><td>MTP 수락률</td><td><strong>93.1%</strong></td><td>약 88%</td></tr>
<tr><td>메모리</td><td>약 16GB</td><td><strong>약 12GB</strong></td></tr>
<tr><td>양자화</td><td>NVFP4 (NVIDIA 양자화)</td><td>Ridge 3.7bpw (고밀도)</td></tr>
</table>

<div class="verdict">
<strong>GB10 실측 결론:</strong> 흥미로운 결과가 나왔다. <strong>NVFP4-MTP-HIGH</strong>는 높은 수락률(93.1%)과 빠른 프리필(최대 930 t/s)이 장점이고, <strong>Ridge 3.7bpw</strong>는 메모리가 4GB 적게 들면서 디코드 속도가 약 29 t/s로 거의 1.5배 빠르다. 수락률은 낮지만(88%), 결과적으로 "한 번에 많은 토큰을 받아들이진 않지만 받은 것은 빠르게 만든다"는 패턴이다. 실사용에서는 Ridge의 디코드 속도가 체감 성능에서 유리할 수 있다.
</div>

<h3>MTP vs DFlash 2 — GB10에서는 어떤 걸 써야 하나</h3>
<p>GB10은 128GB 통합 메모리이지만, GPU 사용 가능 메모리에는 제약이 있다. 현재 상황을 정리하면:</p>

<table>
<tr><th>항목</th><th>MTP</th><th>DFlash 2 (Q4)</th></tr>
<tr><td>추가 메모리</td><td>0 GB</td><td>+약 1.1 GB</td></tr>
<tr><td>설정 난이도</td><td>간단 (기본 활성화)</td><td>별도 모델 다운로드 + 엔진 설정</td></tr>
<tr><td>llama.cpp 지원</td><td>이미 지원</td><td>PR#27342 merge 대기</td></tr>
<tr><td>GB10 실측 속도</td><td>17~19.5 tok/s</td><td>미실측 (추후 테스트 예정)</td></tr>
<tr><td>서버 벤치 (H200)</td><td>135~179 tok/s</td><td>184~236 tok/s</td></tr>
</table>

<div class="verdict">
<strong>GB10 적용 판단:</strong> 현재는 MTP가 가장 실용적인 선택이다. llama.cpp에서 바로 사용 가능하고, 추가 모델 없이 93.1% 수락률을 보여주기 때문이다. DFlash 2는 llama.cpp PR#27342가 merge된 후 GB10에서 직접 비교 테스트할 예정이다.
</div>

<h2>다음 단계: DFlash 2 로컬 비교 테스트 계획</h2>
<p>이번 분석의 자연스러운 다음 단계는 <strong>GB10 환경에서 MTP와 DFlash 2를 직접 비교</strong>하는 것이다.</p>
<ul>
<li><strong>llama.cpp PR#27342 merge 대기 중</strong>: DFlash 2의 <code>--spec-type draft-dflash</code> 지원이 필요</li>
<li><strong>테스트 항목</strong>: 같은 프롬프트 세트로 MTP vs DFlash 2 비교 (프리필 속도, 디코드 속도, 수락률, 메모리 사용량)</li>
<li><strong>도메인별 비교</strong>: 코드 생성 / 수학 풀이 / 일반 대화 / 장문 요약 4개 도메인</li>
<li><strong>동시성 테스트</strong>: GB10에서 MTP의 고동시성 역전 현상이 재현되는지 확인</li>
</ul>

<h2>환경별 선택 가이드</h2>
<table>
<tr><th>환경</th><th>권장</th><th>이유</th></tr>
<tr><td>단일 GPU 24GB (RTX 4090/5090)</td><td>MTP</td><td>VRAM 절약, 설정 간단, 장문 컨텍스트 확보</td></tr>
<tr><td>엔터프라이즈 서버 (H100/H200)</td><td>DFlash 2</td><td>고동시성에서도 성능 역전 없음</td></tr>
<tr><td>코드 생성 파이프라인 (IDE/에이전트)</td><td>DFlash 2</td><td>구조적 예측 가능성으로 수락률 극대화</td></tr>
<tr><td>DGX Spark GB10 (로컬)</td><td>MTP (현재) / DFlash 2 (추후 비교)</td><td>MTP는 이미 실측 완료, DFlash 2는 llama.cpp 지원 후 비교 예정</td></tr>
</table>

<h2>참고 자료</h2>
<ul>
<li><a href="https://huggingface.co/incoai/Qwen3.8-27B-DFlash2" target="_blank">DFlash 2 모델 (HuggingFace)</a></li>
<li><a href="https://inco.ai/blog/dflash2/" target="_blank">DFlash 2 블로그 포스트 (Inco AI)</a></li>
<li><a href="https://arxiv.org/abs/2602.06036" target="_blank">DFlash 논문 (ICML 2026)</a></li>
<li><a href="https://github.com/QwenLM/Qwen3.8" target="_blank">Qwen3.8 GitHub</a></li>
<li><a href="https://huggingface.co/Qwen/Qwen3.8-27B" target="_blank">Qwen3.8-27B 모델카드</a></li>
<li><a href="https://devsnack-blog.vercel.app/lab/local-llm-benchmark-report" target="_blank">GB10 로컬 LLM 벤치마크 실측 리포트</a></li>
<li><a href="https://devsnack-blog.vercel.app/research/dflash-2-qwen3-8-27b-vs-mtp" target="_blank">상세 조사 리서치 (DevSnack)</a></li>
</ul>

</div>
"""

# ── Blogger API로 드래프트 발행 (isDraft=true) ──
body = json.dumps({
    "kind": "blogger#post",
    "blog": {"id": BLOG_ID},
    "title": "Qwen3.8-27B 추론 가속 비교: 내장 MTP vs DFlash 2 — GB10 로컬 실측 포함",
    "content": content,
    "labels": ["Qwen3.8", "MTP", "DFlash2", "추론가속", "SpeculativeDecoding", "DGXSpark", "LLM"],
}).encode()

req = urllib.request.Request(
    f"https://www.googleapis.com/blogger/v3/blogs/{BLOG_ID}/posts?isDraft=true",
    data=body,
    headers={
        "Content-Type": "application/json",
        "Authorization": f"Bearer {creds.token}",
    },
    method="POST",
)

with urllib.request.urlopen(req, timeout=30) as resp:
    result = json.loads(resp.read())
    print(f"✅ 드래프트 발행 완료!")
    print(f"   제목: {result['title']}")
    print(f"   ID: {result['id']}")
    print(f"   URL: {result['url']}")
    print(f"   상태: {result.get('status', 'DRAFT (확인 필요)')}")
