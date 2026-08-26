#!/usr/bin/env python3
"""StockPulse weekly Lab Note pipeline with guarded first consolidation.

Default mode is read-only.  ``--publish`` publishes the deterministic Weekly
Lab Note after validation and production read-back.  ``--transition`` may be
used only together with ``--publish`` and changes only the selected daily
StockPulse rows after the Weekly Note is verified in production.
"""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from collections import Counter, defaultdict
from datetime import date, timedelta
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
ENV_PATH = ROOT / ".env.local"
SNAPSHOT_PATH = ROOT / "src" / "data" / "stockpulse-snapshot.json"
SNAPSHOT_SCRIPT = ROOT / "scripts" / "refresh_stockpulse_snapshot.py"
SITE_URL = "https://devsnack-blog.vercel.app"
STOCKPULSE_BLOG_ID = "stockpulse"
WEEKLY_ROUTE_PREFIX = "stockpulse-weekly-"
AUTOMATED_FEED_LIVE = "live"
CONSOLIDATED = "consolidated"

sys.path.insert(0, "/home/kahros/workspace/vercel-blog/scripts")
from devsnack_direct_publish import DirectPublisher  # type: ignore[reportMissingImports]  # noqa: E402
from public_content_safety import inspect_public_content  # type: ignore[reportMissingImports]  # noqa: E402
from stockpulse_weekly import build_weekly_note, validate_weekly_note  # noqa: E402


class PipelineError(RuntimeError):
    pass


def load_env(path: Path = ENV_PATH) -> dict[str, str]:
    values: dict[str, str] = {}
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
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
    headers = {
        "Accept": "application/json",
        "apikey": key,
        "Authorization": f"Bearer {key}",
    }
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


def report_date_from_slug(slug: str) -> str | None:
    match = re.match(r"^(\d{4}-\d{2}-\d{2})-", slug)
    return match.group(1) if match else None


def weekday_dates(start: str, end_inclusive: str) -> list[str]:
    first = date.fromisoformat(start)
    last = date.fromisoformat(end_inclusive)
    if last < first:
        raise PipelineError("week end must not be before week start")
    result: list[str] = []
    current = first
    while current <= last:
        if current.weekday() < 5:
            result.append(current.isoformat())
        current += timedelta(days=1)
    return result


def fetch_period_data(week_start: str, week_end: str) -> dict[str, Any]:
    dates = weekday_dates(week_start, week_end)
    start_exclusive = (date.fromisoformat(week_end) + timedelta(days=1)).isoformat()
    all_posts = rest_request(
        "GET",
        "posts",
        [
            ("select", "id,slug,title,published,updated,status,lifecycle_status"),
            ("blog_id", "eq.stockpulse"),
            ("limit", "5000"),
        ],
    )
    if not isinstance(all_posts, list):
        raise PipelineError("StockPulse post response is not a list")
    posts = [row for row in all_posts if report_date_from_slug(str(row.get("slug") or "")) in dates]

    predictions = rest_request(
        "GET",
        "predictions",
        [
            ("select", "*"),
            ("date", f"gte.{week_start}"),
            ("date", f"lt.{start_exclusive}"),
            ("order", "date.asc"),
            ("limit", "5000"),
        ],
    )
    if not isinstance(predictions, list):
        raise PipelineError("prediction response is not a list")

    all_lab_notes = rest_request(
        "GET",
        "posts",
        [
            ("select", "id,slug,title,published,updated,status,lifecycle_status,content"),
            ("blog_id", "eq.lab"),
            ("slug", "like.stockpulse-self-*"),
            ("limit", "5000"),
        ],
    )
    if not isinstance(all_lab_notes, list):
        raise PipelineError("Lab Note response is not a list")
    lab_notes = [row for row in all_lab_notes if str(row.get("slug") or "") in {f"stockpulse-self-{item}" for item in dates}]

    by_post_date = Counter(report_date_from_slug(str(row.get("slug") or "")) for row in posts)
    by_prediction_date_session = Counter((str(row.get("date")), str(row.get("session"))) for row in predictions)
    by_lab_date = Counter(str(row.get("slug") or "").removeprefix("stockpulse-self-") for row in lab_notes)
    if set(by_post_date) != set(dates) or any(by_post_date[item] != 2 for item in dates):
        raise PipelineError(f"Expected exactly two StockPulse daily posts per date: {dict(by_post_date)}")
    if any(by_prediction_date_session[(item, session)] != 1 for item in dates for session in ("morning", "ml")):
        raise PipelineError(f"Expected exactly one morning and one ml prediction per date: {dict(by_prediction_date_session)}")
    if set(by_lab_date) != set(dates) or any(by_lab_date[item] != 1 for item in dates):
        raise PipelineError(f"Expected exactly one daily Lab Note per date: {dict(by_lab_date)}")
    if any(row.get("status") != "live" or row.get("lifecycle_status") != "live" for row in posts):
        raise PipelineError("Selected daily rows are not all status=live and lifecycle_status=live")

    return {
        "dates": dates,
        "posts": sorted(posts, key=lambda row: (report_date_from_slug(str(row.get("slug") or "")) or "", row.get("published") or "")),
        "predictions": sorted(predictions, key=lambda row: (str(row.get("date") or ""), str(row.get("session") or ""))),
        "lab_notes": sorted(lab_notes, key=lambda row: str(row.get("slug") or "")),
    }


