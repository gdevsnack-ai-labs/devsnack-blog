#!/usr/bin/env python3
"""Read-only same-origin anchor checker for public DevSnack pages."""
from __future__ import annotations

import argparse
import concurrent.futures
import html
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from collections import defaultdict
from html.parser import HTMLParser

DEFAULT_BASE = os.environ.get("SITE_URL", "http://127.0.0.1:3333").rstrip("/")
USER_AGENT = "devsnack-internal-link-audit/1.0"
SKIP_PREFIXES = ("/_next/", "/_vercel/")


def normalize_href(base_url: str, href: str) -> str:
    joined = urllib.parse.urljoin(base_url, html.unescape(href.strip()))
    split = urllib.parse.urlsplit(joined)
    path = urllib.parse.quote(urllib.parse.unquote(split.path or "/"), safe="/%:@+~!$&'()*,-._;=")
    return urllib.parse.urlunsplit((split.scheme, split.netloc, path, split.query, ""))


def is_checkable_href(href: str, base_url: str) -> bool:
    value = html.unescape(href.strip())
    if not value or value.startswith(("#", "mailto:", "tel:", "javascript:", "data:")):
        return False
    target = normalize_href(base_url, value)
    origin = urllib.parse.urlsplit(base_url)
    parsed = urllib.parse.urlsplit(target)
    if parsed.scheme not in {"http", "https"} or parsed.netloc != origin.netloc:
        return False
    return not parsed.path.startswith(SKIP_PREFIXES)


class AnchorParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.hrefs: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag.lower() != "a":
            return
        values = dict(attrs)
        href = values.get("href")
        if href:
            self.hrefs.append(href)


def fetch(url: str, timeout: int = 20) -> tuple[int, str]:
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            return response.status, response.read().decode("utf-8", "ignore")
    except urllib.error.HTTPError as error:
        return error.code, error.read().decode("utf-8", "ignore")
    except (urllib.error.URLError, TimeoutError):
        return 0, ""


def sitemap_urls(base_url: str) -> list[str]:
    status, body = fetch(f"{base_url}/sitemap.xml")
    if status != 200:
        raise RuntimeError(f"sitemap HTTP {status}")
    root = ET.fromstring(body)
    namespace = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    urls = [node.text for node in root.findall("sm:url/sm:loc", namespace) if node.text]
    return list(dict.fromkeys(urls))


def collect_page_links(url: str, base_url: str) -> tuple[str, set[str]]:
    status, body = fetch(url)
    if status != 200:
        return url, set()
    parser = AnchorParser()
    parser.feed(body)
    targets = {
        normalize_href(url, href)
        for href in parser.hrefs
        if is_checkable_href(href, base_url)
    }
    return url, targets


def check_target(url: str) -> tuple[str, int]:
    status, _ = fetch(url, timeout=20)
    return url, status


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-url", default=DEFAULT_BASE)
    parser.add_argument("--max-pages", type=int, default=0)
    args = parser.parse_args()
    base_url = args.base_url.rstrip("/")

    urls = sitemap_urls(base_url)
    if args.max_pages:
        urls = urls[: args.max_pages]

    refs: dict[str, set[str]] = defaultdict(set)
    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
        for source, targets in pool.map(lambda url: collect_page_links(url, base_url), urls):
            for target in targets:
                refs[target].add(source)

    targets = sorted(refs)
    results: list[dict[str, object]] = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
        for target, status in pool.map(check_target, targets):
            if status != 200:
                results.append({"url": target, "status": status, "referrers": sorted(refs[target])})

    output = {
        "base_url": base_url,
        "sitemap_pages_checked": len(urls),
        "internal_targets_checked": len(targets),
        "broken": results,
    }
    print(json.dumps(output, ensure_ascii=False, indent=2))
    return 1 if results else 0


if __name__ == "__main__":
    sys.exit(main())
