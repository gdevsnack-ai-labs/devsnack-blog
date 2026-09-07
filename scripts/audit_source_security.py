#!/usr/bin/env python3
"""Tracked-source secret/config audit with value-free findings."""
from __future__ import annotations

import re
import subprocess
from pathlib import Path

_HARDCODED_SUPABASE_KEY = re.compile(
    r"NEXT_PUBLIC_SUPABASE_ANON_KEY\s*:\s*['\"](?!\$|process\.env|REPLACE_ME)[^'\"]+['\"]",
    re.IGNORECASE,
)
_SECRET_VALUE = re.compile(
    r"(?i)(?:"
    r"(?:postgres(?:ql)?|mysql)://[^\s<>{}\"']+|"
    r"(?:sb_secret_|sbp_)[A-Za-z0-9_-]{16,}|"
    r"eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}|"
    r"(?:authorization\s*:\s*bearer\s+)[A-Za-z0-9._-]{20,}|"
    r"(?:api[_ -]?key|access[_ -]?token|refresh[_ -]?token|client[_ -]?secret)\s*[:=]\s*[A-Za-z0-9._-]{20,}"
    r")"
)


def scan_text(text: str) -> list[str]:
    findings: list[str] = []
    if _HARDCODED_SUPABASE_KEY.search(text):
        findings.append("hardcoded-supabase-key")
    if _SECRET_VALUE.search(text):
        findings.append("credential-like-value")
    return findings


def scan_tracked_source(repo_root: Path) -> list[str]:
    result = subprocess.run(
        ["git", "-C", str(repo_root), "ls-files", "-z"],
        check=True,
        capture_output=True,
        text=False,
    )
    findings: list[str] = []
    for raw_path in result.stdout.split(b"\0"):
        if not raw_path:
            continue
        relative = raw_path.decode("utf-8")
        if relative == ".env.example":
            continue
        path = repo_root / relative
        if not path.is_file() or path.suffix.lower() not in {".ts", ".tsx", ".js", ".jsx", ".py", ".json", ".md", ".yaml", ".yml", ".toml"}:
            continue
        try:
            text = path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            continue
        for line_number, line in enumerate(text.splitlines(), 1):
            for category in scan_text(line):
                findings.append(f"{relative}:{line_number}:{category}")
    return sorted(set(findings))


def main() -> int:
    repo_root = Path(__file__).resolve().parents[1]
    findings = scan_tracked_source(repo_root)
    if findings:
        print("SOURCE SECURITY AUDIT FAILED")
        for finding in findings:
            print(f"- {finding}")
        return 1
    print("SOURCE SECURITY AUDIT PASSED")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
