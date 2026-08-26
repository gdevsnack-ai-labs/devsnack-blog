#!/usr/bin/env python3
"""DevSnack 블로그 글 3개에 들어갈 Krea2 이미지 생성 (Krea_simple.json 워크플로우 기반)"""
import json, time, urllib.request, random, os, shutil

COMFYUI_URL = os.environ.get("COMFYUI_URL", "http://localhost:8188")
WORKFLOW_PATH = os.environ.get("KREA_WORKFLOW_PATH", "./workflows/Krea_simple.json")
OUTPUT_DIR = os.environ.get("BLOG_IMAGE_OUTPUT_DIR", "./public/images/blog")
COMFYUI_OUTPUT_DIR = os.environ.get("COMFYUI_OUTPUT_DIR", "./ComfyUI/output")
os.makedirs(OUTPUT_DIR, exist_ok=True)

# 기존 워크플로우 로드
with open(WORKFLOW_PATH) as f:
    base_workflow = json.load(f)

posts = [
    {
        "name": "gdrive-video-playback",
        "prompt": "A sleek modern laptop screen showing a video player interface with a play button overlay, connected to a glowing blue cloud storage icon representing Google Drive, digital connection lines between them, clean tech blog header style, dark blue gradient background, minimalist flat design, professional technology illustration, 4K quality, sharp details",
        "title": "구글 드라이브 영상 블로그 재생",
        "width": 1200, "height": 630,
    },
    {
        "name": "ai-blog-pipeline",
        "prompt": "An automated digital pipeline visualization showing data flowing from AI brain icon through code gears to a blog post with images, representing automated blog publishing workflow, tech infographic style, neon blue and purple accents on dark background, clean modern illustration, professional tech blog header, 4K quality, sharp details",
        "title": "AI 블로그 자동 발행 파이프라인",
        "width": 1200, "height": 630,
    },
    {
        "name": "qwen-mtp-vs-dflash",
        "prompt": "Two neural network architectures side by side comparison, left side showing sequential token prediction heads with arrows, right side showing parallel block diffusion with multiple tokens generated at once, GPU chip in center, performance speed visualization with glowing speed lines, tech comparison infographic, dark background with blue and orange accent colors, professional AI research illustration, 4K quality, sharp details",
        "title": "Qwen3.8 MTP vs DFlash2 비교",
        "width": 1200, "height": 630,
    },
]

def submit_and_wait(workflow, timeout=120):
    data = json.dumps({"prompt": workflow}).encode()
    req = urllib.request.Request(
        f"{COMFYUI_URL}/prompt",
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    resp = json.loads(urllib.request.urlopen(req, timeout=10).read())
    prompt_id = resp["prompt_id"]
    print(f"  제출됨: {prompt_id}")

    start = time.time()
    while time.time() - start < timeout:
        time.sleep(3)
        try:
            hist_req = urllib.request.Request(f"{COMFYUI_URL}/history/{prompt_id}")
            hist = json.loads(urllib.request.urlopen(hist_req, timeout=5).read())
            if prompt_id in hist:
                outputs = hist[prompt_id].get("outputs", {})
                for node_id, node_out in outputs.items():
                    if "images" in node_out:
                        for img in node_out["images"]:
                            return img["filename"], img.get("subfolder", "")
                    # PreviewImage도 확인
                    if not outputs:
                        status = hist[prompt_id].get("status", {})
                        if status.get("status_str") == "error":
                            print(f"  ❌ 에러: {status}")
                            return None, None
        except Exception:
            continue
    return None, None

print("Krea2 이미지 생성 시작 (Krea_simple 워크플로우)...\n")
results = []

for post in posts:
    print(f"[{post['name']}] {post['title']}")

    # 워크플로우 복사 후 수정
    wf = json.loads(json.dumps(base_workflow))
    wf["6"]["inputs"]["text"] = post["prompt"]  # 프롬프트
    wf["10"]["inputs"]["width"] = post["width"]  # 너비
    wf["10"]["inputs"]["height"] = post["height"]  # 높이
    wf["2"]["inputs"]["seed"] = random.randint(0, 2**32 - 1)  # 랜덤 시드

    filename, subfolder = submit_and_wait(wf)

    if filename:
        dst = f"{OUTPUT_DIR}/{post['name']}.png"
        output_base = COMFYUI_OUTPUT_DIR
        src_path = os.path.join(output_base, subfolder, filename) if subfolder else os.path.join(output_base, filename)

        if os.path.exists(src_path):
            shutil.copy2(src_path, dst)
            size_kb = os.path.getsize(dst) / 1024
            print(f"  ✅ 저장: {dst} ({size_kb:.0f}KB)")
            results.append({"name": post["name"], "file": dst, "title": post["title"]})
        else:
            print(f"  ❌ 파일 없음: {src_path}")
    else:
        print(f"  ❌ 생성 실패 (타임아웃)")

print(f"\n완료: {len(results)}/3개 생성됨")
for r in results:
    print(f"  {r['name']}: {r['file']}")
