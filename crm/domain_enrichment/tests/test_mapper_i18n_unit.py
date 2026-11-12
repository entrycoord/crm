"""Isolated tests for enrichment display labels."""
import importlib.util
import sys
import types
import unittest
from pathlib import Path
from unittest.mock import patch

class MapperI18nTest(unittest.TestCase):
    def test_unknown_mapping_uses_translated_field_label_not_fieldname(self):
        frappe = types.ModuleType("frappe")
        frappe._ = lambda value: {"Custom field": "Egyéni mező"}.get(value, value)
        crawler = types.ModuleType("isolated_enrichment.crawler")
        crawler.registrable_domain = lambda value: value
        pkg = types.ModuleType("isolated_enrichment")
        pkg.__path__ = []
        path = Path(__file__).parents[1] / "mapper.py"
        with patch.dict(sys.modules, {"frappe": frappe, "isolated_enrichment": pkg, crawler.__name__: crawler}):
            spec = importlib.util.spec_from_file_location("isolated_enrichment.mapper", path)
            mod = importlib.util.module_from_spec(spec)
            sys.modules[spec.name] = mod
            try:
                spec.loader.exec_module(mod)
                field = types.SimpleNamespace(label="Custom field")
                doc = types.SimpleNamespace(meta=types.SimpleNamespace(get_field=lambda name: field))
                self.assertEqual(mod._label_for(doc, "custom_source", "custom_field"), "Egyéni mező")
            finally:
                del sys.modules[spec.name]

if __name__ == "__main__":
    unittest.main()
