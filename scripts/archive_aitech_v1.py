#!/usr/bin/env python3
"""Archive the current AI Tech v1 rows without deleting or changing status.

Default mode is a read-only plan. Use --apply only after reviewing the exact
row count. The operation changes lifecycle_status live -> archived for every
current blog_id=aitech, status=live, lifecycle_status=live row, and verifies
that status/workflow data remain intact.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import Request, urlopen

REPO_ROOT = Path(__file__).resolve().parents[1]
ENV_PATH = REPO_ROOT / ".env.local"


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


def request_json(method: str, path: str, params: list[tuple[str, str]], service_key: str, payload: dict | None = None, prefer: str | None = None):
    base_url, _ = get_config()
    url = f"{base_url}{path}?{urlencode(params)}"
    headers = {"Accept": "application/json", "apikey": service_key, "Authorization": f"Bearer {service_key}"}
    if payload is not None:
        headers["Content-Type"] = "application/json"
    if prefer:
        headers["Prefer"] = prefer
    body = json.dumps(payload).encode("utf-8") if payload is not None else None
    request = Request(url, method=method, headers=headers, data=body)
    with urlopen(request, timeout=30) as response:
        raw = response.read().decode("utf-8")
        return response.status, json.loads(raw) if raw else []


def fetch_targets(service_key: str) -> list[dict]:
    _, rows = request_json("GET", "/rest/v1/posts", [
        ("select", "id,slug,title,status,lifecycle_status,workflow_state,published"),
        ("blog_id", "eq.aitech"),
        ("status", "eq.live"),
        ("lifecycle_status", "eq.live"),
        ("order", "published.asc"),
        ("limit", "5000"),
    ], service_key)
    if not isinstance(rows, list):
        raise RuntimeError("Supabase target query did not return a list")
    for row in rows:
        if row.get("status") != "live" or row.get("lifecycle_status") != "live":
            raise RuntimeError(f"Target query returned an unexpected row: id={row.get('id')}")
    return rows


def verify_archived(service_key: str, ids: list[int]) -> list[dict]:
    _, rows = request_json("GET", "/rest/v1/posts", [
        ("select", "id,slug,title,status,lifecycle_status,workflow_state,published"),
        ("id", f"in.({','.join(str(item) for item in ids)})"),
        ("blog_id", "eq.aitech"),
        ("status", "eq.live"),
        ("lifecycle_status", "eq.archived"),
        ("limit", "5000"),
    ], service_key)
    if len(rows) != len(ids):
        raise RuntimeError(f"Archive read-back mismatch: expected {len(ids)}, got {len(rows)}")
    if any(row.get("status") != "live" or row.get("lifecycle_status") != "archived" for row in rows):
        raise RuntimeError("Archive read-back contains an unexpected status/lifecycle value")
    return rows


def apply_archive(service_key: str, ids: list[int]) -> list[dict]:
    status, rows = request_json("PATCH", "/rest/v1/posts", [
        ("id", f"in.({','.join(str(item) for item in ids)})"),
        ("blog_id", "eq.aitech"),
        ("status", "eq.live"),
        ("lifecycle_status", "eq.live"),
    ], service_key, payload={"lifecycle_status": "archived"}, prefer="return=representation")
    if status not in (200, 204) or not isinstance(rows, list) or len(rows) != len(ids):
        raise RuntimeError(f"Archive PATCH mismatch: HTTP {status}, returned {len(rows) if isinstance(rows, list) else 'non-list'} rows")
    return verify_archived(service_key, ids)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--expected-count", type=int, default=185)
    parser.add_argument("--apply", action="store_true", help="apply live -> archived after exact target validation")
    args = parser.parse_args()
    _, service_key = get_config()
    targets = fetch_targets(service_key)
    if args.expected_count is not None and len(targets) != args.expected_count:
        raise RuntimeError(f"Expected {args.expected_count} current AI Tech v1 rows, got {len(targets)}")
    output = {
        "mode": "apply" if args.apply else "dry-run",
        "target_count": len(targets),
        "target_lifecycle": "live",
        "target_status": "live",
        "sample": [{"id": row["id"], "published": row.get("published"), "title": row.get("title")} for row in targets[:3]],
    }
    if args.apply:
        rows = apply_archive(service_key, [int(row["id"]) for row in targets])
        output.update({"patched_count": len(rows), "readback_lifecycle": "archived", "status_preserved": all(row.get("status") == "live" for row in rows), "workflow_preserved": all(row.get("workflow_state") == target.get("workflow_state") for row, target in zip(sorted(rows, key=lambda item: item["id"]), sorted(targets, key=lambda item: item["id"])))})
        if not output["status_preserved"] or not output["workflow_preserved"]:
            raise RuntimeError("Archive read-back detected status/workflow mutation")
    else:
        output["would_set_lifecycle"] = "archived"
        output["write"] = "NO WRITE"
    print(json.dumps(output, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"AI Tech v1 archive failed: {exc}", file=sys.stderr)
        raise SystemExit(1)
