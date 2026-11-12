"""Isolated display translation checks for assignment notifications."""
import importlib.util
import sys
import types
import unittest
from pathlib import Path
from unittest.mock import patch

class TodoTranslationTest(unittest.TestCase):
    def test_lead_display_is_translated_but_reference_is_raw(self):
        frappe = types.ModuleType("frappe")
        translations = {"lead": "érdeklődő"}
        frappe._ = lambda text: translations.get(text, text)
        frappe.session = types.SimpleNamespace(user="owner@example.test")
        frappe.get_cached_value = lambda *a: "Owner"
        ref = types.SimpleNamespace(lead_name="Jane")
        frappe.get_doc = lambda *a: ref
        sent = []
        notification = types.ModuleType("crm.fcrm.doctype.crm_notification.crm_notification")
        notification.notify_user = sent.append
        doc = types.SimpleNamespace(reference_type="CRM Lead", reference_name="LEAD-1", allocated_to="person@example.test")
        path = Path(__file__).parents[3] / "api" / "todo.py"
        with patch.dict(sys.modules, {"frappe": frappe, notification.__name__: notification}):
            spec = importlib.util.spec_from_file_location("todo_under_test", path)
            mod = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(mod)
            mod.notify_assigned_user(doc)
        self.assertIn("érdeklődő", sent[0]["notification_text"])
        self.assertEqual(sent[0]["reference_doctype"], "CRM Lead")
        self.assertEqual(sent[0]["redirect_to_doctype"], "CRM Lead")

if __name__ == "__main__":
    unittest.main()
