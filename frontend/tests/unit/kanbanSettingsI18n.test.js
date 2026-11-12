import { it, expect, vi } from 'vitest'
import { createApp, h } from 'vue'

vi.mock('@/stores/meta', () => ({ getMeta: () => ({ getFields: () => [
  { fieldname: 'status', fieldtype: 'Link', label: 'Status' },
  { fieldname: 'subject', fieldtype: 'Data', label: 'Subject' },
  { fieldname: 'owner', fieldtype: 'Data', label: 'Owner' },
] }) }))
vi.mock('frappe-ui', () => ({
  Dialog: { setup: (_, { slots }) => () => h('div', [slots.default?.(), slots.actions?.()]) },
  Combobox: { props: ['options'], setup: (props, { slots }) => () => h('div', [slots.trigger?.({ open: false, setOpen: () => {} }), ...(props.options || []).map(item => slots['item-label']?.({ item }) || h('span', item.label))]) },
}))
vi.mock('vuedraggable', () => ({ default: { props: ['list'], setup: (props, { slots }) => () => h('div', (props.list || []).map(element => slots.item?.({ element }))) } }))
import KanbanSettings from '@/components/Kanban/KanbanSettings.vue'

it('translates field metadata everywhere while keeping saved fieldnames raw', () => {
  globalThis.__ = (s) => ({ Status: 'Állapot', Subject: 'Tárgy', Owner: 'Tulajdonos' }[s] || s)
  const model = { data: { column_field: 'status', title_field: 'subject', kanban_fields: ['owner'] } }
  const root = document.createElement('div')
  const app = createApp(KanbanSettings, { doctype: 'CRM Lead', modelValue: model })
  app.config.globalProperties.__ = globalThis.__
  app.component('Button', { props: ['label'], render() { return h('button', this.label) } })
  app.mount(root)
  expect(root.textContent).toContain('Állapot')
  expect(root.textContent).toContain('Tárgy')
  expect(root.textContent).toContain('Tulajdonos')
  expect(root.querySelector('.flex.flex-col.gap-1').textContent).toContain('Tulajdonos')
  expect(model.data).toEqual({ column_field: 'status', title_field: 'subject', kanban_fields: ['owner'] })
  app.unmount()
})


it('keeps selected title and column fields available when also shown on cards', () => {
  globalThis.__ = (s) => ({ Status: 'Állapot', Subject: 'Tárgy' }[s] || s)
  const model = { data: { column_field: 'status', title_field: 'subject', kanban_fields: ['status', 'subject'] } }
  const root = document.createElement('div')
  const app = createApp(KanbanSettings, { doctype: 'CRM Lead', modelValue: model })
  app.config.globalProperties.__ = globalThis.__
  app.component('Button', { props: ['label'], render() { return h('button', this.label) } })
  app.mount(root)
  expect(root.textContent).toContain('Állapot')
  expect(root.textContent).toContain('Tárgy')
  expect(model.data.kanban_fields).toEqual(['status', 'subject'])
  app.unmount()
})
