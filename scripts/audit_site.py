#!/usr/bin/env python3
"""Read-only local smoke audit for the DevSnack blog."""
from __future__ import annotations

import asyncio
import html
import json
import os
import re
import sys
import urllib.error
import urllib.request

BASE_URL = os.environ.get("SITE_URL", "http://127.0.0.1:3333").rstrip("/")
ROUTES = [
    "/",
    "/devsnack",
    "/stock",
    "/aitech",
    "/realestate",
    "/lab",
    "/demos",
    "/research",
    "/misc",
    "/search",
    "/sitemap.xml",
    "/rss.xml",
]
BLOG_PATHS = {
    "devsnack": "/devsnack/",
    "stockpulse": "/stock/",
    "aitech": "/aitech/",
    "realestate": "/realestate/",
    "lab": "/lab/",
    "research": "/research/",
    "misc": "/misc/",
}
CONTENT_ROUTES = [
    "/devsnack/gemma-4-mtp-drafter-dgx-spark-3-31b",
    "/aitech/ai-mistral",
    "/lab/local-llm-benchmark-report",
    "/research/dflash-2-qwen3-8-27b-vs-mtp",
    "/misc/rx-7900-xtx",
]


def normalize_html(body: str) -> str:
    body = body.replace('<!-- -->', '')
    body = re.sub(r'<[^>]+>', ' ', body)
    return html.unescape(re.sub(r'\s+', ' ', body))


def fetch(path: str) -> tuple[int, str]:
    request = urllib.request.Request(f"{BASE_URL}{path}", headers={"User-Agent": "devsnack-site-audit/1.0"})
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            return response.status, response.read().decode("utf-8", "ignore")
    except urllib.error.HTTPError as error:
        return error.code, error.read().decode("utf-8", "ignore")


def check_http(failures: list[str]) -> None:
    for route in ROUTES:
        status, _ = fetch(route)
        if status != 200:
            failures.append(f"HTTP {route}: {status}")

    status, search_body = fetch("/api/search?q=local")
    if status != 200:
        failures.append(f"HTTP /api/search: {status}")
        return

    try:
        results = json.loads(search_body).get("results", [])
    except json.JSONDecodeError:
        failures.append("/api/search: invalid JSON")
        return

    for result in results:
        blog_id = result.get("blog_id")
        slug = result.get("slug")
        if blog_id not in BLOG_PATHS or not isinstance(slug, str):
            failures.append(f"search mapping: unknown {blog_id}/{slug}")

    if not results:
        failures.append("/api/search: no results for known query")

    for route in ("/sitemap.xml", "/rss.xml"):
        _, body = fetch(route)
        for required in (
            "/research/dflash-2-qwen3-8-27b-vs-mtp",
            "/lab/local-llm-benchmark-report",
            "/misc/mining-leaderboard",
        ):
            if required not in body:
                failures.append(f"{route}: missing {required}")
            if f"/devsnack/{required.rsplit('/', 1)[-1]}" in body:
                failures.append(f"{route}: stale devsnack fallback for {required}")

    _, aitech_page = fetch("/aitech")
    _, aitech_page_two = fetch("/aitech?page=2")
    aitech_text = normalize_html(aitech_page)
    aitech_text_two = normalize_html(aitech_page_two)
    if not re.search(r"1/\d+페이지", aitech_text):
        failures.append("/aitech: page 1 summary missing")
    if not re.search(r"2/\d+페이지", aitech_text_two):
        failures.append("/aitech?page=2: page 2 summary missing")


