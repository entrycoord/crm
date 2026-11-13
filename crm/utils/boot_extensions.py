# Copyright (c) 2026, Frappe Technologies Pvt. Ltd. and contributors
# For license information, please see license.txt

import frappe


def collect_boot_extensions(hooks: list[str]) -> dict:
	"""Merge the dicts returned by the ``crm_boot_extensions`` hook callables.

	Each hook is a dotted path to a ``callable() -> dict``. Results are merged
	shallowly in hook order, so a later extension wins on the same top-level key.

	This runs inside the CRM boot, so it must never raise: an extension that fails
	to import, raises or returns something other than a dict is logged and skipped.
	"""
	extensions: dict = {}
	for path in hooks or []:
		try:
			result = frappe.get_attr(path)()
			if not isinstance(result, dict):
				raise TypeError(f"{path} returned {type(result).__name__}, expected dict")
			extensions.update(result)
		except Exception:
			try:
				frappe.log_error(title=f"CRM boot extension failed: {path}")
			except Exception:
				pass  # logging must not break the page load either
	return extensions
