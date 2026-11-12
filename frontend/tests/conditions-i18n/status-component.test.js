import { describe, it, expect, vi } from 'vitest'
import { createApp, h, nextTick } from 'vue'

vi.mock('frappe-ui', () => ({
  createResource: () => ({
    data: [{ value: 'New' }, { value: 'Customer' }],
    update: vi.fn(), reload: vi.fn(),
  }),
}))
vi.mock('@/components/frappe-ui/Autocomplete.vue', () => ({
  default: {
    props: ['modelValue', 'options'],
    emits: ['update:modelValue'],
    render() {
      return h('div', [h('span', { class: 'selected' }, this.modelValue),
        ...this.options.map(option => h('button', { onClick: () => this.$emit('update:modelValue', option) }, option.label))])
    },
  },
}))
import StatusFilter from '@/components/ConditionsFilter/StatusFilter.vue'

describe('status filter', () => {
  it('shows translated labels but emits raw values and preserves custom names', async () => {
    globalThis.__ = s => ({ New: 'Új', Customer: 'Ügyfél' })[s] || s
    const changes = []
    const el = document.createElement('div')
    const app = createApp({ render: () => h(StatusFilter, {
      doctype: 'CRM Lead Status', value: 'New', onChange: v => changes.push(v),
    }) })
    app.component('Button', { template: '<button />' })
    app.mount(el)
    expect(el.querySelector('.selected').textContent).toBe('Új')
    expect([...el.querySelectorAll('button')].map(b => b.textContent)).toEqual(['Új', 'Customer'])
    el.querySelector('button').click()
    await nextTick()
    expect(changes).toEqual(['New'])
    app.unmount()
  })
})
