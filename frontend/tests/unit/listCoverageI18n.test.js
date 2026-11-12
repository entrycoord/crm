import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, defineComponent, nextTick } from 'vue'
import { doctypeLabel } from '@/utils/doctypeLabel'
import {
  isShippedSelect,
  quickFilterSelectOptions,
  selectColumnLabel,
  selectOptionLabels,
} from '@/translation'
import { commandOptionLabels } from '@/utils/filterOptionLabels'
import viewControls from '@/components/ViewControls.vue?raw'
import filterSource from '@/components/Filter.vue?raw'
import linkedDocsList from '@/components/ListViews/LinkedDocsListView.vue?raw'
import leads from '@/components/ListViews/LeadsListView.vue?raw'
import deals from '@/components/ListViews/DealsListView.vue?raw'
import contacts from '@/components/ListViews/ContactsListView.vue?raw'
import organizations from '@/components/ListViews/OrganizationsListView.vue?raw'
import tasks from '@/components/ListViews/TasksListView.vue?raw'
import callLogs from '@/components/ListViews/CallLogsListView.vue?raw'
import dataImports from '@/components/ListViews/DataImportsListView.vue?raw'

const dictionary = {
  Lead: 'Érdeklődő', Deal: 'Ügylet', Contact: 'Kapcsolattartó', Organization: 'Szervezet',
  Note: 'Jegyzet', Task: 'Feladat', 'Call Log': 'Hívásnapló',
  Passive: 'Passzív', Open: 'Nyitott', Replied: 'Megválaszolt', Yes: 'Igen', No: 'Nem',
  Advertising: 'Reklám', Advertisement: 'Hirdetés', 'First Name': 'Keresztnév',
  'Liked By': 'Kedvelte', 'Filter list': 'Lista szűrése', 'Refresh list': 'Lista frissítése',
  'Switch view': 'Nézet váltása', 'Quick filters': 'Gyorsszűrők', 'All fields': 'Összes mező',
  Contacts: 'Kapcsolattartók',
  'mentioned you in {0}': 'megemlítette Önt itt: {0}',
  'Are you sure you want to delete {0} - {1}?': 'Biztosan törölni szeretné a következőt: {0} - {1}?',
  '1 row selected': '1 sor kijelölve', '{0} rows selected': '{0} sor kijelölve',
  'Select all': 'Összes kijelölése', Close: 'Bezárás',
}
const t = (text, args) => {
  let out = dictionary[text] ?? text
  ;(args || []).forEach((arg, i) => { out = out.replace(`{${i}}`, arg) })
  return out
}

afterEach(() => vi.unstubAllGlobals())

describe('doctypeLabel', () => {
  it('translates doctype names and the lowercase keys the server sends', () => {
    expect(doctypeLabel('CRM Lead', t)).toBe('Érdeklődő')
    expect(doctypeLabel('CRM Deal', t)).toBe('Ügylet')
    expect(doctypeLabel('lead', t)).toBe('Érdeklődő')
    expect(doctypeLabel('deal', t)).toBe('Ügylet')
    expect(doctypeLabel('Contact', t)).toBe('Kapcsolattartó')
    expect(doctypeLabel('FCRM Note', t)).toBe('Jegyzet')
    expect(doctypeLabel('Unknown Thing', t)).toBe('Unknown Thing')
    expect(doctypeLabel(undefined, t)).toBe(undefined)
  })
})

