"""Regression tests for CRM boot translation delivery."""
import ast
from pathlib import Path
from types import SimpleNamespace
import unittest

class BootTranslationsTest(unittest.TestCase):
    def boot(self, override, methods, base, lang="hu", hooks=None, user=None):
        path = Path(__file__).with_name("crm.py")
        tree = ast.parse(path.read_text(encoding="utf-8"))
        module = ast.Module(body=[n for n in tree.body if isinstance(n, ast.FunctionDef)], type_ignores=[])
        frappe = SimpleNamespace(
            __version__="test", _dict=dict, local=SimpleNamespace(site="test", lang=lang),
            conf=SimpleNamespace(socketio_port=9000, get=lambda key: None),
            flags=SimpleNamespace(read_only=False), sessions=SimpleNamespace(get_csrf_token=lambda: "token"),
            defaults=SimpleNamespace(get_defaults=dict),
            db=SimpleNamespace(get_default=lambda key: None, get_value=lambda *args: None),
            session=SimpleNamespace(user="test"), get_system_settings=lambda key: 1,
            override_whitelisted_method=lambda method: override or method,
            get_attr=lambda name: methods[name], get_hooks=lambda name: hooks or [], whitelist=lambda **kwargs: lambda func: func,
        )
        env = dict(frappe=frappe, HAS_AUTOMATION_ENGINE=False, cint=int,
                   get_messages_for_boot=lambda: base, get_translated_doctypes=dict,
                   get_user_translations=lambda code: dict((user or {}).get(code, {})),
                   get_parent_language=lambda code: code.replace("-", "_").split("_")[0] if ("-" in code or "_" in code) else None,
                   is_fc_site=lambda: False, get_system_timezone=lambda: "UTC")
        exec(compile(module, str(path), "exec"), env)
        env.update(get_cloud_settings=dict, get_state_options=dict)
        return env["get_boot"]()["translated_messages"]

    def test_boot_hook_preserves_request_locale_and_runtime_messages(self):
        base = {"Accounts": "Site translation", "Runtime": "Custom"}
        def endpoint():
            return {"Accounts": "User language instead of request language"}
        def layer(language):
            self.assertEqual(language, "fr")
            return {"Accounts": "French CRM"}
        result = self.boot("overlay.crm", {"overlay.crm": endpoint, "overlay.boot": layer}, base,
                           lang="fr", hooks=["overlay.boot"])
        self.assertEqual(result, {"Accounts": "French CRM", "Runtime": "Custom"})
        self.assertEqual(base, {"Accounts": "Site translation", "Runtime": "Custom"})

    def test_site_translation_records_win_over_the_crm_layer(self):
        base = {"Accounts": "Site translation", "Other": "Shared"}
        layer = lambda language: {"Accounts": "CRM layer", "Other": "CRM other"}
        user = {"fr": {"Accounts": "Site translation"}}
        result = self.boot(None, {"overlay.boot": layer}, base, lang="fr", hooks=["overlay.boot"], user=user)
        self.assertEqual(result["Accounts"], "Site translation")
        self.assertEqual(result["Other"], "CRM other")
        self.assertEqual(base["Other"], "Shared")

    def test_child_language_site_translation_beats_parent_site_translation(self):
        layer = lambda language: {"A": "layer", "B": "layer"}
        user = {"pt": {"A": "parent", "B": "parent"}, "pt-BR": {"A": "child"}}
        result = self.boot(None, {"overlay.boot": layer}, {}, lang="pt-BR", hooks=["overlay.boot"], user=user)
        self.assertEqual(result, {"A": "child", "B": "parent"})

    def test_without_override_uses_unchanged_boot_messages(self):
        base = {"Accounts": "Global"}
        result = self.boot(None, {}, base)
        self.assertEqual(result, base)

    def test_real_overlay_is_crm_scoped_without_mutating_cached_base(self):
        import importlib.util
        import os
        import sys
        from unittest.mock import patch
        overlay = os.environ.get("CRM_TRANSLATIONS_API")
        if not overlay:
            self.skipTest("Set CRM_TRANSLATIONS_API to the optional app's translations_api.py")
        base = {"Accounts": "Global", "Other": "Shared"}
        frappe = SimpleNamespace(session=SimpleNamespace(user="test"),
            db=SimpleNamespace(get_value=lambda *args: "hu", get_single_value=lambda *args: "hu"),
            whitelist=lambda **kwargs: lambda func: func)
        translate = SimpleNamespace(get_all_translations=lambda language: base)
        spec = importlib.util.spec_from_file_location("test_real_translations_api", overlay)
        api = importlib.util.module_from_spec(spec)
        with patch.dict(sys.modules, {"frappe": frappe, "frappe.translate": translate}):
            spec.loader.exec_module(api)
            crm_layer = api.get_app_layer("crm", "hu")
            other_keys = set(api.get_app_layer("helpdesk", "hu")) | set(api.get_app_layer("wiki", "hu"))
            key = next(key for key in crm_layer if key not in other_keys)
            base[key] = "Global sentinel"
            result = self.boot("overlay.crm", {"overlay.boot": lambda lang: api.get_app_layer("crm", lang)}, base,
                               hooks=["overlay.boot"])
            self.assertEqual(result[key], crm_layer[key])
            self.assertEqual(api.translations_for("helpdesk")[key], "Global sentinel")
            self.assertEqual(api.translations_for("wiki")[key], "Global sentinel")
            self.assertEqual(base[key], "Global sentinel")

if __name__ == "__main__":
    unittest.main()
