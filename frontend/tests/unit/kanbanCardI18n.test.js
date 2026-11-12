import { describe, it, expect } from 'vitest'
import { compile, createApp, h } from 'vue'
import leads from '@/pages/Leads.vue?raw'
import deals from '@/pages/Deals.vue?raw'
import { statusFilterLabel } from '@/components/ConditionsFilter/statusFilter'

function renderSlot(source, slot, field, row) {
  const start = source.indexOf(`<template #${slot}=`)
  const end = source.indexOf('</template>', start)
  const template = source.slice(source.indexOf('>', start) + 1, end)
  const root = document.createElement('div')
  const app = createApp({
    data: () => ({ titleField: field, fieldName: field, itemName: 'row' }),
    methods: { getRow: () => row, statusFilterLabel },
    render: compile(`<div>${template}</div>`),
  })
  globalThis.__ = (s) => ({ New: 'Új', Won: 'Nyert', Fulfilled: 'Teljesítve', Acme: 'NE FORDÍTSD' }[s] || s)
  for (const component of ['Avatar', 'UserAvatar', 'PhoneIcon', 'Tooltip', 'MultipleAvatar']) app.component(component, { render: () => h('div') })
  app.component('IndicatorIcon', { render: () => h('i') })
  app.component('Badge', { props: ['label'], render() { return h('span', this.label) } })
  app.mount(root)
  return { text: root.textContent, unmount: () => app.unmount() }
}

describe.each([['lead', leads], ['deal', deals]])('%s kanban cards', (_, source) => {
  it.each(['title', 'fields'])('translates a seeded %s status without changing its raw value', (slot) => {
    const row = { label: _ === 'lead' ? 'New' : 'Won', color: 'red' }
    const rendered = renderSlot(source, slot, 'status', row)
    expect(rendered.text).toContain(_ === 'lead' ? 'Új' : 'Nyert')
    expect(row.label).toBe(_ === 'lead' ? 'New' : 'Won')
    rendered.unmount()
  })
  it.each(['title', 'fields'])('keeps a custom %s status exact', (slot) => {
    const rendered = renderSlot(source, slot, 'status', { label: 'Acme', color: 'red' })
    expect(rendered.text).toContain('Acme')
    expect(rendered.text).not.toContain('NE FORDÍTSD')
    rendered.unmount()
  })
  it.each(['title', 'fields'])('translates %s SLA badge but not arbitrary names', (slot) => {
    const rendered = renderSlot(source, slot, 'sla_status', { label: 'Fulfilled', value: 'Fulfilled' })
    expect(rendered.text).toContain('Teljesítve')
    rendered.unmount()
    const name = renderSlot(source, slot, 'company_name', { label: 'Acme' })
    expect(name.text).toContain('Acme')
    name.unmount()
  })
})
