// Display name of a DocType (or of the lowercase route/notification key the server
// sends for CRM Lead / CRM Deal). DocType names are schema, not customer data, so
// they go through the dictionary; the stored value is never changed.
const serverKeys = { lead: 'Lead', deal: 'Deal' }

export function doctypeLabel(doctype, translate = __) {
  if (typeof doctype !== 'string' || !doctype) return doctype
  const name = doctype.replace(/^(CRM|FCRM)\s+/, '')
  return translate(serverKeys[name] ?? name)
}
