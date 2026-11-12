"""Isolated WhatsApp display translation and routing check."""
import importlib.util
import sys
import types
import unittest
from pathlib import Path
from unittest.mock import patch

class WhatsAppTranslationTest(unittest.TestCase):
    def test_translated_display_does_not_change_redirect_identifier(self):
        frappe = types.ModuleType("frappe")
        frappe._ = lambda text: {"lead": "érdeklődő"}.get(text, text)
        frappe.whitelist = lambda: lambda fn: fn
        frappe.utils = types.SimpleNamespace(escape_html=lambda s: s.replace("<", "&lt;"))
        perms = types.ModuleType("frappe.permissions")
        perms.add_permission = perms.update_permission_property = lambda *args: None
        api = types.ModuleType("crm.api.doc")
        api.get_assigned_users = lambda *args: ["person@example.test"]
        notif = types.ModuleType("crm.fcrm.doctype.crm_notification.crm_notification")
        sent = []
        notif.notify_user = sent.append
        integration = types.ModuleType("crm.integrations.api")
        integration.get_contact_lead_or_deal_from_number = lambda *args: (None, None)
        modules = {m.__name__: m for m in [frappe, perms, api, notif, integration]}
        path = Path(__file__).parents[3] / "api" / "whatsapp.py"
        with patch.dict(sys.modules, modules):
            spec = importlib.util.spec_from_file_location("whatsapp_under_test", path)
            mod = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(mod)
            doc = types.SimpleNamespace(type="Incoming", reference_doctype="CRM Lead", reference_name="<LEAD-1>", owner="owner", message="hello", name="MSG-1")
            mod.notify_agent(doc)
        self.assertIn("érdeklődő", sent[0]["notification_text"])
        self.assertIn("&lt;LEAD-1>", sent[0]["notification_text"])
        self.assertEqual(sent[0]["redirect_to_doctype"], "CRM Lead")
        self.assertEqual(sent[0]["redirect_to_docname"], "<LEAD-1>")

if __name__ == "__main__":
    unittest.main()
