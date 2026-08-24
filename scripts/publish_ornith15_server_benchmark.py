#!/usr/bin/env python3
"""Publish the Ornith-1.5 server quality/speed benchmark to the Lab."""

from __future__ import annotations

import json
import sys
import urllib.parse
from datetime import datetime, timezone, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MARKDOWN_FILE = ROOT / 'docs/benchmarks/ornith15-server-quality-speed.md'
SLUG = 'ornith15-server-quality-speed-benchmark'
BLOG_ID = 'lab'
TITLE = 'Ornith-1.5 서버 품질·실사용 속도 Benchmark — Q5/Q6/Q8 비교'

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
        'FORGEJO_TOKEN', 'SUPABASE_SERVICE_ROLE', '사장님', '[로컬]', '[IP]',
    )
    leaked = [token for token in forbidden if token in markdown or token in content_html]
    if leaked:
        raise SystemExit(f'public safety scan failed: {leaked}')

    now = datetime.now(timezone(timedelta(hours=9))).isoformat(timespec='seconds')
    body = {
        'slug': SLUG,
        'title': TITLE,
        'content': content_html,
        'excerpt': 'Ornith-1.5-35B-A3B Q5_K_M·Q6_K·Q8_0을 실제 YouTube 대본 품질 요청에서 비교하고, 같은 요청의 prompt 처리·생성 속도·TTFT·MTP acceptance를 측정한 GB10 로컬 Benchmark입니다.',
        'seo_desc': 'DGX Spark GB10에서 Ornith-1.5-35B-A3B Q5/Q6/Q8 GGUF를 실제 YouTube 대본 품질과 실사용 속도로 비교한 로컬 Benchmark 결과입니다.',
        'labels': ['benchmark', 'llm', 'inference', 'Ornith-1.5', 'GGUF', 'Q5_K_M', 'Q6_K', 'Q8_0', 'MTP', 'DGX Spark'],
        'published': now,
        'updated': now,
        'status': 'live',
        'blog_id': BLOG_ID,
        'cover_image': None,
        'blogger_id': 'benchmark-ornith15-server-quality-speed-20260824',
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
        'content_marker': 'Ornith-1.5 서버 품질·실사용 속도 Benchmark' in row.get('content', ''),
        'table_marker': '<table>' in row.get('content', ''),
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