describe('shipped Select vocabularies', () => {
  const status = ['Passive', 'Open', 'Replied']
  it('knows the Contact status list', () => {
    expect(isShippedSelect('Contact', 'status', status)).toBe(true)
    expect(isShippedSelect('Contact', 'status', ['', ...status])).toBe(true)
    expect(isShippedSelect('Contact', 'status', ['Passive', 'Open', 'Replied', 'Mine'])).toBe(false)
    expect(isShippedSelect('Contact', 'nope', status)).toBe(false)
  })
  it('translates the list cell only for the shipped Contact status', () => {
    expect(selectColumnLabel('Contact', { key: 'status' }, 'Passive', t)).toBe('Passzív')
    expect(selectColumnLabel('Contact', { key: 'status', options: 'Passive\nOpen\nReplied' }, 'Replied', t)).toBe('Megválaszolt')
    expect(selectColumnLabel('Contact', { key: 'status', options: 'Passive\nOwn' }, 'Passive', t)).toBe('Passive')
  })
  it('translates quick-filter choices, keeping values and a customised list', () => {
    const filter = {
      fieldname: 'status',
      options: [{ label: '', value: '' }, ...status.map((v) => ({ label: v, value: v }))],
    }
    const out = quickFilterSelectOptions('Contact', filter, t)
    expect(out.map((o) => o.label)).toEqual(['', 'Passzív', 'Nyitott', 'Megválaszolt'])
    expect(out.map((o) => o.value)).toEqual(['', ...status])
    expect(filter.options[1].label).toBe('Passive')
    const custom = { fieldname: 'status', options: [{ label: 'Open', value: 'Open' }, { label: 'Mine', value: 'Mine' }] }
    expect(quickFilterSelectOptions('Contact', custom, t).map((o) => o.label)).toEqual(['Open', 'Mine'])
  })
  it('translates bulk-edit Select options but keeps the stored values', () => {
    const field = { fieldname: 'status', options: 'Passive\nOpen\nReplied' }
    expect(selectOptionLabels('Contact', field, t)).toEqual([
      { label: 'Passzív', value: 'Passive' },
      { label: 'Nyitott', value: 'Open' },
      { label: 'Megválaszolt', value: 'Replied' },
    ])
  })
})

describe('command palette filter values', () => {
  it('translates Check, shipped Select and seeded Link values, not customer names', () => {
    const yesNo = [{ label: 'Yes', value: '1' }, { label: 'No', value: '0' }]
    expect(commandOptionLabels('Contact', { fieldtype: 'Check' }, yesNo, t).map((o) => o.label)).toEqual(['Igen', 'Nem'])
    const select = { fieldtype: 'Select', fieldname: 'status', options: [{ label: '', value: '' }, { label: 'Passive', value: 'Passive' }, { label: 'Open', value: 'Open' }, { label: 'Replied', value: 'Replied' }] }
    const selectOptions = [{ label: 'Passive', value: 'Passive' }, { label: 'Replied', value: 'Replied' }]
    expect(commandOptionLabels('Contact', select, selectOptions, t).map((o) => o.label)).toEqual(['Passzív', 'Megválaszolt'])
    const link = { fieldtype: 'Link', fieldname: 'source', options: 'CRM Lead Source' }
    const sources = [{ label: 'Advertisement', value: 'Advertisement' }, { label: 'My source', value: 'My source' }]
    expect(commandOptionLabels('CRM Lead', link, sources, t).map((o) => o.label)).toEqual(['Hirdetés', 'My source'])
    expect(commandOptionLabels('CRM Lead', { fieldtype: 'Data' }, sources, t)).toBe(sources)
  })
})

describe('list palette commands', () => {
  it('present translated titles and keep their identifiers', () => {
    const body = viewControls.split('function listCommands() {')[1].split('// One row per quick filter value')[0]
    const build = new Function('props', '__', 'reload', 'viewCommands', 'filterCommands', 'flatFilterCommands',
      `return () => {${body.slice(0, body.lastIndexOf('}'))}}`)
    const commands = build({ doctype: 'Contact' }, t, () => {}, () => [], () => [], () => [])()
    expect(commands.slice(0, 3).map((c) => [c.id, c.title, c.translate])).toEqual([
      ['list-views-Contact', 'Nézet váltása', false],
      ['list-filters-Contact', 'Lista szűrése', false],
      ['list-refresh-Contact', 'Lista frissítése', false],
    ])
  })
  it('names the filter groups through __()', () => {
    expect(viewControls).toContain("filterFieldCommand(filter, __('Quick filters'))")
    expect(viewControls).toContain("filterFieldCommand(field, __('All fields'))")
    expect(viewControls).toContain("title: __('Clear all filters')")
  })
  it('puts the translated route name in the page title', () => {
    expect(viewControls).toContain('label = `${__(routeName)} - ${label}`')
    expect(viewControls).not.toContain('label = `${routeName} - ${label}`')
  })
})

