import sys
import unittest
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
import app

class DomainRulesTests(unittest.TestCase):
    def test_catalog_303(self):
        entries = app.catalog()
        self.assertEqual(len(entries), 303)
        self.assertEqual(len(app.group_catalog(entries)), 9)

    def test_all_enabled_then_disable_one_group(self):
        entries = app.catalog()
        self.assertEqual(len(app.selection_domains(entries, set())), 9)
        ids = {x["id"] for x in entries if x["group"] == "Médias et groupes de presse"}
        self.assertNotIn("cnews.fr", app.selection_domains(entries, ids))
        self.assertEqual(app.selection_domains(entries, set()), sorted(set(app.selection_domains(entries, set()))))

    def test_disable_one_entry_only(self):
        entries = app.catalog()
        cnews = next(x for x in entries if x["name"] == "CNews")
        self.assertNotIn("cnews.fr", app.selection_domains(entries, {cnews["id"]}))
        self.assertIn("europe1.fr", app.selection_domains(entries, {cnews["id"]}))

    def test_domain_validation(self):
        names, bad = app.normalize('cnews.fr\n*.europe1.fr\nINVALID DOMAIN\n# note\ncnews.fr\n')
        self.assertEqual(names, ['cnews.fr','europe1.fr'])
        self.assertEqual(bad, ['INVALID DOMAIN'])

    def test_hosts_restoration_preserves_unmanaged_lines(self):
        existing = '127.0.0.1 localhost\n'+app.OPEN+'\n0.0.0.0 exemple.fr\n'+app.CLOSE+'\n10.1.1.1 intranet\n'
        self.assertEqual(app.strip_managed(existing), '127.0.0.1 localhost\n10.1.1.1 intranet\n')

    def test_missing_end_marker_refuses_edit(self):
        with self.assertRaises(ValueError):
            app.strip_managed('hosts\n'+app.OPEN+'\nunclosed')

if __name__ == '__main__': unittest.main()
