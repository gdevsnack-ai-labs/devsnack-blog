#!/usr/bin/env python3
"""AI Tech quality-v2 weekly digest and guarded first consolidation.

The default command is read-only.  ``--publish`` is blocked during the Phase 3
public-publish pause unless paired with ``--allow-public-publish`` after sign-off.
``--transition`` is allowed only after the digest has passed Supabase and
production read-back, then transitions the exact AI Tech daily rows and refreshes
the AI Tech snapshot.  Any post-transition verification failure triggers a DB +
snapshot reconciliation attempt.
"""

from __future__ import annotations

import argparse
import html
import json
import re
import sqlite3
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from collections import Counter
from datetime import date, timedelta
from pathlib import Path
from typing import Any, Callable

ROOT = Path(__file__).resolve().parents[1]
ENV_PATH = ROOT / ".env.local"
HISTORY_DB = Path("/home/kahros/content-factory/ai_blogs/ai-news-blogger/history.db")
SNAPSHOT_PATH = ROOT / "src" / "data" / "aitech-snapshot.json"
SNAPSHOT_SCRIPT = ROOT / "scripts" / "refresh_feed_snapshot.py"
SITE_URL = "https://devsnack-blog.vercel.app"
AITECH_BLOG_ID = "aitech"
WEEKLY_ROUTE_PREFIX = "aitech-weekly-"
CONSOLIDATED = "consolidated"
LIVE = "live"

SHARED_SCRIPTS = Path("/home/kahros/workspace/vercel-blog/scripts")
sys.path.insert(0, str(SHARED_SCRIPTS))
from aitech_weekly import (  # noqa: E402
    build_weekly_digest,
    classify_reconstructed_source,
    cluster_events,
    select_core_events,
    validate_weekly_digest,
)
from devsnack_direct_publish import DirectPublisher  # type: ignore[reportMissingImports]  # noqa: E402
from public_content_safety import inspect_public_content  # type: ignore[reportMissingImports]  # noqa: E402


class PipelineError(RuntimeError):
    pass


def load_env(path: Path = ENV_PATH) -> dict[str, str]:
    values: dict[str, str] = {}
    if not path.exists():
        raise PipelineError(f"Missing environment file: {path}")
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        values[key.strip()] = value.strip().strip('"').strip("'")
    return values


def rest_request(method: str, table: str, params: list[tuple[str, str]], body: Any = None) -> Any:
    env = load_env()
    base = (env.get("SUPABASE_URL") or env.get("NEXT_PUBLIC_SUPABASE_URL") or "").rstrip("/")
    key = env.get("SUPABASE_SERVICE_ROLE_KEY", "")
    if not base or not key:
        raise PipelineError("Supabase configuration is missing")
    headers = {"Accept": "application/json", "apikey": key, "Authorization": f"Bearer {key}"}
    encoded = None
    if body is not None:
        headers["Content-Type"] = "application/json"
        encoded = json.dumps(body, ensure_ascii=False).encode("utf-8")
    if method == "PATCH":
        headers["Prefer"] = "return=representation"
    url = f"{base}/rest/v1/{table}?{urllib.parse.urlencode(params)}"
    request = urllib.request.Request(url, data=encoded, headers=headers, method=method)
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            raw = response.read()
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")[:500]
        raise PipelineError(f"Supabase {method} {table} failed: HTTP {exc.code}: {detail}") from exc
    if not raw.strip():
        return None
    try:
        return json.loads(raw)
    except json.JSONDecodeError as exc:
        raise PipelineError(f"Supabase {method} {table} returned invalid JSON") from exc


def dates_inclusive(week_start: str, week_end: str) -> list[str]:
    first, last = date.fromisoformat(week_start), date.fromisoformat(week_end)
    if last < first:
        raise PipelineError("week end must not be before week start")
    return [(first + timedelta(days=i)).isoformat() for i in range((last - first).days + 1)]


def post_date(row: dict[str, Any]) -> str:
    value = str(row.get("published") or "")
    return value[:10]


def load_history_rows() -> list[dict[str, Any]]:
    if not HISTORY_DB.exists():
        raise PipelineError(f"AI Tech history DB is missing: {HISTORY_DB}")
    con = sqlite3.connect(HISTORY_DB)
    con.row_factory = sqlite3.Row
    try:
        rows = con.execute(
            "SELECT source_url, original_summary, generated_title, status, created_at "
            "FROM news_history WHERE status='published' AND generated_title != ''"
        ).fetchall()
    finally:
        con.close()
    return [dict(row) for row in rows]


