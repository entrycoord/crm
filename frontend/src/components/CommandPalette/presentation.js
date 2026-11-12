const RECORD_TYPES = {
  'CRM Lead': 'Lead',
  'CRM Deal': 'Deal',
  Contact: 'Contact',
  'CRM Organization': 'Organization',
}

export function createCommandTitle(title) {
  return __('Create {0}', [__(title)])
}

export function recordTypeLabel(doctype) {
  const label = RECORD_TYPES[doctype]
  return label ? __(label) : doctype
}
