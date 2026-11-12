import { describe, it, expect, vi } from 'vitest'
import { createApp, defineComponent, h, nextTick } from 'vue'

vi.mock('frappe-ui', () => ({
  Dialog: defineComponent({ setup(_, { slots }) { return () => h('div', [slots.default?.(), slots.actions?.()]) } }),
  FormControl: defineComponent({ inheritAttrs: false, props: ['modelValue', 'options'], emits: ['update:modelValue'], setup(props, { emit }) {
    return () => props.options ? h('select', { value: props.modelValue, onChange: (event) => emit('update:modelValue', event.target.value) }, props.options.map((option) => h('option', { value: option.value }, option.label))) : null
  } }),
  Button: defineComponent({ setup(_, { slots }) { return () => h('button', slots.default?.()) } }),
  toast: { error: vi.fn() },
}))

import WorkDayModal from '@/components/Settings/Sla/WorkDayModal.vue'

describe('SLA workday translations', () => {
  it('shows translated days without changing the selected stored value', async () => {
    const oldTranslate = globalThis.__
    globalThis.__ = (text) => ({ Monday: 'Hétfő', Tuesday: 'Kedd' }[text] || text)
    const element = document.createElement('div')
    const app = createApp(WorkDayModal, { modelValue: { show: true, isEditing: false, data: {} }, workDaysList: [] })
    app.config.globalProperties.__ = globalThis.__
    app.component('ErrorMessage', { render: () => null })
    app.mount(element)
    await nextTick()
    const select = element.querySelector('select')
    expect(select.options[0].textContent).toBe('Hétfő')
    expect(select.options[0].value).toBe('Monday')
    app.unmount()
    globalThis.__ = oldTranslate
  })
})
