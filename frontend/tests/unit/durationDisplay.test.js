import { afterEach, expect, it, vi } from 'vitest'
import { createApp, h, nextTick } from 'vue'

vi.mock('frappe-ui', () => ({
  TextInput: {
    props: ['value'],
    emits: ['focus', 'blur', 'input', 'keydown'],
    render() {
      return h('input', { value: this.value, onFocus: e => this.$emit('focus', e), onBlur: e => this.$emit('blur', e), onInput: e => this.$emit('input', e), onKeydown: e => this.$emit('keydown', e) })
    },
  },
}))
// Keep the real duration formatter while avoiding unrelated UI/store dependencies.
vi.mock('@/utils', () => ({
  formatDuration(seconds, longForm = false) {
    if (seconds == null) return ''
    if (seconds === 0) return longForm ? '0 seconds' : '0s'
    const h = Math.floor(seconds / 3600), m = Math.floor((seconds % 3600) / 60), s = seconds % 60
    return [h && (longForm ? `${h} ${h === 1 ? 'hour' : 'hours'}` : `${h}h`), m && (longForm ? `${m} ${m === 1 ? 'minute' : 'minutes'}` : `${m}m`), s && (longForm ? `${s} ${s === 1 ? 'second' : 'seconds'}` : `${s}s`)].filter(Boolean).join(' ')
  },
}))
import DurationInput from '@/components/Controls/DurationInput.vue'
import { formatDurationDisplay } from '@/utils/durationDisplay'

afterEach(() => vi.unstubAllGlobals())

it('displays translated units but edits and commits the original parseable format', async () => {
  const translations = { '{0}h': '{0}ó', '{0}m': '{0}p', '{0}s': '{0}mp' }
  vi.stubGlobal('__', (text, args = []) => (translations[text] || text).replace('{0}', args[0]))
  const changes = []
  const root = document.createElement('div')
  const app = createApp(DurationInput, { value: 3661, onChange: value => changes.push(value) })
  app.mount(root)
  try {
    const input = root.querySelector('input')
    expect(input.value).toBe('1ó 1p 1mp')
    input.dispatchEvent(new Event('focus'))
    await nextTick()
    expect(input.value).toBe('1h 1m 1s')
    input.dispatchEvent(new Event('blur'))
    await nextTick()
    expect(changes).toEqual([3661])
    expect(input.value).toBe('1ó 1p 1mp')
  } finally { app.unmount() }
})

it('translates long singular and plural units, zero and handles empty values', () => {
  const translations = {
    '{0} hour': '{0} óra', '{0} hours': '{0} óra',
    '{0} minute': '{0} perc', '{0} minutes': '{0} perc',
    '{0} second': '{0} másodperc', '{0} seconds': '{0} másodperc',
  }
  vi.stubGlobal('__', (text, args = []) => (translations[text] || text).replace('{0}', args[0]))
  expect(formatDurationDisplay(3661, true)).toBe('1 óra 1 perc 1 másodperc')
  expect(formatDurationDisplay(7322, true)).toBe('2 óra 2 perc 2 másodperc')
  expect(formatDurationDisplay(0, true)).toBe('0 másodperc')
  expect(formatDurationDisplay(0)).toBe('0s')
  for (const value of [null, undefined, '', 'invalid']) expect(formatDurationDisplay(value)).toBe('')
})

it('preserves long form editable values and parse results', async () => {
  vi.stubGlobal('__', (text, args = []) => (text === '{0} hour' ? '{0} óra' : text).replace('{0}', args[0]))
  const changes = []
  const root = document.createElement('div')
  const app = createApp(DurationInput, { value: 3600, longForm: true, onChange: value => changes.push(value) })
  app.mount(root)
  try {
    const input = root.querySelector('input')
    expect(input.value).toBe('1 óra')
    input.dispatchEvent(new Event('focus'))
    await nextTick()
    expect(input.value).toBe('1 hour')
    input.dispatchEvent(new Event('blur'))
    await nextTick()
    expect(changes).toEqual([3600])
  } finally { app.unmount() }
})
