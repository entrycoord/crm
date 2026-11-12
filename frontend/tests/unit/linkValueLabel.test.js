import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/utils', () => ({
  isTranslatable: (doctype) => ['CRM Territory', 'CRM Lead Status', 'CRM Industry'].includes(doctype),
}))
import { linkValueLabel } from '@/utils/linkValueLabel'
import lead from '@/components/ListViews/LeadsListView.vue?raw'
import deal from '@/components/ListViews/DealsListView.vue?raw'
import contacts from '@/components/ListViews/ContactsListView.vue?raw'
import orgs from '@/components/ListViews/OrganizationsListView.vue?raw'
import tasks from '@/components/ListViews/TasksListView.vue?raw'
import calls from '@/components/ListViews/CallLogsListView.vue?raw'
import link from '@/components/Controls/Link.vue?raw'

const dictionary = { New: 'Új', Open: 'Nyitott', 'Retail & Wholesale': 'Kis- és nagykereskedelem', Retail: 'Kiskereskedelem', Hungary: 'Magyarország', Email: 'E-mail' }
const t = (v) => dictionary[v] ?? v

describe('linkValueLabel', () => {
  it('translates seeded status, industry and source names', () => {
    expect(linkValueLabel('CRM Lead Status', 'New', t)).toBe('Új')
    expect(linkValueLabel('CRM Industry', 'Retail & Wholesale', t)).toBe('Kis- és nagykereskedelem')
    expect(linkValueLabel('CRM Lead Source', 'Email', t)).toBe('E-mail')
  })
  it('keeps customer-defined names exact even when they match a dictionary word', () => {
    expect(linkValueLabel('CRM Lead Status', 'Open', t)).toBe('Open')
    expect(linkValueLabel('CRM Industry', 'Retail', t)).toBe('Retail')
    expect(linkValueLabel('CRM Lead Source', 'Open', t)).toBe('Open')
  })
  it('keeps the generic behaviour for other translated doctypes', () => {
    expect(linkValueLabel('CRM Territory', 'Hungary', t)).toBe('Magyarország')
    expect(linkValueLabel('User', 'Hungary', t)).toBe('Hungary')
  })
  it('passes through non-strings and missing doctypes', () => {
    expect(linkValueLabel(undefined, 'New', t)).toBe('New')
    expect(linkValueLabel('CRM Lead Status', null, t)).toBe(null)
  })
})

describe('call sites use it instead of a doctype-wide __()', () => {
  it.each([['Leads', lead], ['Deals', deal], ['Contacts', contacts], ['Organizations', orgs], ['Tasks', tasks], ['CallLogs', calls]])('%s list view', (_, source) => {
    expect(source).not.toMatch(/column\.options && isTranslatable\(column\.options\)\) return __\(label\)/)
    expect(source).toContain('linkValueLabel(column.options, label')
  })
  it('Link control', () => {
    expect(link).not.toContain('if (isTranslatable(props.doctype)) return __(v)')
    expect(link).toContain('linkValueLabel(props.doctype, v')
  })
})
