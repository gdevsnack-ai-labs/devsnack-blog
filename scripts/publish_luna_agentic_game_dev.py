#!/usr/bin/env python3
"""Publish the Luna Agentic Game Dev Lab note to Supabase and verify it."""

from __future__ import annotations

import html
import json
import os
import re
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ENV_FILE = ROOT / '.env.local'
MARKDOWN_FILE = ROOT / 'docs/lab/luna-agentic-game-dev.md'
SLUG = 'luna-agentic-game-dev-e2e'
BLOG_ID = 'lab'


def load_env(path: Path) -> dict[str, str]:
    values: dict[str, str] = {}
    for raw in path.read_text(encoding='utf-8').splitlines():
        line = raw.strip()
        if not line or line.startswith('#') or '=' not in line:
            continue
        key, value = line.split('=', 1)
        value = value.strip()
        if len(value) >= 2 and value[0] == value[-1] and value[0] in {'"', "'"}:
            value = value[1:-1]
        values[key.strip()] = value
    return values


def mask_private(text: str) -> str:
    text = re.sub(r'/home/[A-Za-z0-9_.-]+(?:/[A-Za-z0-9_.-]+)+', '[local path]', text)
    text = re.sub(r'\b(?:192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|127\.0\.0\.1|localhost)\b', '[local endpoint]', text)
    return text


def inline(value: str) -> str:
    value = html.escape(value, quote=True)
    value = re.sub(r'`([^`]+)`', r'<code>\1</code>', value)
    value = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', value)
    value = re.sub(r'\[([^\]]+)\]\((https?://[^)]+|/[^)]+)\)', r'<a href="\2" target="_blank" rel="noopener noreferrer">\1</a>', value)
    return value


def markdown_to_html(markdown: str) -> str:
    lines = mask_private(markdown).splitlines()
    output: list[str] = []
    i = 0
    in_code = False
    code_lines: list[str] = []
    list_open = False

    def close_list() -> None:
        nonlocal list_open
        if list_open:
            output.append('</ul>')
            list_open = False

    while i < len(lines):
        line = lines[i].rstrip()
        if line.startswith('```'):
            if in_code:
                output.append('<pre><code>' + html.escape('\n'.join(code_lines)) + '</code></pre>')
                in_code = False
                code_lines = []
            else:
                close_list()
                in_code = True
            i += 1
            continue
        if in_code:
            code_lines.append(line)
            i += 1
            continue
        if not line.strip():
            close_list()
            i += 1
            continue
        if line.strip() == '---':
            close_list()
            output.append('<hr>')
            i += 1
            continue
        table_match = line.startswith('|') and i + 1 < len(lines) and re.match(r'^\|[\s:|\-]+\|?$', lines[i + 1].strip())
        if table_match:
            close_list()
            headers = [cell.strip() for cell in line.strip().strip('|').split('|')]
            output.append('<table><thead><tr>' + ''.join(f'<th>{inline(cell)}</th>' for cell in headers) + '</tr></thead><tbody>')
            i += 2
            while i < len(lines) and lines[i].strip().startswith('|'):
                cells = [cell.strip() for cell in lines[i].strip().strip('|').split('|')]
                output.append('<tr>' + ''.join(f'<td>{inline(cell)}</td>' for cell in cells) + '</tr>')
                i += 1
            output.append('</tbody></table>')
            continue
        heading = re.match(r'^(#{1,6})\s+(.+)$', line)
        if heading:
            close_list()
            level = len(heading.group(1))
            output.append(f'<h{level}>{inline(heading.group(2))}</h{level}>')
            i += 1
            continue
        if line.startswith('> '):
            close_list()
            output.append(f'<blockquote>{inline(line[2:])}</blockquote>')
            i += 1
            continue
        bullet = re.match(r'^\s*[-*]\s+(.+)$', line)
        if bullet:
            if not list_open:
                output.append('<ul>')
                list_open = True
            output.append(f'<li>{inline(bullet.group(1))}</li>')
            i += 1
            continue
        close_list()
        output.append(f'<p>{inline(line)}</p>')
        i += 1
    if in_code:
        output.append('<pre><code>' + html.escape('\n'.join(code_lines)) + '</code></pre>')
    close_list()
    return '\n'.join(output)


