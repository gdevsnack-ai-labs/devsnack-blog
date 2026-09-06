#!/usr/bin/env python3
"""Read-only contract audit for the current DevSnack public surface.

The route matrix below is the approved policy projection. The audit checks
production against that contract and keeps route/lifecycle assertions separate
from browser/UI smoke checks.
"""
from __future__ import annotations

import asyncio
import html
import json
import os
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse

BASE_URL = os.environ.get("SITE_URL", "http://127.0.0.1:3333").rstrip("/")
REPO_ROOT = Path(__file__).resolve().parents[1]


@dataclass(frozen=True)
class RouteExpectation:
    path: str
    status: int
    meta_robots: str | None = None
    header_robots: str | None = None
    location: str | None = None
    canonical: bool = False
    required_text: tuple[str, ...] = ()
    forbidden_text: tuple[str, ...] = ()
    required_hrefs: tuple[str, ...] = ()
    forbidden_hrefs: tuple[str, ...] = ()


# Current route/content policy. Change this contract when lifecycle policy
# changes; the checker then reports production drift instead of hiding it.
CURRENT_POLICY: dict[str, RouteExpectation] = {
    "/": RouteExpectation(
        "/", 200, meta_robots="index, follow", canonical=True,
        required_text=("직접 조사하고, 만들고, 측정합니다.", "Benchmarks", "Knowledge"),
    ),
    "/devsnack": RouteExpectation(
        "/devsnack", 200, meta_robots="index, follow", canonical=True,
        required_text=("Stories",),
    ),
    "/labs": RouteExpectation(
        "/labs", 200, meta_robots="index, follow", canonical=True,
        required_text=("Recent Verified Findings", "Lab Board", "Experiments"),
        forbidden_text=("Mining",),
    ),
    "/labs/autonomous-ai-blog": RouteExpectation(
        "/labs/autonomous-ai-blog", 200, meta_robots="index, follow", canonical=True,
        required_text=("Verified Project Finding", "아직 독립적인 Project Finding이 없습니다.", "Latest Activity", "Operational Snapshot", "Recent Publications", "bodyStored=false", "Agent Field Notes"),
        forbidden_text=("Roman의 관측 가치는",),
    ),
    "/benchmarks": RouteExpectation(
        "/benchmarks", 200, meta_robots="index, follow", canonical=True,
        required_text=("Evaluation Overview", "Latest Result", "Ornith-1.5"),
    ),
    "/benchmarks/gb10-llm-benchmark-v1-20260906": RouteExpectation(
        "/benchmarks/gb10-llm-benchmark-v1-20260906", 200,
        meta_robots="index, follow", canonical=True,
        required_text=("DGX Spark GB10", "Model comparison matrix", "Models covered", "GGUF", "Suite guide", "Download JSON"),
    ),
    "/research": RouteExpectation(
        "/research", 200, meta_robots="index, follow", canonical=True,
        required_text=("Knowledge Domains", "Recent Knowledge", "Research Notes Board"),
    ),
    "/data": RouteExpectation(
        "/data", 200, meta_robots="index, follow", canonical=True,
        required_text=("Publications & Trackers", "StockPulse"),
    ),
    "/aitech": RouteExpectation(
        "/aitech", 200, meta_robots="index, follow", canonical=True,
        required_text=("Historical index", "다음 단계"),
        forbidden_hrefs=("/aitech/", "/aitech?page="),
    ),
    "/stock": RouteExpectation(
        "/stock", 200, meta_robots="noindex, follow", canonical=True,
        required_text=("Daily Feed 발행 중단", "v1 Report Archive", "GitHub Pages"),
        required_hrefs=("https://gdevsnack-ai-labs.github.io/stockpulse-publication/",),
        forbidden_hrefs=("/stock/",),
    ),
    "/aitech/ai-mistral": RouteExpectation(
        "/aitech/ai-mistral", 410, header_robots="noindex, follow",
    ),
    "/research/deepseek-harness-dsh-everything-is-a-plugin": RouteExpectation(
        "/research/deepseek-harness-dsh-everything-is-a-plugin",
        308,
        location="https://gdevsnack-ai-labs.github.io/devsnack-research-notes/notes/deepseek-harness-dsh.html",
    ),
    "/misc": RouteExpectation("/misc", 404),
    "/lab": RouteExpectation("/lab", 308, location="/labs"),
    "/labs/local-llm-benchmark": RouteExpectation(
        "/labs/local-llm-benchmark", 200, meta_robots="index, follow", canonical=True,
        required_text=("Local LLM Benchmark", "Model Sub-Labs"),
    ),
    "/lab/ornith15-server-quality-speed-benchmark": RouteExpectation(
        "/lab/ornith15-server-quality-speed-benchmark", 200,
        meta_robots="index, follow", canonical=True,
        required_text=("Target", "Environment", "Method / Protocol", "Result", "Limitations"),
    ),
}