def action_summary(lab_notes: list[dict[str, Any]]) -> dict[str, str]:
    result: dict[str, str] = {}
    for note in lab_notes:
        slug = str(note.get("slug") or "")
        report_date = slug.removeprefix("stockpulse-self-")
        content = str(note.get("content") or "")
        marker = "### 📝 적용된 개선 액션"
        tail = content.split(marker, 1)[1] if marker in content else ""
        tail = tail.split("###", 1)[0]
        llm_match = re.search(r"\*\*🧠 LLM:\*\*.*?\n\n(.*?)(?=\n\n>|\n\n\*\*🤖 ML:)", tail, re.DOTALL)
        ml_match = re.search(r"\*\*🤖 ML:\*\*.*?\n\n(.*?)(?=\n\n>|\Z)", tail, re.DOTALL)
        llm = re.sub(r"\s+", " ", (llm_match.group(1) if llm_match else "")).strip()
        ml = re.sub(r"\s+", " ", (ml_match.group(1) if ml_match else "")).strip()
        if llm:
            result[f"{report_date} LLM"] = f"LLM prompt: {llm[:360]}"
        if ml:
            result[f"{report_date} ML"] = f"ML feature: {ml[:360]}"
    return result


def build_period(week_start: str, week_end: str) -> dict[str, Any]:
    current = fetch_period_data(week_start, week_end)
    previous_start = (date.fromisoformat(week_start) - timedelta(days=7)).isoformat()
    previous_end = (date.fromisoformat(week_end) - timedelta(days=7)).isoformat()
    previous = fetch_period_data(previous_start, previous_end)
    return {
        "current": current,
        "previous": previous,
        "previous_range": (previous_start, previous_end),
    }


def artifact_path(week_start: str) -> Path:
    return ROOT / "docs" / "phase2-stockpulse" / f"stockpulse-weekly-{week_start}.md"


def generate_artifact(week_start: str, week_end: str) -> tuple[Path, str, dict[str, Any]]:
    periods = build_period(week_start, week_end)
    current = periods["current"]
    previous = periods["previous"]
    note = build_weekly_note(
        week_start=week_start,
        week_end=week_end,
        predictions=current["predictions"],
        previous_predictions=previous["predictions"],
        stockpulse_posts=current["posts"],
        lab_note_slugs=[str(row["slug"]) for row in current["lab_notes"]],
        applied_actions=action_summary(current["lab_notes"]),
    )
    validate_weekly_note(note, expected_dates=current["dates"])
    safety = inspect_public_content(
        note,
        title=f"StockPulse 주간 자기개선 실험 — {week_start}~{week_end}",
        seo_desc="StockPulse 주간 자기개선 실험 기록",
    )
    if safety.decision == "BLOCK":
        raise PipelineError(f"Weekly public-content safety BLOCK: {safety.summary()}")
    path = artifact_path(week_start)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(note, encoding="utf-8")
    return path, note, periods


def production_get(path: str) -> tuple[int, str]:
    request = urllib.request.Request(SITE_URL + path, headers={"User-Agent": "Mozilla/5.0"})
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            return response.status, response.read().decode("utf-8", errors="replace")
    except urllib.error.HTTPError as exc:
        return exc.code, exc.read().decode("utf-8", errors="replace")


def verify_weekly_production(slug: str, note: str) -> None:
    status, body = production_get(f"/lab/{slug}")
    if status != 200:
        raise PipelineError(f"Weekly Lab Note production read-back failed: HTTP {status}")
    for marker in ("주간 지표", "일별 compact result", "전주 대비 변화", "다음 주 변경사항"):
        if marker not in body:
            raise PipelineError(f"Weekly Lab Note production read-back missing marker: {marker}")
    if "37.5%" not in body or "0.4875" not in body or "0.2125" not in body:
        raise PipelineError("Weekly Lab Note production read-back missing expected calculated metrics")


