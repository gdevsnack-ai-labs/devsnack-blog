import json
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from audit_site import (  # noqa: E402
    CURRENT_POLICY,
    check_route_expectation,
    check_sitemap_policy,
    latest_v1_fixed_publication_url,
)


class AuditPolicyTest(unittest.TestCase):
    def test_aitech_archive_policy_is_noindex_and_not_paginated(self):
        expectation = CURRENT_POLICY['/aitech']
        failures = check_route_expectation(
            expectation,
            200,
            {'content-type': 'text/html'},
            '<title>AI Tech</title><meta name="robots" content="noindex, follow">'
            '<link rel="canonical" href="https://example.test/aitech">'
            '<h1>AI Tech Insight</h1><p>Historical index</p><p>185개 기록</p><p>다음 단계</p>',
            'https://example.test',
        )
        self.assertEqual(failures, [])

    def test_redirect_policy_requires_exact_location(self):
        expectation = CURRENT_POLICY['/lab']
        failures = check_route_expectation(
            expectation,
            308,
            {'Location': '/labs'},
            '',
            'https://example.test',
        )
        self.assertEqual(failures, [])

    def test_current_stockpulse_publication_comes_from_available_projection_path(self):
        projection_path = Path(__file__).resolve().parents[1] / 'src' / 'data' / 'stockpulse-v1-fixed-projection.json'
        projection = json.loads(projection_path.read_text())
        candidates = []
        for run in projection['runs']['records']:
            if run['trading_date'] < '2026-09-01':
                continue
            for stage in ('morning', 'evening'):
                publication = run['publications'][stage]
                if publication['status'] != 'available' or not publication['path']:
                    continue
                candidates.append((
                    run['trading_date'],
                    stage == 'evening',
                    f"https://gdevsnack-ai-labs.github.io/stockpulse-v1-fixed-publication/{publication['path'].lstrip('/')}",
                ))
        expected = max(candidates, key=lambda item: (item[0], item[1]))[2]
        self.assertEqual(
            latest_v1_fixed_publication_url(),
            expected,
        )

    def test_sitemap_rejects_retired_and_migrated_detail_urls(self):
        urls = [
            'https://example.test/',
            'https://example.test/aitech',
            'https://example.test/labs',
            'https://example.test/aitech/old-story',
            'https://example.test/stock/2026-08-01',
            'https://example.test/research/dflash-2-qwen3-8-27b-vs-mtp',
        ]
        failures = check_sitemap_policy(urls, 'https://example.test')
        self.assertIn('sitemap contains retired AI Tech detail URL', failures)
        self.assertIn('sitemap contains retired StockPulse detail URL', failures)
        self.assertIn('sitemap contains migrated Research detail URL', failures)


if __name__ == '__main__':
    unittest.main()
