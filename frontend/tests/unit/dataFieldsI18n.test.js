import { expect, it, vi } from 'vitest'
import { createApp, h } from 'vue'

vi.mock('@/components/Modals/DataFieldsModal.vue', () => ({ default: { render: () => null } }))
vi.mock('@/components/FieldLayout/FieldLayout.vue', () => ({ default: { render: () => null } }))
vi.mock('@/components/FadedScrollableDiv.vue', () => ({ default: { render() { return h('div', this.$slots.default?.()) } } }))
vi.mock('@/stores/users', () => ({ usersStore: () => ({ isManager: () => false }) }))
vi.mock('@/data/document', () => ({ useDocument: () => ({ document: { isDirty: false, enriching: false, save: {}, get: { loading: false }, doc: {}, originalDoc: {} } }) }))
vi.mock('@/data/enrichedFields', () => ({ provideEnrichedFieldnames() {} }))
vi.mock('@/composables/settings', () => ({ isMobileView: false }))
vi.mock('frappe-ui', () => ({ Badge: { render: () => null }, createResource: () => ({ data: null }) }))
import DataFields from '@/components/Activities/DataFields.vue'

it('translates the save action on the data panel', () => {
  const root = document.createElement('div')
  const app = createApp(DataFields, { doctype: 'CRM Lead', docname: 'L-1' })
  app.config.globalProperties.__ = text => text === 'Save' ? 'Mentés' : text
  app.component('Button', { props: ['label'], render() { return h('button', this.label) } })
  app.mount(root)
  try { expect(root.textContent).toContain('Mentés') } finally { app.unmount() }
})
