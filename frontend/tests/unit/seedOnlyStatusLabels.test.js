import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'

// Every doctype is "translatable" here on purpose: custom status names must still stay exact.
vi.mock('@/utils', () => ({
  parseColor: (color) => color,
  isTranslatable: () => true,
  isTouchScreenDevice: () => false,
  colors: ['red'],
}))
vi.mock('@framework/ui/telemetry', () => ({ useTelemetry: () => ({ capture: vi.fn() }) }))
vi.mock('vuedraggable', async () => {
  const { h } = await import('vue')
  return { default: { props: ['list'], setup: (props, { slots }) => () => h('div', (props.list || []).map((element) => slots.item?.({ element }))) } }
})
vi.mock('frappe-ui', async () => {
  const { h } = await import('vue')
  const passthrough = { setup: (_, { slots }) => () => h('div', slots.default?.()) }
  return { createListResource: () => ({ data: [] }), Combobox: passthrough, Dropdown: passthrough, Popover: passthrough }
})
import { statusesStore } from '@/stores/statuses'
import KanbanView from '@/components/Kanban/KanbanView.vue'
import { statusFilterLabel } from '@/components/ConditionsFilter/statusFilter'
import lead from '@/pages/Lead.vue?raw'
import deal from '@/pages/Deal.vue?raw'
import mobileLead from '@/pages/MobileLead.vue?raw'
import mobileDeal from '@/pages/MobileDeal.vue?raw'
import leads from '@/pages/Leads.vue?raw'
import deals from '@/pages/Deals.vue?raw'

const dictionary = { New: 'Új', Open: 'Nyitott', Won: 'Nyert' }
const translate = (value) => dictionary[value] || value

describe('status labels use the seeded vocabulary only', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    globalThis.__ = translate
  })

  it('status dropdown options', () => {
    const options = statusesStore().statusOptions('lead', ['New', 'Open'], vi.fn())
    expect(options.map((o) => o.label)).toEqual(['Új', 'Open'])
    expect(options.map((o) => o.value)).toEqual(['New', 'Open'])
  })

  it('kanban column headings', async () => {
    const columns = ['New', 'Open'].map((name) => ({ column: { name, color: 'red', count: 0, all_count: 0 }, data: [], fields: [] }))
    const model = { data: { view_type: 'kanban', column_field: 'status', data: columns } }
    const root = document.createElement('div')
    document.body.appendChild(root)
    const app = createApp(KanbanView, { modelValue: model, statusDoctype: 'CRM Lead Status' })
    app.config.globalProperties.__ = translate
    app.component('router-link', { template: '<a><slot /></a>' })
    app.component('Button', { template: '<button><slot /></button>' })
    app.mount(root)
    await nextTick()
    expect(root.textContent).toContain('Új')
    expect(root.textContent).toContain('Open')
    expect(root.textContent).not.toContain('Nyitott')
    app.unmount()
    root.remove()
  })

  it.each([['Lead.vue', lead, 'New'], ['Deal.vue', deal, 'Won'], ['MobileLead.vue', mobileLead, 'New'], ['MobileDeal.vue', mobileDeal, 'Won']])('%s statusLabel', (_, source, seeded) => {
    const body = source.match(/function statusLabel\(status\) \{([\s\S]*?)\n\}/)[1]
    const statusLabel = new Function('status', 'statusFilterLabel', '__', body)
    expect(statusLabel(seeded, statusFilterLabel, translate)).toBe(translate(seeded))
    expect(statusLabel('Open', statusFilterLabel, translate)).toBe('Open')
  })

  it.each([['Leads.vue', leads], ['Deals.vue', deals]])('%s list and group headings no longer translate by doctype alone', (_, source) => {
    expect(source).not.toMatch(/isTranslatable\('CRM (Lead|Deal) Status'\)/)
    expect(source).toContain('statusFilterLabel')
  })
})
