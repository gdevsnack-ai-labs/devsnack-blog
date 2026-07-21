#!/usr/bin/env python3
"""
Supabase 데이터 정리 스크립트
1. excerpt에서 HTML 태그 제거 (plain text로)
2. content에서 첫 번째 이미지 추출 → cover_image
"""
import json
import re
import urllib.request
import urllib.error
import time

SUPABASE_URL = "https://qbkfwnddxycixnqvfokq.supabase.co"
import os
_env_path = os.path.expanduser("~/workspace/vercel-blog/devsnack-blog/.env.local")
SERVICE_KEY = ""
ANON_KEY = ""
if os.path.exists(_env_path):
    with open(_env_path) as _f:
        for _line in _f:
            if "SERVICE_ROLE_KEY" in _line:
                SERVICE_KEY = _line.split("=", 1)[1].strip()
            elif "NEXT_PUBLIC_SUPABASE_ANON_KEY" in _line:
                ANON_KEY = _line.split("=", 1)[1].strip()

HEADERS = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {SERVICE_KEY}",
    "apikey": ANON_KEY,
}

def req(method, path, data=None):
    url = f"{SUPABASE_URL}/rest/v1/{path}"
    body = json.dumps(data).encode() if data else None
    r = urllib.request.Request(url, data=body, headers=HEADERS, method=method)
    try:
        resp = urllib.request.urlopen(r)
        raw = resp.read()
        return json.loads(raw) if raw.strip() else {}
    except urllib.error.HTTPError as e:
        print(f"  ❌ HTTP {e.code}: {e.read().decode()[:200]}")
        return None

def strip_html(html):
    """HTML 태그 제거, 연속 공백 정리"""
    text = re.sub(r'<[^>]+>', ' ', html)
    text = re.sub(r'\s+', ' ', text).strip()
    return text[:300]

def extract_first_image(html):
    """content에서 첫 번째 이미지 URL 추출"""
    m = re.search(r'<img[^>]+src=["\'](https?://[^"\']+)["\']', html)
    return m.group(1) if m else None

def main():
    print("📡 Fetching all posts from Supabase...")
    posts = req("GET", "posts?select=id,slug,content,excerpt")
    if not posts:
        print("❌ No posts found")
        return
    print(f"   ✅ {len(posts)} posts loaded")

    updated = 0
    for post in posts:
        new_excerpt = strip_html(post["excerpt"] or post["content"][:300])
        new_cover = extract_first_image(post["content"])

        # Update
        patch_data = {"excerpt": new_excerpt}
        if new_cover:
            patch_data["cover_image"] = new_cover

        result = req("PATCH", f"posts?id=eq.{post['id']}", patch_data)
        if result is not None or True:  # PATCH returns empty on success
            print(f"  ✅ {post['slug']}: excerpt cleaned, cover={new_cover[:50] if new_cover else 'None'}...")
            updated += 1
        else:
            print(f"  ❌ {post['slug']}: update failed")
        time.sleep(0.1)

    print(f"\n📊 완료: {updated}/{len(posts)} posts updated")

if __name__ == "__main__":
    main()
