"""Non-invasive V23 checks for the hosts parser and catalog."""
import unittest
from unittest.mock import patch
import app

class V23DiagnosticTests(unittest.TestCase):
    def test_hosts_markers_are_reversible(self):
        original = "127.0.0.1 localhost\n"
        managed = original + app.OPEN + "\n0.0.0.0 sample.example\n" + app.CLOSE + "\n"
        self.assertEqual(app.strip_managed(managed), original)

    def test_incomplete_hosts_is_rejected(self):
        with self.assertRaises(ValueError):
            app.strip_managed(app.OPEN + "\n0.0.0.0 sample.example\n")

    def test_domains_invalid_are_reported(self):
        valid, bad = app.normalize("example.org\nhttps://example.org/path\n")
        self.assertEqual(valid, ["example.org"])
        self.assertEqual(len(bad), 1)

if __name__ == '__main__':
    unittest.main()
