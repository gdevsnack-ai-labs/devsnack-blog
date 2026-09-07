#!/usr/bin/env python3
"""Read-only public-surface safety and publication-link audit."""
from __future__ import annotations

import concurrent.futures
import html
import re
import sys
import urllib.error
import urllib.request
import xml.etree.ElementTree as ET
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin, urlparse

REPO_ROOT = Path(__file__).resolve().parents[1]
PUBLICATION_ROOT = "https://gdevsnack-ai-labs.github.io/stockpulse-v1-fixed-publication"
MIGRATION_SOURCE = REPO_ROOT / "src/lib/research-note-migration.ts"

_LOCAL_PATH = re.compile(
    r"(?<![\w])(?:/home/kahros(?:/[\w.\-]+)+|/content-factory(?:/[\w.\-]+)+|/workspace(?:/[\w.\-]+)+|~/(?!project(?:[/\s]|$)|example(?:[/\s]|$))[\w.\-/]+)",
    re.IGNORECASE,
)
_INTERNAL_SERVICE = re.compile(
    r"(?i)(?<![A-Za-z0-9_])(?:localhost|127\.0\.0\.1|0\.0\.0\.0):(?:8080|8082|8083|8188|8888|18888|19999)(?![A-Za-z0-9_])"
    r"|(?<![A-Za-z0-9_])(?:10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(?:1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3})(?::\d{2,5})?(?![A-Za-z0-9_])"
)
_OPERATOR_CONTEXT = re.compile(
    r"(?i)(?:사장님|오빠)(?:의)?\s*(?:지시|요청|승인|검수|피드백|현장|결정|제작\s*중|테스트)"
)
_SECRET_VALUE = re.compile(
    r"(?i)(?:"
    r"(?:postgres(?:ql)?|mysql)://[^\s<>{}\"']+|"
    r"(?:sb_secret_|sbp_)[A-Za-z0-9_-]{16,}|"
    r"eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}|"
    r"(?:authorization\s*:\s*bearer\s+)[A-Za-z0-9._-]{20,}|"
    r"(?:api[_ -]?key|access[_ -]?token|refresh[_ -]?token|client[_ -]?secret)\s*[:=]\s*[A-Za-z0-9._-]{20,}|"
    r"(?:gh[pousr]_)[A-Za-z0-9_]{20,}"
    r")"
)


class PublicTextParser(HTMLParser):
    """Collect visible prose and all non-script text separately."""

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.visible: list[str] = []
        self.all_text: list[str] = []
        self._skip_depth = 0
        self._code_depth = 0

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        tag = tag.lower()
        if tag in {"script", "style", "noscript"}:
            self._skip_depth += 1
        elif tag in {"pre", "code"} and not self._skip_depth:
            self._code_depth += 1

    def handle_endtag(self, tag: str) -> None:
        tag = tag.lower()
        if tag in {"script", "style", "noscript"} and self._skip_depth:
            self._skip_depth -= 1
        elif tag in {"pre", "code"} and self._code_depth:
            self._code_depth -= 1

    def handle_data(self, data: str) -> None:
        if self._skip_depth:
            return
        self.all_text.append(data)
        if not self._code_depth:
            self.visible.append(data)


def _text_parts(value: str) -> tuple[str, str]:
    parser = PublicTextParser()
    if "<" in value and ">" in value:
        parser.feed(value)
        parser.close()
        return html.unescape(" ".join(parser.visible)), html.unescape(" ".join(parser.all_text))
    return value, value


def scan_public_text(value: str) -> list[str]:
    """Return redacted category labels; never return matched values."""
    visible, all_text = _text_parts(value)
    failures: list[str] = []
    if _SECRET_VALUE.search(value) or _SECRET_VALUE.search(all_text):
        failures.append("credential-or-secret-value")
    if _LOCAL_PATH.search(visible) or _LOCAL_PATH.search(all_text):
        failures.append("local-filesystem-path")
    if _INTERNAL_SERVICE.search(visible) or _INTERNAL_SERVICE.search(all_text):
        failures.append("internal-host-or-port")
    if _OPERATOR_CONTEXT.search(visible) or _OPERATOR_CONTEXT.search(all_text):
        failures.append("internal-operator-context")
    return list(dict.fromkeys(failures))


def migrated_research_paths() -> set[str]:
    if not MIGRATION_SOURCE.exists():
        return set()
    text = MIGRATION_SOURCE.read_text(encoding="utf-8")
    slugs = re.findall(r"^\s*'([^']+)':\s*`", text, flags=re.MULTILINE)
    return {f"/research/{slug}" for slug in slugs}


def rss_item_count(body: str) -> int:
    return len(re.findall(r"<item(?:\s|>)", body, flags=re.IGNORECASE))


