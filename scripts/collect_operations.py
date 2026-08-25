#!/usr/bin/env python3
"""Collect the DGX Spark operations snapshot for the public Vercel dashboard."""
from __future__ import annotations

import argparse
import json
import os
import re
import sqlite3
import subprocess
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

HOME = Path.home()
PROJECT_ROOT = Path(__file__).resolve().parents[1]
TOOLS_ROOT = HOME / "tools"
LOCAL_TOOLS = HOME / "LOCAL_TOOLS.md"
CRON_JOBS = HOME / ".hermes" / "cron" / "jobs.json"
CRON_EXECUTIONS = HOME / ".hermes" / "cron" / "executions.db"

PORT_LABELS = {
    22: ("SSH", "system"),
    53: ("DNS resolver", "system"),
    80: ("Nginx", "web"),
    2222: ("Forgejo SSH", "git"),
    3000: ("Forgejo internal", "git"),
    3333: ("Next.js local test server", "test"),
    631: ("CUPS", "system"),
    8080: ("llama-server", "llm"),
    8082: ("BGE embedding server", "memory"),
    8083: ("BGE reranker server", "memory"),
    8188: ("ComfyUI", "media"),
    8888: ("SearXNG", "search"),
    9080: ("Forgejo web", "git"),
    11000: ("Local service", "internal"),
    18888: ("Hindsight API", "memory"),
    19999: ("Hindsight admin", "memory"),
}

# 운영 현황판에서 관리할 필요가 없는 기본 OS/네트워크 포트.
# 서비스 자체를 중지하지 않고 공개 현황에서만 제외한다.
EXCLUDED_PORTS = {22, 53, 80, 443, 58175, 631}

# 사용자가 직접 만들었거나 현재 운영에 필요한 systemd 서비스만 노출한다.
# 기본 OS, 데스크톱, 프린터, NVIDIA 관리 서비스는 현황판에서 제외한다.
DISPLAY_SYSTEMD_SERVICES = {
    "ai-llama-server.service",
    "ai-thermal-monitor.service",
    "comfyui.service",
    "containerd.service",
    "docker.service",
    "real-estate-monitor.service",
}

# 사용자 세션에서 직접 관리하는 Hindsight GPU sidecar와 묶음 target.
DISPLAY_USER_SYSTEMD_UNITS = {
    "hindsight-embed.service",
    "hindsight-rerank.service",
    "hindsight-sidecars.target",
}


def run_command(command: list[str], timeout: int = 10) -> str:
    try:
        result = subprocess.run(command, capture_output=True, text=True, timeout=timeout, check=False)
        return result.stdout
    except (OSError, subprocess.TimeoutExpired):
        return ""


def parse_bind(value: str) -> str:
    if value.startswith("[") and "]" in value:
        return value[1:value.index("]")]
    return value.rsplit(":", 1)[0] if ":" in value else value


def parse_port(value: str) -> int | None:
    try:
        return int(value.rsplit(":", 1)[-1].rstrip("]"))
    except ValueError:
        return None


def collect_ports() -> list[dict[str, Any]]:
    output = run_command(["ss", "-ltnpH"])
    ports: list[dict[str, Any]] = []
    seen: set[tuple[str, int, str]] = set()
    for line in output.splitlines():
        columns = line.split()
        if len(columns) < 4:
            continue
        local = columns[3]
        port = parse_port(local)
        if port is None:
            continue
        if port in EXCLUDED_PORTS:
            continue
        process_text = " ".join(columns[5:]) if len(columns) > 5 else ""
        process_match = re.search(r'\(\("([^"]+)', process_text)
        process = process_match.group(1) if process_match else ""
        bind = parse_bind(local)
        key = (bind, port, process)
        if key in seen:
            continue
        seen.add(key)
        label, category = PORT_LABELS.get(port, (process or "Unknown listener", "other"))
        health = "ok" if process or port in PORT_LABELS else "unknown"
        ports.append({
            "port": port,
            "protocol": "tcp",
            "bind": bind,
            "process": process,
            "service": label,
            "category": category,
            "health": health,
        })
    return sorted(ports, key=lambda item: (item["port"], item["bind"]))


