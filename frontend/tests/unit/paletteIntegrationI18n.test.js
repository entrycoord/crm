import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

it('wires localized command presentation without changing action identifiers', () => {
  const source = readFileSync(resolve('src/components/CommandPalette/useCRMCommands.js'), 'utf8')
  expect(source).toContain('title: createCommandTitle(title)')
  expect(source).toContain('subtitle: recordTypeLabel(record.doctype)')
  expect(source).toContain('perform: () => showModal({ doctype, title })')
  expect(source).toContain('activeSettingsPage.value = page')
})

it('uses a localized intermediate dialog', () => {
  const source = readFileSync(resolve('src/components/Layouts/AppSidebar.vue'), 'utf8')
  expect(source).toContain("import IntermediateStepModal from '@/components/Onboarding/IntermediateStepModal.vue'")
})
