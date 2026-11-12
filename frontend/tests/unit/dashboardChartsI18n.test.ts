import { describe, expect, it, vi } from 'vitest'

vi.mock('@/utils', () => ({ isTranslatable: () => true }))
import {
  toAxisChartProps,
  toDonutChartProps,
} from '@/utils/dashboardCharts'
import item from '@/components/Dashboard/DashboardItem.vue?raw'

const dictionary: Record<string, string> = {
  Leads: 'Érdeklődők',
  Count: 'Mennyiség',
  Qualification: 'Minősítés',
  Pricing: 'Árazás',
  Open: 'Nyitott',
}
const t = (text: string) => dictionary[text] ?? text

describe('dashboard chart display text', () => {
  it('series labels are translated for display, identities stay raw', () => {
    const props = toAxisChartProps(
      {
        data: [],
        xAxis: { key: 'date' },
        series: [{ name: 'leads', label: 'Leads', type: 'line' }],
      },
      t,
    )
    expect(props.y).toEqual(['leads'])
    expect(props.seriesConfig?.leads.label).toBe('Érdeklődők')
  })

  it('seeded stage names are translated, custom ones are not', () => {
    const data = [
      { stage: 'Leads', count: 4 },
      { stage: 'Qualification', count: 2 },
      { stage: 'Open', count: 1 },
    ]
    const axis = toAxisChartProps(
      { data, xAxis: { key: 'stage', type: 'category' }, series: [{ name: 'count', label: 'Count', type: 'bar' }] },
      t,
    )
    expect(axis.data.map((r) => r.stage)).toEqual(['Érdeklődők', 'Minősítés', 'Open'])
    const donut = toDonutChartProps({ data, categoryColumn: 'stage', valueColumn: 'count' }, t)
    expect(donut.data.map((r) => r.stage)).toEqual(['Érdeklődők', 'Minősítés', 'Open'])
    expect(donut.centerLabel).toBe('Mennyiség')
    expect(data[0].stage).toBe('Leads')
  })

  it('seeded lost reasons are translated', () => {
    const axis = toAxisChartProps(
      { data: [{ reason: 'Pricing', count: 1 }, { reason: 'Our own', count: 1 }], xAxis: { key: 'reason' }, series: [{ name: 'count', type: 'bar' }] },
      t,
    )
    expect(axis.data.map((r) => r.reason)).toEqual(['Árazás', 'Our own'])
  })

  it('the dashboard item passes the translator', () => {
    expect(item).toContain('toAxisChartProps(config.value as AxisChartConfig, __)')
    expect(item).toContain('toDonutChartProps(config.value as DonutChartConfig, __)')
  })
})
