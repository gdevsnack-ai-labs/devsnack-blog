#!/usr/bin/env python3
"""Publish the YuE2-3B autumn chanson Knowledge article.

Default mode is read-only. Use --apply for the explicitly requested Supabase
upsert. Credentials are loaded from the ignored .env.local file and never
printed.
"""
from __future__ import annotations

import argparse
import json
import os
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ENV_FILE = Path(__file__).resolve().parents[1] / ".env.local"
SLUG = "yue2-3b-symbolic-music-generation-autumn-chanson"
TITLE = "YuE2-3B — 악보를 먼저 쓰는 음악 생성 모델을 DGX Spark에서 실행해봤다"
DEFAULT_AUDIO_URL = "/api/drive?id=1ksT9J3vCiqQUqw6upVqlmIZfnGXsESxf"
COVER_IMAGE = "/images/showcase/yue2-autumn-chanson-cover.webp"
LABELS = ["적용완료", "YuE2", "음악 생성", "악보 생성", "DGX Spark", "ACE-Step", "로컬 AI", "media"]
EXCERPT = (
    "YuE2-3B는 가사와 스타일에서 바로 오디오만 뽑는 대신, 먼저 멜로디와 코드 악보를 계획하고 "
    "그 악보를 바탕으로 보컬과 반주를 렌더링한다. ACE-Step과 무엇이 다른지 궁금해 DGX Spark GB10에서 직접 실행했다."
)
SEO_DESC = (
    "YuE2-3B를 DGX Spark GB10에서 직접 실행한 기록. ABC 악보 계획, cot=full, YuE2-Vae, "
    "ACE-Step 1.5와의 차이, 가을 여성 샹송 생성 결과와 전체 가사를 정리한다."
)

STYLE = (
    "Autumn Korean chanson, intimate female lead vocal, warm smoky alto with delicate breath and "
    "controlled vibrato; 86 BPM, D minor verses opening into an F major chorus; target a concise "
    "two-minute-thirty-second to two-minute-fifty-second song. Parisian cafe atmosphere, felt piano, "
    "accordion, upright bass, brushed jazz drums, muted violin, subtle guitar harmonics, analog tape "
    "warmth, close-miked vocal. Start sparse and conversational, bloom gently in the chorus, let the "
    "bridge lift with restrained strings, then make the final chorus emotional but elegant and unforced. "
    "End with only piano and accordion fading into room tone. No EDM, no trap, no rap, no heavy drums, "
    "no male vocals, no choir."
)

LYRICS = """[Intro]
가을은 천천히, 창가에 내려앉고

[Verse 1]
오늘도 네 이름을 접어
코트 안쪽 주머니에 넣었어
붉어진 거리 모퉁이마다
우리의 계절이 잠들어 있어

[Pre-Chorus]
바람이 불면 네가 올까 봐
문을 조금 열어 둔 채로

[Chorus]
은행잎 한 장, 편지처럼 날아와
말하지 못한 안녕을 내 손에 건네네
사랑은 가고, 향기만 남아서
오늘도 네 쪽으로 가을이 기울어

[Verse 2]
카페의 불빛은 낮게 흔들리고
네가 웃던 그 짧은 순간은
이 밤보다 오래 따뜻해

[Chorus]
은행잎 한 장, 편지처럼 날아와
끝내 쓰지 못한 사랑을 내 어깨에 내려
시간은 멀리, 계절은 다시 와도
나는 그날의 빛을 천천히 간직할게

[Bridge]
혹시 우연히 이 노래를 듣는다면
작은 온기 하나, 가을 끝에 빛날 테니

[Final Chorus]
은행잎 한 장, 마지막 인사처럼
눈물 대신 노을빛으로 내 마음을 물들이네
사랑은 가고, 노래만 남아서
오늘도 네 이름을 가만히 불러

[Outro]
내 편지는 바람 속에 잠드네"""


def load_env() -> dict[str, str]:
    values: dict[str, str] = {}
    for raw in ENV_FILE.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if line and not line.startswith("#") and "=" in line:
            key, value = line.split("=", 1)
            values[key.strip()] = value.strip().strip('"').strip("'")
    return values


