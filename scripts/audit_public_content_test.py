import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from audit_public_content import (
    check_publication_links,
    check_rss_contract,
    scan_public_text,
)


class PublicSurfaceAuditTests(unittest.TestCase):
    def test_internal_values_in_public_prose_are_blocked(self):
        failures = scan_public_text(
            '<p>사장님 지시로 /home/kahros/tools/app을 실행하고 '
            'localhost:8080에서 확인했습니다.</p>'
        )
        self.assertIn('local-filesystem-path', failures)
        self.assertIn('internal-host-or-port', failures)
        self.assertIn('internal-operator-context', failures)

    def test_generic_code_example_is_allowed(self):
        failures = scan_public_text(
            '<p>일반적인 개발 예시입니다.</p>'
            '<pre><code>curl http://localhost:3000/health</code></pre>'
        )
        self.assertEqual(failures, [])

    def test_rss_with_public_details_cannot_be_empty(self):
        failures = check_rss_contract(
            '<rss><channel><title>DevSnack</title></channel></rss>',
            feed_path='/rss.xml',
            public_detail_paths=['/devsnack/example'],
        )
        self.assertIn('/rss.xml: public detail routes exist but RSS has 0 items', failures)

    def test_rss_rejects_retired_and_noindex_links(self):
        body = (
            '<rss><channel>'
            '<item><link>https://example.test/devsnack/live</link></item>'
            '<item><link>https://example.test/stock/old</link></item>'
            '<item><link>https://example.test/aitech/old</link></item>'
            '</channel></rss>'
        )
        failures = check_rss_contract(body, feed_path='/rss.xml', public_detail_paths=[])
        self.assertTrue(any('retired AI Tech or StockPulse detail URL' in failure for failure in failures))

    def test_pending_publication_link_is_rejected(self):
        body = (
            '<a href="https://gdevsnack-ai-labs.github.io/stockpulse-v1-fixed-publication/">home</a>'
            '<a href="https://gdevsnack-ai-labs.github.io/stockpulse-v1-fixed-publication/reports/2026-09-07/evening/">Evening</a>'
        )
        failures = check_publication_links(
            body,
            lambda url: 404 if url.endswith('/2026-09-07/evening/') else 200,
        )
        self.assertIn('publication link HTTP 404', failures[0])


if __name__ == '__main__':
    unittest.main()
