import { isShippedSelect } from '@/translation'
import { linkValueLabel } from '@/utils/linkValueLabel'

// Display labels for the value choices of a quick filter in the command palette.
// The values stay as stored; only shipped vocabularies are translated, names the
// customer added (statuses, industries, sources, custom Select lists) stay as typed.
export function commandOptionLabels(doctype, filter, options, translate) {
  if (filter.fieldtype === 'Check') {
    return options.map((option) => ({ ...option, label: translate(option.label) }))
  }
  if (filter.fieldtype === 'Link') {
    return options.map((option) => {
      const label = linkValueLabel(filter.options, option.value, translate)
      return label === option.value ? option : { ...option, label }
    })
  }
  if (filter.fieldtype === 'Select') {
    const raw = Array.isArray(filter.options)
      ? filter.options
      : String(filter.options || '').split('\n')
    const values = raw.map((option) =>
      typeof option === 'object' ? option.value : option,
    )
    if (!isShippedSelect(doctype, filter.fieldname, values)) return options
    return options.map((option) => ({ ...option, label: translate(option.label) }))
  }
  return options
}
