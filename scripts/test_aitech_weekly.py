#!/usr/bin/env python3
from aitech_weekly import (
    build_weekly_digest,
    classify_reconstructed_source,
    cluster_events,
    neutral_event_title,
    select_core_events,
    validate_weekly_digest,
)

articles = [
    {
        'id': 1,
        'slug': 'openai-safety-standards',
        'title': 'OpenAI, AI 보안 새 기준 공개',
        'summary': 'OpenAI가 AI 보안 기준과 새로운 안전 절차를 공개했다.',
        'source_url': 'https://example.com/openai-1',
        'published': '2026-08-18T01:00:00Z',
    },
    {
        'id': 2,
        'slug': 'openai-safety-standards-followup',
        'title': 'OpenAI AI 보안 기준 후속 발표',
        'summary': 'OpenAI의 AI 보안 기준 후속 내용과 안전 절차가 공개됐다.',
        'source_url': 'https://example.com/openai-2',
        'published': '2026-08-18T02:00:00Z',
    },
    {
        'id': 3,
        'slug': 'mistral-procurement',
        'title': '프랑스 공공기관, Mistral AI 우선 조달',
        'summary': '프랑스 공공기관이 Mistral AI를 우선 조달 대상으로 검토한다.',
        'source_url': 'https://example.com/mistral',
        'published': '2026-08-19T01:00:00Z',
    },
    {
        'id': 4,
        'slug': 'anthropic-hardware',
        'title': 'Anthropic, AI 칩 하드웨어 인력 영입',
        'summary': 'Anthropic이 AI 칩 하드웨어 인력을 영입했다.',
        'source_url': 'https://example.com/hardware',
        'published': '2026-08-20T01:00:00Z',
    },
]

assert classify_reconstructed_source('https://example.com/a', '요약 ' * 80) == 'NEWS_BRIEF'
assert classify_reconstructed_source('', '요약 ' * 80) == 'REJECT'

clusters = cluster_events(articles)
assert len(clusters) == 3, clusters
assert sorted(len(cluster['articles']) for cluster in clusters) == [1, 1, 2]
core, roundup = select_core_events(articles, clusters, core_limit=2)
assert len(core) == 2
assert len(roundup) == 1
assert neutral_event_title(articles[0]) == 'OpenAI, 보안 사고 이후 학습·테스트 일시 중단 보도'

html = build_weekly_digest('2026-08-18', '2026-08-24', articles, clusters, core_limit=2)
assert '## 핵심 사건' in html
assert '## Compact roundup' in html
assert '## 사건별 확인된 source facts' in html
assert '## 의미와 해석' in html
assert '## 다음 주 watch items' in html
assert '## Sources' in html
assert '중복 사건 1건 병합' in html
assert '핵심 사건 2개' in html
assert 'roundup 1개' in html
assert validate_weekly_digest(html, expected_article_count=4, expected_cluster_count=3, expected_core_count=2, expected_roundup_count=1) == []

print('AI Tech weekly digest tests passed')