def request_json(url: str, headers: dict[str, str], *, method: str = 'GET', payload: dict | None = None) -> tuple[int, object]:
    data = json.dumps(payload, ensure_ascii=False).encode('utf-8') if payload is not None else None
    request = urllib.request.Request(url, data=data, headers=headers, method=method)
    with urllib.request.urlopen(request, timeout=20) as response:
        raw = response.read()
        return response.status, (json.loads(raw) if raw.strip() else None)


def main() -> int:
    env = load_env(ENV_FILE)
    supabase_url = env.get('NEXT_PUBLIC_SUPABASE_URL', '').rstrip('/')
    service_key = env.get('SUPABASE_SERVICE_ROLE_KEY', '')
    if not supabase_url or not service_key:
        raise SystemExit('Supabase URL or service key is missing from .env.local')

    markdown = MARKDOWN_FILE.read_text(encoding='utf-8')
    content_html = markdown_to_html(markdown)
    forbidden = ('/home/', '192.168.', '127.0.0.1', 'FORGEJO_TOKEN', 'SUPABASE_SERVICE_ROLE', '사장님', '글쓴이의 내부 경로')
    leaked = [token for token in forbidden if token in markdown or token in content_html]
    if leaked:
        raise SystemExit(f'public safety scan failed: {leaked}')

    now = datetime.now(timezone(timedelta(hours=9))).isoformat(timespec='seconds')
    body = {
        'slug': SLUG,
        'title': 'Luna Agentic Game Development Lab — AI 개발팀의 첫 E2E 실험',
        'content': content_html,
        'excerpt': 'Hermes Agent, GPT-5.6 Luna, Qwen worker, Godot, Forgejo를 연결해 실제 AI 개발팀의 첫 PR·review·merge 루프를 검증한 DevSnack Lab 기록입니다.',
        'seo_desc': 'Hermes Agent와 로컬 Qwen worker가 Godot 변경을 수행하고 Forgejo PR·review·protected merge까지 완료한 Luna Agentic Game Development Lab 실험 기록입니다.',
        'labels': ['Agentic AI', 'Hermes', 'Luna', 'Godot', 'Forgejo', 'Qwen3.6', 'DevSnack Lab'],
        'published': now,
        'updated': now,
        'status': 'live',
        'blog_id': BLOG_ID,
        'cover_image': None,
        'blogger_id': 'lab-luna-agentic-game-dev',
    }
    headers = {
        'apikey': service_key,
        'Authorization': f'Bearer {service_key}',
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates,return=representation',
    }
    insert_url = f'{supabase_url}/rest/v1/posts?on_conflict=slug'
    status, inserted = request_json(insert_url, headers, method='POST', payload=body)
    read_url = f'{supabase_url}/rest/v1/posts?slug=eq.{urllib.parse.quote(SLUG)}&blog_id=eq.lab&select=id,slug,title,status,blog_id,seo_desc,content&limit=1'
    read_status, rows = request_json(read_url, headers)
    if not isinstance(rows, list) or len(rows) != 1:
        raise SystemExit(f'read-back failed: HTTP {read_status}')
    row = rows[0]
    checks = {
        'slug': row.get('slug') == SLUG,
        'blog_id': row.get('blog_id') == BLOG_ID,
        'status': row.get('status') == 'live',
        'title': row.get('title') == body['title'],
        'content_marker': 'Luna Agentic Game Development Lab' in row.get('content', ''),
        'content_length': len(row.get('content', '')) > 5000,
        'seo_desc': bool(row.get('seo_desc')),
    }
    if not all(checks.values()):
        raise SystemExit(f'validation failed: {checks}')
    print(json.dumps({
        'upsert_http': status,
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
