import { describe, expect, it } from 'vitest'
import settings from '@/components/Settings/Settings.vue?raw'

// Settings pages are addressed by a stable English key; the visible label is translated.
const sources = import.meta.glob('/src/**/*.{vue,js}', { query: '?raw', import: 'default', eager: true })

function itemKeys(source) {
  return [...source.matchAll(/^ {10}key: '([^']+)',$/gm)].map((m) => m[1])
}

describe('settings navigation keys', () => {
  it('every page item has a stable English key next to its translated label', () => {
    const labels = [...settings.matchAll(/^ {10}label: (?:__\('([^']+)'\)|user\.value\.full_name),$/gm)]
    expect(labels.length).toBeGreaterThan(10)
    expect(itemKeys(settings).length).toBe(labels.length)
  })

  it('every deep link used elsewhere resolves to an existing key', () => {
    const keys = new Set(itemKeys(settings))
    const used = new Set()
    for (const [path, source] of Object.entries(sources)) {
      if (path.endsWith('Settings/Settings.vue')) continue
      for (const m of source.matchAll(/activeSettingsPage(?:\.value)? = '([^']+)'/g)) used.add(m[1])
    }
    expect(used.size).toBeGreaterThanOrEqual(3)
    for (const page of used) expect(keys.has(page), page).toBe(true)
  })

  it('selection compares keys, so a translated label does not break English deep links', () => {
    const body = settings.match(/function setActiveTab\(tabName\) \{([\s\S]*?)\n\}\n/)[1]
    const tabs = { value: [{ items: [{ key: 'Profile', label: 'Profil' }, { key: 'Accounts', label: 'Fiókok' }] }] }
    const activeTab = { value: null }
    new Function('tabs', 'activeTab', 'tabName', body)(tabs, activeTab, 'Accounts')
    expect(activeTab.value.label).toBe('Fiókok')
    new Function('tabs', 'activeTab', 'tabName', body)(tabs, activeTab, 'Nincs ilyen')
    expect(activeTab.value.key).toBe('Profile')
  })

  it('the template keys items, marks them active and writes the page by key', () => {
    expect(settings).toContain(':data-page="item.key"')
    expect(settings).toContain('@click="activeSettingsPage = item.key"')
    expect(settings).not.toContain('activeSettingsPage = item.label')
    expect(settings).toContain(':label="item.label"')
  })
})
