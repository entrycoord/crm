import { describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick } from 'vue'

vi.mock('@/utils', () => ({
  isTouchScreenDevice: () => false,
  colors: ['red'],
  parseColor: (color) => color,
  isTranslatable: (doctype) => doctype === 'CRM Lead Status',
}))
vi.mock('vuedraggable', async () => {
  const { h } = await import('vue')
  return { default: { props: ['list'], setup: (props, { slots }) => () => h('div', (props.list || []).map((element) => slots.item?.({ element }))) } }
})
vi.mock('frappe-ui', async () => {
  const { h } = await import('vue')
  const passthrough = { setup: (_, { slots }) => () => h('div', slots.default?.()) }
  return { Combobox: passthrough, Dropdown: passthrough, Popover: passthrough }
})
import KanbanView from '@/components/Kanban/KanbanView.vue'

describe('Kanban column labels', () => {
  it('translates status column display without changing the raw column or its drag key', async () => {
    globalThis.__ = (value) => value === 'New' ? 'Új' : value
    const column = { name: 'New', color: 'red', count: 0, all_count: 0 }
    const model = { data: { view_type: 'kanban', column_field: 'status', data: [{ column, data: [], fields: [] }] } }
    const root = document.createElement('div')
    document.body.appendChild(root)
    const app = createApp(KanbanView, { modelValue: model, statusDoctype: 'CRM Lead Status' })
    app.config.globalProperties.__ = globalThis.__
    app.component('router-link', { template: '<a><slot /></a>' })
    app.component('Button', { template: '<button><slot /></button>' })
    app.mount(root)
    await nextTick()
    expect(root.textContent).toContain('Új')
    expect(root.querySelector('[data-column]').getAttribute('data-column')).toBe('New')
    expect(column.name).toBe('New')
    app.unmount()
    root.remove()
  })
})
