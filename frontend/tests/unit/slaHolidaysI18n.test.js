import { it, expect, vi } from 'vitest'
import { createApp, defineComponent, h, ref } from 'vue'
vi.mock('@/components/Settings/Sla/utils', () => ({ slaData: ref({ working_hours: [{ workday: 'Monday', start_time: '09:00', end_time: '17:00' }], holiday_list: '' }), slaDataErrors: ref({}) }))
vi.mock('@/utils', () => ({ ConfirmDelete: () => [], getGridTemplateColumnsForTable: () => '' }))
vi.mock('frappe-ui', () => ({
  createListResource: () => ({ data: [] }),
  Button: defineComponent({ props: ['label'], setup(props) { return () => h('button', props.label) } }),
  Dropdown: defineComponent({ setup(_, { slots }) { return () => h('div', slots.default?.()) } }),
  Popover: defineComponent({ setup(_, { slots }) { return () => h('div', [slots.trigger?.({ open: false }), slots.default?.()]) } }),
  ErrorMessage: defineComponent({ render: () => null }),
  Dialog: defineComponent({ render: () => null }), FormControl: defineComponent({ render: () => null }), toast: { error: () => {} },
}))
import SlaHolidays from '@/components/Settings/Sla/SlaHolidays.vue'
it('shows translated weekdays but keeps the selected workday value', () => {
  const el = document.createElement('div')
  const app = createApp(SlaHolidays)
  app.config.globalProperties.__ = (s) => s === 'Monday' ? 'Hétfő' : s
  app.component('ErrorMessage', { render: () => null })
  app.mount(el)
  const select = el.querySelector('select')
  expect(select.options[0].textContent.trim()).toBe('Hétfő')
  expect(select.value).toBe('Monday')
  app.unmount()
})
