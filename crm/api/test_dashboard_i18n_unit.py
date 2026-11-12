"""Static checks: chart series carry display labels (translated by the frontend, which\nalso holds the CRM-only translation layer) and number-card suffixes are translatable."""
import ast
import unittest
from pathlib import Path

SOURCE = Path(__file__).with_name("dashboard.py")
TREE = ast.parse(SOURCE.read_text(encoding="utf8"))


def dict_items(node):
    return {k.value: v for k, v in zip(node.keys, node.values) if isinstance(k, ast.Constant)}


class DashboardI18nTest(unittest.TestCase):
    def test_every_chart_series_has_a_display_label(self):
        series = [
            dict_items(n)
            for n in ast.walk(TREE)
            if isinstance(n, ast.Dict) and {"name", "type"} <= set(dict_items(n))
        ]
        self.assertGreaterEqual(len(series), 10)
        missing = [s["name"].value for s in series if "label" not in s]
        self.assertEqual(missing, [])

    def test_number_card_suffixes_are_translatable(self):
        suffixes = [
            v
            for n in ast.walk(TREE)
            if isinstance(n, ast.Dict)
            for k, v in dict_items(n).items()
            if k in ("suffix", "deltaSuffix") and not isinstance(v, ast.Constant) or False
        ]
        constants = [
            v.value
            for n in ast.walk(TREE)
            if isinstance(n, ast.Dict)
            for k, v in dict_items(n).items()
            if k in ("suffix", "deltaSuffix") and isinstance(v, ast.Constant)
        ]
        self.assertEqual([c for c in constants if c.strip().isalpha()], [])
        self.assertGreaterEqual(len(suffixes), 4)

    def test_category_placeholders_are_translatable(self):
        """Missing source/territory/owner get a translated label, never raw 'Empty'/null."""
        calls = [n for n in ast.walk(TREE) if isinstance(n, ast.Call)]

        def second_arg_is_translated(name, attr, expected):
            for call in calls:
                f = call.func
                if isinstance(f, ast.Name) and f.id == name and len(call.args) >= 2:
                    first = call.args[0]
                    if isinstance(first, ast.Attribute) and first.attr == attr:
                        arg = call.args[-1]
                        return (
                            isinstance(arg, ast.Call)
                            and isinstance(arg.func, ast.Name)
                            and arg.func.id == "_"
                            and arg.args[0].value == expected
                        )
            return False

        self.assertTrue(second_arg_is_translated("IfNull", "source", "Empty"))
        self.assertTrue(second_arg_is_translated("IfNull", "territory", "Empty"))
        self.assertTrue(second_arg_is_translated("Coalesce", "full_name", "Unassigned"))
        translated = {
            id(a)
            for c in calls
            if isinstance(c.func, ast.Name) and c.func.id == "_"
            for a in c.args
        }
        raw_empty = [
            n
            for n in ast.walk(TREE)
            if isinstance(n, ast.Constant) and n.value == "Empty" and id(n) not in translated
        ]
        self.assertEqual(raw_empty, [])


if __name__ == "__main__":
    unittest.main()
