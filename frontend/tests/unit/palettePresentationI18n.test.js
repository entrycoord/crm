import { createCommandTitle, recordTypeLabel } from '@/components/CommandPalette/presentation'

describe('command palette presentation', () => {
  const original = globalThis.__
  beforeEach(() => {
    globalThis.__ = (text, args = []) => ({ 'Create {0}': '{0} létrehozása', Lead: 'Érdeklődő', Contact: 'Kapcsolat' }[text] || text).replace('{0}', args[0])
  })
  afterEach(() => { globalThis.__ = original })

  it('translates the creation template and built-in type', () => {
    expect(createCommandTitle('Lead')).toBe('Érdeklődő létrehozása')
  })

  it('translates built-in record type labels and preserves unknown doctypes', () => {
    expect(recordTypeLabel('CRM Lead')).toBe('Érdeklődő')
    expect(recordTypeLabel('Contact')).toBe('Kapcsolat')
    expect(recordTypeLabel('Custom Entity')).toBe('Custom Entity')
    expect(recordTypeLabel('CRM Custom Entity')).toBe('CRM Custom Entity')
  })
})
