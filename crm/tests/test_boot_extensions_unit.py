"""Isolated checks (stdlib unittest, no bench): the crm_boot_extensions hook collector."""

import importlib.util
import sys
import types
import unittest
from pathlib import Path


def load(attrs: dict):
	"""Load boot_extensions.py with a stub ``frappe`` whose get_attr resolves from ``attrs``."""
	frappe = types.ModuleType("frappe")
	frappe.logged = []

	def get_attr(path):
		value = attrs[path]
		if isinstance(value, Exception):
			raise value
		return value

	frappe.get_attr = get_attr
	frappe.log_error = lambda *a, **k: frappe.logged.append(k.get("title") or (a[0] if a else None))
	path = Path(__file__).resolve().parents[1] / "utils" / "boot_extensions.py"
	saved = sys.modules.get("frappe")
	sys.modules["frappe"] = frappe
	try:
		spec = importlib.util.spec_from_file_location("boot_extensions_under_test", path)
		module = importlib.util.module_from_spec(spec)
		spec.loader.exec_module(module)
	finally:
		if saved is None:
			sys.modules.pop("frappe", None)
		else:
			sys.modules["frappe"] = saved
	return module, frappe


class CollectBootExtensionsTest(unittest.TestCase):
	def test_empty_hooks_give_empty_dict(self):
		module, frappe = load({})
		self.assertEqual(module.collect_boot_extensions([]), {})
		self.assertEqual(module.collect_boot_extensions(None), {})
		self.assertEqual(frappe.logged, [])

	def test_results_are_merged_in_hook_order(self):
		module, _ = load(
			{
				"a.one": lambda: {"report_issue": {"enabled": True}, "x": 1},
				"b.two": lambda: {"y": 2, "x": 3},
			}
		)
		self.assertEqual(
			module.collect_boot_extensions(["a.one", "b.two"]),
			{"report_issue": {"enabled": True}, "x": 3, "y": 2},
		)

	def test_merge_is_shallow(self):
		module, _ = load({"a": lambda: {"k": {"one": 1}}, "b": lambda: {"k": {"two": 2}}})
		self.assertEqual(module.collect_boot_extensions(["a", "b"]), {"k": {"two": 2}})

	def test_raising_extension_is_logged_and_skipped(self):
		def boom():
			raise RuntimeError("broken")

		module, frappe = load({"bad": boom, "good": lambda: {"ok": True}})
		self.assertEqual(module.collect_boot_extensions(["bad", "good"]), {"ok": True})
		self.assertEqual(frappe.logged, ["CRM boot extension failed: bad"])

	def test_unresolvable_path_is_logged_and_skipped(self):
		module, frappe = load({"good": lambda: {"ok": True}, "missing": ImportError("no module")})
		self.assertEqual(module.collect_boot_extensions(["missing", "good"]), {"ok": True})
		self.assertEqual(len(frappe.logged), 1)

	def test_non_dict_result_is_logged_and_skipped(self):
		module, frappe = load({"bad": lambda: ["not", "a", "dict"], "good": lambda: {"ok": 1}})
		self.assertEqual(module.collect_boot_extensions(["bad", "good"]), {"ok": 1})
		self.assertEqual(len(frappe.logged), 1)

	def test_failing_log_error_does_not_propagate(self):
		module, frappe = load({"bad": RuntimeError("x")})

		def broken_log(*a, **k):
			raise OSError("no log dir")

		frappe.log_error = broken_log
		self.assertEqual(module.collect_boot_extensions(["bad"]), {})


if __name__ == "__main__":
	unittest.main()
