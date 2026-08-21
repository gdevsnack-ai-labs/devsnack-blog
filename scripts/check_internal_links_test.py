import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from check_internal_links import is_checkable_href, normalize_href


class InternalLinkHelpersTest(unittest.TestCase):
    def test_normalize_relative_and_unicode_paths(self):
        self.assertEqual(
            normalize_href('https://example.com/devsnack/post', '../research/AI 뉴스'),
            'https://example.com/research/AI%20%EB%89%B4%EC%8A%A4',
        )

    def test_ignores_external_and_non_http_links(self):
        self.assertFalse(is_checkable_href('mailto:test@example.com', 'https://example.com/'))
        self.assertFalse(is_checkable_href('https://other.example/path', 'https://example.com/'))
        self.assertFalse(is_checkable_href('#section', 'https://example.com/'))

    def test_checks_same_origin_page_and_static_links(self):
        self.assertTrue(is_checkable_href('/research/example', 'https://example.com/'))
        self.assertTrue(is_checkable_href('/demo.html', 'https://example.com/'))
        self.assertFalse(is_checkable_href('/_next/static/app.js', 'https://example.com/'))


if __name__ == '__main__':
    unittest.main()
