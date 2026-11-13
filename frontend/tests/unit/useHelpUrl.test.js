import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

// The settings store builds a frappe-ui document resource at import time; the
// composable only needs the loaded document, so stand in for it.
const state = vi.hoisted(() => ({ settings: null }))
vi.mock('@/stores/settings', async () => {
  const { ref } = await import('vue')
  state.settings = ref({})
  return { getSettings: () => ({ settings: state.settings }) }
})
import { normalizeHelpUrl, useHelpUrl } from '@/composables/useHelpUrl'
import { getHelpArticles } from '@/data/helpArticles'

beforeEach(() => {
  state.settings.value = {}
  vi.restoreAllMocks()
})

describe('normalizeHelpUrl', () => {
  it('treats anything but a plain web or same-site link as no help', () => {
    for (const bad of [undefined, null, '', '   ', 0, {}, 'javascript:alert(1)', 'data:text/html,x', '//evil.example', 'help.example.com', 'ftp://x.example'])
      expect(normalizeHelpUrl(bad)).toBe('')
  })
  it('keeps http(s) and absolute-path links, trimmed', () => {
    expect(normalizeHelpUrl(' https://help.example.com/crm ')).toBe('https://help.example.com/crm')
    expect(normalizeHelpUrl('http://help.example.com')).toBe('http://help.example.com')
    expect(normalizeHelpUrl('/help/crm')).toBe('/help/crm')
  })
})

describe('useHelpUrl', () => {
  it('has no help while help_url is missing or empty', () => {
    const { helpUrl, hasHelp } = useHelpUrl()
    expect(helpUrl.value).toBe('')
    expect(hasHelp.value).toBe(false)
    state.settings.value = { help_url: '' }
    expect(hasHelp.value).toBe(false)
  })

  it('follows the loaded settings document', async () => {
    const { helpUrl, hasHelp } = useHelpUrl()
    state.settings.value = { help_url: 'https://help.example.com/crm' }
    await nextTick()
    expect(hasHelp.value).toBe(true)
    expect(helpUrl.value).toBe('https://help.example.com/crm')
  })

  it('opens nothing without a URL', () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null)
    useHelpUrl().openHelp()
    useHelpUrl().openHelp('first-steps')
    expect(open).not.toHaveBeenCalled()
  })

  it('opens the help URL, or an article below it, in a new tab', () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null)
    state.settings.value = { help_url: 'https://help.example.com/crm/' }
    const { openHelp } = useHelpUrl()
    openHelp()
    expect(open).toHaveBeenLastCalledWith('https://help.example.com/crm', '_blank', 'noopener')
    openHelp('first-steps')
    expect(open).toHaveBeenLastCalledWith('https://help.example.com/crm/first-steps', '_blank', 'noopener')
  })
})

describe('help article data', () => {
  it('is empty until our own content is added', () => {
    expect(getHelpArticles()).toEqual([])
  })
})
