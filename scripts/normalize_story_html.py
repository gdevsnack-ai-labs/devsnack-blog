#!/usr/bin/env python3
"""Normalize legacy DevSnack Story HTML without rewriting its meaning.

This script is intentionally source-preserving:
- it removes imported document/head/presentation artifacts;
- it keeps semantic article HTML such as tables, code, links and images;
- it extracts the two playable legacy game documents before normalizing them;
- it can preview changes from a before snapshot before any external PATCH.

Requires: beautifulsoup4 (used only by this local content operation).
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

from bs4 import BeautifulSoup, Tag

GAME_SLUGS = {
    "html5-poop-dodge-game": "HTML5 똥피하기 게임",
    "ai-vampire-survivor-like-demo": "Pixel Survivors",
}

UPDATE_NOTES = {
    "googledrive-as-a-mediaserver": "현재 DevSnack의 canonical 발행 경로는 Supabase direct insert → Vercel read-back이다. 이 글의 Blogger 병행 발행 설명은 작성 당시의 역사적 맥락으로 읽어야 하며, 현재 발행은 Blogger에 의존하지 않는다.",
    "ai-llm-omok-experiment": "이 글은 초기 AI Omok 실험 기록이다. 이후 후속 엔진·자율 개선 실험이 AI Omok Project에서 계속되었으므로, 본문의 수치와 결론은 당시 실행 시점의 기록으로 구분한다.",
    "ai-built-gomoku-engine-vs-rapfi": "이 글 이후 AI Omok Project에서 후속 엔진·자율 개선 실험이 진행되었다. 본문의 Rapfi 비교와 다음 단계 예고는 당시의 역사적 기록이며, 최신 상태는 AI Omok Project에서 확인한다.",
    "hermes-agent-2-llm": "이 글의 위키·기억 구조는 당시 구축 기록이다. 현재 Hermes Memory 실험에서는 USER/MEMORY와 Hindsight의 역할을 분리해 별도로 검증하고 있으므로, 현재 구조로 오해하지 않도록 구분한다.",
    "2-hermes-agent-24": "Hermes Agent의 기능과 통합 방식은 버전에 따라 달라질 수 있다. 이 글은 작성 당시의 24시간 사용 경험과 설정 기록을 보존한 역사적 콘텐츠다.",
    "dgx-spark-gb10-2026-4": "이 글은 2026년 4월 기준 모델 목록과 선택 판단을 기록한 자료다. 모델 출시·지원·성능은 변할 수 있으므로 현재 선택 기준으로 사용할 때는 최신 공식 자료와 실측을 다시 확인한다.",
    "dgx-spark-qwen36-llamacpp-vllm-dflash": "본문의 설치 과정과 측정값은 당시 환경의 기록이다. 현재 DevSnack 발행 구조는 Blogger 병행이 아닌 Supabase direct insert → Vercel read-back이며, 원래 실측값은 변경하지 않았다.",
    "hermes-agent-searxng-dgx-gb10-tailscale": "Hermes의 web search backend와 SearXNG 연결 방식은 버전·설정에 따라 달라질 수 있다. 적용 전 현재 Hermes 공식 문서와 로컬 설정을 다시 확인한다.",
}

UPDATE_NOTES_EN = {
    "ai-built-gomoku-engine-vs-rapfi": "The AI Omok Project continued with later engine and autonomous-improvement experiments after this article. The Rapfi comparison and next-step preview remain a historical record of that run; see the AI Omok Project for the current state.",
}

PRESENTATION_ATTRS = {
    "align",
    "bgcolor",
    "border",
    "cellpadding",
    "cellspacing",
    "color",
    "face",
    "height",
    "hspace",
    "nowrap",
    "style",
    "valign",
    "vspace",
    "width",
}
LEGACY_CLASS_TOKENS = {
    "blog-container",
    "blog-wrap",
    "blog-header",
    "blog-footer",
    "blog-content",
    "post-body",
    "entry-content",
    "separator",
    "hentry",
    "blog-pager",
}


def inner_html(tag: Tag) -> str:
    return "".join(str(child) for child in tag.contents).strip()


def remove_imported_nodes(soup: BeautifulSoup) -> None:
    for selector in ["head", "meta", "link", "title"]:
        for node in soup.select(selector):
            node.decompose()
    for node in soup.find_all("script"):
        node.decompose()
    for node in soup.find_all(["html", "body"]):
        node.unwrap()


def class_values(tag: Tag) -> list[str]:
    raw = tag.attrs.get("class", [])
    if isinstance(raw, list):
        return [str(value) for value in raw]
    return str(raw).split()


def strip_presentation_attributes(root: BeautifulSoup | Tag) -> None:
    for tag in root.find_all(True):
        for attr in list(tag.attrs):
            if attr.lower() in PRESENTATION_ATTRS:
                del tag.attrs[attr]
        if "class" in tag.attrs:
            classes = [value for value in class_values(tag) if value not in LEGACY_CLASS_TOKENS]
            if classes:
                tag["class"] = classes
            else:
                del tag.attrs["class"]
    for tag_name in ["font", "center"]:
        for tag in root.find_all(tag_name):
            tag.unwrap()


def select_article_root(soup: BeautifulSoup, slug: str) -> Tag | BeautifulSoup:
    if slug == "html5-poop-dodge-game":
        root = soup.select_one(".blog-content")
        if root is not None:
            return root
    if slug == "ai-vampire-survivor-like-demo":
        root = soup.select_one(".blog-wrap")
        if root is not None:
            for game in root.select("#game-section"):
                game.decompose()
            return root
    body = soup.body
    return body if body is not None else soup


def update_note(slug: str, locale: str = "ko") -> str:
    note = UPDATE_NOTES_EN.get(slug) if locale == "en" else UPDATE_NOTES.get(slug)
    if not note:
        return ""
    label = "Current status update" if locale == "en" else "현재 상태 업데이트"
    return (
        f'<aside class="devsnack-update-note" aria-label="{label}">'
        '<strong>Update · 2026-08-26</strong>'
        f"<p>{note}</p>"
        "</aside>"
    )


def showcase_callout(slug: str) -> str:
    if slug not in GAME_SLUGS:
        return ""
    return (
        '<aside class="devsnack-showcase-callout" aria-label="Standalone Showcase">'
        f"<strong>{GAME_SLUGS[slug]} · Standalone Showcase</strong>"
        '<p>이 글의 실행 결과물을 별도 Showcase 화면으로 분리했다. '
        '<a href="/demos/html">Showcase에서 게임 실행하기 →</a></p>'
        "</aside>"
    )


def normalize_content(slug: str, content: str, locale: str = "ko") -> str:
    soup = BeautifulSoup(content, "html.parser")
    remove_imported_nodes(soup)
    root = select_article_root(soup, slug)
    for style in root.find_all("style"):
        style.decompose()

    # The selected root may still contain nested imported wrappers. Unwrap only
    # known layout containers; keep arbitrary divs because they can be semantic.
    for tag_name in ["html", "body"]:
        for tag in root.find_all(tag_name):
            tag.unwrap()
    legacy_wrappers = [
        tag for tag in root.find_all(True)
        if set(class_values(tag)).intersection(LEGACY_CLASS_TOKENS)
    ]
    for tag in reversed(legacy_wrappers):
        tag.unwrap()
    for tag in root.find_all(["header", "footer"]):
        classes = set(class_values(tag))
        if classes.intersection({"blog-header", "blog-footer", "site-header", "site-footer"}):
            tag.decompose()

    strip_presentation_attributes(root)
    body = inner_html(root) if isinstance(root, Tag) else str(root).strip()
    prefix = update_note(slug, locale) + showcase_callout(slug)
    return (prefix + body).strip()


def normalize_snapshot(snapshot: dict[str, Any]) -> dict[str, Any]:
    posts = snapshot.get("posts", [])
    normalized: list[dict[str, Any]] = []
    for post in posts:
        old = post.get("content") or ""
        new = normalize_content(post["slug"], old)
        normalized.append({
            "id": post["id"],
            "slug": post["slug"],
            "title": post["title"],
            "old_chars": len(old),
            "new_chars": len(new),
            "changed": old != new,
            "old_doctype": "<!doctype" in old.lower(),
            "new_doctype": "<!doctype" in new.lower(),
            "old_style_tags": old.lower().count("<style"),
            "new_style_tags": new.lower().count("<style"),
            "old_script_tags": old.lower().count("<script"),
            "new_script_tags": new.lower().count("<script"),
            "old_meta_link_tags": old.lower().count("<meta") + old.lower().count("<link"),
            "new_meta_link_tags": new.lower().count("<meta") + new.lower().count("<link"),
            "old_inline_style_attrs": old.lower().count(" style="),
            "new_inline_style_attrs": new.lower().count(" style="),
            "content": new,
        })
    return {"posts": normalized, "source": snapshot.get("meta", {})}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("input", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    snapshot = json.loads(args.input.read_text(encoding="utf-8"))
    result = normalize_snapshot(snapshot)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    changed = [row for row in result["posts"] if row["changed"]]
    print(json.dumps({
        "posts": len(result["posts"]),
        "changed": len(changed),
        "old_style_tags": sum(row["old_style_tags"] for row in result["posts"]),
        "new_style_tags": sum(row["new_style_tags"] for row in result["posts"]),
        "old_script_tags": sum(row["old_script_tags"] for row in result["posts"]),
        "new_script_tags": sum(row["new_script_tags"] for row in result["posts"]),
        "old_inline_style_attrs": sum(row["old_inline_style_attrs"] for row in result["posts"]),
        "new_inline_style_attrs": sum(row["new_inline_style_attrs"] for row in result["posts"]),
        "output": str(args.output),
    }, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
