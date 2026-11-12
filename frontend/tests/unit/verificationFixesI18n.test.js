import { describe, expect, it, vi } from 'vitest'
import dayjs from 'dayjs/esm'

vi.mock('frappe-ui', () => ({ getConfig: () => ({}) }))
import { selectColumnLabel } from '@/translation'
import { loadDayjsLocale } from '@/dayjsLocale'

import field from '@/components/FieldLayout/Field.vue?raw'
import invite from '@/components/Settings/InviteUserPage.vue?raw'
import existing from '@/components/Modals/AddExistingUserModal.vue?raw'
import prefs from '@/components/Settings/PreferencesSettings.vue?raw'
import footer from '@/components/ListViews/ListFooter.vue?raw'

const lists = import.meta.glob(
  ['/src/components/ListViews/*ListView.vue', '/src/pages/Notes.vue'],
  { query: '?raw', import: 'default', eager: true },
)

const t = (value) => ({ Todo: 'Teendő', High: 'Magas' })[value] ?? value
const taskStatusOptions = 'Backlog\nTodo\nIn Progress\nDone\nCanceled'

describe('selectColumnLabel', () => {
  it('translates shipped Select values only', () => {
    const column = { key: 'status', options: taskStatusOptions }
    expect(selectColumnLabel('CRM Task', column, 'Todo', t)).toBe('Teendő')
    const customised = { key: 'status', options: taskStatusOptions + '\nReview' }
    expect(selectColumnLabel('CRM Task', customised, 'Todo', t)).toBe('Todo')
    expect(selectColumnLabel('CRM Task', { key: 'title' }, 'High', t)).toBe('High')
    expect(selectColumnLabel('CRM Task', { key: 'priority' }, 'High', t)).toBe('Magas')
  })
})

describe('dayjs locale', () => {
  it('formats month names in Hungarian and leaves English alone', async () => {
    expect(await loadDayjsLocale('en_US', dayjs)).toBe(false)
    expect(dayjs('2026-11-13').format('MMM')).toBe('Nov')
    expect(await loadDayjsLocale('hu', dayjs)).toBe(true)
    expect(dayjs('2026-11-13').format('MMM')).toBe('nov')
    expect(await loadDayjsLocale('xx', dayjs)).toBe(false)
    dayjs.locale('en')
  })
})

describe('static strings', () => {
  it('field descriptions are translated for display', () => {
    expect(field).not.toContain(':description="field.description"')
    expect(field).toContain('field.description ? __(field.description)')
  })
  it.each([['InviteUserPage', invite], ['AddExistingUserModal', existing]])('%s role descriptions', (_, source) => {
    expect(source).toContain("__('Can work with leads and deals and create private views (reports).')")
    expect(source).toContain("__('Can manage and invite new users, and create public & private views (reports).')")
    expect(source).toContain("__('Can manage all aspects of the CRM, including user management, customizations and settings.')")
  })
  it('timezone select has a translated placeholder', () => {
    expect(prefs).toContain(`:placeholder="__('Select option')"`)
  })
  it('local list footer translates its two strings', () => {
    expect(footer).toContain("__('of')")
    expect(footer).toContain(":label=\"__('Load More')\"")
  })
  it('every list uses the local footer and the select column label', () => {
    const entries = Object.entries(lists)
    expect(entries.filter(([, source]) => source.includes('<ListFooter')).length).toBe(8)
    for (const [path, source] of entries.filter(([, source]) => source.includes('<ListFooter'))) {
      expect(source, path).not.toMatch(/ListFooter,?[\s\S]{0,40}from 'frappe-ui\/experimental'/)
      expect(source, path).toContain("import ListFooter from '@/components/ListViews/ListFooter.vue'")
    }
    for (const name of ['Leads', 'Deals', 'Contacts', 'Organizations', 'Tasks', 'CallLogs']) {
      const source = lists[`/src/components/ListViews/${name}ListView.vue`]
      expect(source, name).toContain('selectColumnLabel(')
    }
  })
})
