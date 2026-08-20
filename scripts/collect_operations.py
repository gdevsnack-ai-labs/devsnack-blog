#!/usr/bin/env python3
"""Collect the DGX Spark operations snapshot for the public Vercel dashboard."""
from __future__ import annotations

import argparse
import json
import os
import re
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
        process_text = " ".join(columns[6:]) if len(columns) > 6 else ""
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


def collect_systemd() -> list[dict[str, Any]]:
    output = run_command([
        "systemctl", "list-units", "--type=service", "--state=running", "--no-legend", "--no-pager",
    ])
    services: list[dict[str, Any]] = []
    for line in output.splitlines():
        columns = line.split(None, 4)
        if len(columns) < 4:
            continue
        name, load, active, sub = columns[:4]
        description = columns[4] if len(columns) == 5 else ""
        services.append({
            "name": name,
            "load": load,
            "active": active,
            "sub": sub,
            "description": description,
            "health": "ok" if active == "active" and sub == "running" else "warning",
        })
    return sorted(services, key=lambda item: (item["active"] != "active", item["name"]))


def load_cron_jobs() -> list[dict[str, Any]]:
    if not CRON_JOBS.exists():
        return []
    try:
        payload = json.loads(CRON_JOBS.read_text())
    except (OSError, json.JSONDecodeError):
        return []
    jobs = payload.get("jobs", []) if isinstance(payload, dict) else []
    result: list[dict[str, Any]] = []
    for job in jobs:
        if not isinstance(job, dict):
            continue
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


def collect_health_checks(ports: list[dict[str, Any]]) -> list[dict[str, Any]]:
    candidates = {3333, 8080, 8188, 8888, 9080, 18888, 19999}
    listening = {item["port"] for item in ports}
    checks = []
    for port in sorted(candidates & listening):
        label = PORT_LABELS.get(port, (f"Port {port}", "other"))[0]
        checks.append(check_url(label, f"http://127.0.0.1:{port}/"))
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
