import { afterEach, describe, expect, it, vi } from 'vitest'
import activitiesSource from '@/components/Activities/Activities.vue?raw'
import taskAreaSource from '@/components/Activities/TaskArea.vue?raw'
import callAreaSource from '@/components/Activities/CallArea.vue?raw'
import taskPanelSource from '@/components/Telephony/TaskPanel.vue?raw'
import statusIconSource from '@/components/Icons/TaskStatusIcon.vue?raw'
import callLogModalSource from '@/components/Modals/CallLogDetailModal.vue?raw'
import emailTemplatesSource from '@/components/Settings/EmailTemplate/EmailTemplates.vue?raw'
import newTemplateSource from '@/components/Settings/EmailTemplate/NewEmailTemplate.vue?raw'
import editTemplateSource from '@/components/Settings/EmailTemplate/EditEmailTemplate.vue?raw'

const fields = { status: null, priority: null }

vi.mock('@/stores/meta', () => ({
  getMeta: () => ({
    getFields: () => [fields.status, fields.priority].filter(Boolean),
    getFormattedPercent: vi.fn(),
    getFormattedFloat: vi.fn(),
    getFormattedCurrency: vi.fn(),
  }),
}))
vi.mock('@/stores/users', () => ({ usersStore: () => ({}) }))
vi.mock('@/utils/scriptToast', () => ({ createToast: vi.fn(), scriptToast: vi.fn() }))
vi.mock('@/composables/useTimelinePreferences', () => ({ timestampCell: vi.fn() }))

import { formatTime, taskPriorityOptions, taskStatusOptions } from '@/utils'
import { taskSelectOptions } from '@/utils/taskOptions'
import { callDurationLabel } from '@/utils/callLog'
import { CRMTask } from '@/doctypes/crm_task/form.js'
import { FCRMNote } from '@/doctypes/fcrm_note/form.js'

const hu = {
  added: 'hozzáadta',
  as: 'értékkel:',
  removed: 'eltávolította',
  value: 'érték:',
  changed: 'módosította',
  from: 'erről:',
  to: 'erre:',
  Low: 'Alacsony',
  Medium: 'Közepes',
  High: 'Magas',
  Backlog: 'Várólista',
  Todo: 'Elvégzendő',
  'In Progress': 'Folyamatban',
  Done: 'Kész',
  Canceled: 'Megszakítva',
  'Rich Text': 'Formázott szöveg',
  Lead: 'Érdeklődő',
  Deal: 'Ügylet',
  'Open {0}': '{0} megnyitása',
  'Inbound Call': 'Bejövő hívás',
  'Outbound Call': 'Kimenő hívás',
  '{0}d': '{0}n',
  '{0}h': '{0}ó',
  '{0}m': '{0}p',
  '{0}s': '{0}mp',
  'created this lead': 'létrehozta ezt az érdeklődőt',
}
const translate = (text, args = []) =>
  (hu[text] ?? text).replace(/{(\d+)}/g, (_, i) => args[i])

afterEach(() => vi.unstubAllGlobals())

function activityDetails() {
  const src = activitiesSource.match(/function update_activities_details\(activity\) \{[\s\S]*?\n\}/)[0]
  return new Function('getUser', '__', `${src}; return update_activities_details`)(
    () => ({ full_name: 'Teszt Elek' }),
    translate,
  )
}

describe('timeline field-change sentence', () => {
  it.each([
    ['added', 'hozzáadta', 'értékkel:', ''],
    ['removed', 'eltávolította', 'érték:', ''],
    ['changed', 'módosította', 'erről:', 'erre:'],
  ])('%s is translated word by word', (type, word, value, to) => {
    const activity = { activity_type: type, owner: 'a@b.c' }
    activityDetails()(activity)
    expect(activity).toMatchObject({ type: word, value, to, owner_name: 'Teszt Elek' })
  })

  it('keeps the server-translated creation text and clears the other words', () => {
    const activity = { activity_type: 'creation', data: 'created this lead', owner: 'a@b.c' }
    activityDetails()(activity)
    expect(activity).toMatchObject({ type: 'létrehozta ezt az érdeklődőt', value: '', to: '' })
  })

  it('translates through literal __() calls so the strings are extracted', () => {
    for (const word of ['added', 'as', 'removed', 'value', 'changed', 'from', 'to']) {
      expect(activitiesSource).toContain(`__('${word}')`)
    }
  })

  it('prints the stored words without translating them a second time', () => {
    expect(activitiesSource).not.toMatch(/__\(activity\.(type|value)\)/)
    expect(activitiesSource).not.toContain('__(a.type)')
    expect(activitiesSource).not.toMatch(/__\(activity\.data\.type\)/)
    expect(activitiesSource).toContain('{{ activity.to }}')
    expect(activitiesSource).toContain('{{ a.to }}')
  })
})