def select_week(week_start: str, week_end: str) -> dict[str, Any]:
    expected_dates = dates_inclusive(week_start, week_end)
    next_day = (date.fromisoformat(week_end) + timedelta(days=1)).isoformat()
    rows = rest_request(
        "GET",
        "posts",
        [
            ("select", "id,slug,title,published,updated,status,lifecycle_status"),
            ("blog_id", "eq.aitech"),
            ("published", f"gte.{week_start}T00:00:00Z"),
            ("published", f"lt.{next_day}T00:00:00Z"),
            ("order", "published.asc"),
            ("limit", "5000"),
        ],
    )
    if not isinstance(rows, list):
        raise PipelineError("AI Tech post response is not a list")
    by_date = Counter(post_date(row) for row in rows)
    if set(by_date) != set(expected_dates) or any(by_date[item] != 2 for item in expected_dates):
        raise PipelineError(f"Expected exactly two AI Tech daily rows per date: {dict(by_date)}")
    if any(row.get("status") != LIVE or row.get("lifecycle_status") not in {LIVE, CONSOLIDATED} for row in rows):
        raise PipelineError("Selected AI Tech rows must keep status=live and use lifecycle live/consolidated")

    history = load_history_rows()
    by_title: dict[str, list[dict[str, Any]]] = {}
    for row in history:
        by_title.setdefault(str(row.get("generated_title") or ""), []).append(row)

    articles: list[dict[str, Any]] = []
    unmatched: list[str] = []
    for row in rows:
        candidates = by_title.get(str(row.get("title") or ""), [])
        if not candidates:
            unmatched.append(str(row.get("title") or row.get("slug") or "unknown"))
            continue
        source = candidates[0]
        source_url = str(source.get("source_url") or "")
        summary = str(source.get("original_summary") or "")
        articles.append({
            "id": int(row["id"]),
            "slug": str(row.get("slug") or ""),
            "title": str(row.get("title") or ""),
            "published": str(row.get("published") or ""),
            "source_url": source_url,
            "summary": summary,
            "source_quality": classify_reconstructed_source(source_url, summary),
            "source_basis": "persisted_rss_summary",
        })
    if unmatched:
        raise PipelineError(f"No persisted source summary matched {len(unmatched)} selected articles: {unmatched[:3]}")
    if any(row["source_quality"] == "REJECT" for row in articles):
        rejected = [row["slug"] for row in articles if row["source_quality"] == "REJECT"]
        raise PipelineError(f"Historical source evidence is insufficient for selected articles: {rejected}")
    return {
        "week_start": week_start,
        "week_end": week_end,
        "dates": expected_dates,
        "posts": sorted(rows, key=lambda row: str(row.get("published") or "")),
        "articles": sorted(articles, key=lambda row: str(row.get("published") or "")),
    }


def artifact_path(week_start: str) -> Path:
    return ROOT / "docs" / "phase3-aitech" / f"aitech-weekly-{week_start}.md"


def generate_artifact(selection: dict[str, Any]) -> tuple[Path, str, list[dict[str, Any]]]:
    articles = selection["articles"]
    clusters = cluster_events(articles)
    core, roundup = select_core_events(articles, clusters)
    if len(articles) >= 4 and not 4 <= len(core) <= 6:
        raise PipelineError(f"Weekly Digest core selection must contain 4-6 events: {len(core)}")
    content = build_weekly_digest(selection["week_start"], selection["week_end"], articles, clusters)
    issues = validate_weekly_digest(
        content,
        len(articles),
        len(clusters),
        expected_core_count=len(core),
        expected_roundup_count=len(roundup),
    )
    if issues:
        raise PipelineError(f"Weekly Digest validation failed: {issues}")
    safety = inspect_public_content(
        content,
        title=f"AI Tech Weekly Digest — {selection['week_start']}~{selection['week_end']}",
        seo_desc="AI Tech 주간 event/topic digest",
    )
    if safety.decision == "BLOCK":
        raise PipelineError(f"Weekly Digest public-content safety BLOCK: {safety.summary()}")
    path = artifact_path(selection["week_start"])
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")
    return path, content, clusters


def production_get(path: str) -> tuple[int, str]:
    request = urllib.request.Request(SITE_URL + path, headers={"User-Agent": "Mozilla/5.0"})
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            return response.status, response.read().decode("utf-8", errors="replace")
    except urllib.error.HTTPError as exc:
        return exc.code, exc.read().decode("utf-8", errors="replace")
    except urllib.error.URLError as exc:
        raise PipelineError(f"Production read failed for {path}: {exc}") from exc


