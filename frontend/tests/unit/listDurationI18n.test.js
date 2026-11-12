import { afterEach, expect, it, vi } from 'vitest'
import contacts from '@/components/ListViews/ContactsListView.vue?raw'
import deals from '@/components/ListViews/DealsListView.vue?raw'
import leads from '@/components/ListViews/LeadsListView.vue?raw'
import organizations from '@/components/ListViews/OrganizationsListView.vue?raw'
import tasks from '@/components/ListViews/TasksListView.vue?raw'
import utils from '@/utils/index.js?raw'
import { formatDurationDisplay } from '@/utils/durationDisplay'

const rawDurationSource = utils.match(/export function formatDuration\([\s\S]*?\n}\n/)[0]
const formatDuration = new Function(`${rawDurationSource.replace('export ', '')}; return formatDuration`)()

afterEach(() => vi.unstubAllGlobals())

it.each([
  ['contacts', contacts], ['deals', deals], ['leads', leads],
  ['organizations', organizations], ['tasks', tasks],
])('%s list translates duration labels without altering the raw value', (_, source) => {
  const translations = { '{0}h': '{0}ó', '{0}m': '{0}p', '{0}s': '{0}mp' }
  vi.stubGlobal('__', (text, args = []) => (translations[text] || text).replace('{0}', args[0]))
  const functionSource = source.match(/function getLabel\(label, column\) \{[\s\S]*?\n\}/)[0]
  const getLabel = new Function('formatDuration', 'formatDurationDisplay', 'isTranslatable', `${functionSource}; return getLabel`)(formatDuration, formatDurationDisplay, () => false)
  const item = { label: 3661, value: 3661 }
  expect(source).toContain('{{ getLabel(label, column) }}')
  expect(getLabel(item.label, { type: 'Duration' })).toBe('1ó 1p 1mp')
  expect(item).toEqual({ label: 3661, value: 3661 })
  expect(getLabel('Plain', { type: 'Data' })).toBe('Plain')
  expect(source).toMatch(/import \{ formatDurationDisplay \} from ['"]@\/utils\/durationDisplay['"]/)
})
