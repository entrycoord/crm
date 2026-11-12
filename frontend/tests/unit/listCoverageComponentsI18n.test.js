import { describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, h, nextTick, ref } from 'vue'

const dictionary = {
  'First Name': 'Keresztnév', Status: 'Állapot', 'Liked By': 'Kedvelte', 'Created On': 'Létrehozva',
  Passive: 'Passzív', Open: 'Nyitott', Replied: 'Megválaszolt', Yes: 'Igen', No: 'Nem',
  Lead: 'Érdeklődő', Deal: 'Ügylet', Contact: 'Kapcsolattartó',
  'mentioned you in {0}': 'megemlítette Önt itt: {0}',
  'Are you sure you want to delete {0} - {1}?': 'Biztosan törölni szeretné a következőt: {0} - {1}?',
}
const t = (text, args) => {
  let out = dictionary[text] ?? text
  ;(args || []).forEach((arg, i) => { out = out.replace(`{${i}}`, arg) })
  return out
}
globalThis.__ = t

const seen = vi.hoisted(() => ({ columnOptions: null, bulkFieldOptions: null, valueOptions: null, emitColumn: null, emitField: null }))

vi.mock('@/utils', () => ({ isTouchScreenDevice: () => false, timeAgo: () => '1 perce', sanitizeHTML: (s) => s }))
vi.mock('@/stores/meta', () => ({
  getMeta: () => ({
    getFields: () => [
      { fieldname: 'first_name', label: 'First Name', fieldtype: 'Data', description: 'A very long description that would stretch the dropdown' },
      { fieldname: 'status', label: 'Status', fieldtype: 'Select', options: 'Passive\nOpen\nReplied' },
      { fieldname: '_liked_by', label: 'Like', fieldtype: 'Data' },
      { fieldname: 'creation', label: 'Created On', fieldtype: 'Datetime' },
    ],
  }),
}))
vi.mock('@framework/ui/telemetry', () => ({ useTelemetry: () => ({ capture() {} }) }))
vi.mock('@/stores/statuses', () => ({ statusesStore: () => ({ getLeadStatus() {}, getDealStatus() {} }) }))
vi.mock('@/composables/document', () => ({ createDocument() {} }))
vi.mock('@/components/Controls/Link.vue', () => ({ default: { render: () => h('div') } }))
vi.mock('@/components/Controls/TextEditorControl.vue', () => ({ default: { render: () => h('div') } }))
vi.mock('@/components/UserAvatar.vue', () => ({ default: { render: () => h('i') } }))
vi.mock('@/components/ListViews/EmptyState.vue', () => ({ default: { render: () => h('div') } }))
vi.mock('@/stores/notifications', () => ({
  visible: ref(true),
  notifications: {
    data: [{
      comment: 'c1', read: 0, type: 'Mention', route_name: 'Lead', reference_doctype: 'lead',
      reference_name: 'CRM-LEAD-2026-00002', creation: '2026-11-12', from_user: { name: 'a@b.c', full_name: 'Administrator' },
    }, {
      comment: 'c2', read: 1, type: 'Mention', route_name: 'Deal', reference_doctype: 'deal',
      reference_name: 'CRM-DEAL-2026-00001', creation: '2026-11-12', from_user: { name: 'a@b.c', full_name: 'Administrator' },
    }],
  },
  notificationsStore: () => ({ toggle() {}, mark_as_read: {}, mark_doc_as_read() {} }),
}))
vi.mock('@/stores/global', () => ({ globalStore: () => ({ $socket: { on() {}, off() {} }, $dialog() {} }) }))
vi.mock('@/data/document', () => ({ markDocumentAsDeleted() {}, unmarkDocumentAsDeleted() {}, expireDeletionMarker() {} }))
vi.mock('vue-router', () => ({ useRouter: () => ({ push() {} }) }))
vi.mock('frappe-ui', () => {
  const passthrough = { render() { return h('div', this.$slots.default?.()) } }
  const Dialog = { render() { return h('div', [this.$slots.default?.(), this.$slots.actions?.()]) } }
  Dialog.Title = passthrough
  Dialog.Close = passthrough
  return {
    Dialog,
    Popover: { render() { return h('div', [this.$slots.trigger?.(), this.$slots.default?.({ close() {} })]) } },
    Combobox: {
      props: ['options', 'modelValue'],
      emits: ['update:selectedOption'],
      setup(props, { emit }) {
        return () => {
          // Both modals under test render a single Combobox (the field picker).
          seen.columnOptions = props.options; seen.emitColumn = (o) => emit("update:selectedOption", o)
          return h('div')
        }
      },
    },
    FormControl: { props: ['options', 'type'], render() { seen.valueOptions = this.options; return h('div') } },
    ErrorMessage: passthrough,
    DatePicker: passthrough,
    createResource: (opts) => ({
      data: opts.transform
        ? opts.transform([
          { fieldname: 'first_name', label: 'First Name', fieldtype: 'Data', hidden: 0, read_only: 0, description: 'long description' },
          { fieldname: 'status', label: 'Status', fieldtype: 'Select', options: 'Passive\nOpen\nReplied', hidden: 0, read_only: 0 },
          { fieldname: 'sync', label: 'Sync', fieldtype: 'Check', hidden: 0, read_only: 0 },
          { fieldname: 'ro', label: 'Read only', fieldtype: 'Data', hidden: 0, read_only: 1 },
        ])
        : [{ reference_docname: 'DOC-1', reference_doctype: 'Contact' }],
      fetch() {},
      reload() {},
    }),
    call() {},
    toast: {},
  }
})

