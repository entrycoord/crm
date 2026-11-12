import { groupCommands } from '@/utils/commandPalette'

describe('localized command search', () => {
  const original = globalThis.__
  beforeEach(() => { globalThis.__ = (text) => ({ Leads: 'Érdeklődők', Alice: 'Más' }[text] || text) })
  afterEach(() => { globalThis.__ = original })

  it('matches translated and original labels without changing command identity', () => {
    const command = { id: 'navigate-Leads', title: 'Leads', group: 'Navigate' }
    expect(groupCommands([command], 'érdeklődők')[0].items[0]).toBe(command)
    expect(groupCommands([command], 'leads')[0].items[0]).toBe(command)
  })

  it('does not translate free-form record titles during search', () => {
    const record = { id: 'r', title: 'Alice', group: 'Records', translate: false }
    expect(groupCommands([record], 'más')).toEqual([])
    expect(groupCommands([record], 'alice')[0].items[0]).toBe(record)
  })
})
