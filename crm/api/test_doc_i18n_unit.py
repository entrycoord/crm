"""Static checks for the field lists crm/api/doc.py hands to the list controls (group by, filter,
list data): every standard field appears once and `_liked_by` is labelled "Liked By" (the bare word
"Like" is the filter operator and translates to "Mint")."""
import ast
import unittest
from pathlib import Path

SOURCE = Path(__file__).with_name("doc.py")
TREE = ast.parse(SOURCE.read_text(encoding="utf8"))


def function(name):
    return next(n for n in ast.walk(TREE) if isinstance(n, ast.FunctionDef) and n.name == name)


def dict_items(node):
    return {k.value: v.value for k, v in zip(node.keys, node.values) if isinstance(k, ast.Constant) and isinstance(v, ast.Constant)}


def dicts_with(fn, *keys):
    return [dict_items(n) for n in ast.walk(fn) if isinstance(n, ast.Dict) and set(keys) <= set(dict_items(n))]


class DocFieldListsTest(unittest.TestCase):
    def test_group_by_standard_fields_are_unique(self):
        fields = dicts_with(function("get_group_by_fields"), "label", "fieldname")
        names = [f["fieldname"] for f in fields]
        labels = [f["label"] for f in fields]
        self.assertIn("creation", names)
        self.assertIn("modified", names)
        self.assertEqual(sorted(names), sorted(set(names)), "a field is listed twice")
        self.assertEqual(sorted(labels), sorted(set(labels)), "a label is listed twice")
        self.assertNotIn("Modified On", labels)

    def test_liked_by_is_never_labelled_like(self):
        found = []
        for name in ("get_filterable_fields", "get_group_by_fields", "get_data"):
            found += [f for f in dicts_with(function(name), "label", "fieldname") if f["fieldname"] == "_liked_by"]
        self.assertEqual(len(found), 3)
        self.assertEqual({f["label"] for f in found}, {"Liked By"})


if __name__ == "__main__":
    unittest.main()