def publish_weekly(selection: dict[str, Any], content: str, allow_public_publish: bool = False) -> dict[str, Any]:
    if not allow_public_publish:
        raise PipelineError("AI Tech Weekly public publish is paused; pass --allow-public-publish only after Phase 3 sign-off")
    slug = f"{WEEKLY_ROUTE_PREFIX}{selection['week_start']}"
    title = f"AI Tech Weekly Digest — {selection['week_start']}~{selection['week_end']}"
    quality_counts = Counter(str(row.get("source_quality")) for row in selection["articles"])
    clusters = cluster_events(selection["articles"])
    publisher = DirectPublisher(blog_id="lab", route_prefix="lab")
    result = publisher.publish(
        title=title,
        slug=slug,
        content=content,
        labels=["AI Tech", "Weekly Digest", "AI 뉴스", "event clustering"],
        seo_desc=f"AI Tech 주간 event/topic digest — {selection['week_start']}~{selection['week_end']}",
        provenance={
            "kind": "aitech_weekly_digest",
            "pipeline": "ai-tech-quality-v2",
            "week_start": selection["week_start"],
            "week_end": selection["week_end"],
            "daily_output_count": len(selection["articles"]),
            "source_article_count": len(selection["articles"]),
            "event_cluster_count": len(clusters),
            "merged_duplicate_count": sum(max(0, len(cluster["articles"]) - 1) for cluster in clusters),
            "source_quality_counts": dict(sorted(quality_counts.items())),
            "legacy_claim_telemetry": "unavailable_not_reconstructed",
            "human_reviewed": False,
        },
    )
    rows = rest_request(
        "GET",
        "posts",
        [("select", "id,slug,title,blog_id,status,lifecycle_status,content"), ("slug", f"eq.{slug}"), ("limit", "2")],
    )
    if not isinstance(rows, list) or len(rows) != 1:
        raise PipelineError("AI Tech Weekly Supabase read-back did not return exactly one row")
    row = rows[0]
    if row.get("blog_id") != "lab" or row.get("status") != LIVE or row.get("lifecycle_status") != LIVE or row.get("content") != content:
        raise PipelineError("AI Tech Weekly Supabase read-back does not match the published payload")
    verify_weekly_production(slug)
    return result


def verify_weekly_production(slug: str) -> None:
    deadline = time.time() + 240
    last_status, last_body = 0, ""
    markers = ("AI Tech Weekly Digest", "핵심 변화", "사건별 source-summary record", "의미와 해석", "다음 주 watch items")
    while time.time() < deadline:
        last_status, last_body = production_get(f"/lab/{slug}")
        if last_status == 200 and all(marker in html.unescape(last_body) for marker in markers):
            return
        time.sleep(5)
    raise PipelineError(f"AI Tech Weekly production read-back failed: HTTP {last_status}, missing digest markers")


def fetch_selected_rows(ids: list[int]) -> list[dict[str, Any]]:
    if not ids:
        raise PipelineError("No AI Tech lifecycle IDs selected")
    rows = rest_request(
        "GET",
        "posts",
        [
            ("select", "id,slug,title,status,lifecycle_status,blog_id"),
            ("id", f"in.({','.join(str(item) for item in ids)})"),
            ("blog_id", "eq.aitech"),
            ("limit", "5000"),
        ],
    )
    if not isinstance(rows, list) or len(rows) != len(ids):
        raise PipelineError(f"Selected AI Tech row count mismatch: expected={len(ids)} actual={len(rows) if isinstance(rows, list) else 'non-list'}")
    return rows


def lifecycle_preflight(rows: list[dict[str, Any]]) -> str:
    if not rows or any(row.get("status") != LIVE for row in rows):
        raise PipelineError("AI Tech lifecycle preflight requires status=live")
    states = {row.get("lifecycle_status") for row in rows}
    if states == {LIVE}:
        return "ready"
    if states == {CONSOLIDATED}:
        return "already_consolidated"
    raise PipelineError(f"Mixed AI Tech lifecycle states are unsafe: {sorted(str(state) for state in states)}")


def patch_lifecycle(ids: list[int], lifecycle_status: str) -> list[dict[str, Any]]:
    rows = rest_request(
        "PATCH",
        "posts",
        [("id", f"in.({','.join(str(item) for item in ids)})"), ("blog_id", "eq.aitech"), ("status", "eq.live")],
        {"lifecycle_status": lifecycle_status},
    )
    if not isinstance(rows, list) or len(rows) != len(ids):
        raise PipelineError("AI Tech lifecycle PATCH returned an incomplete representation")
    return rows


