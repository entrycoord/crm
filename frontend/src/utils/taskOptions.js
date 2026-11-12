// Select options of CRM Task (status / priority) as {value, label}. The stored value
// stays the English key; only the label is translated. Labels coming from the doctype
// meta are already translated, the built-in fallback list is translated here.
export function taskSelectOptions(field, fallback) {
  let options = field?.options
  if (typeof options === 'string') options = options.split('\n').map((value) => ({ value }))
  if (!Array.isArray(options)) options = fallback.map((value) => ({ value }))
  return options
    .filter((option) => option?.value)
    .map((option) => ({
      value: option.value,
      label: option.label || __(option.value),
    }))
}
