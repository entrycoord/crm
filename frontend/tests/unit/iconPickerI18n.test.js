import { it, expect, vi } from 'vitest'
import { createApp, defineComponent, h } from 'vue'
vi.mock('gemoji', () => ({ gemoji: [{ emoji: '😀', description: 'smile', names: [], tags: [], category: 'Smileys & Emotion' }] }))
vi.mock('frappe-ui', () => ({ Popover: defineComponent({ setup(_, { slots }) { return () => h('div', slots.default?.({ close: () => {} })) } }) }))
import IconPicker from '@/components/IconPicker.vue'
it('translates picker controls and category headings', () => {
  const translate = (s) => ({ Random: 'Véletlen', 'Search by keyword': 'Keresés', 'Smileys & Emotion': 'Arcok' }[s] || s)
  const el = document.createElement('div')
  const app = createApp(IconPicker)
  app.config.globalProperties.__ = translate
  app.component('FormControl', { props: ['placeholder'], render() { return h('input', { placeholder: this.placeholder }) } })
  app.component('Button', { render() { return h('button', this.$slots.default?.()) } })
  app.mount(el)
  expect(el.querySelector('input').placeholder).toBe('Keresés')
  expect(el.textContent).toContain('Véletlen')
  expect(el.textContent).toContain('Arcok')
  app.unmount()
})
