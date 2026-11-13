import { createApp, h, nextTick } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// One help switch: `help_url` of the settings document. Empty/missing hides the
// Help centre, the "Documentation" buttons and the "?" links; set shows them
// all, pointing at that one URL.
const state = vi.hoisted(() => ({ settings: null, completed: null, showHelpCenter: null }))
vi.mock('@/stores/settings', async () => {
  const { ref } = await import('vue')
  state.settings = ref({})
  return { getSettings: () => ({ settings: state.settings }) }
})
vi.mock('frappe-ui', async () => {
  const { h } = await import('vue')
  return {
    Button: { props: ['label', 'href', 'ariaLabel'], setup: (p, { slots, attrs }) => () => h(p.href ? 'a' : 'button', { href: p.href, 'aria-label': p.ariaLabel || attrs['aria-label'] }, [p.label, slots.default?.()]) },
    Dropdown: { template: '<div><slot /></div>' },
    TextInput: { template: '<input />' },
    Badge: { template: '<span />' },
    Tooltip: { props: ['text'], template: '<span><slot /></span>' },
  }
})
vi.mock('frappe-ui/icons', () => ({ StepsIcon: { template: '<i />' }, HelpIcon: { template: '<i />' }, MaximizeIcon: { template: '<i />' }, MinimizeIcon: { template: '<i />' } }))
vi.mock('@framework/ui/components/Onboarding', async () => {
  const { ref } = await import('vue')
  state.completed = ref(false)
  return {
    showHelpModal: ref(true),
    minimize: ref(false),
    useOnboarding: () => ({ stepsCompleted: ref(1), totalSteps: ref(3), completedPercentage: ref(33), isOnboardingStepsCompleted: state.completed, steps: [], skip() {}, skipAll() {}, reset() {}, resetAll() {}, syncStatus() {} }),
  }
})
vi.mock('@/components/Icon.vue', () => ({ default: { template: '<i />' } }))

import DocsLink from '@/components/Settings/DocsLink.vue'
import EmptyState from '@/components/ListViews/EmptyState.vue'
import HelpCenter from '@/components/Onboarding/HelpCenter.vue'
import HelpModal from '@/components/Onboarding/HelpModal.vue'
import OnboardingSteps from '@/components/Onboarding/OnboardingSteps.vue'
import { showHelpCenter } from '@/components/Onboarding/helpCenter'

const URL_SET = 'https://help.example.com/crm'
let app, root
function mount(component, props = {}) {
  root = document.createElement('div')
  document.body.append(root)
  app = createApp({ render: () => h(component, props) })
  app.config.globalProperties.__ = (msg, args = []) => msg.replace(/{(\d+)}/g, (_, i) => args[i])
  app.component('Button', { props: ['label', 'href'], setup: (p) => () => h(p.href ? 'a' : 'button', { href: p.href }, p.label) })
  app.mount(root)
  return root
}
beforeEach(() => {
  state.settings.value = {}
  state.completed.value = false
  showHelpCenter.value = false
  globalThis.__ = (msg, args = []) => msg.replace(/{(\d+)}/g, (_, i) => args[i])
})
afterEach(() => {
  app?.unmount()
  root?.remove()
  vi.restoreAllMocks()
})

describe('settings "?" link (DocsLink)', () => {
  it('renders nothing without a help URL', () => {
    expect(mount(DocsLink).querySelector('a')).toBeNull()
  })
  it('links to the help URL when set', () => {
    state.settings.value = { help_url: URL_SET }
    const link = mount(DocsLink).querySelector('a')
    expect(link.getAttribute('href')).toBe(URL_SET)
    expect(link.getAttribute('target')).toBe('_blank')
  })
})

describe('empty list "Documentation" button (EmptyState)', () => {
  const props = { name: 'Lead', docs: true }
  it('is hidden without a help URL', () => {
    expect(mount(EmptyState, props).textContent).not.toContain('Documentation')
  })
  it('is hidden when the page does not ask for it', () => {
    state.settings.value = { help_url: URL_SET }
    expect(mount(EmptyState, { name: 'Lead' }).textContent).not.toContain('Documentation')
  })
  it('shows and points at the help URL when set', () => {
    state.settings.value = { help_url: URL_SET }
    const a = mount(EmptyState, props).querySelector('a')
    expect(a.textContent).toContain('Documentation')
    expect(a.getAttribute('href')).toBe(URL_SET)
  })
})

describe('Help centre (HelpCenter)', () => {
  const articles = [{ title: 'Group', opened: true, subArticles: [{ name: 'first-steps', title: 'First steps' }, { name: 'faq', title: 'FAQ', url: 'https://other.example.com/faq' }] }]
  it('has no "Open docs" button without a help URL', () => {
    expect(mount(HelpCenter, { modelValue: articles }).querySelector('[aria-label="Open docs"]')).toBeNull()
  })
  it('opens the help URL, an article below it, or an article\'s own URL', () => {
    state.settings.value = { help_url: URL_SET }
    const open = vi.spyOn(window, 'open').mockImplementation(() => null)
    const el = mount(HelpCenter, { modelValue: articles })
    el.querySelector('[aria-label="Open docs"]').click()
    expect(open).toHaveBeenLastCalledWith(URL_SET, '_blank', 'noopener')
    const rows = [...el.querySelectorAll('.group')]
    rows[0].click()
    expect(open).toHaveBeenLastCalledWith(`${URL_SET}/first-steps`, '_blank', 'noopener')
    rows[1].click()
    expect(open).toHaveBeenLastCalledWith('https://other.example.com/faq', '_blank', 'noopener')
  })
})

describe('help panel (HelpModal)', () => {
  const props = { modelValue: true, logo: { template: '<i />' } }
  it('without a help URL only the getting-started checklist is offered', () => {
    const el = mount(HelpModal, props)
    expect(el.textContent).toContain('Getting started')
    expect(el.textContent).toContain('Welcome to CRM')
    expect(el.textContent).not.toContain('Help centre')
    expect(el.textContent).not.toContain('Frappe')
  })
  it('without a help URL the Help centre never renders, even when it was opened before', () => {
    state.completed.value = true
    showHelpCenter.value = true
    const el = mount(HelpModal, props)
    expect(el.textContent).not.toContain('Help center')
    expect(el.querySelector('[aria-label="Open docs"]')).toBeNull()
  })
  it('with a help URL the Help centre link and the centre itself are available', async () => {
    state.settings.value = { help_url: URL_SET }
    const el = mount(HelpModal, props)
    expect(el.textContent).toContain('Help centre')
    state.completed.value = true
    showHelpCenter.value = true
    await nextTick()
    expect(el.textContent).toContain('Help center')
    expect(el.querySelector('[aria-label="Open docs"]')).not.toBeNull()
  })
  it('names the product with the title it is given', () => {
    expect(mount(HelpModal, { ...props, title: 'Acme CRM' }).textContent).toContain('Welcome to Acme CRM')
  })
})

describe('welcome heading (OnboardingSteps)', () => {
  it('defaults to the neutral product name', () => {
    expect(mount(OnboardingSteps, { logo: { template: '<i />' } }).textContent).toContain('Welcome to CRM')
  })
})
