import { it, expect } from 'vitest'
import { compile, createApp, h } from 'vue'
import leads from '@/components/ListViews/LeadsListView.vue?raw'
import deals from '@/components/ListViews/DealsListView.vue?raw'

it.each([['lead', leads], ['deal', deals]])('%s list renders an SLA translation without changing its filter item', (_, source) => {
  const start = source.indexOf('<Badge', source.indexOf("column.key === 'sla_status'"))
  const badge = source.slice(start, source.indexOf('/>', start) + 2)
  const item = { label: 'Fulfilled', value: 'Fulfilled', color: 'green' }
  globalThis.__ = s => s === 'Fulfilled' ? 'Teljesítve' : s
  const root = document.createElement('div')
  const app = createApp({ data: () => ({ item }), render: compile(badge) })
  app.component('Badge', { props: ['label'], render() { return h('span', this.label) } })
  app.mount(root)
  expect(root.textContent).toBe('Teljesítve')
  expect(item.value).toBe('Fulfilled')
  app.unmount()
})
