// Chart resolvers (CRM's and contributed apps') return the experimental config shape; these map it to frappe-ui/charts props.
import type {
  BarChartProps,
  ChartValueAxisOptions,
  DonutChartProps,
  NumberCardProps,
  SeriesStyle,
  TimeGrain,
} from 'frappe-ui/charts'
import { linkValueLabel } from '@/utils/linkValueLabel'

export type Translate = (text: string) => string

type Row = Record<string, unknown>

interface ValueAxisConfig {
  title?: string
  yMin?: number
  yMax?: number
  echartOptions?: Row
}

interface SeriesConfig {
  name: string
  label?: string
  type: 'bar' | 'line' | 'area'
  color?: string
  axis?: 'y' | 'y2'
  showDataLabels?: boolean
  showDataPoints?: boolean
  lineType?: 'solid' | 'dashed' | 'dotted'
  stackName?: string
  echartOptions?: Row
}

export interface AxisChartConfig {
  data?: Row[]
  title?: string
  subtitle?: string
  colors?: string[]
  xAxis?: {
    key: string
    type?: 'category' | 'time' | 'value'
    timeGrain?: TimeGrain
    title?: string
    echartOptions?: Row
  }
  yAxis?: ValueAxisConfig
  y2Axis?: ValueAxisConfig
  swapXY?: boolean
  stacked?: boolean
  series?: SeriesConfig[]
  echartOptions?: Row
}

export interface DonutChartConfig {
  data?: Row[]
  title?: string
  subtitle?: string
  colors?: string[]
  categoryColumn: string
  valueColumn: string
  maxSliceCount?: number
  showInlineLabels?: boolean
  echartOptions?: Row
}

export type NumberChartConfig = NumberCardProps & { tooltip?: string }

export type DashboardChartConfig = Partial<
  NumberChartConfig & AxisChartConfig & DonutChartConfig
>

export type AxisChartKind = 'line' | 'area' | 'bar'

export function toNumberCardProps(config: NumberChartConfig): NumberCardProps {
  const props = { ...config }
  delete props.tooltip
  return props
}

// Stage and lost-reason names come from records: only the names CRM ships are
// translated, the stored values and the customer's own names stay exact.
function translateCategories(
  data: Row[] | undefined,
  key: string | undefined,
  translate: Translate,
): Row[] {
  const rows = data || []
  const display: Record<string, (value: string) => string> = {
    stage: (value) =>
      value === 'Leads'
        ? translate(value)
        : linkValueLabel('CRM Deal Status', value, translate),
    reason: (value) => linkValueLabel('CRM Lost Reason', value, translate),
  }
  const format = key ? display[key] : undefined
  if (!key || !format) return rows
  return rows.map((row) =>
    typeof row[key] === 'string' ? { ...row, [key]: format(row[key] as string) } : row,
  )
}

export function toDonutChartProps(
  config: DonutChartConfig,
  translate: Translate = (text) => text,
): DonutChartProps {
  return {
    title: config.title,
    subtitle: config.subtitle,
    data: translateCategories(config.data, config.categoryColumn, translate),
    category: config.categoryColumn,
    value: config.valueColumn,
    maxSlices: config.maxSliceCount,
    showDataLabels: config.showInlineLabels,
    palette: config.colors,
    // frappe-ui prints the value column's key under the total; name it in the user's language
    centerLabel: translate(
      config.valueColumn.charAt(0).toUpperCase() +
        config.valueColumn.slice(1).replace(/_/g, ' '),
    ),
    echartOptions: config.echartOptions,
  }
}

export function getAxisChartKind(config: AxisChartConfig): AxisChartKind {
  const types = new Set((config.series || []).map((s) => s.type))
  if (types.size === 1 && types.has('line')) return 'line'
  if (types.size === 1 && types.has('area')) return 'area'
  return 'bar'
}

function toValueAxis(
  axis?: ValueAxisConfig,
): ChartValueAxisOptions | undefined {
  return (
    axis && {
      title: axis.title,
      min: axis.yMin,
      max: axis.yMax,
      echartOptions: axis.echartOptions,
    }
  )
}

export function toAxisChartProps(
  config: AxisChartConfig,
  translate: Translate = (text) => text,
): BarChartProps {
  const series = config.series || []
  const seriesConfig: Record<string, SeriesStyle> = {}
  series.forEach((s, i) => {
    seriesConfig[s.name] = {
      label: s.label ? translate(s.label) : undefined,
      type: s.type,
      color: s.color || config.colors?.[i],
      showDataLabels: s.showDataLabels,
      showDataPoints: s.showDataPoints,
      dashed: s.lineType === 'dashed' || s.lineType === 'dotted' || undefined,
      stackName: s.stackName,
      echartOptions: s.echartOptions,
    }
  })

  const y2 = series.filter((s) => s.axis === 'y2').map((s) => s.name)

  return {
    title: config.title,
    subtitle: config.subtitle,
    data: translateCategories(config.data, config.xAxis?.key, translate),
    x: config.xAxis?.key as string,
    y: series.filter((s) => s.axis !== 'y2').map((s) => s.name),
    y2: y2.length ? y2 : undefined,
    seriesConfig,
    stacked: config.stacked,
    xAxis: {
      title: config.xAxis?.title,
      type: config.xAxis?.type,
      timeGrain: config.xAxis?.timeGrain,
      echartOptions: config.xAxis?.echartOptions,
    },
    yAxis: toValueAxis(config.yAxis),
    y2Axis: toValueAxis(config.y2Axis),
    echartOptions: config.echartOptions,
    ...(getAxisChartKind(config) === 'bar' && { horizontal: config.swapXY }),
  }
}
