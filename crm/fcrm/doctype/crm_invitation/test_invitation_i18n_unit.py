"""Isolated invitation translation tests; no site or outgoing mail required."""
import importlib.util
import sys
import types
import unittest
from pathlib import Path
from unittest.mock import patch


class InvitationLanguageTest(unittest.TestCase):
    def test_existing_recipient_language_used_and_restored(self):
        local = types.SimpleNamespace(lang="en", dev_server=False)
        sent = []
        frappe = types.ModuleType("frappe")
        frappe.local = local
        frappe._ = lambda text, lang=None: f"[{lang or local.lang}] {text}"
        frappe.utils = types.SimpleNamespace(get_url=lambda s: s, now=lambda: "now")
        frappe.get_cached_value = lambda *args: "hu"
        frappe.get_system_settings = lambda key: "de"
        frappe.sendmail = lambda **kw: sent.append((local.lang, kw))
        frappe.db = types.SimpleNamespace(get_single_value=lambda *args: None)
        frappe.whitelist = lambda: lambda fn: fn
        model = types.ModuleType("frappe.model")
        document = types.ModuleType("frappe.model.document")
        document.Document = object
        api = types.ModuleType("crm.api.user")
        api.validate_no_role_profile = lambda user: None
        with patch.dict(sys.modules, {"frappe": frappe, "frappe.model": model, "frappe.model.document": document, "crm.api.user": api}):
            spec = importlib.util.spec_from_file_location("invitation_under_test", Path(__file__).with_name("crm_invitation.py"))
            mod = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(mod)
            invitation = mod.CRMInvitation()
            invitation.email = "person@example.test"
            invitation.key = "abc"
            invitation.db_set = lambda *args: None
            invitation.invite_via_email()
        self.assertEqual(sent[0][0], "hu")
        self.assertEqual(sent[0][1]["subject"], "[hu] You have been invited to join CRM")
        self.assertEqual(local.lang, "en")

    def test_background_job_uses_recipient_language_for_body(self):
        local = types.SimpleNamespace(lang="en", dev_server=False)
        sent = []
        frappe = types.ModuleType("frappe")
        # Frappe resolves the job user's language on the first implicit lookup.
        def translate(text, lang=None):
            if lang is None:
                local.lang = "en"
            return f"[{lang or local.lang}] {text}"
        frappe._ = translate
        frappe.local = local
        frappe.utils = types.SimpleNamespace(get_url=lambda s: s, now=lambda: "now")
        frappe.get_cached_value = lambda *args: "hu"
        frappe.get_system_settings = lambda key: "de"
        frappe.sendmail = lambda **kw: sent.append(kw)
        frappe.db = types.SimpleNamespace(get_single_value=lambda *args: None)
        frappe.whitelist = lambda: lambda fn: fn
        model = types.ModuleType("frappe.model")
        document = types.ModuleType("frappe.model.document")
        document.Document = object
        api = types.ModuleType("crm.api.user")
        api.validate_no_role_profile = lambda user: None
        with patch.dict(sys.modules, {"frappe": frappe, "frappe.model": model, "frappe.model.document": document, "crm.api.user": api}):
            spec = importlib.util.spec_from_file_location("invitation_under_test", Path(__file__).with_name("crm_invitation.py"))
            mod = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(mod)
            invitation = mod.CRMInvitation()
            invitation.email = "person@example.test"
            invitation.key = "abc"
            invitation.db_set = lambda *args: None
            invitation.invite_via_email()
        self.assertEqual(sent[0]["subject"], "[hu] You have been invited to join CRM")
        self.assertEqual(sent[0]["args"]["invitation_button"], "[hu] Accept Invitation")
        self.assertEqual(local.lang, "en")

if __name__ == "__main__":
    unittest.main()
