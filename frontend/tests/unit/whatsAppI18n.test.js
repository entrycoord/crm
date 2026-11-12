import { expect, it, vi } from 'vitest'
import { createApp, h } from 'vue'

vi.mock('@framework/ui/telemetry', () => ({ useTelemetry: () => ({ capture() {} }) }))
vi.mock('@/components/IconPicker.vue', () => ({ default: { render: () => null } }))
vi.mock('@/utils', () => ({ formatDate: () => '', sanitizeHTML: value => value }))
vi.mock('frappe-ui', () => ({
  Tooltip: { render() { return h('span', this.$slots.default?.()) } },
  Dropdown: { props: ['options'], render() { return h('span', this.options[0].label) } },
  createResource: () => ({}), toast: {}
}))
import WhatsAppArea from '@/components/Activities/WhatsAppArea.vue'

it('translates attachment chrome and reply action without changing message data', () => {
  const translations = { Document: 'Dokumentum', Reply: 'Válasz' }
  globalThis.__ = text => translations[text] || text
  const message = { name: 'abc', content_type: 'document', status: 'sent', type: 'Incoming', attach: '/files/example.pdf', message: 'Hello' }
  const root = document.createElement('div')
  const app = createApp(WhatsAppArea, { messages: [message] })
  app.config.globalProperties.__ = globalThis.__
  app.component('Badge', { render: () => null })
  app.component('Button', { render: () => null })
  app.mount(root)
  try {
    expect(root.textContent).toContain('Dokumentum')
    expect(root.textContent).toContain('Válasz')
    expect(message.content_type).toBe('document')
    expect(message.message).toBe('Hello')
  } finally { app.unmount() }
})

it('translates the failed status badge without changing the raw status', () => {
  globalThis.__ = text => text === 'failed' ? 'sikertelen' : text
  const message = { name: 'x', content_type: 'document', status: 'failed', type: 'Outgoing' }
  const root = document.createElement('div')
  const app = createApp(WhatsAppArea, { messages: [message] })
  app.config.globalProperties.__ = globalThis.__
  app.component('Badge', { props: ['label'], render() { return h('span', this.label) } })
  app.component('Button', { render: () => null })
  app.mount(root)
  try {
    expect(root.textContent).toContain('sikertelen')
    expect(message.status).toBe('failed')
  } finally { app.unmount() }
})
