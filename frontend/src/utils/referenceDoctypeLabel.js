// The notification API sends the reference doctype as a raw lowercase word
// ('lead' / 'deal'). Shipped names are shown translated; anything else stays raw.
export function referenceDoctypeLabel(doctype, translate = __) {
  switch (String(doctype ?? '').replace(/^CRM /i, '').toLowerCase()) {
    case 'lead':
      return translate('Lead')
    case 'deal':
      return translate('Deal')
    default:
      return doctype
  }
}