def publish_weekly(week_start: str, week_end: str, note: str) -> dict[str, Any]:
    slug = f"{WEEKLY_ROUTE_PREFIX}{week_start}"
    title = f"StockPulse 주간 자기개선 실험 — {week_start}~{week_end}"
    publisher = DirectPublisher(blog_id="lab", route_prefix="lab")
    result = publisher.publish(
        title=title,
        slug=slug,
        content=note,
        labels=["stockpulse", "AI 실험", "자기개선", "주간 기록"],
        seo_desc=f"StockPulse 주간 자기개선 실험 — {week_start}~{week_end}",
        provenance={
            "kind": "stockpulse_weekly_lab_note",
            "pipeline": "stockpulse-self-improvement",
            "week_start": week_start,
            "week_end": week_end,
            "daily_output_count": 8,
            "prediction_count": 8,
            "human_reviewed": False,
        },
    )
    verify_weekly_production(slug, note)
    return result


def fetch_selected_rows(ids: list[int]) -> list[dict[str, Any]]:
    if not ids:
        raise PipelineError("No lifecycle transition IDs selected")
    id_filter = f"in.({','.join(str(item) for item in ids)})"
    rows = rest_request(
        "GET",
        "posts",
        [
            ("select", "id,slug,title,status,lifecycle_status,blog_id"),
            ("id", id_filter),
            ("blog_id", "eq.stockpulse"),
            ("limit", "5000"),
        ],
    )
    if not isinstance(rows, list):
        raise PipelineError("Selected row response is not a list")
    return rows


def patch_lifecycle(ids: list[int], lifecycle_status: str) -> list[dict[str, Any]]:
    id_filter = f"in.({','.join(str(item) for item in ids)})"
    rows = rest_request(
        "PATCH",
        "posts",
        [
            ("id", id_filter),
            ("blog_id", "eq.stockpulse"),
            ("status", "eq.live"),
        ],
        {"lifecycle_status": lifecycle_status},
    )
    if not isinstance(rows, list):
        raise PipelineError("Lifecycle PATCH returned no row representation")
    return rows


def verify_lifecycle(ids: list[int], expected: str) -> None:
    rows = fetch_selected_rows(ids)
    expected_ids = set(ids)
    actual_ids = {int(row["id"]) for row in rows}
    if actual_ids != expected_ids:
        raise PipelineError(f"Lifecycle read-back IDs differ: expected={sorted(expected_ids)} actual={sorted(actual_ids)}")
    if any(row.get("status") != "live" or row.get("lifecycle_status") != expected for row in rows):
        raise PipelineError(f"Lifecycle read-back has unexpected status for expected={expected}")


def run_snapshot_refresh() -> None:
    if not SNAPSHOT_SCRIPT.exists():
        raise PipelineError(f"Missing snapshot script: {SNAPSHOT_SCRIPT}")
    completed = subprocess.run(
        [sys.executable, str(SNAPSHOT_SCRIPT)],
        cwd=ROOT,
        capture_output=True,
        text=True,
        timeout=240,
        env={**__import__("os").environ, "PYTHONDONTWRITEBYTECODE": "1"},
    )
    if completed.returncode != 0:
        detail = completed.stderr.strip() or completed.stdout.strip() or "unknown snapshot refresh failure"
        raise PipelineError(f"StockPulse snapshot refresh failed: {detail[-1500:]}")


def production_stock_slugs() -> set[str]:
    slugs: set[str] = set()
    for page in range(1, 12):
        path = "/stock" if page == 1 else f"/stock?page={page}"
        status, body = production_get(path)
        if status != 200:
            raise PipelineError(f"StockPulse production list read-back failed on page {page}: HTTP {status}")
        found = set(re.findall(r'href="/stock/([^"?#]+)"', body))
        slugs.update(found)
        if not found and page > 1:
            break
    return slugs


def wait_for_snapshot(target_slugs: set[str], should_contain: bool, timeout_seconds: int = 240) -> None:
    deadline = time.time() + timeout_seconds
    last: set[str] = set()
    while time.time() < deadline:
        last = production_stock_slugs()
        present = target_slugs & last
        if (not should_contain and not present) or (should_contain and present == target_slugs):
            return
        time.sleep(5)
    state = "present" if should_contain else "absent"
    raise PipelineError(f"Vercel Stock snapshot did not reach expected target={state}; intersection={sorted(target_slugs & last)}")


