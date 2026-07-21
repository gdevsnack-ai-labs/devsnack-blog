#!/usr/bin/env python3
"""
Blogger → Supabase 마이그레이션 스크립트
모든 LIVE 게시물을 Blogger API에서 가져와 Supabase posts 테이블에 insert합니다.
"""
import json
import re
import urllib.request
import urllib.parse
import urllib.error
import os
import sys
import time
from datetime import datetime, timedelta

# --- 설정 ---
BLOG_ID = "303801891860673316"
BLOG_LABEL = "stockpulse"
TOKEN_FILE = os.path.expanduser("~/content-factory/ai_blogs/ai-news-blogger/token.json")
SUPABASE_URL = "https://qbkfwnddxycixnqvfokq.supabase.co"
SUPABASE_SERVICE_KEY = ""
SUPABASE_ANON_KEY = ""
import os
_env_path = os.path.expanduser("~/workspace/vercel-blog/devsnack-blog/.env.local")
if os.path.exists(_env_path):
    with open(_env_path) as _f:
        for _line in _f:
            if "SERVICE_ROLE_KEY" in _line:
                SUPABASE_SERVICE_KEY = _line.split("=", 1)[1].strip()
            elif "NEXT_PUBLIC_SUPABASE_ANON_KEY" in _line:
                SUPABASE_ANON_KEY = _line.split("=", 1)[1].strip()
CLIENT_ID = os.environ.get("BLOGGER_CLIENT_ID", "")
CLIENT_SECRET = os.environ.get("BLOGGER_CLIENT_SECRET", "")

# --- OAuth: load or refresh token ---
def get_access_token():
    with open(TOKEN_FILE) as f:
        tok = json.load(f)

    expiry = datetime.fromisoformat(tok["expiry"].replace("Z", "+00:00"))
    if datetime.now().astimezone() >= expiry:
        print("🔄 Token expired, refreshing...")
        data = {
            "client_id": CLIENT_ID,
            "client_secret": CLIENT_SECRET,
            "refresh_token": tok["refresh_token"],
            "grant_type": "refresh_token",
        }
        req = urllib.request.Request(
            "https://oauth2.googleapis.com/token",
            data=urllib.parse.urlencode(data).encode(),
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        resp = json.loads(urllib.request.urlopen(req).read())
        tok["token"] = resp["access_token"]
        tok["expiry"] = (datetime.now().astimezone() + timedelta(seconds=resp.get("expires_in", 3600))).isoformat()
        with open(TOKEN_FILE, "w") as f:
            json.dump(tok, f, indent=2)
        print("✅ Token refreshed")
    return tok["token"]

# --- Blogger API: fetch all posts ---
def fetch_all_posts(access_token):
    posts = []
    page_token = None
    while True:
        url = f"https://www.googleapis.com/blogger/v3/blogs/{BLOG_ID}/posts?status=live&fetchImages=false&maxResults=100"
        if page_token:
            url += f"&pageToken={page_token}"
        req = urllib.request.Request(url, headers={"Authorization": f"Bearer {access_token}"})
        try:
            resp = json.loads(urllib.request.urlopen(req).read())
        except urllib.error.HTTPError as e:
            print(f"❌ API Error: {e.code} {e.read().decode()}")
            sys.exit(1)

        posts.extend(resp.get("items", []))
        page_token = resp.get("nextPageToken")
        if not page_token:
            break
        print(f"  → fetched {len(posts)} posts so far...")
        time.sleep(0.3)
    return posts

# --- Extract slug from Blogger URL ---
def extract_slug(url):
    # https://devsnack.blogspot.com/2026/04/xxx.html
    m = re.search(r"/\d{4}/\d{2}/(.+)\.html", url)
    if m:
        return m.group(1)
    # fallback: last path segment
    return url.rstrip("/").split("/")[-1].replace(".html", "")

# --- Extract SEO description from HTML comment ---
def extract_seo(content):
    m = re.search(r'<!-- SEO meta description:\s*(.+?)\s*-->', content)
    return m.group(1).strip() if m else None

# --- Insert into Supabase ---
def supabase_insert(post, access_token):
    slug = extract_slug(post["url"])
    seo_desc = extract_seo(post.get("content", ""))

    body = {
        "slug": slug,
        "title": post["title"],
        "content": post["content"],
        "excerpt": None,  # will be cleaned by clean_data.py
        "labels": post.get("labels", []),
        "published": post["published"],
        "status": "live",
        "seo_desc": seo_desc,
        "cover_image": None,
        "blogger_id": post["id"],
        "blog_id": BLOG_LABEL,
    }

    req = urllib.request.Request(
        f"{SUPABASE_URL}/rest/v1/posts",
        data=json.dumps(body).encode(),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
            "apikey": SUPABASE_ANON_KEY,
            "Prefer": "return=representation",
        },
        method="POST",
    )
    try:
        resp = json.loads(urllib.request.urlopen(req).read())
        print(f"  ✅ Inserted: {slug} — \"{post['title'][:50]}...\"")
        return resp
    except urllib.error.HTTPError as e:
        err = e.read().decode()
        if "duplicate key" in err.lower() or "unique constraint" in err.lower():
            print(f"  ⏭️  Skipped (duplicate): {slug}")
        else:
            print(f"  ❌ Error inserting {slug}: {e.code} {err}")
        return None

# --- Main ---
def main():
    print("=" * 60)
    print(f"Blogger → Supabase 마이그레이션")
    print(f"Blog ID: {BLOG_ID}")
    print(f"Supabase: {SUPABASE_URL}")
    print("=" * 60)

    # 1. Get access token
    print("\n1️⃣  Getting access token...")
    access_token = get_access_token()
    print("   ✅ Token OK")

    # 2. Fetch all posts from Blogger
    print("\n2️⃣  Fetching posts from Blogger...")
    posts = fetch_all_posts(access_token)
    print(f"   ✅ Total: {len(posts)} posts fetched")

    # 3. Insert into Supabase
    print(f"\n3️⃣  Inserting into Supabase...")
    success = 0
    skipped = 0
    failed = 0
    for post in posts:
        result = supabase_insert(post, access_token)
        if result:
            success += 1
        elif result is None:
            skipped += 1
        else:
            failed += 1
        time.sleep(0.2)

    print("\n" + "=" * 60)
    print(f"📊 결과:")
    print(f"   ✅ 성공: {success}")
    print(f"   ⏭️  중복 스킵: {skipped}")
    print(f"   ❌ 실패: {failed}")
    print(f"   📝 총 처리: {len(posts)}")
    print("=" * 60)

if __name__ == "__main__":
    main()