def collect_docker() -> list[dict[str, Any]]:
    output = run_command([
        "docker", "ps", "-a", "--format",
        "{{json .}}",
    ])
    containers: list[dict[str, Any]] = []
    for line in output.splitlines():
        try:
            item = json.loads(line)
        except json.JSONDecodeError:
            continue
        status = item.get("Status", "")
        containers.append({
            "name": item.get("Names", ""),
            "image": item.get("Image", ""),
            "status": status,
            "ports": item.get("Ports", ""),
            "health": "ok" if status.lower().startswith("up ") else "warning",
        })
    return containers


def parse_systemd_units(output: str, allowed: set[str], scope: str) -> list[dict[str, Any]]:
    services: list[dict[str, Any]] = []
    for line in output.splitlines():
        columns = line.split(None, 4)
        if len(columns) < 4:
            continue
        name, load, active, sub = columns[:4]
        name = name.lstrip("●")
        if name not in allowed:
            continue
        description = columns[4] if len(columns) == 5 else ""
        services.append({
            "name": name,
            "scope": scope,
            "unitType": "target" if name.endswith(".target") else "service",
            "load": load,
            "active": active,
            "sub": sub,
            "description": description,
            "health": "ok" if active == "active" and (sub == "running" or name.endswith(".target") and sub == "active") else "warning",
        })
    return services


def collect_systemd() -> list[dict[str, Any]]:
    system_output = run_command([
        "systemctl", "list-units", "--type=service", "--all", "--no-legend", "--no-pager",
    ])
    user_output = run_command([
        "systemctl", "--user", "list-units", "--type=service", "--type=target", "--all", "--no-legend", "--no-pager",
    ])
    services = parse_systemd_units(system_output, DISPLAY_SYSTEMD_SERVICES, "system")
    services.extend(parse_systemd_units(user_output, DISPLAY_USER_SYSTEMD_UNITS, "user"))
    return sorted(services, key=lambda item: (item["health"] != "ok", item["scope"], item["name"]))