def verify_lifecycle(ids: list[int], expected: str) -> None:
    rows = fetch_selected_rows(ids)
    if any(row.get("status") != LIVE or row.get("lifecycle_status") != expected for row in rows):
        raise PipelineError(f"AI Tech lifecycle read-back has unexpected state; expected={expected}")


def run_snapshot_refresh() -> None:
    if not SNAPSHOT_SCRIPT.exists():
        raise PipelineError(f"Missing AI Tech snapshot script: {SNAPSHOT_SCRIPT}")
    completed = subprocess.run(
        [sys.executable, str(SNAPSHOT_SCRIPT), "--feed", "aitech"],
        cwd=ROOT,
        capture_output=True,
        text=True,
        timeout=300,
        env={**__import__("os").environ, "PYTHONDONTWRITEBYTECODE": "1"},
    )
    if completed.returncode != 0:
        detail = completed.stderr.strip() or completed.stdout.strip() or "unknown snapshot refresh failure"
        raise PipelineError(f"AI Tech snapshot refresh failed: {detail[-1500:]}")


def assert_snapshot_preflight() -> None:
    completed = subprocess.run(
        ["git", "-C", str(ROOT), "status", "--porcelain", "--", str(SNAPSHOT_PATH.relative_to(ROOT))],
        capture_output=True,
        text=True,
        check=True,
    )
    if completed.stdout.strip():
        raise PipelineError(f"AI Tech snapshot is dirty before transition: {completed.stdout.strip()}")


def production_aitech_slugs() -> set[str]:
    result: set[str] = set()
    for page in range(1, 31):
        path = "/aitech" if page == 1 else f"/aitech?page={page}"
        status, body = production_get(path)
        if status != 200:
            raise PipelineError(f"AI Tech production list failed on page {page}: HTTP {status}")
        found = set(re.findall(r'href="/aitech/([^"?#]+)', body))
        result.update(found)
        if not found and page > 1:
            break
    return result


def wait_for_aitech_slugs(target_slugs: set[str], should_contain: bool, timeout_seconds: int = 300) -> None:
    deadline = time.time() + timeout_seconds
    last: set[str] = set()
    while time.time() < deadline:
        last = production_aitech_slugs()
        present = target_slugs & last
        if (should_contain and present == target_slugs) or (not should_contain and not present):
            return
        time.sleep(5)
    raise PipelineError(f"AI Tech production snapshot did not reconcile: should_contain={should_contain}, present={sorted(target_slugs & last)}")


def verify_public_projections(target_slugs: set[str], weekly_slug: str, consolidated: bool) -> None:
    expected_present = not consolidated
    wait_for_aitech_slugs(target_slugs, should_contain=expected_present)
    checks = {
        "/": True,
        "/data": True,
        "/rss.xml": True,
        "/sitemap.xml": True,
        "/labs/blog": True,
        f"/lab/{weekly_slug}": True,
        f"/api/search?q={urllib.parse.quote('AI Tech Weekly Digest')}": True,
    }
    for path in checks:
        status, body = production_get(path)
        if status != 200:
            raise PipelineError(f"Public projection failed: {path} HTTP {status}")
        body_text = html.unescape(body)
        if path == f"/lab/{weekly_slug}" and weekly_slug not in body_text:
            raise PipelineError("Weekly detail URL does not contain its slug")
        if path == "/labs/blog" and weekly_slug not in body_text:
            raise PipelineError("Blog Automation Lab Project does not expose Weekly Digest")
        if path.startswith("/api/search") and weekly_slug not in body_text:
            raise PipelineError("Search projection does not expose Weekly Digest")
        if path in {"/", "/data", "/rss.xml", "/sitemap.xml"}:
            present = any(slug in body_text for slug in target_slugs)
            if present != expected_present:
                raise PipelineError(f"Projection lifecycle mismatch on {path}: present={present}, expected={expected_present}")
        if path in {"/rss.xml", "/sitemap.xml"} and weekly_slug not in body_text:
            raise PipelineError(f"Weekly Digest missing from {path}")
    for slug in target_slugs:
        status, body = production_get(f"/aitech/{slug}")
        if status != 200 or slug not in html.unescape(body):
            raise PipelineError(f"Consolidated detail URL is not accessible: /aitech/{slug} HTTP {status}")


