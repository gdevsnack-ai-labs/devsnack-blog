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
assert neutral_event_title(articles[0]) == 'OpenAI, AI 보안 기준 공개'
assert neutral_event_title({'title': 'OpenAI, 허깅페이스 해킹 이후 학습·테스트 중단'}) == 'OpenAI, 보안 사고 이후 학습·테스트 일시 중단 보도'

html = build_weekly_digest('2026-08-18', '2026-08-24', articles, clusters, core_limit=2)
assert '## 핵심 사건' in html
assert '## Compact roundup' in html
assert '## 사건별 source-summary record' in html
assert '## 사건별 확인된 source facts' not in html
assert '## 의미와 해석' in html
assert '## 다음 주 watch items' in html
assert '## Sources' in html
assert '중복 사건 1건 병합' in html
assert '핵심 사건 2개' in html
assert 'roundup 1개' in html
assert validate_weekly_digest(html, expected_article_count=4, expected_cluster_count=3, expected_core_count=2, expected_roundup_count=1) == []

production_articles = [
    {'id': 10, 'title': 'OpenAI 보안 사고 대응', 'summary': 'source summary ' * 30, 'source_url': 'https://example.com/10', 'published': '2026-08-18', 'source_quality': 'NEWS_BRIEF'},
    {'id': 11, 'title': 'Patton 데이터센터 조닝 조례', 'summary': 'source summary ' * 30, 'source_url': 'https://example.com/11', 'published': '2026-08-19', 'source_quality': 'NEWS_BRIEF'},
    {'id': 12, 'title': 'Fortinet Virtue AI 인수', 'summary': 'source summary ' * 30, 'source_url': 'https://example.com/12', 'published': '2026-08-20', 'source_quality': 'NEWS_BRIEF'},
    {'id': 13, 'title': 'Mistral 공공 조달', 'summary': 'source summary ' * 30, 'source_url': 'https://example.com/13', 'published': '2026-08-21', 'source_quality': 'NEWS_BRIEF'},
    {'id': 14, 'title': 'Anthropic Google TPU 인력 영입', 'summary': 'source summary ' * 30, 'source_url': 'https://example.com/14', 'published': '2026-08-22', 'source_quality': 'NEWS_BRIEF'},
    {'id': 15, 'title': 'KT 초등학생 AI 교육', 'summary': 'source summary ' * 30, 'source_url': 'https://example.com/15', 'published': '2026-08-23', 'source_quality': 'NEWS_BRIEF'},
    {'id': 16, 'title': 'GIST 대학생 AX 챌린지', 'summary': 'source summary ' * 30, 'source_url': 'https://example.com/16', 'published': '2026-08-24', 'source_quality': 'NEWS_BRIEF'},
]
production_clusters = cluster_events(production_articles)
production_core, production_roundup = select_core_events(production_articles, production_clusters)
assert len(production_clusters) == 7
assert 4 <= len(production_core) <= 6
assert len(production_core) == 5
assert len(production_roundup) == 2
assert any('Patton Township' in neutral_event_title(item['articles'][0]) for item in production_core)
production_html = build_weekly_digest('2026-08-18', '2026-08-24', production_articles, production_clusters)
assert validate_weekly_digest(production_html, 7, 7, expected_core_count=5, expected_roundup_count=2) == []

print('AI Tech weekly digest tests passed')
