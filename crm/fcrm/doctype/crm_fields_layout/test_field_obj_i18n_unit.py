"""Isolated checks: field-layout placeholders and tooltips are built from translatable messages."""
import importlib.util
import sys
import types
import unittest
from pathlib import Path
from unittest.mock import patch

HU = {
    "Add {0}...": "{0} hozzáadása...",
    "Select {0}...": "{0} kiválasztása...",
    "Territory": "Terület",
    "This field is read only and cannot be edited.": "Ez a mező csak olvasható, nem szerkeszthető.",
}


class Field(dict):
    __getattr__ = dict.get


def load():
    frappe = types.ModuleType("frappe")
    frappe._ = lambda text: HU.get(text, text)
    frappe.whitelist = lambda *a, **k: (lambda fn: fn)
    model = types.ModuleType("frappe.model")
    document = types.ModuleType("frappe.model.document")
    document.Document = type("Document", (), {})
    utils = types.ModuleType("frappe.utils")
    utils.random_string = lambda n: "x" * n
    frappe._ = frappe._
    modules = {
        "frappe": frappe,
        "frappe.model": model,
        "frappe.model.document": document,
        "frappe.utils": utils,
    }
    path = Path(__file__).with_name("crm_fields_layout.py")
    with patch.dict(sys.modules, modules):
        spec = importlib.util.spec_from_file_location("fields_layout_under_test", path)
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
    return module


class FieldPlaceholderTest(unittest.TestCase):
    def setUp(self):
        self.module = load()

    def test_text_placeholder_is_translated_with_the_translated_label(self):
        field = self.module.get_field_obj(Field(label="Territory", fieldtype="Data"))
        self.assertEqual(field["placeholder"], "Terület hozzáadása...")

    def test_link_placeholder_keeps_the_upstream_add_wording_but_is_translated(self):
        field = self.module.get_field_obj(Field(label="Territory", fieldtype="Link"))
        self.assertEqual(field["placeholder"], "Terület hozzáadása...")

    def test_select_placeholder_is_translated_and_option_values_stay_raw(self):
        field = self.module.get_field_obj(
            Field(label="Territory", fieldtype="Select", options="One\nTwo")
        )
        self.assertEqual(field["placeholder"], "Terület hozzáadása...")
        self.assertEqual([o["value"] for o in field["options"]], ["One", "Two"])

    def test_explicit_placeholder_is_kept(self):
        field = self.module.get_field_obj(
            Field(label="Territory", fieldtype="Data", placeholder="Anything")
        )
        self.assertEqual(field["placeholder"], "Anything")

    def test_read_only_tooltip_is_translated(self):
        field = self.module.get_field_obj(Field(label="Territory", fieldtype="Data", read_only=1))
        self.assertEqual(field["tooltip"], "Ez a mező csak olvasható, nem szerkeszthető.")


if __name__ == "__main__":
    unittest.main()