describe('task status / priority labels', () => {
  it('translates the label and keeps the stored value (meta labels win)', () => {
    vi.stubGlobal('__', translate)
    const field = { options: [{ label: '', value: '' }, { label: 'Kész', value: 'Done' }, { label: 'Egyedi', value: 'Custom' }] }
    expect(taskSelectOptions(field, ['Backlog'])).toEqual([
      { value: 'Done', label: 'Kész' },
      { value: 'Custom', label: 'Egyedi' },
    ])
  })

  it('translates the built-in list when the meta has no options', () => {
    vi.stubGlobal('__', translate)
    expect(taskSelectOptions(undefined, ['Low', 'Medium', 'High'])).toEqual([
      { value: 'Low', label: 'Alacsony' },
      { value: 'Medium', label: 'Közepes' },
      { value: 'High', label: 'Magas' },
    ])
    expect(taskSelectOptions({ options: 'Todo\nDone' }, [])).toEqual([
      { value: 'Todo', label: 'Elvégzendő' },
      { value: 'Done', label: 'Kész' },
    ])
  })

  it('taskStatusOptions / taskPriorityOptions show Hungarian labels but call back with the English value', () => {
    vi.stubGlobal('__', translate)
    fields.status = null
    fields.priority = null
    const picked = []
    const statuses = taskStatusOptions((v, d) => picked.push([v, d]), 'row')
    expect(statuses.map((o) => o.label)).toEqual(['Várólista', 'Elvégzendő', 'Folyamatban', 'Kész', 'Megszakítva'])
    statuses[0].onClick()
    const priorities = taskPriorityOptions((v) => picked.push([v]))
    expect(priorities.map((o) => o.label)).toEqual(['Alacsony', 'Közepes', 'Magas'])
    priorities[2].onClick()
    expect(picked).toEqual([['Backlog', 'row'], ['High']])
  })

  it('uses the meta option labels when the doctype provides them', () => {
    vi.stubGlobal('__', translate)
    fields.status = {
      fieldname: 'status',
      options: [{ label: 'Kész', value: 'Done' }],
    }
    expect(taskStatusOptions().map((o) => o.label)).toEqual(['Kész'])
    fields.status = null
  })

  it('the task card, telephony panel and status icon translate priority / status text', () => {
    expect(taskAreaSource).toContain("{{ task.priority ? __(task.priority) : '' }}")
    expect(taskPanelSource).toContain(':label="task.status ? __(task.status) : task.status"')
    expect(taskPanelSource).toContain(':label="task.priority ? __(task.priority) : task.priority"')
    expect(statusIconSource).toContain(':aria-label="status ? __(status) : status"')
  })
})

describe('durations', () => {
  it('formatTime translates the day/hour/minute/second units', () => {
    vi.stubGlobal('__', translate)
    expect(formatTime(90061)).toBe('1n 1ó 1p 1mp')
    expect(formatTime(5)).toBe('5mp')
  })

  it('call duration label is built from the raw seconds, not the English server string', () => {
    vi.stubGlobal('__', translate)
    expect(callDurationLabel({ duration: 65, _duration: '1m 5s' })).toBe('1p 5mp')
    expect(callDurationLabel({ duration: 0, _duration: '0s' })).toBe('0mp')
    expect(callDurationLabel({ duration: null, _duration: '2m' })).toBe('2m')
    expect(callAreaSource).toContain(':label="callDurationLabel(call)"')
    expect(callAreaSource).not.toContain('call._duration')
  })
})

describe('call log detail modal', () => {
  it('shows the call type and the linked record type translated', () => {
    expect(callLogModalSource).not.toContain("+ ' Call'")
    expect(callLogModalSource).toContain("__('Inbound Call') : __('Outbound Call')")
    expect(callLogModalSource).toContain("data._lead ? __('Lead') : __('Deal')")
    expect(callLogModalSource).not.toContain("data._lead ? 'Lead' : 'Deal'")
  })
})

describe('open-record action of the task / note modals', () => {
  it.each([
    ['task', CRMTask, 'CRM Lead', 'Érdeklődő megnyitása'],
    ['task', CRMTask, 'CRM Deal', 'Ügylet megnyitása'],
    ['note', FCRMNote, 'CRM Lead', 'Érdeklődő megnyitása'],
    ['note', FCRMNote, 'CRM Deal', 'Ügylet megnyitása'],
  ])('%s modal: %s -> %s', (_, Form, doctype, label) => {
    vi.stubGlobal('__', translate)
    const form = new Form()
    form.doc = { reference_doctype: doctype, reference_docname: 'X-1' }
    form.onRender()
    expect(form.actions[0].label).toBe(label)
  })
})

describe('email templates', () => {
  it('list prints the translated record type and the content type is a labelled option', () => {
    expect(emailTemplatesSource).toContain('{{ referenceDoctypeLabel(template.reference_doctype) }}')
    expect(emailTemplatesSource).not.toContain(".replace('CRM ', '')")
    for (const src of [newTemplateSource, editTemplateSource]) {
      expect(src).toContain("{ label: __('Rich Text'), value: 'Rich Text' }")
      expect(src).not.toContain("['Rich Text', 'HTML']")
    }
  })
})
