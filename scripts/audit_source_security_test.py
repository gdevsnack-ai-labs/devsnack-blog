import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from audit_source_security import scan_text


class SourceSecurityAuditTests(unittest.TestCase):
    def test_literal_supabase_key_assignment_is_rejected(self):
        findings = scan_text('env: { NEXT_PUBLIC_SUPABASE_ANON_KEY: "eyJ' + 'a' * 20 + "." + 'b' * 20 + "." + 'c' * 20 + '" }')
        self.assertIn('hardcoded-supabase-key', findings)

    def test_environment_reference_is_allowed(self):
        findings = scan_text('const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY')
        self.assertEqual(findings, [])

    def test_secret_shaped_value_is_rejected_without_echoing_value(self):
        findings = scan_text('Authorization: Bearer ' + 'x' * 32)
        self.assertIn('credential-like-value', findings)


if __name__ == '__main__':
    unittest.main()
