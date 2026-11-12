import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, h } from 'vue'

vi.mock('@/utils', () => ({
  timeAgo: (date) => {
    const seconds = Math.abs((new Date(date) - new Date()) / 1000)
    return seconds < 60 ? __('just now') : new Date(date) < new Date() ? __('1 minute ago') : __('in 1 minute')
  },
  formatDate: () => 'date',
  formatTime: () => '2h',
}))
vi.mock('@/stores/statuses', () => ({ statusesStore: () => ({ communicationStatuses: { data: [] } }) }))
vi.mock('@framework/ui/telemetry', () => ({ useTelemetry: () => ({ capture: () => {} }) }))
vi.mock('frappe-ui', async (importOriginal) => {
  const original = await importOriginal()
  return {
    ...original,
    Tooltip: defineComponent({ setup(_, { slots }) { return () => h('div', slots.default?.()) } }),
    Dropdown: defineComponent({ setup(_, { slots }) { return () => h('div', slots.default?.({ open: false })) } }),
  }
})
import SLASection from '@/components/SLASection.vue'

const originalTranslate = globalThis.__
let app

afterEach(() => {
  app?.unmount()
  app = undefined
  globalThis.__ = originalTranslate
  vi.useRealTimers()
})

function renderDue(offsetSeconds, status = 'First Response Due') {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-11-12T12:00:00Z'))
  globalThis.__ = (s) => ({
    'just now': 'éppen most',
    'In less than a minute': 'Kevesebb mint egy perc múlva',
    'less than a minute ago': 'Kevesebb mint egy perce',
    'in 1 minute': 'egy perc múlva',
    '1 minute ago': 'egy perce',
  }[s] || s)
  const el = document.createElement('div')
  app = createApp(SLASection, { modelValue: {
    sla_status: status,
    response_by: new Date(Date.now() + offsetSeconds * 1000).toISOString(),
  } })
  app.config.globalProperties.__ = globalThis.__
  app.component('Badge', { props: ['label', 'theme'], render() { return h('span', { 'data-theme': this.theme }, this.label) } })
  app.component('Button', { render() { return h('button') } })
  app.mount(el)
  return el.querySelector('[data-theme]')
}

describe('localized near-due SLA', () => {
  it('shows a localized future near-due message instead of translated just now', () => {
    const badge = renderDue(30)
    expect(badge.textContent).toBe('Kevesebb mint egy perc múlva')
    expect(badge.dataset.theme).toBe('amber')
  })

  it('shows a localized overdue near-due message for rolling response', () => {
    const badge = renderDue(-30, 'Rolling Response Due')
    expect(badge.textContent).toBe('Kevesebb mint egy perce')
    expect(badge.dataset.theme).toBe('red')
  })

  it.each([
    [60, 'egy perc múlva', 'amber'],
    [-60, 'egy perce', 'red'],
  ])('keeps timeAgo output and color at the %i-second boundary', (offset, text, theme) => {
    const badge = renderDue(offset)
    expect(badge.textContent).toBe(text)
    expect(badge.dataset.theme).toBe(theme)
  })

})