def request_json(url: str, *, method: str = "GET", payload: object | None = None) -> object:
    env = load_env()
    base = (env.get("SUPABASE_URL") or env.get("NEXT_PUBLIC_SUPABASE_URL", "")).rstrip("/")
    key = env.get("SUPABASE_SERVICE_ROLE_KEY", "")
    if not base or not key:
        raise RuntimeError("Supabase configuration is missing from the ignored .env.local file")
    headers = {"apikey": key, "Authorization": f"Bearer {key}", "Accept": "application/json"}
    data = None
    if payload is not None:
        headers["Content-Type"] = "application/json"
        data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(f"{base}/rest/v1/{url}", data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as response:
            raw = response.read().decode("utf-8")
            return json.loads(raw) if raw else None
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")[:500]
        raise RuntimeError(f"Supabase {method} failed with HTTP {exc.code}: {detail}") from exc


def build_content(audio_url: str) -> str:
    return f"""## 새로운 음악 모델이 나왔다

요즘 음악 생성 모델을 찾아보다가 `m-a-p/YuE2-3B`를 봤다. 이름만 보면 또 하나의 텍스트·가사 기반 음악 생성 모델처럼 보이지만, YuE2는 중간에 **악보를 먼저 생성한다**는 점이 다르다.

가사와 스타일을 넣으면 곧바로 오디오를 뽑는 대신, 먼저 멜로디와 코드를 담은 ABC 악보 계획을 만든다. 그 계획을 사람이 읽고, 직접 고치거나, 에이전트에게 수정시키고, 다시 곡으로 렌더링할 수 있다.

[YuE2-3B 모델 카드](https://huggingface.co/m-a-p/YuE2-3B)와 [공식 YuE 저장소](https://github.com/multimodal-art-projection/YuE)를 보고, 기존에 사용하던 [ACE-Step 1.5](https://github.com/ace-step/ACE-Step-1.5)와 실제 사용감이 어떻게 다른지 궁금해져 설치와 첫 실행을 해봤다.

> 이번 기록은 악보를 직접 편집한 결과가 아니라, YuE2의 기본 `cot=full` 경로로 만든 첫 실행이다.

## YuE2는 무엇이 다른가

YuE2의 공식 설명은 **Compose in symbols. Create in sound.**다. 한 개의 AR–NAR Mixture-of-Transformers 백본이 먼저 악보와 semantic music token을 만들고, flow matching으로 acoustic latent를 생성한 뒤 VAE가 48kHz 스테레오 오디오로 디코드한다.

| 구분 | ACE-Step 1.5 | YuE2-3B |
|---|---|---|
| 일반적인 생성 흐름 | 프롬프트·가사 → LM/DiT → 오디오 | 가사·스타일 → 멜로디·코드 악보 → semantic token → 오디오 |
| 중간 표현 | 보통 생성 요청과 latent 중심 | 사람이 읽고 수정할 수 있는 ABC 악보·score |
| 편집 방향 | text2music, cover, repaint 등 입력 조건을 바꿔 재생성 | `plan()`으로 계획을 저장하고 `score.abc`를 편집한 뒤 재렌더링 |
| 커버 경로 | 오디오 reference 기반 cover/repaint | SheetSage2 등으로 얻은 melody ABC를 넣고 `cot="melody"` 사용 |
| 이번 테스트 | 기존 배경음악 생성 파이프라인에서 사용 | `cot="full"` 기본 작곡 경로를 실행 |

ACE-Step도 cover·repaint·melody 관련 기능을 갖고 있지만, 우리가 평소 사용한 `text2music` 흐름에서는 악보가 첫 번째 공개 편집 대상으로 나오지 않았다. YuE2는 그 작곡 계획을 결과물의 일부로 남긴다는 점이 가장 재미있다.

## 모델 카드에서 확인한 정보

- 모델: `m-a-p/YuE2-3B`
- 파라미터: Hugging Face 모델 카드의 Model size 표기는 4B params이며, 저장소·모델명은 `YuE2-3B`로 제공된다.
- 가중치: BF16 safetensors
- 기본 VAE: [`m-a-p/YuE2-Vae`](https://huggingface.co/m-a-p/YuE2-Vae)
- 공식 quick start 기준: Linux, Python 3.10 이상, BF16을 지원하는 NVIDIA GPU, 24GB GPU 메모리와 24GB 수준의 호스트 RAM
- 출력: 48kHz 스테레오, 별도 양자화 없이 실행
- 생성 모드: `cot="full"`은 멜로디·코드 계획, `cot="melody"`는 멜로디 중심 계획, `cot="off"`는 symbolic plan 없이 직접 생성
- 모델 카드가 명시한 가중치 라이선스: **CC BY-NC 4.0**. 저장소의 코드 라이선스와 모델 가중치 라이선스는 별도로 확인해야 한다.

공식 모델 카드의 WildSongBench 표에서는 YuE2가 오픈 모델 가운데 높은 SongBench 점수를 기록했고, best-of-8 설정은 여러 후보 중 좋은 결과를 고르는 방식이다. 이번 실행은 best-of-8 비교가 아니라 한 개의 seed를 사용한 단일 실행이므로, 그 벤치마크 수치를 우리 곡의 품질로 해석하지 않았다.

## DGX Spark GB10에서 실행한 환경

- 하드웨어: NVIDIA DGX Spark GB10, 128GB unified memory
- GPU 실행: CUDA 사용
- Python: 3.11.15
- 추론 패키지: `yue2-infer==0.1.5`
- PyTorch: `2.10.0+cu130`
- Transformers: `4.57.6`
- Hugging Face Hub: `0.36.2`
- 모델: YuE2-3B + YuE2-Vae 로컬 파일
- 실제 호출: `device="cuda"`, `local_files_only=True`
- 생성 모드: `cot="full"`
- seed: `20260918`
- 실제 결과: ABC 계획 1,687 tokens, semantic 4,363 tokens, truncation 없음

공식 예시는 모델 ID를 직접 넣어 처음 사용할 때 Hugging Face에서 받는 방식이다. 우리는 실행 재현성을 위해 모델 본체와 VAE를 미리 내려받고, 로컬 파일만 읽도록 실행했다.

## 실제 실행 옵션

핵심 호출은 다음과 같은 형태다.

```python
from yue2 import YuE2Pipeline

pipe = YuE2Pipeline.from_pretrained(
    "m-a-p/YuE2-3B",
    vae="m-a-p/YuE2-Vae",
    device="cuda",
    local_files_only=True,
)

song = pipe(
    style=style,
    lyrics=lyrics,
    cot="full",
    seed=20260918,
)
song.save("letter-of-falling-leaves.flac")
song.save_artifacts("artifacts/letter-of-falling-leaves")
pipe.close()
```

`save_artifacts()`를 호출하면 오디오만 남는 것이 아니라 `score.abc`, 계획 JSON, semantic tokens, latent, request와 결과 메타데이터가 함께 남는다. 이 점이 ACE-Step의 일반적인 한 번짜리 오디오 생성과 비교했을 때 YuE2를 다시 만져보고 싶게 만드는 부분이다.

## 만든 곡: 은행잎 편지

[🎵 Music Showcase에서 원본·편집본 비교하기](/demos/music)

- 장르: 가을 여성 샹송 / 재즈 카페 발라드
- 보컬: 가까이 속삭이는 듯한 따뜻한 여성 알토
- 편성: 펠트 피아노, 아코디언, 콘트라베이스, 브러시 드럼, 절제된 바이올린
- 목표 길이: 2분 30초~2분 50초
- 최종 길이: **174.48초, 약 2분 54.5초**
- 오디오: 48kHz 스테레오 FLAC 원본, 320kbps MP3 전달본

처음부터 가사를 길게 쓰면 곡도 3분을 넘어가기 쉬웠다. 첫 번째 생성은 217초, 두 번째는 190초까지 나왔고, 가사 섹션을 압축한 세 번째 실행에서 174.48초가 됐다. YuE2에서는 가사 구조가 곡 길이와 전개에 직접 영향을 주므로, 원하는 길이가 있으면 프롬프트보다 가사 구조를 먼저 조절하는 편이 실용적이었다.

## 가사

```text
[Intro]
가을은 천천히, 창가에 내려앉고

[Verse 1]
오늘도 네 이름을 접어
코트 안쪽 주머니에 넣었어
붉어진 거리 모퉁이마다
우리의 계절이 잠들어 있어

[Pre-Chorus]
바람이 불면 네가 올까 봐
문을 조금 열어 둔 채로

[Chorus]
은행잎 한 장, 편지처럼 날아와
말하지 못한 안녕을 내 손에 건네네
사랑은 가고, 향기만 남아서
오늘도 네 쪽으로 가을이 기울어

[Verse 2]
카페의 불빛은 낮게 흔들리고
네가 웃던 그 짧은 순간은
이 밤보다 오래 따뜻해

[Chorus]
은행잎 한 장, 편지처럼 날아와
끝내 쓰지 못한 사랑을 내 어깨에 내려
시간은 멀리, 계절은 다시 와도
나는 그날의 빛을 천천히 간직할게

[Bridge]
혹시 우연히 이 노래를 듣는다면
작은 온기 하나, 가을 끝에 빛날 테니

[Final Chorus]
은행잎 한 장, 마지막 인사처럼
눈물 대신 노을빛으로 내 마음을 물들이네
사랑은 가고, 노래만 남아서
오늘도 네 이름을 가만히 불러

[Outro]
내 편지는 바람 속에 잠드네
```

## 첫 음악 품질은 어땠나

악보를 직접 편집하지 않은 기본 첫 실행인데도 보컬과 반주가 분리된 데모가 아니라, 시작과 후렴의 밀도가 있는 한 곡으로 나왔다. 가을 샹송이라는 스타일 지시도 크게 벗어나지 않았다.

첫 결과를 최종 음반처럼 평가할 단계는 아니다. 하지만 “악보를 먼저 만들고 그 결과를 소리로 옮긴다”는 구조를 확인하는 첫 샘플로는 괜찮았다. 특히 생성 후 `score.abc`가 남기 때문에 다음에는 코드를 바꾸거나 브리지의 멜로디를 수정한 뒤 다시 들어볼 수 있다.

## 실제 악보 편집 실험 — 같은 seed로 Final Chorus 교체

첫 번째 생성 결과에서 Final Chorus 마지막 4마디만 직접 수정하고, 같은 가사·스타일·seed `20260918`을 유지한 채 다시 렌더링했다. 화성 `Cm7 → F7 → Bb`는 유지하고, 마지막 멜로디를 상승시켜 `c'`까지 올라간 뒤 내려오도록 바꿨다.

실행 옵션은 다음과 같았다.

```python
song = pipe(
    style=style,
    lyrics=lyrics,
    abc=edited_score,
    cot="full",
    seed=20260918,
)
```

YuE2 로그에는 `Using provided score`가 기록됐고, ABC 계획 생성 시간은 0초(`external_prefix_tokens=1691`)였다. 새 악보를 다시 샘플링한 것이 아니라, 수정한 ABC 악보를 고정하고 오디오만 다시 렌더링한 셈이다.

- 원본 길이: 174.48초
- 수정본 길이: 174.72초
- 길이 차이: 약 0.24초
- 수정본 truncation: 없음
- 수정본 semantic tokens: 4,369

원본과 수정본의 중간 구간을 이어서 비교해 들어보니, 전체 샹송 분위기는 거의 그대로 유지되면서 Final Chorus가 더 올라와서 수정본 쪽이 더 좋았다. 이 실험으로 YuE2에서는 **같은 seed + 수정 ABC** 조합으로 기존 곡의 정체성을 유지하면서 특정 구간을 편집할 수 있다는 점을 확인했다. 단, 오디오 전체를 다시 렌더링하므로 byte-perfect하게 동일한 것은 아니다. 두 버전은 위 Music Showcase에서 직접 비교할 수 있다.

## 아직 해보지 않은 것

이번에는 다음 단계까지 가지 않았다.

- `cot="melody"`로 기존 멜로디를 유지한 커버 만들기
- best-of-8 후보 생성과 자동 선택 비교
- ACE-Step과 같은 가사·스타일을 넣은 정면 품질 비교
- 브리지 화성이나 2절 멜로디까지 함께 수정하는 편집

따라서 이 글은 YuE2의 모든 편집 기능을 검증한 것은 아니지만, 기본 생성과 **부분 악보 수정 후 재렌더링**까지 확인한 실행 기록이다.

## 정리

ACE-Step이 현재 우리 파이프라인에서 빠르게 프롬프트와 가사를 오디오로 바꾸는 실용적인 생성기라면, YuE2는 작곡 과정을 중간 악보로 끌어내린다. 당장 한 곡을 뽑는 속도만 보면 추가 단계처럼 보이지만, 멜로디와 코드에 손을 대고 다시 만들 수 있다는 점에서 접근 방식 자체가 다르다.

이번에는 Final Chorus의 일부 악보를 실제로 수정했고, 같은 seed로 전체 분위기를 유지하면서 후렴의 상승감을 개선했다. 다음 실험에서는 브리지 화성이나 2절 멜로디까지 범위를 넓히고, `cot="melody"` 커버와 ACE-Step 정면 비교를 진행할 예정이다.

## 출처

- [YuE2-3B — Hugging Face](https://huggingface.co/m-a-p/YuE2-3B)
- [YuE2-Vae — Hugging Face](https://huggingface.co/m-a-p/YuE2-Vae)
- [YuE2 공식 GitHub](https://github.com/multimodal-art-projection/YuE)
- [ACE-Step 1.5 공식 GitHub](https://github.com/ace-step/ACE-Step-1.5)
"""


def build_payload(audio_url: str, timestamp: str, published_at: str | None = None) -> dict[str, object]:
    return {
        "slug": SLUG,
        "title": TITLE,
        "content": build_content(audio_url),
        "excerpt": EXCERPT,
        "labels": LABELS,
        "published": published_at or timestamp,
        "updated": timestamp,
        "status": "live",
        "lifecycle_status": "live",
        "blog_id": "research",
        "cover_image": COVER_IMAGE,
        "seo_desc": SEO_DESC,
        "blogger_id": "research-yue2-autumn-chanson",
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true", help="upsert and read back the live row")
    parser.add_argument("--audio-url", default=os.environ.get("YUE2_AUDIO_URL", DEFAULT_AUDIO_URL))
    args = parser.parse_args()
    timestamp = datetime.now(timezone.utc).isoformat(timespec="seconds")
    query = urllib.parse.urlencode({"select": "id,slug,title,published,updated,status,lifecycle_status,blog_id,cover_image", "slug": f"eq.{SLUG}"})
    existing = request_json(f"posts?{query}")
    existing_rows = existing if isinstance(existing, list) else []
    existing_published = existing_rows[0].get("published") if existing_rows and isinstance(existing_rows[0], dict) else None
    payload = build_payload(args.audio_url, timestamp, existing_published)
    print(json.dumps({"mode": "apply" if args.apply else "dry-run", "slug": SLUG, "existing_rows": len(existing_rows), "published_preserved": existing_published, "content_chars": len(str(payload["content"])), "audio_url": args.audio_url}, ensure_ascii=False))
    if not args.apply:
        return
    env = load_env()
    base = (env.get("SUPABASE_URL") or env.get("NEXT_PUBLIC_SUPABASE_URL", "")).rstrip("/")
    key = env.get("SUPABASE_SERVICE_ROLE_KEY", "")
    headers = {"apikey": key, "Authorization": f"Bearer {key}", "Content-Type": "application/json", "Prefer": "resolution=merge-duplicates,return=representation"}
    url = f"{base}/rest/v1/posts?on_conflict=slug"
    req = urllib.request.Request(url, data=json.dumps(payload, ensure_ascii=False).encode("utf-8"), headers=headers, method="POST")
    with urllib.request.urlopen(req) as response:
        response.read()
    after = request_json(f"posts?{query}")
    if not isinstance(after, list) or len(after) != 1 or after[0].get("slug") != SLUG:
        raise RuntimeError("post read-back did not return exactly the published YuE2 row")
    print(json.dumps({"read_back": after[0]}, ensure_ascii=False))


if __name__ == "__main__":
    main()
