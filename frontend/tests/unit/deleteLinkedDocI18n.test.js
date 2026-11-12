import { expect, it, vi } from 'vitest'
import { createApp, h } from 'vue'
vi.mock('vue-router', () => ({ useRouter: () => ({ push() {} }) }))
vi.mock('@/data/document', () => ({ markDocumentAsDeleted() {}, unmarkDocumentAsDeleted() {}, expireDeletionMarker() {} }))
vi.mock('frappe-ui', () => {
  const Dialog = { render() { return h('div', this.$slots.default?.()) } }
  Dialog.Title = { render() { return h('div', this.$slots.default?.()) } }
  Dialog.Close = { render() { return h('div', this.$slots.default?.()) } }
  return { Dialog, createResource: () => ({ data: [{ reference_docname: 'DOC-1', reference_doctype: 'Contact' }] }), call() {}, toast: {} }
})
import DeleteLinkedDocModal from '@/components/DeleteLinkedDocModal.vue'

it('localizes linked-document columns while retaining their data keys', () => {
  const root = document.createElement('div')
  let columns
  const app = createApp(DeleteLinkedDocModal, { name: 'Leads', doctype: 'CRM Lead', docname: 'LEAD-1' })
  app.config.globalProperties.__ = text => ({ Document: 'Dokumentum', Master: 'Törzs' })[text] || text
  app.component('Button', { render: () => null })
  app.component('LinkedDocsListView', { props: ['columns'], render() { columns = this.columns; return h('div', columns.map(c => c.label).join(' | ')) } })
  app.mount(root)
  try {
    expect(root.textContent).toContain('Dokumentum | Törzs')
    expect(columns.map(c => c.key)).toEqual(['title', 'reference_doctype'])
  } finally { app.unmount() }
})
