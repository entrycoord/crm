import { it, expect, vi } from 'vitest'
import { createApp, defineComponent, h, nextTick } from 'vue'

vi.mock('@/utils', () => ({ timeAgo: () => 'just now', formatDate: () => 'date', formatTime: () => '2h' }))
vi.mock('@/stores/statuses', () => ({ statusesStore: () => ({ communicationStatuses: { data: [{ name: 'Open' }] } }) }))
vi.mock('@framework/ui/telemetry', () => ({ useTelemetry: () => ({ capture: () => {} }) }))
vi.mock('frappe-ui', () => ({
  Tooltip: defineComponent({ setup(_, { slots }) { return () => h('div', slots.default?.()) } }),
  Dropdown: defineComponent({ props: ['options'], setup(props, { slots }) { return () => h('div', [slots.default?.({ open: false }), ...(props.options || []).map((option) => h('button', { onClick: option.onClick }, option.label))]) } }),
}))
import SLASection from '@/components/SLASection.vue'

it('translates SLA text and statuses while emitting raw status values', async () => {
  const old = globalThis.__
  globalThis.__ = (s, args) => { const translated = ({ 'Fulfilled': 'Teljesítve', 'Open': 'Nyitott', '{0} in {1}': '{1} alatt {0}' }[s] || s); return (args || []).reduce((v, arg, i) => v.replace(`{${i}}`, arg), translated) }
  const el = document.createElement('div')
  const updates = []
  const app = createApp(SLASection, { modelValue: { sla_status: 'Fulfilled', communication_status: 'Open', first_response_time: 7200 }, onUpdateField: (...args) => updates.push(args) })
  app.config.globalProperties.__ = globalThis.__
  app.component('Badge', { props: ['label'], render() { return h('span', this.label) } })
  app.component('Button', { props: ['label'], render() { return h('button', this.label) } })
  app.mount(el)
  await nextTick()
  expect(el.textContent).toContain('2h alatt Teljesítve')
  expect(el.textContent).toContain('Nyitott')
  ;[...el.querySelectorAll('button')].filter((button) => button.textContent === 'Nyitott').at(-1).click()
  expect(updates).toEqual([['communication_status', 'Open']])
  app.unmount()
  globalThis.__ = old
})