INDEXABLE_HUB_PATHS = {
    "/", "/devsnack", "/aitech", "/labs", "/labs/autonomous-ai-blog", "/benchmarks", "/data", "/demos", "/research",
}


class DocumentParser(HTMLParser):
    """Collect metadata, visible text, and links without third-party deps."""

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.meta: dict[str, str] = {}
        self.canonical: str | None = None
        self.hrefs: list[str] = []
        self.title = ""
        self.h1 = ""
        self.h2s: list[str] = []
        self.visible_parts: list[str] = []
        self._skip_depth = 0
        self._capture_tag: str | None = None
        self._capture_parts: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attributes = {key.lower(): value or "" for key, value in attrs}
        tag = tag.lower()
        if tag in {"script", "style", "noscript"}:
            self._skip_depth += 1
            return
        if tag == "meta" and attributes.get("name"):
            self.meta[attributes["name"].lower()] = attributes.get("content", "")
        if tag == "link" and "canonical" in attributes.get("rel", "").lower():
            self.canonical = attributes.get("href") or None
        if tag == "a" and attributes.get("href"):
            self.hrefs.append(attributes["href"])
        if tag in {"title", "h1", "h2"} and self._capture_tag is None:
            self._capture_tag = tag
            self._capture_parts = []

    def handle_endtag(self, tag: str) -> None:
        tag = tag.lower()
        if tag in {"script", "style", "noscript"} and self._skip_depth:
            self._skip_depth -= 1
            return
        if tag == self._capture_tag:
            value = normalize_text(" ".join(self._capture_parts))
            if tag == "title":
                self.title = value
            elif tag == "h1":
                self.h1 = value
            elif tag == "h2":
                self.h2s.append(value)
            self._capture_tag = None
            self._capture_parts = []

    def handle_data(self, data: str) -> None:
        if self._skip_depth:
            return
        self.visible_parts.append(data)
        if self._capture_tag:
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


def header_value(headers: dict[str, str], name: str) -> str | None:
    wanted = name.lower()
    for key, value in headers.items():
        if key.lower() == wanted:
            return value
    return None


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, request, fp, code, msg, headers, newurl):
        return None


OPENER = urllib.request.build_opener(NoRedirect)


def fetch(path: str) -> tuple[int, dict[str, str], str]:
    request = urllib.request.Request(
        f"{BASE_URL.rstrip('/')}{path}",
        headers={"User-Agent": "devsnack-policy-audit/2.0", "Accept": "*/*"},
    )
    try:
        with OPENER.open(request, timeout=30) as response:
            return response.status, dict(response.headers), response.read().decode("utf-8", "ignore")
    except urllib.error.HTTPError as error:
        return error.code, dict(error.headers), error.read().decode("utf-8", "ignore")
    except Exception as error:  # pragma: no cover - live network failure
        return 0, {}, f"AUDIT_FETCH_ERROR {type(error).__name__}: {error}"


def check_route_expectation(
    expectation: RouteExpectation,
    status: int,
    headers: dict[str, str],
    body: str,
    base_url: str,
) -> list[str]:
    failures: list[str] = []
    path = expectation.path
    if status != expectation.status:
        failures.append(f"{path}: expected HTTP {expectation.status}, got {status}")

    actual_location = header_value(headers, "location")
    if expectation.location is not None and actual_location != expectation.location:
        failures.append(f"{path}: expected Location {expectation.location!r}, got {actual_location!r}")
    if expectation.location is None and actual_location is not None and expectation.status not in {200, 404, 410}:
        failures.append(f"{path}: unexpected Location {actual_location!r}")

    if expectation.header_robots is not None:
        actual_header_robots = header_value(headers, "x-robots-tag")
        if actual_header_robots != expectation.header_robots:
            failures.append(f"{path}: expected X-Robots-Tag {expectation.header_robots!r}, got {actual_header_robots!r}")

    if status != 200:
        return failures

    document = parse_document(body)
    if expectation.meta_robots is not None and document.meta.get("robots") != expectation.meta_robots:
        failures.append(f"{path}: expected meta robots {expectation.meta_robots!r}, got {document.meta.get('robots')!r}")
    if expectation.canonical:
        expected_canonical = f"{base_url.rstrip('/')}{path}"
        if document.canonical != expected_canonical:
            failures.append(f"{path}: expected canonical {expected_canonical!r}, got {document.canonical!r}")

    for marker in expectation.required_text:
        if marker not in document.visible_text:
            failures.append(f"{path}: missing visible marker {marker!r}")
    for marker in expectation.forbidden_text:
        if marker in document.visible_text:
            failures.append(f"{path}: forbidden visible marker {marker!r}")
    for href in expectation.required_hrefs:
        if href not in document.hrefs:
            failures.append(f"{path}: missing href {href!r}")
    for href in expectation.forbidden_hrefs:
        if any(link == href or link.startswith(href) for link in document.hrefs):
            failures.append(f"{path}: forbidden href pattern {href!r}")
    return failures


