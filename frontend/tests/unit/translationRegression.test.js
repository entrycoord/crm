import { describe, expect, it, vi } from 'vitest'
import { createApp } from 'vue'
import { readFileSync } from 'node:fs'

vi.mock('frappe-ui', () => ({ getConfig: () => ({ 'Hello {0}': 'Szia {0}' }) }))
import translationPlugin, { selectOptionLabels } from '@/translation'

const app = createApp({})
translationPlugin(app)
const translate = app.config.globalProperties.__

describe('translation placeholders', () => {
  it('preserves placeholders when no replacement is supplied', () => {
    expect(translate('Plan {0}')).toBe('Plan {0}')
    expect(translate('Hello {0}')).toBe('Szia {0}')
  })
  it('continues substituting supplied replacements', () => {
    expect(translate('Hello {0}', ['Ada'])).toBe('Szia Ada')
  })
})


it('translates shipped select options without translating customer-defined options', () => {
  const tr = value => ({ Low: 'Alacsony', High: 'Magas', Open: 'Nyitott' })[value] || value
  expect(selectOptionLabels('CRM Task', { fieldname: 'priority', options: 'Low\nMedium\nHigh' }, tr)).toEqual([
    { label: 'Alacsony', value: 'Low' }, { label: 'Medium', value: 'Medium' }, { label: 'Magas', value: 'High' },
  ])
  expect(selectOptionLabels('CRM Task', { fieldname: 'custom_plan', options: 'Open\nPlan {0}' }, tr)).toEqual([
    { label: 'Open', value: 'Open' }, { label: 'Plan {0}', value: 'Plan {0}' },
  ])
  expect(selectOptionLabels('CRM Task', { fieldname: 'priority', options: 'Low\nOpen' }, tr)).toEqual([
    { label: 'Low', value: 'Low' }, { label: 'Open', value: 'Open' },
  ])
})

it('routes both field layout select paths through the safe option presenter', () => {
  for (const path of ['src/components/SidePanelLayout.vue', 'src/components/FieldLayout/Field.vue']) {
    const source = readFileSync(path, 'utf8')
    expect(source).toContain('selectOptionLabels(')
    expect(source).not.toContain('label: __(option), value: option')
  }
})