describe('Filter field options', () => {
  it('drops the description and labels the liked-by field', () => {
    const start = filterSource.indexOf('const filterFieldOptions = computed(')
    const end = filterSource.indexOf('\nconst availableFilters', start)
    const run = new Function('computed', 'filterableFields', 'idFieldDoctypes', 'props', '__', 'h',
      `${filterSource.slice(start, end)}\nreturn filterFieldOptions`)
    const data = [
      { fieldname: 'conversion_rate', label: 'Exchange Rate', description: 'The rate used to convert the currency' },
      { fieldname: '_liked_by', label: 'Like' },
    ]
    const options = run((f) => f(), { data }, [], { doctype: 'CRM Organization' }, t, h)
    expect(options.map((o) => o.label)).toEqual(['Exchange Rate', 'Kedvelte'])
    expect(options.some((o) => 'description' in o)).toBe(false)
    expect(data[0].description).toBeDefined()
  })
})

describe('linked-document type column', () => {
  it('goes through doctypeLabel', () => {
    expect(linkedDocsList).toContain('const getDoctypeName = (doctype) => doctypeLabel(doctype)')
  })
})

describe('selection banner', () => {
  it.each([['Leads', leads], ['Deals', deals], ['Contacts', contacts], ['Organizations', organizations],
    ['Tasks', tasks], ['CallLogs', callLogs], ['DataImports', dataImports]])('%s list uses the translated banner', (_, source) => {
    expect(source).toContain("import ListSelectBanner from '@/components/ListViews/ListSelectBanner.vue'")
    expect(source).not.toMatch(/import \{[^}]*ListSelectBanner[^}]*\} from 'frappe-ui\/experimental'/)
    expect(source).toContain('<ListSelectBanner>')
  })

  it('renders translated count and Select all, forwards actions, keeps the callbacks', async () => {
    vi.resetModules()
    const selectAll = vi.fn()
    const unselectAll = vi.fn()
    vi.doMock('frappe-ui/experimental', () => ({
      ListSelectBanner: defineComponent({
        render() {
          return h('div', this.$slots.default?.({
            selections: new Set(['A', 'B']), allRowsSelected: false, selectAll, unselectAll,
          }))
        },
      }),
    }))
    vi.doMock('frappe-ui', () => ({
      Checkbox: { render: () => h('i') },
      Button: {
        props: ['label', 'icon', 'disabled', 'ariaLabel'],
        emits: ['click'],
        render() {
          return h('button', { 'aria-label': this.ariaLabel, onClick: () => this.$emit('click') }, this.$slots.default?.() ?? this.icon)
        },
      },
    }))
    const Banner = (await import('@/components/ListViews/ListSelectBanner.vue')).default
    const root = document.createElement('div')
    const app = createApp({ render: () => h(Banner, null, { actions: ({ selections }) => h('span', `actions:${selections.size}`) }) })
    app.config.globalProperties.__ = t
    app.mount(root)
    await nextTick()
    try {
      expect(root.textContent).toContain('2 sor kijelölve')
      expect(root.textContent).toContain('Összes kijelölése')
      expect(root.textContent).toContain('actions:2')
      expect(root.textContent).not.toContain('rows selected')
      const buttons = root.querySelectorAll('button')
      buttons[0].click()
      buttons[1].click()
      expect(selectAll).toHaveBeenCalledOnce()
      expect(unselectAll).toHaveBeenCalledOnce()
      expect(buttons[1].getAttribute('aria-label')).toBe('Bezárás')
    } finally { app.unmount(); vi.doUnmock('frappe-ui'); vi.doUnmock('frappe-ui/experimental') }
  })
})
