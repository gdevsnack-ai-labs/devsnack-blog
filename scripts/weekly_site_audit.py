#!/usr/bin/env python3
"""Run a read-only, change-aware weekly audit of the DevSnack site."""
from __future__ import annotations

import argparse
import concurrent.futures
import datetime as dt
import html
import json
import os
import re
import subprocess
import sys
import textwrap
import urllib.error
import urllib.request
import xml.etree.ElementTree as ET
from dataclasses import asdict, dataclass
from html.parser import HTMLParser
from pathlib import Path
from typing import Any
from urllib.parse import urljoin, urlparse

REPO_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_BASE_URL = "https://devsnack-blog.vercel.app"
DEFAULT_OUTPUT_DIR = Path("/home/kahros/yura_workspace/outputs/devsnack-weekly-site-audit")
STOCKPULSE_PROJECTION = REPO_ROOT / "src/data/stockpulse-v1-fixed-projection.json"
STOCKPULSE_PRIVATE_ROOT = Path("/home/kahros/content-factory/stock-pulse/v1-fixed")
STOCKPULSE_PUBLICATION_ROOT = "https://gdevsnack-ai-labs.github.io/stockpulse-v1-fixed-publication"
USER_AGENT = "devsnack-weekly-site-audit/1.0"
SEVERITY_RANK = {"PASS": 0, "UNVERIFIED": 1, "WARN": 2, "BLOCK": 3}
STATIC_SITEMAP_EXEMPTIONS = {"/stock", "/aitech", "/lab", "/misc"}
KNOWN_RETIRED_PREFIXES = ("/aitech/", "/stock/")


@dataclass(frozen=True)
class Finding:
    severity: str
    area: str
    message: str
    observed: Any = None
    expected: Any = None
    evidence: Any = None

    def as_dict(self) -> dict[str, Any]:
        return {key: value for key, value in asdict(self).items() if value is not None}


class DocumentParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.title = ""
        self.h1 = ""
        self.h2s: list[str] = []
        self.hrefs: list[str] = []
        self.visible_parts: list[str] = []
        self._skip_depth = 0
        self._capture: str | None = None
        self._capture_parts: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        tag = tag.lower()
        values = {key.lower(): value or "" for key, value in attrs}
        if tag in {"script", "style", "noscript"}:
            self._skip_depth += 1
            return
        if tag == "a" and values.get("href"):
            self.hrefs.append(values["href"])
        if tag in {"title", "h1", "h2"} and self._capture is None:
            self._capture = tag
            self._capture_parts = []

    def handle_endtag(self, tag: str) -> None:
        tag = tag.lower()
        if tag in {"script", "style", "noscript"} and self._skip_depth:
            self._skip_depth -= 1
            return
        if tag == self._capture:
            value = normalize_text(" ".join(self._capture_parts))
            if tag == "title":
                self.title = value
            elif tag == "h1":
                self.h1 = value
            elif tag == "h2":
                self.h2s.append(value)
            self._capture = None
            self._capture_parts = []

    def handle_data(self, data: str) -> None:
        if self._skip_depth:
            return
        self.visible_parts.append(data)
        if self._capture:
            self._capture_parts.append(data)

    @property
    def visible_text(self) -> str:
        return normalize_text(" ".join(self.visible_parts))


def normalize_text(value: str) -> str:
    return re.sub(r"\s+", " ", html.unescape(value)).strip()


def parse_document(body: str) -> DocumentParser:
    parser = DocumentParser()
    parser.feed(body)
    parser.close()
    return parser


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


HTTP_OPENER = urllib.request.build_opener(NoRedirect)