def migrated_research_paths() -> set[str]:
    source = REPO_ROOT / "src/lib/research-note-migration.ts"
    if not source.exists():
        return set()
    text = source.read_text(encoding="utf-8")
    slugs = re.findall(r"^\s*'([^']+)':\s*`", text, flags=re.MULTILINE)
    return {f"/research/{slug}" for slug in slugs}


def check_sitemap_policy(urls: list[str], base_url: str) -> list[str]:
    failures: list[str] = []
    origin = urlparse(base_url).netloc
    paths = {urlparse(url).path.rstrip("/") or "/" for url in urls}
    for required in INDEXABLE_HUB_PATHS:
        if required not in paths:
            failures.append(f"sitemap missing indexable hub {required}")
    for url in urls:
        parsed = urlparse(url)
        path = parsed.path.rstrip("/") or "/"
        if parsed.netloc and parsed.netloc != origin:
            failures.append(f"sitemap contains off-origin URL {url}")
        if path.startswith("/aitech/"):
            failures.append("sitemap contains retired AI Tech detail URL")
        if path.startswith("/stock/"):
            failures.append("sitemap contains retired StockPulse detail URL")
        if path in migrated_research_paths():
            failures.append("sitemap contains migrated Research detail URL")
        if path == "/lab":
            failures.append("sitemap contains legacy Lab hub URL")
    return sorted(set(failures))


def check_syndication_policy(body: str) -> list[str]:
    failures: list[str] = []
    for pattern, message in (
        (r"/aitech/", "RSS contains retired AI Tech detail URL"),
        (r"/stock/", "RSS contains retired StockPulse detail URL"),
    ):
        if re.search(pattern, body):
            failures.append(message)
    for path in migrated_research_paths():
        if path in body:
            failures.append("RSS contains migrated Research detail URL")
            break
    return failures


def check_search_api(failures: list[str]) -> None:
    expected_prefix = {
        "devsnack": "/devsnack/",
        "lab": "/lab/",
        "research": "/research/",
    }
    for query in ("local", "benchmark"):
        status, _, body = fetch(f"/api/search?q={urllib.parse.quote(query)}")
        if status != 200:
            failures.append(f"/api/search?q={query}: expected HTTP 200, got {status}")
            continue
        try:
            results = json.loads(body).get("results", [])
        except json.JSONDecodeError:
            failures.append(f"/api/search?q={query}: invalid JSON")
            continue
        if not results:
            failures.append(f"/api/search?q={query}: expected at least one result")
        for result in results:
            blog_id = result.get("blog_id")
            slug = result.get("slug")
            prefix = expected_prefix.get(blog_id)
            if prefix is None:
                failures.append(f"/api/search?q={query}: unknown public blog_id {blog_id!r}")
            elif not isinstance(slug, str) or not slug:
                failures.append(f"/api/search?q={query}: invalid slug for {blog_id!r}")
        if any(result.get("blog_id") in {"aitech", "stockpulse"} for result in results):
            failures.append(f"/api/search?q={query}: archived external Feed row leaked into public search")


def check_http_contract(failures: list[str]) -> None:
    for expectation in CURRENT_POLICY.values():
        status, headers, body = fetch(expectation.path)
        failures.extend(check_route_expectation(expectation, status, headers, body, BASE_URL))

    status, _, sitemap_body = fetch("/sitemap.xml")
    if status != 200:
        failures.append(f"/sitemap.xml: expected HTTP 200, got {status}")
    else:
        urls = re.findall(r"<loc>(.*?)</loc>", sitemap_body, flags=re.IGNORECASE | re.DOTALL)
        failures.extend(check_sitemap_policy(urls, BASE_URL))
        if len(urls) == 0:
            failures.append("/sitemap.xml: no URLs found")
        print(f"- sitemap policy: {len(urls)} URLs checked")

    status, _, rss_body = fetch("/rss.xml")
    if status != 200:
        failures.append(f"/rss.xml: expected HTTP 200, got {status}")
    else:
        failures.extend(check_syndication_policy(rss_body))

    status, _, robots_body = fetch("/robots.txt")
    if status != 200:
        failures.append(f"/robots.txt: expected HTTP 200, got {status}")
    else:
        if f"Sitemap: {BASE_URL}/sitemap.xml" not in robots_body:
            failures.append("/robots.txt: configured sitemap missing")
        if "Disallow: /api/ingest" not in robots_body or "Disallow: /api/ops/" not in robots_body:
            failures.append("/robots.txt: ingest route protection drift")

    check_search_api(failures)