const globals = (app) => {
  app.config.globalProperties.__ = t
  app.component('Button', { render: () => h('button') })
  app.component('Dialog', { render() { return h('div', [this.$slots.default?.(), this.$slots.actions?.()]) } })
  app.component('FormControl', { render: () => h('div') })
  app.component('RouterLink', { render() { return h('a', this.$slots.default?.()) } })
  app.component('LinkedDocsListView', { render: () => h('div') })
  app.component('ErrorMessage', { render: () => h('div') })
}

describe('ColumnSettings', () => {
  it('shows translated field labels without descriptions, saves the English label', async () => {
    const ColumnSettings = (await import('@/components/ColumnSettings.vue')).default
    const list = { data: { columns: [{ key: 'name', label: 'Name' }], rows: ['name'], is_default: true } }
    const root = document.createElement('div')
    const updates = []
    const app = createApp({
      render: () => h(ColumnSettings, { doctype: 'Contact', modelValue: list, onUpdate: (v) => updates.push(v) }),
    })
    globals(app)
    app.mount(root)
    await nextTick()
    try {
      expect(seen.columnOptions.map((o) => o.label)).toEqual(['Keresztnév', 'Állapot', 'Kedvelte', 'Létrehozva'])
      expect(seen.columnOptions.some((o) => 'description' in o)).toBe(false)
      expect(seen.columnOptions.map((o) => o.value)).toEqual(['first_name', 'status', '_liked_by', 'creation'])
      seen.emitColumn(seen.columnOptions[0])
      expect(list.data.columns.at(-1)).toMatchObject({ key: 'first_name', label: 'First Name' })
      expect(list.data.rows).toContain('first_name')
    } finally { app.unmount() }
  })
})

describe('EditValueModal (bulk edit)', () => {
  it('translates field labels and Select/Check values, keeps the stored values', async () => {
    seen.columnOptions = null
    seen.bulkFieldOptions = null
    const EditValueModal = (await import('@/components/Modals/EditValueModal.vue')).default
    const root = document.createElement('div')
    const app = createApp({
      render: () => h(EditValueModal, { doctype: 'Contact', selectedValues: new Set(['A']), modelValue: true }),
    })
    globals(app)
    app.mount(root)
    await nextTick()
    try {
      const options = seen.columnOptions
      expect(options.map((o) => o.label)).toEqual(['Keresztnév', 'Állapot', 'Sync'])
      expect(options.map((o) => o.value)).toEqual(['first_name', 'status', 'sync'])
      expect(options.some((o) => 'description' in o)).toBe(false)

      seen.emitColumn(options[1])
      await nextTick()
      expect(seen.valueOptions).toEqual([
        { label: 'Passzív', value: 'Passive' },
        { label: 'Nyitott', value: 'Open' },
        { label: 'Megválaszolt', value: 'Replied' },
      ])

      seen.emitColumn(options[2])
      await nextTick()
      expect(seen.valueOptions).toEqual([{ label: 'Igen', value: 'Yes' }, { label: 'Nem', value: 'No' }])
    } finally { app.unmount() }
  })
})

describe('Notifications', () => {
  it('names the mentioned document type instead of the raw server key', async () => {
    const Notifications = (await import('@/components/Notifications.vue')).default
    const root = document.createElement('div')
    const app = createApp(Notifications)
    globals(app)
    app.mount(root)
    await nextTick()
    try {
      expect(root.textContent).toContain('megemlítette Önt itt: Érdeklődő')
      expect(root.textContent).toContain('megemlítette Önt itt: Ügylet')
      expect(root.textContent).not.toMatch(/ lead /)
      expect(root.textContent).toContain('CRM-LEAD-2026-00002')
    } finally { app.unmount() }
  })
})

describe('DeleteLinkedDocModal', () => {
  it('names the doctype in the delete confirmation', async () => {
    vi.resetModules()
    vi.doMock('frappe-ui', () => {
      const passthrough = { render() { return h('div', this.$slots.default?.()) } }
      const Dialog = { render() { return h('div', this.$slots.default?.()) } }
      Dialog.Title = passthrough
      Dialog.Close = passthrough
      return { Dialog, createResource: () => ({ data: [], reload() {} }), call() {}, toast: {} }
    })
    const Modal = (await import('@/components/DeleteLinkedDocModal.vue')).default
    const root = document.createElement('div')
    const app = createApp({ render: () => h(Modal, { name: 'Contacts', doctype: 'Contact', docname: 'Éva Varga' }) })
    globals(app)
    app.mount(root)
    await nextTick()
    try {
      expect(root.textContent).toContain('Biztosan törölni szeretné a következőt: Kapcsolattartó - Éva Varga?')
    } finally { app.unmount(); vi.doUnmock('frappe-ui') }
  })
})
