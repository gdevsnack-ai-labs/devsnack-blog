from __future__ import annotations

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from weekly_site_audit import (
    audit_status,
    classify_changed_file,
    rss_contract_findings,
    sitemap_coverage_findings,
    stockpulse_visible_findings,
    route_from_page_file,
)


class WeeklySiteAuditTests(unittest.TestCase):
    def test_page_file_maps_to_public_route_and_omits_route_groups(self):
        self.assertEqual(route_from_page_file("src/app/(marketing)/benchmarks/page.tsx"), "/benchmarks")
        self.assertEqual(route_from_page_file("src/app/research/[slug]/page.tsx"), "/research/[slug]")
        self.assertEqual(route_from_page_file("src/app/api/search/route.ts"), None)

    def test_changed_files_are_classified_by_site_surface(self):
        self.assertEqual(classify_changed_file("src/app/sitemap.ts"), "syndication")
        self.assertEqual(classify_changed_file("src/app/research/[slug]/page.tsx"), "routes")
        self.assertEqual(classify_changed_file("src/components/blog-card.tsx"), "ia-or-ui")
        self.assertEqual(classify_changed_file("src/data/experiments.ts"), "data-or-seo")

    def test_new_indexable_route_missing_from_sitemap_is_reported(self):
        findings = sitemap_coverage_findings(
            ["/new-research"],
            {"/", "/research"},
        )
        self.assertEqual(len(findings), 1)
        self.assertEqual(findings[0]["severity"], "BLOCK")
        self.assertIn("/new-research", findings[0]["message"])

    def test_noindex_route_is_not_reported_as_sitemap_omission(self):
        findings = sitemap_coverage_findings(
            ["/stock"],
            {"/", "/research"},
            exempt_routes={"/stock"},
        )
        self.assertEqual(findings, [])

    def test_rss_with_public_details_but_no_items_is_blocked(self):
        findings = rss_contract_findings(
            "<rss><channel><title>DevSnack</title></channel></rss>",
            "/rss.xml",
            ["/research/example"],
        )
        self.assertTrue(any(item["severity"] == "BLOCK" for item in findings))
        self.assertTrue(any("0 items" in item["message"] for item in findings))

    def test_stockpulse_date_string_in_event_data_does_not_pass_stale_lab(self):
        body = """
        <span>최근 run · <!-- -->09/15</span>
        <p>Upcoming FOMC: 2026-09-16</p>
        <a href="https://gdevsnack-ai-labs.github.io/stockpulse-v1-fixed-publication/reports/2026-09-15/morning/">Morning</a>
        <span>반영 대기</span>
        """
        findings = stockpulse_visible_findings(
            body,
            trading_date="2026-09-16",
            expected_publication_paths=["reports/2026-09-16/morning/"],
            expected_applied=8,
            expected_pending=0,
        )
        self.assertEqual(audit_status(findings), "BLOCK")
        self.assertTrue(any("latest run" in item["message"] for item in findings))

    def test_current_stockpulse_lab_markers_pass(self):
        body = """
        <span>최근 run · <!-- -->09/16</span>
        <a href="https://gdevsnack-ai-labs.github.io/stockpulse-v1-fixed-publication/reports/2026-09-16/morning/">Morning</a>
        <span>설정 반영 완료</span><span>설정 반영 완료</span>
        """
        findings = stockpulse_visible_findings(
            body,
            trading_date="2026-09-16",
            expected_publication_paths=["reports/2026-09-16/morning/"],
            expected_applied=2,
            expected_pending=0,
        )
        self.assertEqual(findings, [])


if __name__ == "__main__":
    unittest.main()
