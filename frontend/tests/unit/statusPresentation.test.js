import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('@/utils', () => ({ parseColor: (color) => color, isTranslatable: () => true }))
vi.mock('@framework/ui/telemetry', () => ({ useTelemetry: () => ({ capture: vi.fn() }) }))
vi.mock('frappe-ui', () => ({ createListResource: () => ({ data: [] }) }))

import { statusesStore } from '@/stores/statuses'

describe('status options', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    globalThis.__ = (value) => value === 'New' ? 'Új' : value
  })

  it('shows a translated option while retaining its raw status for updates before the status resource loads', async () => {
    const change = vi.fn()
    const option = statusesStore().statusOptions('lead', ['New'], change)[0]
    expect(option.label).toBe('Új')
    expect(option.value).toBe('New')
    await option.onClick()
    expect(change).toHaveBeenCalledWith('New')
  })
})
