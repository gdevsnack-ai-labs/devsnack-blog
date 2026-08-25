#!/usr/bin/env python3
"""Phase 6: replace only Blogger URLs with verified DevSnack routes."""
from __future__ import annotations

import json
import re
import urllib.error
import urllib.parse
import urllib.request
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ENV_FILE = ROOT / ".env.local"
SUPABASE_URL = "https://qbkfwnddxycixnqvfokq.supabase.co"
REST = f"{SUPABASE_URL}/rest/v1"

URL_RE = re.compile(
    r"https?://(?:devsnack\.blogspot\.com|aitech-kahros\.blogspot\.com|stockpulse-ai-lab\.blogspot\.com)"
    r"(?:/[A-Za-z0-9._~:/?#\[\]@!$&'()*+,;=%-]*)?",
    re.IGNORECASE,
)
ROOT_ROUTES = {
    "devsnack.blogspot.com": "/devsnack",
    "aitech-kahros.blogspot.com": "/aitech",
    "stockpulse-ai-lab.blogspot.com": "/stock",
}
STATIC_ROUTES = {
    ("aitech", "/p/blog-page.html"): "/privacy",
    ("aitech", "/p/blog-page_17.html"): "/contact",
    ("aitech", "/p/blog-page_21.html"): "/about",
}


def env() -> dict[str, str]:
    values: dict[str, str] = {}
    for raw in ENV_FILE.read_text(encoding="utf-8").splitlines():
        if "=" not in raw or raw.lstrip().startswith("#"):
            continue
        key, value = raw.split("=", 1)
        values[key.strip()] = value.strip().strip('"').strip("'")
    return values


def request(key: str, path: str, method: str = "GET", payload: object | None = None):
    body = None if payload is None else json.dumps(payload, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(
        f"{REST}/{path}",
        data=body,
        method=method,
        headers={
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=45) as response:
            raw = response.read()
            return json.loads(raw) if raw else []
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")[:500]
        raise RuntimeError(f"Supabase HTTP {exc.code}: {detail}") from exc


def fetch_all(key: str, table: str, params: dict[str, str]) -> list[dict]:
    rows: list[dict] = []
    offset = 0
    while True:
        query = dict(params)
        query.update(limit="1000", offset=str(offset))
        chunk = request(key, f"{table}?{urllib.parse.urlencode(query)}")
        if not isinstance(chunk, list):
            raise RuntimeError(f"Expected list from {table}")
        rows.extend(chunk)
        if len(chunk) < 1000:
            return rows
        offset += 1000


def clean_url(raw: str) -> tuple[str, str]:
    trimmed = raw.rstrip(".,);]")
    return trimmed, raw[len(trimmed):]


def build_mapper(posts: list[dict]):
    slugs: dict[str, set[str]] = defaultdict(set)
    for post in posts:
        slugs[post["blog_id"]].add(post["slug"])

    def resolve(raw: str, blog_id: str) -> str | None:
        url, _suffix = clean_url(raw)
        parsed = urllib.parse.urlsplit(url)
        domain = parsed.netloc.lower()
        path = parsed.path or "/"
        if path == "/":
            return ROOT_ROUTES.get(domain)
        if path == "/favicon.ico":
            return "/favicon.ico"
        static = STATIC_ROUTES.get((blog_id, path))
        if static:
            return static
        slug = path.rsplit("/", 1)[-1]
        if slug.endswith(".html"):
            slug = slug[:-5]
        route = {"devsnack": "/devsnack", "aitech": "/aitech", "stockpulse": "/stock"}.get(blog_id)
        if route and slug in slugs.get(blog_id, set()):
            return f"{route}/{slug}"
        return None

    return resolve


def rewrite(text: str, blog_id: str, resolve) -> tuple[str, list[tuple[str, str]], list[str]]:
    mapped: list[tuple[str, str]] = []
    unresolved: list[str] = []

    def replace(match: re.Match[str]) -> str:
        raw = match.group(0)
        target = resolve(raw, blog_id)
        if target:
            _url, suffix = clean_url(raw)
            mapped.append((raw, target))
            return target + suffix
        unresolved.append(clean_url(raw)[0])
        return raw

    return URL_RE.sub(replace, text), mapped, unresolved


def main() -> None:
    key = env()["SUPABASE_SERVICE_ROLE_KEY"]
    posts = fetch_all(key, "posts", {"select": "id,slug,blog_id,status,content", "status": "eq.live"})
    translations = fetch_all(key, "post_translations", {"select": "id,post_id,locale,translation_status,content", "translation_status": "eq.published"})
    post_blog = {post["id"]: post["blog_id"] for post in posts}
    resolve = build_mapper(posts)

    changed_posts = 0
    changed_translations = 0
    mapped_by_scope: Counter[str] = Counter()
    unresolved: defaultdict[tuple[str, str], list[str]] = defaultdict(list)

    for post in posts:
        new_content, mapped, unresolved_urls = rewrite(post.get("content") or "", post["blog_id"], resolve)
        mapped_by_scope[post["blog_id"]] += len(mapped)
        for url in unresolved_urls:
            unresolved[(post["blog_id"], url)].append(post["slug"])
        if new_content != (post.get("content") or ""):
            request(key, f"posts?id=eq.{post['id']}", "PATCH", {"content": new_content})
            changed_posts += 1

    for translation in translations:
        blog_id = post_blog.get(translation["post_id"])
        if not blog_id:
            continue
        new_content, mapped, unresolved_urls = rewrite(translation.get("content") or "", blog_id, resolve)
        mapped_by_scope[f"translation:{blog_id}"] += len(mapped)
        for url in unresolved_urls:
            unresolved[(f"translation:{blog_id}", url)].append(str(translation["id"]))
        if new_content != (translation.get("content") or ""):
            request(key, f"post_translations?id=eq.{translation['id']}", "PATCH", {"content": new_content})
            changed_translations += 1

    print(json.dumps({
        "live_posts": len(posts),
        "published_translations": len(translations),
        "changed_posts": changed_posts,
        "changed_translations": changed_translations,
        "mapped_by_scope": dict(mapped_by_scope),
        "unresolved_unique": len(unresolved),
        "unresolved_by_scope": dict(Counter(scope for scope, _url in unresolved)),
        "unresolved_examples": [
            {"scope": scope, "url": url, "refs": refs[:8]}
            for (scope, url), refs in list(unresolved.items())[:120]
        ],
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
