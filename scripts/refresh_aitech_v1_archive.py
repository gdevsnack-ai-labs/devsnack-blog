#!/usr/bin/env python3
"""Build the compact public index for archived AI Tech v1 articles.

The public snapshot intentionally contains only KST publication date and title.
It does not contain slug, body, excerpt, cover image, or detail links.
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
from zoneinfo import ZoneInfo

REPO_ROOT = Path(__file__).resolve().parents[1]
ENV_PATH = REPO_ROOT / ".env.local"
SNAPSHOT_PATH = REPO_ROOT / "src" / "data" / "aitech-v1-archive.json"
KST = ZoneInfo("Asia/Seoul")


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


def fetch_rows() -> list[dict[str, Any]]:
    base_url, service_key = get_config()
    params = [
        ("select", "id,title,published,status,lifecycle_status"),
        ("blog_id", "eq.aitech"),
        ("status", "eq.live"),
        ("lifecycle_status", "eq.archived"),
        ("order", "published.desc"),
        ("limit", "5000"),
    ]
    request = Request(
        f"{base_url}/rest/v1/posts?{urlencode(params)}",
        headers={"Accept": "application/json", "apikey": service_key, "Authorization": f"Bearer {service_key}"},
    )
    with urlopen(request, timeout=30) as response:
        rows = json.loads(response.read())
    if not isinstance(rows, list) or not rows:
        raise RuntimeError("Refusing to write an empty AI Tech v1 archive snapshot")
    return rows


def normalize_row(row: dict[str, Any]) -> dict[str, str]:
    title = str(row.get("title") or "").strip()
    published = str(row.get("published") or "").strip()
    if not title or not published:
        raise RuntimeError(f"Archive row is missing title/published: id={row.get('id')}")
    if row.get("status") != "live" or row.get("lifecycle_status") != "archived":
        raise RuntimeError(f"Archive row is outside live/archived: id={row.get('id')}")
    try:
        parsed = datetime.fromisoformat(published.replace("Z", "+00:00"))
        if parsed.tzinfo is None:
            parsed = parsed.replace(tzinfo=timezone.utc)
        archive_date = parsed.astimezone(KST).date().isoformat()
    except ValueError as exc:
        raise RuntimeError(f"Archive row has invalid published value: id={row.get('id')}") from exc
    return {"date": archive_date, "title": title}


def build_snapshot(expected_count: int | None = None) -> dict[str, Any]:
    entries = [normalize_row(row) for row in fetch_rows()]
    if expected_count is not None and len(entries) != expected_count:
        raise RuntimeError(f"Expected {expected_count} archived entries, got {len(entries)}")
    return {
        "schema_version": 1,
        "feed": "aitech-v1-archive",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "entries": entries,
    }


def read_existing() -> dict[str, Any] | None:
    if not SNAPSHOT_PATH.exists():
        return None
    try:
        value = json.loads(SNAPSHOT_PATH.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return None
    return value if isinstance(value, dict) else None


def write_snapshot(snapshot: dict[str, Any]) -> None:
    with tempfile.NamedTemporaryFile("w", encoding="utf-8", dir=SNAPSHOT_PATH.parent, prefix=".aitech-v1-archive-", delete=False) as handle:
        json.dump(snapshot, handle, ensure_ascii=False, indent=2)
        handle.write("\n")
        temp_path = Path(handle.name)
    temp_path.replace(SNAPSHOT_PATH)


def run_git(*args: str, check: bool = True) -> subprocess.CompletedProcess[str]:
    return subprocess.run(["git", "-C", str(REPO_ROOT), *args], check=check, text=True, capture_output=True)


def push_snapshot() -> None:
    relative = SNAPSHOT_PATH.relative_to(REPO_ROOT)
    status = run_git("status", "--porcelain").stdout.strip().splitlines()
    allowed = {f"?? {relative}", f" M {relative}"}
    unexpected = [line for line in status if line not in allowed]
    if unexpected:
        raise RuntimeError(f"Refusing archive snapshot commit with unrelated changes: {unexpected}")
    run_git("add", str(relative))
    if run_git("diff", "--cached", "--quiet", check=False).returncode == 0:
        print("AI Tech v1 archive snapshot unchanged; no deployment commit needed.")
        return
    print(run_git("commit", "-m", "chore: refresh AI Tech v1 archive index").stdout.strip())
    print(run_git("push", "origin", "main").stdout.strip() or "Archive snapshot pushed to origin/main.")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--expected-count", type=int, default=None)
    parser.add_argument("--check", action="store_true", help="fetch and validate without writing")
    parser.add_argument("--no-push", action="store_true", help="write without committing or pushing")
    args = parser.parse_args()
    snapshot = build_snapshot(args.expected_count)
    print(f"AI Tech v1 archive source: {len(snapshot['entries'])} entries")
    if args.check:
        print("AI Tech v1 archive check passed.")
        return 0
    write_snapshot(snapshot)
    print(f"Wrote {SNAPSHOT_PATH}")
    if not args.no_push:
        push_snapshot()
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"AI Tech v1 archive refresh failed: {exc}", file=sys.stderr)
        raise SystemExit(1)
