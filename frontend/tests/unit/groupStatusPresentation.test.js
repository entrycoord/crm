import { describe, expect, it, vi } from 'vitest'
import { createApp, h } from 'vue'

vi.mock('@/composables/useVisitedRecords', () => ({ useVisitedRecords: () => ({ isVisited: () => false }) }))
vi.mock('frappe-ui/experimental', async () => {
  const { h } = await import('vue')
  const box = { setup: (_, { slots }) => () => h('div', slots.default?.()) }
  return { ListRows: box, ListRow: box, ListGroupHeader: box, ListGroupRows: box }
})
import ListRows from '@/components/ListViews/ListRows.vue'

describe('group headings', () => {
  it('displays a presentation label without modifying the raw group key', () => {
    const group = { label: 'Status', group: 'Open', displayLabel: 'Nyitott', rows: [] }
    const root = document.createElement('div')
    const app = createApp(ListRows, { rows: [group] })
    app.config.globalProperties.__ = (value) => value
    app.mount(root)
    expect(root.textContent).toContain('Nyitott')
    expect(group.group).toBe('Open')
    app.unmount()
  })
})