def fetch_url(url: str, timeout: int = 30) -> tuple[int, dict[str, str], str]:
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": "*/*"})
    try:
        with HTTP_OPENER.open(request, timeout=timeout) as response:
            return response.status, dict(response.headers), response.read().decode("utf-8", "replace")
    except urllib.error.HTTPError as error:
        return error.code, dict(error.headers), error.read().decode("utf-8", "replace")
    except Exception as error:  # pragma: no cover - live network failure
        return 0, {}, f"AUDIT_FETCH_ERROR {type(error).__name__}"


def route_from_page_file(relative_path: str) -> str | None:
    path = Path(relative_path).as_posix()
    if not path.startswith("src/app/"):
        return None
    parts = path.split("/")
    filename = parts[-1]
    if filename not in {"page.tsx", "page.ts", "page.jsx", "page.js"}:
        return None
    segments = [part for part in parts[2:-1] if not (part.startswith("(") and part.endswith(")")) and not part.startswith("@")]
    return "/" + "/".join(segments) if segments else "/"


def classify_changed_file(relative_path: str) -> str:
    path = Path(relative_path).as_posix()
    if path.startswith("src/app/") and any(name in Path(path).name for name in ("sitemap", "rss", "robots")):
        return "syndication"
    if path.startswith("src/app/") and Path(path).name in {"page.tsx", "page.ts", "page.jsx", "page.js", "layout.tsx", "layout.ts", "route.ts", "route.js"}:
        return "routes"
    if path.startswith("src/components/") or path.startswith("src/config/"):
        return "ia-or-ui"
    if path.startswith("src/data/") or path.startswith("src/lib/seo/") or path.startswith("src/lib/ia/"):
        return "data-or-seo"
    if path.startswith("scripts/"):
        return "audit-or-pipeline"
    if "/tests/" in f"/{path}" or path.startswith("tests/") or path.endswith("_test.py") or path.endswith(".test.ts"):
        return "tests"
    return "other"


def sitemap_coverage_findings(
    candidate_routes: list[str],
    sitemap_paths: set[str],
    *,
    exempt_routes: set[str] | None = None,
) -> list[dict[str, Any]]:
    exemptions = STATIC_SITEMAP_EXEMPTIONS | (exempt_routes or set())
    findings: list[dict[str, Any]] = []
    for route in sorted(set(candidate_routes)):
        if not route or "[" in route or route in exemptions:
            continue
        if route not in sitemap_paths:
            findings.append(
                Finding(
                    "BLOCK",
                    "ia-sitemap",
                    f"changed public route {route} is missing from sitemap",
                    observed=route,
                    expected="route appears in the intended indexable sitemap set",
                ).as_dict()
            )
    return findings


def rss_contract_findings(body: str, feed_path: str, public_detail_paths: list[str]) -> list[dict[str, Any]]:
    findings: list[dict[str, Any]] = []
    try:
        ET.fromstring(body)
    except ET.ParseError:
        return [Finding("BLOCK", "rss", f"{feed_path} is not well-formed RSS/XML").as_dict()]

    links = [html.unescape(value).strip() for value in re.findall(r"<link>(.*?)</link>", body, flags=re.IGNORECASE | re.DOTALL)]
    item_count = len(re.findall(r"<item(?:\s|>)", body, flags=re.IGNORECASE))
    if public_detail_paths and item_count == 0:
        findings.append(
            Finding(
                "BLOCK",
                "rss",
                f"{feed_path} has 0 items while public detail routes exist",
                observed={"item_count": item_count, "detail_count": len(public_detail_paths)},
                expected="at least one eligible item",
            ).as_dict()
        )
    for link in links:
        path = urlparse(link).path.rstrip("/") or "/"
        if path.startswith(KNOWN_RETIRED_PREFIXES):
            findings.append(Finding("BLOCK", "rss", f"{feed_path} contains retired detail URL", observed=path).as_dict())
    return list({json.dumps(item, ensure_ascii=False, sort_keys=True): item for item in findings}.values())


def _strip_comments_and_tags(body: str) -> str:
    without_comments = re.sub(r"<!--.*?-->", "", body, flags=re.DOTALL)
    return normalize_text(re.sub(r"<[^>]+>", " ", without_comments))


def stockpulse_visible_findings(
    body: str,
    *,
    trading_date: str,
    expected_publication_paths: list[str],
    expected_applied: int,
    expected_pending: int,
) -> list[dict[str, Any]]:
    findings: list[dict[str, Any]] = []
    month_day = f"{trading_date[5:7]}/{trading_date[8:10]}"
    visible = _strip_comments_and_tags(body)
    if f"최근 run · {month_day}" not in visible:
        findings.append(
            Finding(
                "BLOCK",
                "stockpulse-production",
                "Vercel Lab visible latest run is stale or missing",
                observed=visible[:500],
                expected=f"최근 run · {month_day}",
            ).as_dict()
        )
    missing_paths = [path for path in expected_publication_paths if path not in body]
    if missing_paths:
        findings.append(
            Finding(
                "BLOCK",
                "stockpulse-publication",
                "Vercel Lab is missing current publication link(s)",
                observed=missing_paths,
                expected=expected_publication_paths,
            ).as_dict()
        )
    applied = visible.count("설정 반영 완료")
    pending = visible.count("반영 대기")
    if applied != expected_applied or pending != expected_pending:
        findings.append(
            Finding(
                "BLOCK",
                "stockpulse-improvement",
                "Vercel Lab improvement lifecycle counts disagree with projection",
                observed={"applied": applied, "pending": pending},
                expected={"applied": expected_applied, "pending": expected_pending},
            ).as_dict()
        )
    return findings


def audit_status(findings: list[dict[str, Any]]) -> str:
    if not findings:
        return "PASS"
    return max((str(item.get("severity", "WARN")) for item in findings), key=lambda value: SEVERITY_RANK.get(value, 2))


def _git(repo: Path, *args: str, timeout: int = 60) -> subprocess.CompletedProcess[str]:
    return subprocess.run(["git", "-C", str(repo), *args], capture_output=True, text=True, timeout=timeout, check=False)


def repository_heads(repo: Path) -> dict[str, Any]:
    local = _git(repo, "rev-parse", "HEAD")
    remote = _git(repo, "ls-remote", "origin", "refs/heads/main")
    return {
        "local_head": local.stdout.strip() if local.returncode == 0 else None,
        "remote_head": remote.stdout.split()[0] if remote.returncode == 0 and remote.stdout.split() else None,
        "remote_match": local.returncode == 0 and remote.returncode == 0 and bool(remote.stdout.split()) and local.stdout.strip() == remote.stdout.split()[0],
    }


def latest_previous_audit(output_dir: Path) -> dict[str, Any] | None:
    candidates = []
    if output_dir.is_dir():
        for path in output_dir.glob("*.json"):
            try:
                payload = json.loads(path.read_text(encoding="utf-8"))
            except (OSError, json.JSONDecodeError):
                continue
            if isinstance(payload, dict) and payload.get("audited_at"):
                candidates.append(payload)
    return max(candidates, key=lambda item: str(item.get("audited_at"))) if candidates else None


def git_change_window(repo: Path, since: str) -> tuple[list[dict[str, str]], list[str]]:
    commits_result = _git(repo, "log", f"--since={since}", "--format=%H%x09%cI%x09%s")
    commits: list[dict[str, str]] = []
    if commits_result.returncode == 0:
        for line in commits_result.stdout.splitlines():
            parts = line.split("\t", 2)
            if len(parts) == 3:
                commits.append({"sha": parts[0], "committed_at": parts[1], "subject": parts[2]})
    files_result = _git(repo, "log", f"--since={since}", "--format=", "--name-only")
    files = sorted({line.strip() for line in files_result.stdout.splitlines() if line.strip()}) if files_result.returncode == 0 else []
    return commits, files


def _redact_output(value: str) -> str:
    value = re.sub(r"(?i)(authorization\s*:\s*bearer\s+|api[_ -]?key\s*[:=]\s*|access[_ -]?token\s*[:=]\s*)\S+", r"\1[REDACTED]", value)
    return value.replace("/home/kahros/workspace/vercel-blog/devsnack-blog/.env.local", "[REDACTED_ENV]")


def run_command(label: str, command: list[str], *, env: dict[str, str], timeout: int = 600) -> tuple[dict[str, Any], list[dict[str, Any]]]:
    try:
        completed = subprocess.run(command, cwd=REPO_ROOT, env=env, capture_output=True, text=True, timeout=timeout, check=False)
        output_lines = [line for line in (completed.stdout + "\n" + completed.stderr).splitlines() if line.strip()]
        summary = [_redact_output(line)[:500] for line in (output_lines[:2] + output_lines[-3:])]
        gate = {"status": "PASS" if completed.returncode == 0 else "BLOCK", "exit_code": completed.returncode, "summary": list(dict.fromkeys(summary))}
        findings = [] if completed.returncode == 0 else [Finding("BLOCK", "repository-audit", f"{label} failed", observed=gate["summary"], expected="exit code 0", evidence=label).as_dict()]
        return gate, findings
    except subprocess.TimeoutExpired:
        gate = {"status": "BLOCK", "exit_code": None, "summary": ["timeout"]}
        return gate, [Finding("BLOCK", "repository-audit", f"{label} timed out", expected="completed within the audit timeout", evidence=label).as_dict()]
    except OSError as error:
        gate = {"status": "UNVERIFIED", "exit_code": None, "summary": [type(error).__name__]}
        return gate, [Finding("UNVERIFIED", "repository-audit", f"{label} could not run", observed=type(error).__name__, evidence=label).as_dict()]


def _load_json(path: Path) -> dict[str, Any] | None:
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return None
    return value if isinstance(value, dict) else None


def _sitemap_paths(body: str) -> set[str]:
    try:
        root = ET.fromstring(body)
        namespace = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
        values = [node.text for node in root.findall(".//sm:loc", namespace) if node.text]
    except ET.ParseError:
        values = re.findall(r"<loc>(.*?)</loc>", body, flags=re.IGNORECASE | re.DOTALL)
    return {urlparse(html.unescape(value)).path.rstrip("/") or "/" for value in values}


def _load_final_lifecycle(path: Path) -> dict[str, str]:
    result: dict[str, str] = {}
    if not path.is_file():
        return result
    for line in path.read_text(encoding="utf-8").splitlines():
        if not line.strip():
            continue
        try:
            event = json.loads(line)
        except json.JSONDecodeError:
            continue
        if not isinstance(event, dict):
            continue
        proposal_id = event.get("proposal_id")
        status = event.get("lifecycle_status") or event.get("status")
        if isinstance(proposal_id, str) and status in {"proposed", "approved", "applied", "rejected", "failed"}:
            result[proposal_id] = status
    return result


def _check_stockpulse(base_url: str) -> tuple[dict[str, Any], list[dict[str, Any]]]:
    projection = _load_json(STOCKPULSE_PROJECTION)
    if projection is None:
        return {"status": "BLOCK"}, [Finding("BLOCK", "stockpulse-projection", "StockPulse projection is missing or invalid", evidence=str(STOCKPULSE_PROJECTION)).as_dict()]
    findings: list[dict[str, Any]] = []
    source_manifest = projection.get("source_manifest", {})
    trading_date = source_manifest.get("trading_date")
    run_id = source_manifest.get("run_id")
    if not isinstance(trading_date, str) or not isinstance(run_id, str):
        return {"status": "BLOCK"}, [Finding("BLOCK", "stockpulse-projection", "StockPulse projection lacks current source identity").as_dict()]
    private_run = STOCKPULSE_PRIVATE_ROOT / "runs" / run_id / "run.json"
    if not private_run.is_file():
        findings.append(Finding("BLOCK", "stockpulse-source", "current StockPulse private run is missing", observed=run_id).as_dict())

    current_run = (projection.get("runs", {}).get("records") or [{}])[0]
    publications = current_run.get("publications", {}) if isinstance(current_run, dict) else {}
    expected_paths = [item["path"] for item in publications.values() if isinstance(item, dict) and item.get("status") == "available" and isinstance(item.get("path"), str) and item["path"].strip()]
    improvements = projection.get("improvements", {}).get("records", [])
    snapshot = projection.get("snapshot", {})
    applied_count = sum(1 for item in improvements if isinstance(item, dict) and item.get("actual_applied") is True)
    pending_count = sum(1 for item in improvements if isinstance(item, dict) and item.get("status") in {"proposed", "approved"})
    journal = _load_final_lifecycle(STOCKPULSE_PRIVATE_ROOT / "improvements/journal.jsonl")
    journal_for_projection = {key: value for key, value in journal.items() if any(isinstance(item, dict) and item.get("proposal_id") == key for item in improvements)}
    journal_applied = sum(1 for value in journal_for_projection.values() if value == "applied")
    journal_pending = sum(1 for value in journal_for_projection.values() if value in {"proposed", "approved"})
    if journal_for_projection and (journal_applied != applied_count or journal_pending != pending_count):
        findings.append(Finding("BLOCK", "stockpulse-improvement", "shared journal and projection improvement counts disagree", observed={"journal": {"applied": journal_applied, "pending": journal_pending}, "projection": {"applied": applied_count, "pending": pending_count}}).as_dict())

    status, headers, body = fetch_url(f"{base_url}/labs/stockpulse-v1-fixed")
    if status != 200:
        findings.append(Finding("BLOCK" if status else "UNVERIFIED", "stockpulse-production", "StockPulse V1 Fixed Lab could not be read", observed=status, expected=200, evidence="/labs/stockpulse-v1-fixed").as_dict())
    else:
        findings.extend(stockpulse_visible_findings(body, trading_date=trading_date, expected_publication_paths=expected_paths, expected_applied=applied_count, expected_pending=pending_count))
        for path in expected_paths:
            path_status, _, _ = fetch_url(f"{STOCKPULSE_PUBLICATION_ROOT}/{path.lstrip('/')}")
            if path_status != 200:
                findings.append(Finding("BLOCK" if path_status else "UNVERIFIED", "stockpulse-publication", "available StockPulse publication is not readable", observed={"path": path, "status": path_status}, expected=200).as_dict())
    gate = {"status": audit_status(findings), "trading_date": trading_date, "run_id": run_id, "available_publications": len(expected_paths), "improvement_counts": {"applied": applied_count, "pending": pending_count}, "headers": {key.lower(): value for key, value in headers.items() if key.lower() in {"cache-control", "x-vercel-id"}}}
    return gate, findings


def _check_site(base_url: str, changed_files: list[str]) -> tuple[dict[str, Any], list[dict[str, Any]]]:
    findings: list[dict[str, Any]] = []
    status, headers, sitemap_body = fetch_url(f"{base_url}/sitemap.xml")
    sitemap_paths: set[str] = set()
    if status != 200:
        findings.append(Finding("BLOCK" if status else "UNVERIFIED", "sitemap", "sitemap.xml is not readable", observed=status, expected=200).as_dict())
    else:
        sitemap_paths = _sitemap_paths(sitemap_body)
        required_hubs = {"/", "/devsnack", "/labs", "/benchmarks", "/data", "/research"}
        for missing in sorted(required_hubs - sitemap_paths):
            findings.append(Finding("BLOCK", "sitemap", "sitemap is missing an indexable hub", observed=missing).as_dict())
        for path in sorted(sitemap_paths):
            if path.startswith(KNOWN_RETIRED_PREFIXES) or path == "/lab":
                findings.append(Finding("BLOCK", "sitemap", "sitemap contains a retired detail route", observed=path).as_dict())

    changed_routes: list[str] = []
    for relative in changed_files:
        route = route_from_page_file(relative)
        if route is None or "[" in route:
            continue
        route_file = REPO_ROOT / relative
        text = route_file.read_text(encoding="utf-8", errors="ignore") if route_file.is_file() else ""
        if route in STATIC_SITEMAP_EXEMPTIONS or "noindex" in text.lower():
            continue
        changed_routes.append(route)
    findings.extend(sitemap_coverage_findings(changed_routes, sitemap_paths))

    public_detail_paths = sorted(path for path in sitemap_paths if re.match(r"^/(?:devsnack|research|lab|benchmarks)/[^/]+$", path))
    feed_results: dict[str, Any] = {}
    for feed_path in ("/rss.xml", "/en/rss.xml"):
        feed_status, feed_headers, feed_body = fetch_url(f"{base_url}{feed_path}")
        feed_results[feed_path] = {"status": feed_status, "item_count": len(re.findall(r"<item(?:\s|>)", feed_body, flags=re.IGNORECASE)) if feed_status == 200 else None}
        if feed_status != 200:
            findings.append(Finding("BLOCK" if feed_status else "UNVERIFIED", "rss", f"{feed_path} is not readable", observed=feed_status, expected=200).as_dict())
        else:
            findings.extend(rss_contract_findings(feed_body, feed_path, public_detail_paths if feed_path == "/rss.xml" else []))

    robots_status, _, robots_body = fetch_url(f"{base_url}/robots.txt")
    if robots_status != 200:
        findings.append(Finding("BLOCK" if robots_status else "UNVERIFIED", "robots", "robots.txt is not readable", observed=robots_status, expected=200).as_dict())
    elif f"Sitemap: {base_url}/sitemap.xml" not in robots_body:
        findings.append(Finding("BLOCK", "robots", "robots.txt does not advertise the production sitemap").as_dict())

    route_matrix: dict[str, Any] = {}
    try:
        from audit_site import CURRENT_POLICY, check_route_expectation
    except ImportError as error:  # pragma: no cover - packaging failure
        findings.append(Finding("UNVERIFIED", "route-policy", "existing route policy audit could not be imported", observed=type(error).__name__).as_dict())
    else:
        for path, expectation in CURRENT_POLICY.items():
            route_status, route_headers, route_body = fetch_url(f"{base_url}{path}")
            route_matrix[path] = {"status": route_status, "title": parse_document(route_body).title if route_status == 200 else None}
            findings.extend(Finding("BLOCK", "route-policy", failure, evidence=path).as_dict() for failure in check_route_expectation(expectation, route_status, route_headers, route_body, base_url))

    if sitemap_paths:
        def probe(path: str) -> tuple[str, int]:
            return path, fetch_url(f"{base_url}{path}")[0]
        with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
            for path, route_status in pool.map(probe, sorted(sitemap_paths)):
                if route_status != 200:
                    findings.append(Finding("BLOCK" if route_status else "UNVERIFIED", "sitemap-route", "sitemap URL does not return HTTP 200 without following redirects", observed={"path": path, "status": route_status}, expected=200).as_dict())

    gate = {"status": audit_status(findings), "sitemap": {"status": status, "path_count": len(sitemap_paths), "headers": {key.lower(): value for key, value in headers.items() if key.lower() in {"cache-control", "age", "x-vercel-cache"}}}, "rss": feed_results, "routes_checked": len(route_matrix), "changed_route_candidates": sorted(set(changed_routes))}
    return gate, findings


def markdown_report(report: dict[str, Any]) -> str:
    lines = [
        f"# DevSnack Weekly Site Audit — {report['audit_date']}",
        "",
        f"- Status: **{report['status']}**",
        f"- Audited at: `{report['audited_at']}`",
        f"- Window: `{report['window']['from']}` → `{report['window']['to']}`",
        f"- Repository HEAD: `{report['source']['repo_head']}`",
        f"- Remote HEAD: `{report['source']['remote_head']}`",
        "",
        "## Change summary",
        "",
        f"- Commits: {report['change_summary']['commits']}",
        f"- Changed files: {report['change_summary']['files']}",
        f"- Areas: {', '.join(report['change_summary']['areas']) or 'none'}",
        "",
        "## Gates",
        "",
    ]
    for name, gate in report["gates"].items():
        status = gate.get("status") if isinstance(gate, dict) else gate
        lines.append(f"- `{name}`: **{status}**")
    lines.extend(["", "## Findings", ""])
    findings = report.get("findings", [])
    if not findings:
        lines.append("- 없음")
    else:
        for item in findings:
            lines.append(f"- **{item['severity']} · {item['area']}** — {item['message']}")
            if item.get("observed") is not None:
                lines.append(f"  - observed: `{json.dumps(item['observed'], ensure_ascii=False)[:500]}`")
            if item.get("expected") is not None:
                lines.append(f"  - expected: `{json.dumps(item['expected'], ensure_ascii=False)[:500]}`")
            if item.get("evidence") is not None:
                lines.append(f"  - evidence: `{item['evidence']}`")
    lines.extend(["", "## Scope", "", "- repository/site/DB/cron mutation: `0`", "- audit mode: read-only", ""])
    return "\n".join(lines)


def run_audit(base_url: str, output_dir: Path, *, run_repo_checks: bool = True) -> dict[str, Any]:
    now_utc = dt.datetime.now(dt.timezone.utc).replace(microsecond=0)
    now_kst = now_utc.astimezone(dt.timezone(dt.timedelta(hours=9)))
    previous = latest_previous_audit(output_dir)
    since = str(previous.get("audited_at")) if previous else (now_utc - dt.timedelta(days=7)).isoformat()
    commits, changed_files = git_change_window(REPO_ROOT, since)
    heads = repository_heads(REPO_ROOT)
    findings: list[dict[str, Any]] = []
    gates: dict[str, Any] = {}
    if not heads["remote_match"]:
        findings.append(Finding("WARN", "repository", "local HEAD and origin/main differ", observed=heads, expected="remote HEAD matches local HEAD").as_dict())

    site_gate, site_findings = _check_site(base_url, changed_files)
    gates["site"] = site_gate
    findings.extend(site_findings)
    stock_gate, stock_findings = _check_stockpulse(base_url)
    gates["stockpulse"] = stock_gate
    findings.extend(stock_findings)

    if run_repo_checks:
        env = os.environ.copy()
        env["SITE_URL"] = base_url
        commands = [
            ("npm test", ["npm", "test"], 900),
            ("npm run audit:site", ["npm", "run", "audit:site"], 900),
            ("npm run audit:public-content", ["npm", "run", "audit:public-content"], 600),
            ("npm run audit:security", ["npm", "run", "audit:security"], 300),
            ("npm run audit:links", ["npm", "run", "audit:links"], 900),
        ]
        for label, command, timeout in commands:
            gate, command_findings = run_command(label, command, env=env, timeout=timeout)
            gates[label] = gate
            findings.extend(command_findings)
    else:
        gates["repository_commands"] = {"status": "UNVERIFIED", "reason": "skipped by caller"}
        findings.append(Finding("UNVERIFIED", "repository-audit", "repository commands were skipped").as_dict())

    report = {
        "audit_id": f"devsnack-weekly-site-audit-{now_kst.date().isoformat()}",
        "audit_date": now_kst.date().isoformat(),
        "audited_at": now_utc.isoformat(),
        "window": {"from": since, "to": now_utc.isoformat()},
        "source": {"repo_head": heads["local_head"], "remote_head": heads["remote_head"], "remote_match": heads["remote_match"]},
        "production": {"base_url": base_url},
        "change_summary": {"commits": len(commits), "files": len(changed_files), "areas": sorted({classify_changed_file(path) for path in changed_files}), "commits_detail": commits, "changed_files": changed_files},
        "gates": gates,
        "findings": findings,
        "scope": {"mutations": 0, "cron_changes": 0, "db_writes": 0},
    }
    report["status"] = audit_status(findings)
    output_dir.mkdir(parents=True, exist_ok=True)
    json_path = output_dir / f"{report['audit_date']}.json"
    md_path = output_dir / f"{report['audit_date']}.md"
    json_path.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    md_path.write_text(markdown_report(report), encoding="utf-8")
    report["artifacts"] = {"json": str(json_path), "markdown": str(md_path)}
    return report


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base-url", default=os.environ.get("SITE_URL", DEFAULT_BASE_URL))
    parser.add_argument("--output-dir", default=str(DEFAULT_OUTPUT_DIR))
    parser.add_argument("--skip-repo-checks", action="store_true")
    args = parser.parse_args()
    report = run_audit(args.base_url.rstrip("/"), Path(args.output_dir), run_repo_checks=not args.skip_repo_checks)
    print(json.dumps({"status": report["status"], "audit_date": report["audit_date"], "finding_count": len(report["findings"]), "report": report["artifacts"]}, ensure_ascii=False, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
