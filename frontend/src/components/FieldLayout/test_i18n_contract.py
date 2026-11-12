"""Presentation-only i18n contracts for field layout metadata."""
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

def source(path):
    return (ROOT / path).read_text(encoding="utf-8")

class LayoutI18nContracts(unittest.TestCase):
    def test_layout_section_and_tab_labels_are_presentation_only(self):
        section = source("FieldLayout/Section.vue")
        side = source("SidePanelLayout.vue")
        layout = source("FieldLayout/FieldLayout.vue")
        self.assertIn(':label="__(section.label)"', section)
        self.assertIn(':label="__(section.label)"', side)
        self.assertIn('label: __(tab.label)', layout)
        self.assertIn('value: tab.name || String(i)', layout)

    def test_select_option_displays_translation_but_keeps_raw_value(self):
        side = source("SidePanelLayout.vue")
        self.assertIn('selectOptionLabels(props.doctype, field, __)', side)
        self.assertIn("__('Select {0}', [__(field.label)])", side)

    def test_editor_keeps_stored_defaults_and_editable_labels_raw(self):
        editor = source("FieldLayoutEditor.vue")
        side = source("SidePanelLayoutEditor.vue")
        self.assertNotIn("label: __('New Tab')", editor)
        self.assertNotIn("tabs.value[0].label = __('New Tab')", editor)
        self.assertNotIn("label: __('New Section')", side)
        self.assertIn('v-model="tab.label"', editor)
        self.assertIn('v-model="section.label"', editor)
        self.assertIn('v-model="section.label"', side)
        self.assertIn('{{ __(field.label) }}', editor)
        self.assertIn('{{ __(field.label) }}', side)

if __name__ == "__main__":
    unittest.main()
