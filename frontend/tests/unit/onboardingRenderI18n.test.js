import { createApp, nextTick, ref } from 'vue'
import { vi } from 'vitest'

vi.mock('@/stores/settings', () => ({ getSettings: () => ({ settings: ref({}) }) }))

vi.mock('frappe-ui', () => ({ Dropdown: { template: '<div><slot /></div>' }, TextInput: { template: '<input />' }, Button: { template: '<button><slot /></button>', props: ['label'] }, Badge: { template: '<span>{{ label }}</span>', props: ['label'] }, Tooltip: { template: '<div><slot /></div>' } }))
vi.mock('frappe-ui/icons', () => ({ StepsIcon: { template: '<i />' }, HelpIcon: { template: '<i />' }, MaximizeIcon: { template: '<i />' }, MinimizeIcon: { template: '<i />' } }))
vi.mock('@framework/ui/components/Onboarding', () => ({
  showHelpModal: ref(false), minimize: ref(false),
  useOnboarding: () => ({ stepsCompleted: ref(1), totalSteps: ref(3), completedPercentage: ref(33), isOnboardingStepsCompleted: ref(false), steps: [], skip() {}, skipAll() {}, reset() {}, resetAll() {}, syncStatus() {} }),
}))
import GettingStartedBanner from '@/components/Onboarding/GettingStartedBanner.vue'
import HelpModal from '@/components/Onboarding/HelpModal.vue'
import OnboardingSteps from '@/components/Onboarding/OnboardingSteps.vue'

describe('translated onboarding chrome', () => {
  let app, element
  const originalTranslate = globalThis.__
  beforeEach(() => {
    element = document.createElement('div')
    document.body.append(element)
  })
  afterEach(() => { app?.unmount(); element.remove(); globalThis.__ = originalTranslate })
  function mount(component, props = {}) {
    app = createApp(component, props)
    app.config.globalProperties.__ = (msg, args = []) => {
      const translated = ({ 'Getting started': 'Kezdés', '{0}/{1} steps': '{0}/{1} lépés', 'Welcome to {0}': 'Üdvözlet: {0}', '{0}/{1} steps completed': '{0}/{1} kész', '{0}% completed': '{0}% kész' })[msg] || msg
      return translated.replace(/{(\d+)}/g, (_, i) => args[i])
    }
    globalThis.__ = app.config.globalProperties.__
    app.mount(element)
  }
  it('renders the translated progress with both numbers', () => {
    mount(GettingStartedBanner)
    expect(element.textContent).toContain('Kezdés')
    expect(element.textContent).toContain('1/3 lépés')
  })
  it('renders the local help panel heading', () => {
    mount(HelpModal, { modelValue: true, logo: { template: '<i />' } })
    expect(element.textContent).toContain('Kezdés')
  })
  it('renders translated welcome and completion count', () => {
    mount(OnboardingSteps, { logo: { template: '<i />' } })
    expect(element.textContent).toContain('Üdvözlet: CRM')
    expect(element.textContent).toContain('1/3 kész')
    expect(element.textContent).toContain('33% kész')
  })
})