def parse_execution_datetime(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None


def load_execution_metrics() -> dict[str, dict[str, Any]]:
    if not CRON_EXECUTIONS.exists():
        return {}

    try:
        connection = sqlite3.connect(CRON_EXECUTIONS)
        rows = connection.execute(
            "SELECT job_id, status, started_at, finished_at FROM executions"
        ).fetchall()
        connection.close()
    except (OSError, sqlite3.Error):
        return {}

    metrics: dict[str, dict[str, Any]] = {}
    for job_id, status, started_at, finished_at in rows:
        item = metrics.setdefault(job_id, {
            "executionCount": 0,
            "successfulRuns": 0,
            "failedRuns": 0,
            "unknownRuns": 0,
            "durationSampleCount": 0,
            "durationTotalSec": 0.0,
            "maxDurationSec": None,
        })
        item["executionCount"] += 1
        if status == "completed":
            item["successfulRuns"] += 1
        elif status == "failed":
            item["failedRuns"] += 1
        else:
            item["unknownRuns"] += 1

        started = parse_execution_datetime(started_at)
        finished = parse_execution_datetime(finished_at)
        if not started or not finished or finished < started:
            continue
        duration = (finished - started).total_seconds()
        item["durationSampleCount"] += 1
        item["durationTotalSec"] += duration
        item["maxDurationSec"] = max(item["maxDurationSec"] or 0.0, duration)

    for item in metrics.values():
        samples = item.pop("durationSampleCount")
        total = item.pop("durationTotalSec")
        item["durationSampleCount"] = samples
        item["avgDurationSec"] = round(total / samples, 1) if samples else None
        item["maxDurationSec"] = round(item["maxDurationSec"], 1) if item["maxDurationSec"] is not None else None

    return metrics


def load_cron_jobs() -> list[dict[str, Any]]:
    if not CRON_JOBS.exists():
        return []
    try:
        payload = json.loads(CRON_JOBS.read_text())
    except (OSError, json.JSONDecodeError):
        return []
    jobs = payload.get("jobs", []) if isinstance(payload, dict) else []
    execution_metrics = load_execution_metrics()
    result: list[dict[str, Any]] = []
    for job in jobs:
        if not isinstance(job, dict):
            continue
        metrics = execution_metrics.get(job.get("id", ""), {})
        result.append({
            "id": job.get("id", ""),
            "name": job.get("name", ""),
            "schedule": job.get("schedule_display") or job.get("schedule", ""),
            "enabled": bool(job.get("enabled", False)),
            "state": job.get("state", ""),
            "lastStatus": job.get("last_status", ""),
            "lastRunAt": job.get("last_run_at"),
            "nextRunAt": job.get("next_run_at"),
            "script": job.get("script"),
            "noAgent": bool(job.get("no_agent", False)),
            "model": job.get("model"),
            "provider": job.get("provider"),
            "workdir": job.get("workdir"),
            "executionCount": metrics.get("executionCount", 0),
            "successfulRuns": metrics.get("successfulRuns", 0),
            "failedRuns": metrics.get("failedRuns", 0),
            "unknownRuns": metrics.get("unknownRuns", 0),
            "durationSampleCount": metrics.get("durationSampleCount", 0),
            "avgDurationSec": metrics.get("avgDurationSec"),
            "maxDurationSec": metrics.get("maxDurationSec"),
        })
    return sorted(result, key=lambda item: (not item["enabled"], item["name"]))


def parse_local_tools() -> dict[str, dict[str, str | None]]:
    catalog: dict[str, dict[str, str | None]] = {}
    if not LOCAL_TOOLS.exists():
        return catalog
    pattern = re.compile(r"^\|\s*\*\*(.+?)\*\*\s*\|\s*`?([^|`]+)`?\s*\|\s*([^|]+?)\s*\|\s*(?:\[([^]]+)\]|([^|]+))\s*\|\s*([^|]+?)\s*\|")
    for line in LOCAL_TOOLS.read_text(errors="ignore").splitlines():
        match = pattern.match(line)
        if not match:
            continue
        name, path, version, source_a, source_b, description = match.groups()
        path = path.strip()
        if not path.startswith("~/tools/"):
            continue
        catalog[name.strip()] = {
            "path": path,
            "version": version.strip() or None,
            "source": (source_a or source_b or "LOCAL_TOOLS.md").strip(),
            "description": description.strip(),
        }
    return catalog


def collect_tools() -> list[dict[str, Any]]:
    catalog = parse_local_tools()
    entries: dict[str, dict[str, Any]] = {}
    for name, metadata in catalog.items():
        path = str(metadata["path"])
        entries[path] = {
            "name": name,
            "path": path,
            "version": metadata["version"],
            "description": metadata["description"] or "",
            "source": metadata["source"] or "LOCAL_TOOLS.md",
            "exists": (HOME / path[2:]).exists() if path.startswith("~/") else False,
            "status": "documented",
        }
    documented_roots = {
        path[len("~/tools/"):].split("/", 1)[0]
        for path in (item["path"] for item in catalog.values())
        if isinstance(path, str) and path.startswith("~/tools/")
    }
    if TOOLS_ROOT.exists():
        for entry in TOOLS_ROOT.iterdir():
            if not entry.is_dir() or entry.name.startswith("."):
                continue
            path = f"~/tools/{entry.name}/"
            if path not in entries and entry.name not in documented_roots:
                entries[path] = {
                    "name": entry.name,
                    "path": path,
                    "version": None,
                    "description": "LOCAL_TOOLS.md에 상세 메타데이터가 없는 디렉터리",
                    "source": "filesystem",
                    "exists": True,
                    "status": "undocumented",
                }
    return sorted(entries.values(), key=lambda item: item["name"].lower())


def check_url(name: str, url: str) -> dict[str, Any]:
    started = time.perf_counter()
    try:
        request = urllib.request.Request(url, headers={"User-Agent": "devsnack-operations-collector/1.0"})
        with urllib.request.urlopen(request, timeout=3) as response:
            return {
                "name": name,
                "url": url,
                "statusCode": response.status,
                "latencyMs": round((time.perf_counter() - started) * 1000, 1),
                "ok": 200 <= response.status < 500,
                "error": None,
            }
    except urllib.error.HTTPError as error:
        return {
            "name": name,
            "url": url,
            "statusCode": error.code,
            "latencyMs": round((time.perf_counter() - started) * 1000, 1),
            "ok": 200 <= error.code < 500,
            "error": None,
        }
    except Exception as error:
        return {
            "name": name,
            "url": url,
            "statusCode": None,
            "latencyMs": round((time.perf_counter() - started) * 1000, 1),
            "ok": False,
            "error": type(error).__name__,
        }


def health_host_for_port(port: int, ports: list[dict[str, Any]]) -> str:
    bind = next((item["bind"] for item in ports if item["port"] == port), "")
    if not bind or bind in {"0.0.0.0", "::", "*"}:
        return "127.0.0.1"
    return f"[{bind}]" if ":" in bind and not bind.startswith("[") else bind


def collect_health_checks(ports: list[dict[str, Any]]) -> list[dict[str, Any]]:
    candidates = {3333, 8080, 8082, 8083, 8188, 8888, 9080, 18888, 19999}
    paths = {8080: "/health", 8082: "/health", 8083: "/health", 18888: "/health"}
    listening = {item["port"] for item in ports}
    checks = []
    for port in sorted(candidates & listening):
        label = PORT_LABELS.get(port, (f"Port {port}", "other"))[0]
        host = health_host_for_port(port, ports)
        checks.append(check_url(label, f"http://{host}:{port}{paths.get(port, '/')}"))
    return checks


def collect_snapshot() -> dict[str, Any]:
    captured_at = datetime.now(timezone.utc).isoformat()
    ports = collect_ports()
    return {
        "capturedAt": captured_at,
        "source": "dgx-spark-local-collector",
        "host": "DGX Spark GB10",
        "ports": ports,
        "docker": collect_docker(),
        "systemd": collect_systemd(),
        "cronjobs": load_cron_jobs(),
        "tools": collect_tools(),
        "healthChecks": collect_health_checks(ports),
    }


def load_env_file(path: Path) -> None:
    if not path.exists():
        return
    for raw_line in path.read_text(errors="ignore").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        os.environ.setdefault(key, value)


def push_snapshot(snapshot: dict[str, Any], endpoint: str, token: str) -> str:
    payload = json.dumps({"snapshot": snapshot}, ensure_ascii=False).encode()
    request = urllib.request.Request(
        endpoint,
        data=payload,
        method="POST",
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "User-Agent": "devsnack-operations-collector/1.0",
        },
    )
    with urllib.request.urlopen(request, timeout=20) as response:
        return response.read().decode(errors="replace")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--json", action="store_true", help="Print the snapshot JSON")
    parser.add_argument("--push", action="store_true", help="Push to the Vercel ingest endpoint")
    parser.add_argument("--endpoint", default=os.environ.get("OPS_INGEST_ENDPOINT", ""))
    parser.add_argument("--token", default=os.environ.get("OPS_INGEST_TOKEN", ""))
    args = parser.parse_args()

    load_env_file(PROJECT_ROOT / ".env.local")
    snapshot = collect_snapshot()

    if args.json or not args.push:
        print(json.dumps(snapshot, ensure_ascii=False, indent=2))

    if args.push:
        endpoint = args.endpoint or os.environ.get("OPS_INGEST_ENDPOINT", "")
        token = args.token or os.environ.get("OPS_INGEST_TOKEN") or os.environ.get("INGEST_API_TOKEN", "")
        if not endpoint or not token:
            raise SystemExit("OPS_INGEST_ENDPOINT and OPS_INGEST_TOKEN (or INGEST_API_TOKEN) are required")
        print(push_snapshot(snapshot, endpoint, token))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
