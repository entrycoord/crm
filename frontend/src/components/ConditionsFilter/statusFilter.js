// Translate only the seeded vocabulary, never arbitrary record names.
const vocabulary = {
  'CRM Lead Status': ['New', 'Contacted', 'Nurture', 'Qualified', 'Converted', 'Unqualified', 'Junk'],
  'CRM Deal Status': ['Qualification', 'Demo/Making', 'Proposal/Quotation', 'Negotiation', 'Ready to Close', 'Won', 'Lost'],
  'CRM Communication Status': ['Open', 'Replied'],
}

export function isStatusFilter(doctype) {
  return Object.hasOwn(vocabulary, doctype)
}

export function statusFilterLabel(doctype, value, translate) {
  return vocabulary[doctype]?.includes(value) ? translate(value) : value
}

export function statusFilterOptions(doctype, rows, translate) {
  return rows.map((row) => ({
    label: statusFilterLabel(doctype, row.value, translate),
    value: row.value,
  }))
}

export function statusCommandOptions(field, options, translate) {
  if (field.fieldtype !== 'Link' || !isStatusFilter(field.options)) return options
  return options.map(option => ({
    ...option,
    label: statusFilterLabel(field.options, option.value, translate),
  }))
}
