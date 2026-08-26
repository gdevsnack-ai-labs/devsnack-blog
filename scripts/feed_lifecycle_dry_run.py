#!/usr/bin/env python3
"""Read-only planner for automated Feed lifecycle transitions.

This Phase 1 tool deliberately has no PATCH/DELETE/apply mode. It enumerates
exact candidates and the public projections that must be refreshed before a
future transition is allowed.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from datetime import date
from pathlib import Path
from typing import Any
from urllib.parse import urlencode
from urllib.request import Request, urlopen

REPO_ROOT = Path(__file__).resolve().parents[1]
ENV_PATH = REPO_ROOT / ".env.local"
AUTOMATED_FEEDS = ("aitech", "stockpulse")
LIFECYCLE_STATES = ("live", "consolidated", "archived", "purge_candidate")


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


def fetch_candidates(feed: str, from_state: str, before: str | None) -> list[dict[str, Any]]:
    base_url, service_key = get_config()
    params: list[tuple[str, str]] = [
        ("select", "id,slug,title,status,lifecycle_status,workflow_state,published"),
        ("blog_id", f"eq.{feed}"),
        ("status", "eq.live"),
        ("lifecycle_status", f"eq.{from_state}"),
        ("order", "published.asc"),
        ("limit", "5000"),
    ]
    if before:
        date.fromisoformat(before)
        params.append(("published", f"lt.{before}T00:00:00+00:00"))
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
    if not isinstance(rows, list):
        raise RuntimeError("Unexpected Supabase candidate response")
    return rows


def build_plan(feed: str, from_state: str, to_state: str, rows: list[dict[str, Any]], before: str | None) -> dict[str, Any]:
    invalid = [
        row for row in rows
        if row.get("status") != "live" or row.get("lifecycle_status") != from_state
    ]
    if invalid:
        raise RuntimeError("Candidate query returned a row outside the requested source state")
    return {
        "mode": "read-only-dry-run",
        "feed": feed,
        "from": from_state,
        "to": to_state,
        "before": before,
        "matched_count": len(rows),
        "ids": [row.get("id") for row in rows],
        "slugs": [row.get("slug") for row in rows],
        "projection_requirements": {
            "snapshot": f"refresh {feed} snapshot with lifecycle_status=live",
            "rss": "exclude when target is not live",
            "sitemap": "exclude automated Feed detail URL when target is not live",
            "hub": "exclude from Home/Data/Lab Feed output projections when target is not live",
            "search": "exclude from public FTS results when target is not live",
            "detail": "keep direct detail route accessible while status remains live",
        },
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--feed", choices=AUTOMATED_FEEDS, required=True)
    parser.add_argument("--from", dest="from_state", choices=LIFECYCLE_STATES, default="live")
    parser.add_argument("--to", dest="to_state", choices=LIFECYCLE_STATES, required=True)
    parser.add_argument("--before", help="Only rows published before YYYY-MM-DD")
    parser.add_argument("--preview", type=int, default=10, help="Number of candidate slugs to print in the compact summary")
    args = parser.parse_args()
    if args.from_state == args.to_state:
        raise RuntimeError("Source and target lifecycle states must differ")
    if args.preview < 0:
        raise RuntimeError("--preview must be zero or greater")

    rows = fetch_candidates(args.feed, args.from_state, args.before)
    plan = build_plan(args.feed, args.from_state, args.to_state, rows, args.before)
    plan["preview_slugs"] = plan["slugs"][:args.preview]
    plan.pop("ids")
    plan.pop("slugs")
    print(json.dumps(plan, ensure_ascii=False, indent=2))
    print("NO WRITE: lifecycle_status was not modified.")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"Feed lifecycle dry-run failed: {exc}", file=sys.stderr)
        raise SystemExit(1)