def verify_public_projections(target_slugs: set[str], should_contain: bool) -> None:
    expected_state = "present" if should_contain else "absent"
    local = json.loads(SNAPSHOT_PATH.read_text(encoding="utf-8"))
    local_slugs = {str(row.get("slug")) for row in local.get("posts", [])}
    local_present = target_slugs & local_slugs
    if (should_contain and local_present != target_slugs) or (not should_contain and local_present):
        raise PipelineError(f"Local StockPulse snapshot mismatch; expected target {expected_state}: {sorted(local_present)}")

    for path in ["/rss.xml", "/sitemap.xml", "/", "/data", "/labs/stockpulse-ai-self-improvement", "/api/search?q=StockPulse"]:
        status, body = production_get(path)
        if status != 200:
            raise PipelineError(f"Projection {path} returned HTTP {status}")
        present = {slug for slug in target_slugs if slug in body}
        if not should_contain and present:
            raise PipelineError(f"Projection {path} still exposes consolidated target slugs: {sorted(present)}")
        if should_contain and "<html" not in body.lower() and path not in {"/rss.xml", "/sitemap.xml", "/api/search?q=StockPulse"}:
            raise PipelineError(f"Projection {path} returned an unexpected body during reconciliation")


def verify_detail_routes(rows: list[dict[str, Any]]) -> None:
    for row in rows:
        slug = str(row["slug"])
        status, body = production_get(f"/stock/{slug}")
        if status != 200 or str(row.get("title") or "") not in body:
            raise PipelineError(f"StockPulse detail URL was not preserved: {slug}, HTTP {status}")


def transition_with_reconciliation(rows: list[dict[str, Any]]) -> dict[str, Any]:
    ids = [int(row["id"]) for row in rows]
    slugs = {str(row["slug"]) for row in rows}
    if any(row.get("status") != "live" or row.get("lifecycle_status") != "live" for row in rows):
        raise PipelineError("Transition preflight requires all selected rows to be status=live/lifecycle=live")
    try:
        patched = patch_lifecycle(ids, CONSOLIDATED)
        if {int(row["id"]) for row in patched} != set(ids):
            raise PipelineError("Lifecycle PATCH did not return exactly the selected IDs")
        verify_lifecycle(ids, CONSOLIDATED)
        run_snapshot_refresh()
        wait_for_snapshot(slugs, should_contain=False)
        verify_public_projections(slugs, should_contain=False)
        verify_detail_routes(rows)
        return {"status": "consolidated", "ids": ids, "slugs": sorted(slugs), "reconciled": False}
    except Exception as original_error:
        try:
            patch_lifecycle(ids, AUTOMATED_FEED_LIVE)
            verify_lifecycle(ids, AUTOMATED_FEED_LIVE)
            run_snapshot_refresh()
            wait_for_snapshot(slugs, should_contain=True)
            verify_public_projections(slugs, should_contain=True)
            verify_detail_routes(rows)
        except Exception as rollback_error:
            raise PipelineError(f"Transition failed and reconciliation failed: original={original_error}; rollback={rollback_error}") from rollback_error
        raise PipelineError(f"Transition failed; DB and snapshot reconciled back to live: {original_error}") from original_error


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--week-start", default="2026-08-18")
    parser.add_argument("--week-end", default="2026-08-21")
    parser.add_argument("--publish", action="store_true", help="publish after deterministic validation and artifact generation")
    parser.add_argument("--transition", action="store_true", help="after publish/read-back, consolidate the exact week's StockPulse daily rows")
    args = parser.parse_args()
    if args.transition and not args.publish:
        raise PipelineError("--transition requires --publish so Weekly production read-back happens first")

    path, note, periods = generate_artifact(args.week_start, args.week_end)
    current = periods["current"]
    print(f"Weekly artifact: {path}")
    print(f"Selection: dates={current['dates']} posts={len(current['posts'])} predictions={len(current['predictions'])} lab_notes={len(current['lab_notes'])}")
    print("Weekly validation: PASS")
    if not args.publish:
        print("DRY RUN: no Weekly post published and no lifecycle row changed.")
        return 0

    published = publish_weekly(args.week_start, args.week_end, note)
    weekly_slug = f"{WEEKLY_ROUTE_PREFIX}{args.week_start}"
    print(f"Weekly production read-back: PASS ({published['url']})")
    if not args.transition:
        print("Publish-only mode: daily lifecycle rows remain live.")
        return 0

    result = transition_with_reconciliation(current["posts"])
    print(json.dumps(result, ensure_ascii=False))
    print("Lifecycle transition and projection verification: PASS")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"StockPulse weekly pipeline failed: {exc}", file=sys.stderr)
        raise SystemExit(1)
