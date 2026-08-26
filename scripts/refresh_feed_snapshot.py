#!/usr/bin/env python3
"""Refresh static AI Tech or DevSnack Stories feed snapshots.

AI Tech is refreshed automatically once after its automated publishing batch:
  python3 scripts/refresh_feed_snapshot.py --feed aitech

DevSnack Stories are manual/event-driven and must be refreshed explicitly after
an approved Blogger DRAFT → LIVE → Supabase sync:
  python3 scripts/refresh_feed_snapshot.py --feed devsnack

Both commands fetch from Supabase, write a small public JSON snapshot, commit
only that snapshot, and push the public blog repo unless --no-push is used.
"""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.parse import urlencode
from urllib.request import Request, urlopen

REPO_ROOT = Path(__file__).resolve().parents[1]
ENV_PATH = REPO_ROOT / ".env.local"
SNAPSHOT_PATHS = {
    "aitech": REPO_ROOT / "src" / "data" / "aitech-snapshot.json",
    "devsnack": REPO_ROOT / "src" / "data" / "devsnack-snapshot.json",
}
MAX_EXCERPT_CHARS = 320
MAX_AITECH_EXCERPT_CHARS = 160
MAX_STATIC_COVER_CHARS = 100_000


def load_env(path: Path) -> dict[str, str]:
    values: dict[str, str] = {}
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        values[key.strip()] = value.strip().strip('"').strip("'")
    return values


def get_config() -> tuple[str, str]:
    env = load_env(ENV_PATH)
    base_url = (env.get("SUPABASE_URL") or env.get("NEXT_PUBLIC_SUPABASE_URL") or "").rstrip("/")
    service_key = env.get("SUPABASE_SERVICE_ROLE_KEY", "")
    if not base_url or not service_key:
        raise RuntimeError(f"Missing Supabase configuration in {ENV_PATH}")
    return base_url, service_key


def fetch_posts(feed: str) -> list[dict[str, Any]]:
    base_url, service_key = get_config()
    params = [
        ("select", "slug,title,excerpt,labels,published,cover_image,blog_id,status,lifecycle_status"),
        ("status", "eq.live"),
        ("blog_id", f"eq.{feed}"),
        ("order", "published.desc"),
        ("limit", "5000"),
    ]
    if feed == "aitech":
        params.append(("lifecycle_status", "eq.live"))
    request = Request(
        f"{base_url}/rest/v1/posts?{urlencode(params)}",
        headers={
            "Accept": "application/json",
            "apikey": service_key,
            "Authorization": f"Bearer {service_key}",
        },
    )
    with urlopen(request, timeout=30) as response:
        rows = json.loads(response.read())
    if not isinstance(rows, list) or not rows:
        raise RuntimeError(f"Refusing to write an empty {feed} snapshot")
    return rows


def normalize_post(post: dict[str, Any], feed: str) -> dict[str, Any]:
    excerpt = post.get("excerpt") or ""
    if not isinstance(excerpt, str):
        excerpt = str(excerpt)
    cover = post.get("cover_image")
    if not isinstance(cover, str) or cover.startswith("data:") or len(cover) > MAX_STATIC_COVER_CHARS:
        cover = None

    excerpt_limit = MAX_AITECH_EXCERPT_CHARS if feed == "aitech" else MAX_EXCERPT_CHARS
    normalized = {
        "slug": post.get("slug"),
        "title": post.get("title"),
        "excerpt": excerpt[:excerpt_limit] or None,
        "labels": post.get("labels") if isinstance(post.get("labels"), list) else [],
        "published": post.get("published"),
        "cover_image": cover,
    }
    if not normalized["slug"] or not normalized["title"]:
        raise RuntimeError(f"{feed} snapshot contains a post without slug/title")
    if post.get("blog_id") != feed or post.get("status") != "live":
        raise RuntimeError(f"{feed} snapshot contains a row outside live/{feed}")
    if feed == "aitech" and post.get("lifecycle_status") != "live":
        raise RuntimeError("aitech snapshot contains a row outside lifecycle live")
    if feed == "devsnack":
        normalized["blog_id"] = "devsnack"
        normalized["status"] = "live"
    return normalized


def build_snapshot(feed: str) -> dict[str, Any]:
    rows = [normalize_post(row, feed) for row in fetch_posts(feed)]
    slugs = [row["slug"] for row in rows]
    if len(slugs) != len(set(slugs)):
        raise RuntimeError(f"{feed} snapshot contains duplicate slugs")
    return {
        "schema_version": 1,
        "feed": feed,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "posts": rows,
    }


def read_existing(path: Path) -> dict[str, Any] | None:
    if not path.exists():
        return None
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return None
    return value if isinstance(value, dict) else None


def content_equal(left: dict[str, Any] | None, right: dict[str, Any]) -> bool:
    return bool(left) and (
        left.get("schema_version") == right.get("schema_version")
        and left.get("feed") == right.get("feed")
        and left.get("posts") == right.get("posts")
    )


def write_snapshot(path: Path, snapshot: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile(
        "w", encoding="utf-8", dir=path.parent, prefix=f".{path.stem}-", delete=False
    ) as handle:
        json.dump(snapshot, handle, ensure_ascii=False, indent=2)
        handle.write("\n")
        temp_path = Path(handle.name)
    temp_path.replace(path)


def run_git(*args: str, check: bool = True) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        ["git", "-C", str(REPO_ROOT), *args],
        check=check,
        text=True,
        capture_output=True,
    )


def push_snapshot(path: Path) -> None:
    relative = path.relative_to(REPO_ROOT)
    status = run_git("status", "--porcelain", check=True).stdout.strip().splitlines()
    allowed = {f"?? {relative}", f" M {relative}"}
    unexpected = [line for line in status if line not in allowed]
    if unexpected:
        raise RuntimeError(f"Refusing snapshot commit with unrelated working-tree changes: {unexpected}")

    run_git("add", str(relative))
    staged = run_git("diff", "--cached", "--quiet", check=False)
    if staged.returncode == 0:
        print("Snapshot unchanged; no deployment commit needed.")
        return

    commit = run_git("commit", "-m", f"chore: refresh {path.stem}")
    print(commit.stdout.strip())
    pushed = run_git("push", "origin", "main")
    print(pushed.stdout.strip() or "Snapshot pushed to origin/main.")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--feed", choices=sorted(SNAPSHOT_PATHS), required=True)
    parser.add_argument("--no-push", action="store_true", help="write without committing or pushing")
    parser.add_argument("--check", action="store_true", help="fetch and validate without writing")
    args = parser.parse_args()

    path = SNAPSHOT_PATHS[args.feed]
    snapshot = build_snapshot(args.feed)
    existing = read_existing(path)
    posts = snapshot["posts"]
    covers = sum(1 for post in posts if post["cover_image"])
    print(f"{args.feed} snapshot source: {len(posts)} posts, {covers} static cover URLs")
    if content_equal(existing, snapshot):
        print("Snapshot content is already current.")
        return 0
    if args.check:
        print("Snapshot check passed; changes are available.")
        return 0

    write_snapshot(path, snapshot)
    print(f"Wrote {path}")
    if not args.no_push:
        push_snapshot(path)
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"Feed snapshot refresh failed: {exc}", file=sys.stderr)
        raise SystemExit(1)
