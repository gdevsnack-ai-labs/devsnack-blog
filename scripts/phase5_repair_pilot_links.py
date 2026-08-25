#!/usr/bin/env python3
"""Repair only the Phase 4 pilot links with verified Vercel equivalents."""
from __future__ import annotations

import hashlib
import json
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ENV_FILE = ROOT / ".env.local"
BASE = "https://qbkfwnddxycixnqvfokq.supabase.co/rest/v1"
POST_ID = 1
REPLACEMENTS = {
    "https://aitech-kahros.blogspot.com/": "/aitech",
    "https://devsnack.blogspot.com/2026/07/when-ai-got-borders.html": "/devsnack/when-ai-got-borders",
}


def load_env() -> dict[str, str]:
    values: dict[str, str] = {}
    for raw in ENV_FILE.read_text().splitlines():
        if "=" not in raw or raw.lstrip().startswith("#"):
            continue
        key, value = raw.split("=", 1)
        values[key.strip()] = value.strip().strip('"').strip("'")
    return values


def request(path: str, key: str, method: str = "GET", payload: object | None = None):
    body = None if payload is None else json.dumps(payload, ensure_ascii=False).encode()
    req = urllib.request.Request(
        f"{BASE}/{path}",
        data=body,
        method=method,
        headers={
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation",
        },
    )
    with urllib.request.urlopen(req, timeout=45) as response:
        raw = response.read()
        return json.loads(raw) if raw else []


def source_hash(source: dict) -> str:
    canonical = {
        "title": source.get("title"),
        "content": source.get("content"),
        "excerpt": source.get("excerpt"),
        "seo_desc": source.get("seo_desc"),
        "labels": source.get("labels"),
    }
    encoded = json.dumps(canonical, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode()
    return "sha256:" + hashlib.sha256(encoded).hexdigest()


def main() -> None:
    key = load_env()["SUPABASE_SERVICE_ROLE_KEY"]
    source = request(f"posts?select=id,title,content,excerpt,seo_desc,labels&id=eq.{POST_ID}", key)[0]
    translation = request(f"post_translations?select=id,content,source_content_hash&post_id=eq.{POST_ID}&locale=eq.en", key)[0]
    changed = 0
    source_content = source["content"] or ""
    translation_content = translation["content"] or ""
    for old, new in REPLACEMENTS.items():
        source_count = source_content.count(old)
        translation_count = translation_content.count(old)
        if source_count != 1 or translation_count != 1:
            raise SystemExit(f"Expected one occurrence in source/translation for {old}: {source_count}/{translation_count}")
        source_content = source_content.replace(old, new)
        translation_content = translation_content.replace(old, new)
        changed += 1

    source["content"] = source_content
    new_hash = source_hash(source)
    request(f"posts?id=eq.{POST_ID}", key, "PATCH", {"content": source_content, "updated": datetime.now(timezone.utc).isoformat()})
    request(f"post_translations?id=eq.{translation['id']}", key, "PATCH", {"content": translation_content, "source_content_hash": new_hash, "updated_at": datetime.now(timezone.utc).isoformat()})
    print(json.dumps({"post_id": POST_ID, "replacements": changed, "new_source_hash": new_hash, "translation_status": "hash-aligned"}, ensure_ascii=False))


if __name__ == "__main__":
    main()
