import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from audit_site import (  # noqa: E402
    CURRENT_POLICY,
    check_route_expectation,
    check_sitemap_policy,
)


class AuditPolicyTest(unittest.TestCase):
    def test_aitech_archive_policy_is_indexable_and_not_paginated(self):
        expectation = CURRENT_POLICY['/aitech']
        failures = check_route_expectation(
            expectation,
            200,
            {'content-type': 'text/html'},
            '<title>AI Tech</title><meta name="robots" content="index, follow">'
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
