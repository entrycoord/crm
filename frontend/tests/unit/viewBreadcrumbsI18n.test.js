import { createApp } from 'vue'
import { describe, it, expect, vi } from 'vitest'

vi.mock('frappe-ui', () => ({ Dropdown: { template: '<div><slot :open="false" /></div>' } }))
vi.mock('@/components/Icon.vue', () => ({ default: { template: '<i />' } }))
import ViewBreadcrumbs from '@/components/ViewBreadcrumbs.vue'

function render(view) {
  const element = document.createElement('div')
  const app = createApp(ViewBreadcrumbs, {
    routeName: 'Leads',
    modelValue: { currentView: view, viewsDropdownOptions: [] },
  })
  app.component('router-link', { template: '<a><slot /></a>' })
  app.component('Button', { props: ['label'], template: '<button>{{ label }}<slot name="prefix" /></button>' })
  const previousTranslate = globalThis.__
  globalThis.__ = app.config.globalProperties.__ = (label) => ({ List: 'Lista', Kanban: 'Tábla', 'Group By': 'Csoportosítás', 'My List': 'Fordított név' }[label] || label)
  app.mount(element)
  const label = element.querySelector('button').textContent
  app.unmount()
  globalThis.__ = previousTranslate
  return label
}

describe('view breadcrumb labels', () => {
  it('preserves a custom view name even if it matches a translated built-in name', () => {
    expect(render({ label: 'List', is_standard: false })).toBe('List')
  })

  it.each([['List', 'Lista'], ['Kanban', 'Tábla'], ['Group By', 'Csoportosítás']])(
    'localizes the standard %s view', (label, expected) => {
      const view = { label, is_standard: true }
      expect(render(view)).toBe(expected)
      expect(view.label).toBe(label)
    },
  )

  it('preserves a renamed standard view even when its name exists in translations', () => {
    expect(render({ label: 'My List', is_standard: true })).toBe('My List')
  })

  it('preserves a standard view label that is already localized', () => {
    expect(render({ label: 'Lista', is_standard: true })).toBe('Lista')
  })

})
