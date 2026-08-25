#!/usr/bin/env python3
"""Seed the reviewed Phase 4 English pilot into public.post_translations.

The script verifies the live source post and its source_content_hash before
upserting. It never selects AI Tech or StockPulse Feed rows unless they are
explicitly present in the manifest.
"""
from __future__ import annotations

import hashlib
import json
import os
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "data/phase4-english-pilot/manifest.json"
ENV_FILE = ROOT / ".env.local"
SUPABASE_URL = "https://qbkfwnddxycixnqvfokq.supabase.co"


def load_env() -> dict[str, str]:
    values: dict[str, str] = {}
    for raw in ENV_FILE.read_text().splitlines():
        if "=" not in raw or raw.lstrip().startswith("#"):
            continue
        key, value = raw.split("=", 1)
        values[key.strip()] = value.strip().strip('"').strip("'")
    return values


def request(path: str, *, headers: dict[str, str], method: str = "GET", payload: object | None = None):
    body = None if payload is None else json.dumps(payload, ensure_ascii=False).encode()
    req = urllib.request.Request(
        f"{SUPABASE_URL}/rest/v1/{path}",
        data=body,
        headers={"Content-Type": "application/json", **headers},
        method=method,
    )
    with urllib.request.urlopen(req, timeout=45) as response:
        raw = response.read()
        return json.loads(raw) if raw else None


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
    env = load_env()
    key = env["SUPABASE_SERVICE_ROLE_KEY"]
    headers = {"apikey": key, "Authorization": f"Bearer {key}", "Prefer": "resolution=merge-duplicates,return=representation"}
    manifest = json.loads(MANIFEST.read_text())
    rows = []
    for item in manifest:
        if item["blog_id"] in {"aitech", "stockpulse"}:
            raise SystemExit(f"Feed translation is outside Phase 4 pilot: {item['blog_id']}/{item['source_slug']}")
        query = urllib.parse.urlencode({
            "select": "id,blog_id,slug,title,content,excerpt,seo_desc,labels,status",
            "blog_id": f"eq.{item['blog_id']}",
            "slug": f"eq.{item['source_slug']}",
            "status": "eq.live",
        })
        source_rows = request(f"posts?{query}", headers=headers) or []
        if len(source_rows) != 1:
            raise SystemExit(f"Expected one live source row for {item['blog_id']}/{item['source_slug']}, got {len(source_rows)}")
        source = source_rows[0]
        actual_hash = source_hash(source)
        if actual_hash != item["source_content_hash"]:
            raise SystemExit(f"Source hash mismatch for {item['source_slug']}: {actual_hash} != {item['source_content_hash']}")
        if int(source["id"]) != int(item["post_id"]):
            raise SystemExit(f"Source id mismatch for {item['source_slug']}")
        content = (ROOT / "data/phase4-english-pilot" / item["file"]).read_text()
        rows.append({
            "post_id": source["id"],
            "locale": "en",
            "slug": item["translation_slug"],
            "title": item["title"],
            "content": content,
            "excerpt": item["excerpt"],
            "seo_desc": item["seo_desc"],
            "source_content_hash": actual_hash,
            "translation_status": item["translation_status"],
            "translated_at": datetime.now(timezone.utc).isoformat(),
            "translator_type": item["translator_type"],
            "human_reviewed": item["human_reviewed"],
            "updated_at": datetime.now(timezone.utc).isoformat(),
        })

    result = request("post_translations?on_conflict=post_id%2Clocale", headers=headers, method="POST", payload=rows)
    print(json.dumps({"seeded": len(rows), "ids": [row.get("id") for row in (result or [])], "locales": sorted({row["locale"] for row in rows})}, ensure_ascii=False))


if __name__ == "__main__":
    main()
