#!/usr/bin/env python3
"""Refresh the static StockPulse feed/index snapshot from Supabase.

The public /stock route consumes this generated JSON at build/runtime instead
of querying Supabase on every page visit. The publisher runs this script after
each morning/evening StockPulse publication and pushes the changed snapshot to
GitHub so Vercel deploys the new data.
"""

from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
import tempfile
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any
from urllib.parse import urlencode
from urllib.request import Request, urlopen

REPO_ROOT = Path(__file__).resolve().parents[1]
SNAPSHOT_PATH = REPO_ROOT / "src" / "data" / "stockpulse-snapshot.json"
ENV_PATH = REPO_ROOT / ".env.local"


def load_env(path: Path) -> dict[str, str]:
    values: dict[str, str] = {}
    if not path.exists():
        return values
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


def fetch_rows(base_url: str, service_key: str, table: str, params: list[tuple[str, str]]) -> list[dict[str, Any]]:
    query = urlencode(params)
    request = Request(
        f"{base_url}/rest/v1/{table}?{query}",
        headers={
            "Accept": "application/json",
            "apikey": service_key,
            "Authorization": f"Bearer {service_key}",
        },
    )
    with urlopen(request, timeout=30) as response:
        payload = json.loads(response.read())
    if not isinstance(payload, list):
        raise RuntimeError(f"Unexpected Supabase response for {table}")
    return payload


def build_snapshot() -> dict[str, Any]:
    base_url, service_key = get_config()
    posts_params = [
        ("select", "slug,title,excerpt,labels,published"),
        ("status", "eq.live"),
        ("blog_id", "eq.stockpulse"),
        ("order", "published.desc"),
        ("limit", "5000"),
    ]
    posts = fetch_rows(base_url, service_key, "posts", posts_params)
    if not posts:
        raise RuntimeError("Refusing to write an empty StockPulse post snapshot")

    slugs = [post.get("slug") for post in posts]
    if any(not slug for slug in slugs) or len(slugs) != len(set(slugs)):
        raise RuntimeError("StockPulse post snapshot contains missing or duplicate slugs")

    seven_days_ago = (datetime.now(timezone.utc) - timedelta(days=7)).date().isoformat()
    prediction_queries: dict[str, list[tuple[str, str]]] = {
        "latest": [
            ("select", "session,date,direction,kospi_target,prediction_raw,actual_kospi_close,actual_direction,accuracy_score,is_correct"),
            ("session", "eq.morning"),
            ("order", "date.desc"),
            ("limit", "1"),
        ],
        "recent7": [
            ("select", "accuracy_score,is_correct"),
            ("session", "eq.morning"),
            ("date", f"gte.{seven_days_ago}"),
            ("order", "date.desc"),
        ],
        "mlRecent7": [
            ("select", "accuracy_score,is_correct"),
            ("session", "eq.ml"),
            ("date", f"gte.{seven_days_ago}"),
            ("order", "date.desc"),
        ],
        "allMorning": [
            ("select", "accuracy_score,is_correct"),
            ("session", "eq.morning"),
            ("accuracy_score", "not.is.null"),
        ],
        "allMl": [
            ("select", "accuracy_score,is_correct"),
            ("session", "eq.ml"),
            ("accuracy_score", "not.is.null"),
        ],
    }

    def fetch_prediction(item: tuple[str, list[tuple[str, str]]]) -> tuple[str, list[dict[str, Any]]]:
        name, params = item
        return name, fetch_rows(base_url, service_key, "predictions", params)

    with ThreadPoolExecutor(max_workers=len(prediction_queries)) as pool:
        fetched = dict(pool.map(fetch_prediction, prediction_queries.items()))

    predictions = {
        "latest": fetched["latest"][0] if fetched["latest"] else None,
        "recent7": fetched["recent7"],
        "mlRecent7": fetched["mlRecent7"],
        "allMorning": fetched["allMorning"],
        "allMl": fetched["allMl"],
    }
    return {
        "schema_version": 1,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "posts": posts,
        "predictions": predictions,
    }


def read_existing() -> dict[str, Any] | None:
    if not SNAPSHOT_PATH.exists():
        return None
    try:
        value = json.loads(SNAPSHOT_PATH.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return None
    return value if isinstance(value, dict) else None


def content_equal(left: dict[str, Any] | None, right: dict[str, Any]) -> bool:
    if not left:
        return False
    return (
        left.get("schema_version") == right.get("schema_version")
        and left.get("posts") == right.get("posts")
        and left.get("predictions") == right.get("predictions")
    )


def write_snapshot(snapshot: dict[str, Any]) -> None:
    SNAPSHOT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile(
        "w", encoding="utf-8", dir=SNAPSHOT_PATH.parent, prefix=".stockpulse-snapshot-", delete=False
    ) as handle:
        json.dump(snapshot, handle, ensure_ascii=False, indent=2)
        handle.write("\n")
        temp_path = Path(handle.name)
    temp_path.replace(SNAPSHOT_PATH)


def run_git(*args: str, check: bool = True) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        ["git", "-C", str(REPO_ROOT), *args],
        check=check,
        text=True,
        capture_output=True,
    )


def push_snapshot() -> None:
    status = run_git("status", "--porcelain", check=True).stdout.strip().splitlines()
    allowed = {f"?? {SNAPSHOT_PATH.relative_to(REPO_ROOT)}", f" M {SNAPSHOT_PATH.relative_to(REPO_ROOT)}"}
    unexpected = [line for line in status if line not in allowed]
    if unexpected:
        raise RuntimeError(f"Refusing snapshot commit with unrelated working-tree changes: {unexpected}")

    run_git("add", str(SNAPSHOT_PATH.relative_to(REPO_ROOT)))
    staged = run_git("diff", "--cached", "--quiet", check=False)
    if staged.returncode == 0:
        print("StockPulse snapshot unchanged; no deployment commit needed.")
        return

    commit = run_git("commit", "-m", "chore: refresh StockPulse static snapshot")
    print(commit.stdout.strip())
    pushed = run_git("push", "origin", "main")
    print(pushed.stdout.strip() or "StockPulse snapshot pushed to origin/main.")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--no-push", action="store_true", help="write the snapshot without committing or pushing")
    parser.add_argument("--check", action="store_true", help="fetch and validate without writing")
    args = parser.parse_args()

    snapshot = build_snapshot()
    existing = read_existing()
    print(f"StockPulse snapshot source: {len(snapshot['posts'])} posts")
    print(
        "Prediction rows: "
        f"latest={1 if snapshot['predictions']['latest'] else 0}, "
        f"recent7={len(snapshot['predictions']['recent7'])}, "
        f"mlRecent7={len(snapshot['predictions']['mlRecent7'])}, "
        f"allMorning={len(snapshot['predictions']['allMorning'])}, "
        f"allMl={len(snapshot['predictions']['allMl'])}"
    )
    if content_equal(existing, snapshot):
        print("Snapshot content is already current.")
        return 0
    if args.check:
        print("Snapshot check passed; changes are available.")
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
        print(f"StockPulse snapshot refresh failed: {exc}", file=sys.stderr)
        raise SystemExit(1)
