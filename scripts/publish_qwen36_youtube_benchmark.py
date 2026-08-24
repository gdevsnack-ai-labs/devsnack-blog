#!/usr/bin/env python3
"""Publish the Qwen3.6 YouTube script reliability benchmark to Supabase."""

from __future__ import annotations

import json
import re
import sys
import urllib.parse
from datetime import datetime, timezone, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MARKDOWN_FILE = ROOT / 'docs/benchmarks/qwen36-youtube-script-reliability.md'
SLUG = 'qwen36-youtube-script-reliability-benchmark'
BLOG_ID = 'lab'
TITLE = 'Qwen3.6 YouTube Script Reliability Benchmark — 실제 자동화 대본 생성 재현성 측정'

sys.path.insert(0, str(Path(__file__).resolve().parent))
from publish_luna_agentic_game_dev import load_env, markdown_to_html, request_json  # noqa: E402


def main() -> int:
    env = load_env(ROOT / '.env.local')
    supabase_url = env.get('NEXT_PUBLIC_SUPABASE_URL', '').rstrip('/')
    anon_key = env.get('NEXT_PUBLIC_SUPABASE_ANON_KEY', '')
    service_key = env.get('SUPABASE_SERVICE_ROLE_KEY', '')
    if not supabase_url or not service_key:
        raise SystemExit('Supabase URL or service key is missing from .env.local')
    if not anon_key:
        anon_key = service_key

    markdown = MARKDOWN_FILE.read_text(encoding='utf-8')
    content_html = markdown_to_html(markdown)
    forbidden = (
        '/home/', '~/content-factory', '192.168.', '127.0.0.1', 'localhost',
        'FORGEJO_TOKEN', 'SUPABASE_SERVICE_ROLE', '사장님', '글쓴이의 내부 경로',
    )
    leaked = [token for token in forbidden if token in markdown or token in content_html]
    if leaked:
        raise SystemExit(f'public safety scan failed: {leaked}')

    now = datetime.now(timezone(timedelta(hours=9))).isoformat(timespec='seconds')
    body = {
        'slug': SLUG,
        'title': TITLE,
        'content': content_html,
        'excerpt': 'Qwen3.6-35B-A3B NVFP4 MTP HQ를 실제 YouTube Shorts 대본 생성에 넣고, 첫 시도 통과율과 5회 재시도 수렴성을 측정한 운영형 로컬 모델 벤치마크입니다.',
        'seo_desc': 'DGX Spark GB10에서 Qwen3.6-35B-A3B NVFP4 MTP HQ의 실제 YouTube 대본 생성 재현성과 재시도 안정성을 측정한 로컬 모델 벤치마크 결과입니다.',
        'labels': ['benchmark', 'llm', 'inference', 'Qwen3.6', 'GGUF', 'NVFP4', 'MTP', 'DGX Spark', 'YouTube automation'],
        'published': now,
        'updated': now,
        'status': 'live',
        'blog_id': BLOG_ID,
        'cover_image': None,
        'blogger_id': 'benchmark-qwen36-youtube-20260824',
    }
    headers = {
        'apikey': anon_key,
        'Authorization': f'Bearer {service_key}',
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates,return=representation',
    }
    insert_url = f'{supabase_url}/rest/v1/posts?on_conflict=slug'
    upsert_status, _ = request_json(insert_url, headers, method='POST', payload=body)

    encoded_slug = urllib.parse.quote(SLUG, safe='')
    read_url = (
        f'{supabase_url}/rest/v1/posts?slug=eq.{encoded_slug}'
        f'&blog_id=eq.{BLOG_ID}&select=id,slug,title,status,blog_id,seo_desc,content&limit=1'
    )
    read_status, rows = request_json(read_url, headers)
    if not isinstance(rows, list) or len(rows) != 1:
        raise SystemExit(f'read-back failed: HTTP {read_status}')
    row = rows[0]
    checks = {
        'slug': row.get('slug') == SLUG,
        'blog_id': row.get('blog_id') == BLOG_ID,
        'status': row.get('status') == 'live',
        'title': row.get('title') == TITLE,
        'content_marker': 'Qwen3.6 YouTube Script Reliability Benchmark' in row.get('content', ''),
        'table_marker': '<table>' in row.get('content', ''),
        'collapsible_details': row.get('content', '').count('<details>') >= 9 and row.get('content', '').count('<summary>') >= 9,
        'content_length': len(row.get('content', '')) > 5000,
        'seo_desc': bool(row.get('seo_desc')),
        'private_leak': not any(token in row.get('content', '') for token in forbidden),
    }
    if not all(checks.values()):
        raise SystemExit(f'validation failed: {checks}')

    print(json.dumps({
        'upsert_http': upsert_status,
        'readback_http': read_status,
        'id': row.get('id'),
        'slug': row.get('slug'),
        'status': row.get('status'),
        'blog_id': row.get('blog_id'),
        'content_length': len(row.get('content', '')),
        'checks': checks,
    }, ensure_ascii=False, indent=2))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
