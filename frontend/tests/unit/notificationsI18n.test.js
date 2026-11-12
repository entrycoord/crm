import { expect, it, vi } from 'vitest'
import { createApp, h, ref } from 'vue'

vi.mock('@/stores/notifications', () => ({ visible: ref(true), notifications: { data: [] }, notificationsStore: () => ({ toggle() {}, mark_as_read: {}, mark_doc_as_read() {} }) }))
vi.mock('@/stores/global', () => ({ globalStore: () => ({ $socket: { on() {}, off() {} } }) }))
vi.mock('@framework/ui/telemetry', () => ({ useTelemetry: () => ({ capture() {} }) }))
vi.mock('@/components/ListViews/EmptyState.vue', () => ({ default: { props: ['title', 'description'], render() { return h('div', [this.title, ' | ', this.description]) } } }))
import Notifications from '@/components/Notifications.vue'

it('translates the empty notification state', () => {
  const root = document.createElement('div')
  const app = createApp(Notifications)
  app.config.globalProperties.__ = text => ({ Notifications: 'Értesítések', 'No New Notifications': 'Nincs új értesítés', 'You have no new notifications': 'Nincsenek új értesítéseid' })[text] || text
  app.component('Button', { render: () => null })
  app.component('RouterLink', { render: () => null })
  app.mount(root)
  try {
    expect(root.textContent).toContain('Nincs új értesítés')
    expect(root.textContent).toContain('Nincsenek új értesítéseid')
  } finally { app.unmount() }
})