async def check_browser(failures: list[str]) -> None:
    try:
        from playwright.async_api import async_playwright
    except ImportError:
        failures.append("browser contract: Python Playwright is not installed")
        return

    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(
            headless=True,
            executable_path="/usr/bin/google-chrome",
            args=["--no-sandbox"],
        )
        for width in (320, 360, 375, 390):
            page = await browser.new_page(viewport={"width": width, "height": 844})
            try:
                await page.goto(f"{BASE_URL}/", wait_until="networkidle", timeout=60_000)
                metrics = await page.evaluate(
                    """() => {
                        const nav = document.querySelector('nav[data-mobile-nav]');
                        return {
                            navScrollWidth: nav?.scrollWidth ?? -1,
                            navClientWidth: nav?.clientWidth ?? -1,
                            documentScrollWidth: document.documentElement.scrollWidth,
                        };
                    }"""
                )
                if metrics["navScrollWidth"] != metrics["navClientWidth"] or metrics["documentScrollWidth"] != width:
                    failures.append(f"mobile {width}px overflow: {metrics}")
            finally:
                await page.close()

        page = await browser.new_page(viewport={"width": 390, "height": 844})
        try:
            await page.goto(f"{BASE_URL}/research", wait_until="networkidle", timeout=60_000)
            nav = page.locator("nav[data-mobile-nav]")
            await nav.get_by_role("button", name="More 메뉴", exact=True).click(force=True)
            menu = nav.get_by_role("menu", name="More 하위 메뉴", exact=True)
            if not await menu.is_visible():
                failures.append("mobile More menu: menu did not open")
            await menu.get_by_role("menuitem", name="Search", exact=True).click(force=True)
            await page.wait_for_url(re.compile(r"/search$"), timeout=10_000)
            if not page.url.endswith("/search"):
                failures.append(f"mobile More → Search route: {page.url}")
        except Exception as error:
            failures.append(f"mobile More → Search interaction: {type(error).__name__}: {error}")
        finally:
            await page.close()

        for path, marker, forbidden in (
            ("/aitech", "185개 기록", "페이지"),
            ("/devsnack", "전체 9개", None),
        ):
            page = await browser.new_page(viewport={"width": 1440, "height": 900})
            try:
                await page.goto(f"{BASE_URL}{path}", wait_until="networkidle", timeout=60_000)
                visible_text = await page.locator("body").inner_text()
                if marker not in visible_text:
                    failures.append(f"{path}: missing hydrated marker {marker!r}")
                if forbidden and forbidden in visible_text:
                    failures.append(f"{path}: stale pagination marker {forbidden!r}")
            except Exception as error:
                failures.append(f"{path} archive browser check: {type(error).__name__}: {error}")
            finally:
                await page.close()

        page = await browser.new_page(viewport={"width": 1440, "height": 900})
        try:
            await page.goto(f"{BASE_URL}/", wait_until="networkidle", timeout=60_000)
            aside = page.locator("aside")
            await aside.get_by_role("button", name="Lab", exact=True).click(force=True)
            if "Showcase" not in await aside.inner_text():
                failures.append("desktop Lab group: Showcase missing")
            await aside.get_by_role("button", name="Data", exact=True).click(force=True)
            data_text = await aside.inner_text()
            if "StockPulse" not in data_text or "DevSnack Models" not in data_text:
                failures.append("desktop Data group: current Data destinations missing")
            if "Mining" in data_text:
                failures.append("desktop Data group: retired Mining destination still exposed")
            await aside.get_by_role("button", name="More", exact=True).click(force=True)
            if "Search" not in await aside.inner_text():
                failures.append("desktop More group: Search missing")
        except Exception as error:
            failures.append(f"desktop navigation interaction: {type(error).__name__}: {error}")
        finally:
            await page.close()
        await browser.close()


def main() -> int:
    failures: list[str] = []
    print(f"DevSnack policy audit: {BASE_URL}")
    check_http_contract(failures)
    asyncio.run(check_browser(failures))
    if failures:
        print("SITE POLICY AUDIT FAILED")
        for failure in sorted(set(failures)):
            print(f"- {failure}")
        return 1
    print("SITE POLICY AUDIT PASSED")
    print(f"- route/content policy: {len(CURRENT_POLICY)}/{len(CURRENT_POLICY)} expectations passed")
    print("- retirement/migration sitemap and RSS exclusions: passed")
    print("- search lifecycle filtering: passed")
    print("- mobile overflow: 320/360/375/390px = 0")
    print("- mobile More → Search: passed")
    print("- desktop current navigation / retired Mining absence: passed")
    return 0


if __name__ == "__main__":
    sys.exit(main())