def transition_with_reconciliation(
    ids: list[int],
    target_slugs: set[str],
    *,
    patch_fn: Callable[[list[int], str], Any] = patch_lifecycle,
    verify_fn: Callable[[list[int], str], None] = verify_lifecycle,
    refresh_fn: Callable[[], None] = run_snapshot_refresh,
    wait_fn: Callable[[set[str], bool], None] = wait_for_aitech_slugs,
    final_verify_fn: Callable[[], None] | None = None,
    reconciliation_verify_fn: Callable[[], None] | None = None,
) -> None:
    try:
        patch_fn(ids, CONSOLIDATED)
        verify_fn(ids, CONSOLIDATED)
        refresh_fn()
        wait_fn(target_slugs, False)
        if final_verify_fn:
            final_verify_fn()
    except Exception as exc:
        rollback_error: Exception | None = None
        try:
            patch_fn(ids, LIVE)
            verify_fn(ids, LIVE)
            refresh_fn()
            wait_fn(target_slugs, True)
            if reconciliation_verify_fn:
                reconciliation_verify_fn()
        except Exception as rollback_exc:  # pragma: no cover - exercised by operator failures
            rollback_error = rollback_exc
        if rollback_error:
            raise PipelineError(f"AI Tech transition failed and rollback/reconciliation failed: {rollback_error}") from exc
        raise PipelineError(f"AI Tech transition failed; rollback succeeded: {exc}") from exc


def run_pipeline(week_start: str, week_end: str, publish: bool, transition: bool, allow_public_publish: bool = False) -> int:
    if publish and not allow_public_publish:
        raise PipelineError("AI Tech Weekly public publish is paused; pass --allow-public-publish only after Phase 3 sign-off")
    if transition and not publish:
        raise PipelineError("--transition requires --publish")
    selection = select_week(week_start, week_end)
    path, content, clusters = generate_artifact(selection)
    print(json.dumps({
        "mode": "publish" if publish else "dry-run",
        "artifact": str(path),
        "week": [week_start, week_end],
        "daily_article_count": len(selection["articles"]),
        "event_cluster_count": len(clusters),
        "core_event_count": len(select_core_events(selection["articles"], clusters)[0]),
        "roundup_count": len(select_core_events(selection["articles"], clusters)[1]),
        "merged_duplicate_count": sum(max(0, len(cluster["articles"]) - 1) for cluster in clusters),
        "source_quality_counts": dict(sorted(Counter(row["source_quality"] for row in selection["articles"]).items())),
        "selected_ids": [row["id"] for row in selection["articles"]],
    }, ensure_ascii=False, indent=2))
    if not publish:
        return 0

    result = publish_weekly(selection, content, allow_public_publish=allow_public_publish)
    weekly_slug = f"{WEEKLY_ROUTE_PREFIX}{week_start}"
    target_slugs = {row["slug"] for row in selection["posts"]}
    ids = [int(row["id"]) for row in selection["posts"]]
    print(json.dumps({"weekly_publish": result, "weekly_slug": weekly_slug}, ensure_ascii=False))
    if not transition:
        return 0

    rows = fetch_selected_rows(ids)
    mode = lifecycle_preflight(rows)
    if mode == "already_consolidated":
        verify_public_projections(target_slugs, weekly_slug, consolidated=True)
        print("AI Tech lifecycle already consolidated; production projections verified.")
        return 0
    assert_snapshot_preflight()
    verify_public_projections(target_slugs, weekly_slug, consolidated=False)
    transition_with_reconciliation(
        ids,
        target_slugs,
        final_verify_fn=lambda: verify_public_projections(target_slugs, weekly_slug, consolidated=True),
        reconciliation_verify_fn=lambda: verify_public_projections(target_slugs, weekly_slug, consolidated=False),
    )
    print("AI Tech Weekly Digest publish, lifecycle transition, snapshot, and projection verification completed.")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--week-start", default="2026-08-18")
    parser.add_argument("--week-end", default="2026-08-24")
    parser.add_argument("--publish", action="store_true")
    parser.add_argument("--allow-public-publish", action="store_true", help="explicitly lift the Phase 3 public publish pause")
    parser.add_argument("--transition", action="store_true")
    args = parser.parse_args()
    return run_pipeline(args.week_start, args.week_end, args.publish, args.transition, args.allow_public_publish)


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"AI Tech Weekly pipeline failed: {exc}", file=sys.stderr)
        raise SystemExit(1)