async def check_browser(failures: list[str]) -> None:
    try:
        from playwright.async_api import async_playwright
    except ImportError:
        failures.append("browser audit: Python Playwright is not installed")
        return

    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(
            headless=True,
            executable_path="/usr/bin/google-chrome",
            args=["--no-sandbox"],
        )
        for width in (320, 360, 375, 390):
            page = await browser.new_page(viewport={"width": width, "height": 844})
            await page.goto(f"{BASE_URL}/", wait_until="networkidle", timeout=60_000)
            metrics = await page.evaluate(
                """() => {
                    const nav = document.querySelector('nav[data-mobile-nav]');
                    return {
                        scrollWidth: nav?.scrollWidth ?? -1,
                        clientWidth: nav?.clientWidth ?? -1,
                        bodyScrollWidth: document.documentElement.scrollWidth,
                    };
                }"""
            )
            if metrics["scrollWidth"] != metrics["clientWidth"] or metrics["bodyScrollWidth"] != width:
                failures.append(f"mobile {width}px overflow: {metrics}")
            await page.close()

        for route in CONTENT_ROUTES:
            page = await browser.new_page(viewport={"width": 390, "height": 844})
            await page.goto(f"{BASE_URL}{route}", wait_until="networkidle", timeout=60_000)
            metrics = await page.evaluate(
                """() => ({
                    bodyWidth: document.documentElement.scrollWidth,
                    mainWidth: document.querySelector('main')?.scrollWidth ?? -1,
                    contentWidth: document.querySelector('.content-article, .prose-devsnack')?.clientWidth ?? -1,
                })"""
            )
            if metrics["bodyWidth"] != 390 or metrics["mainWidth"] > 390:
                failures.append(f"content {route} horizontal overflow: {metrics}")
            await page.close()

        page = await browser.new_page(viewport={"width": 390, "height": 844})
        await page.goto(f"{BASE_URL}{CONTENT_ROUTES[0]}", wait_until="networkidle", timeout=60_000)
        nav = page.locator("nav[data-mobile-nav]")
        if await page.get_by_title("링크 복사").count() != 1:
            failures.append("mobile content: copy-link FAB missing before menu")
        await nav.get_by_role("button", name="More 메뉴").click(force=True)
        await page.wait_for_timeout(100)
        if await page.get_by_title("링크 복사").count() != 0:
            failures.append("mobile More menu: copy-link FAB still visible")
        await page.close()

        page = await browser.new_page(viewport={"width": 1440, "height": 900})
        await page.goto(f"{BASE_URL}/", wait_until="networkidle", timeout=60_000)
        aside = page.locator("aside")
        await aside.get_by_role("button", name="Lab").click(force=True)
        if "Demos" not in await aside.inner_text():
            failures.append("desktop Lab group: Demos missing")
        await aside.get_by_role("button", name="More").click(force=True)
        if "검색" not in await aside.inner_text():
            failures.append("desktop More group: Search missing")
        await page.close()

        page = await browser.new_page(viewport={"width": 390, "height": 844})
        await page.goto(f"{BASE_URL}/research", wait_until="networkidle", timeout=60_000)
        nav = page.locator("nav[data-mobile-nav]")
        await nav.get_by_role("button", name="More 메뉴").click(force=True)
        if not await nav.get_by_role("menuitem", name="검색").is_visible():
            failures.append("mobile More menu: Search missing")
        await nav.get_by_role("menuitem", name="검색").click(force=True)
        await page.wait_for_timeout(500)
        if not page.url.endswith("/search"):
            failures.append(f"mobile More → Search route: {page.url}")
        await page.close()

        page = await browser.new_page(viewport={"width": 1440, "height": 900})
        await page.goto(f"{BASE_URL}/search", wait_until="networkidle", timeout=60_000)
        await page.locator("input").fill("local")
        await page.wait_for_timeout(1_200)
        cards = page.locator("main.max-w-3xl a")
        hrefs = await cards.evaluate_all("els => els.map(e => e.getAttribute('href'))")
        texts = await cards.all_inner_texts()
        expected_prefix = {
            "DevSnack": "/devsnack/",
            "StockPulse": "/stock/",
            "AI Tech": "/aitech/",
            "Lab": "/lab/",
            "Research": "/research/",
            "잡동사니": "/misc/",
        }
        for text, href in zip(texts, hrefs):
            label = text.splitlines()[0].strip()
            expected = expected_prefix.get(label)
            if expected and not (href or "").startswith(expected):
                failures.append(f"browser search mapping: {label} → {href}")
        await page.close()
        await browser.close()


def main() -> int:
    failures: list[str] = []
    check_http(failures)
    asyncio.run(check_browser(failures))
    if failures:
        print("SITE AUDIT FAILED")
        for failure in failures:
            print(f"- {failure}")
        return 1
    print(f"SITE AUDIT PASSED: {BASE_URL}")
    print("- HTTP routes: 12/12")
    print("- Search canonical mapping: passed")
    print("- Sitemap/RSS stale fallback: 0")
    print("- Pagination smoke: passed")
    print("- Mobile overflow: home 320/360/375/390px = 0")
    print("- Content detail responsive: 5 representative 390px routes = 0 overflow")
    print("- Mobile FAB/More layering: passed")
    print("- Desktop/mobile navigation: passed")
    return 0


if __name__ == "__main__":
    sys.exit(main())
