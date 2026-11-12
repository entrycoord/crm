import { it, expect } from 'vitest'
import lead from '@/pages/MobileLead.vue?raw'
import deal from '@/pages/MobileDeal.vue?raw'
import { statusFilterLabel } from '@/components/ConditionsFilter/statusFilter'

it.each([['lead', lead, 'CRM Lead Status', 'New'], ['deal', deal, 'CRM Deal Status', 'Won']])('%s mobile status translates only the seeded vocabulary', (_, source, doctype, seeded) => {
  expect(source).toContain(':label=\"statusLabel(doc.status)\"')
  expect(source).toContain('triggerStatusChange')
  const body = source.match(/function statusLabel\(status\) \{([\s\S]*?)\n\}/)[1]
  const translate = s => s === seeded ? 'Fordított' : s
  const statusLabel = new Function('status', 'statusFilterLabel', '__', body)
  expect(statusLabel(seeded, statusFilterLabel, translate)).toBe('Fordított')
  expect(statusLabel('Custom stage', statusFilterLabel, translate)).toBe('Custom stage')
  expect(body).toContain(doctype)
})