def rss_item_links(body: str) -> list[str]:
    return [html.unescape(link).strip() for link in re.findall(r"<link>(.*?)</link>", body, flags=re.IGNORECASE | re.DOTALL)]


def check_rss_contract(body: str, *, feed_path: str, public_detail_paths: list[str]) -> list[str]:
    failures: list[str] = []
    try:
        ET.fromstring(body)
    except ET.ParseError:
        failures.append(f"{feed_path}: invalid RSS XML")
        return failures

    item_count = rss_item_count(body)
    if public_detail_paths and item_count == 0:
        failures.append(f"{feed_path}: public detail routes exist but RSS has 0 items")
    if feed_path == "/en/rss.xml" and item_count == 0:
        failures.append("/en/rss.xml: expected existing English feed to contain items")

    forbidden = ["/aitech/", "/stock/"]
    migrated = migrated_research_paths()
    for link in rss_item_links(body):
        parsed = urlparse(link)
        path = parsed.path.rstrip("/") or "/"
        if any(path.startswith(prefix) for prefix in forbidden):
            failures.append("RSS contains retired AI Tech or StockPulse detail URL")
        if path in migrated:
            failures.append("RSS contains migrated Research detail URL")
    return sorted(set(failures))


def check_publication_links(body: str, fetcher) -> list[str]:
    failures: list[str] = []
    hrefs = re.findall(r"href=[\"']([^\"']+)[\"']", body, flags=re.IGNORECASE)
    targets = sorted({html.unescape(href) for href in hrefs if href.startswith(PUBLICATION_ROOT)})
    for target in targets:
        status = fetcher(target)
        if status != 200:
            failures.append(f"publication link HTTP {status}: {target}")
    return failures


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, request, fp, code, msg, headers, newurl):
        return None


OPENER = urllib.request.build_opener(NoRedirect)


def fetch(url: str, timeout: int = 30) -> tuple[int, dict[str, str], str]:
    request = urllib.request.Request(url, headers={"User-Agent": "devsnack-public-safety-audit/1.0", "Accept": "*/*"})
    try:
        with OPENER.open(request, timeout=timeout) as response:
            return response.status, dict(response.headers), response.read().decode("utf-8", "ignore")
    except urllib.error.HTTPError as error:
        return error.code, dict(error.headers), error.read().decode("utf-8", "ignore")
    except Exception as error:  # pragma: no cover - live network failure
        return 0, {}, f"AUDIT_FETCH_ERROR {type(error).__name__}: {error}"


def _sitemap_paths(body: str) -> list[str]:
    urls = re.findall(r"<loc>(.*?)</loc>", body, flags=re.IGNORECASE | re.DOTALL)
    return sorted({urlparse(html.unescape(url)).path or "/" for url in urls})


def _check_one_page(base_url: str, path: str) -> list[str]:
    status, _, body = fetch(urljoin(base_url + "/", path.lstrip("/")))
    if status != 200 or not body.lstrip().startswith("<"):
        return []
    return [f"{path}: public safety {category}" for category in scan_public_text(body)]


def _status_only(url: str) -> int:
    return fetch(url)[0]


def run_public_content_audit(base_url: str) -> list[str]:
    base_url = base_url.rstrip("/")
    failures: list[str] = []
    sitemap_status, _, sitemap_body = fetch(f"{base_url}/sitemap.xml")
    if sitemap_status != 200:
        return [f"public safety audit: sitemap HTTP {sitemap_status}"]
    paths = _sitemap_paths(sitemap_body)
    if "/labs/stockpulse-v1-fixed" not in paths:
        paths.append("/labs/stockpulse-v1-fixed")
    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
        for page_failures in pool.map(lambda path: _check_one_page(base_url, path), sorted(set(paths))):
            failures.extend(page_failures)

    v1_status, _, v1_body = fetch(f"{base_url}/labs/stockpulse-v1-fixed")
    if v1_status == 200:
        failures.extend(check_publication_links(v1_body, _status_only))
    else:
        failures.append(f"/labs/stockpulse-v1-fixed: HTTP {v1_status}")
    return sorted(set(failures))


def main() -> int:
    base_url = "https://devsnack-blog.vercel.app"
    if "--base-url" in sys.argv:
        index = sys.argv.index("--base-url")
        if index + 1 >= len(sys.argv):
            print("--base-url requires a value")
            return 2
        base_url = sys.argv[index + 1]
    failures = run_public_content_audit(base_url)
    if failures:
        print("PUBLIC SURFACE AUDIT FAILED")
        for failure in failures:
            print(f"- {failure}")
        return 1
    print("PUBLIC SURFACE AUDIT PASSED")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
