import { createApp, nextTick } from 'vue'
import { vi } from 'vitest'

vi.mock('frappe-ui', () => ({ Dialog: { props: ['title', 'size', 'actions', 'modelValue'], template: '<section><h1>{{ title }}</h1><slot /><button v-for="action in actions" @click="action.onClick">{{ action.label }}</button></section>' } }))
import IntermediateStepModal from '@/components/Onboarding/IntermediateStepModal.vue'

describe('onboarding intermediate dialog', () => {
  let app, element
  const original = globalThis.__
  beforeEach(() => {
    element = document.createElement('div')
    document.body.append(element)
    globalThis.__ = (text) => text === 'Your browser does not support the video tag.' ? 'A böngésző nem támogatja a videót.' : text
  })
  afterEach(() => { app?.unmount(); element.remove(); globalThis.__ = original })

  it('translates video fallback and preserves caller-provided content and action', async () => {
    const clicked = vi.fn()
    app = createApp(IntermediateStepModal, { modelValue: true, currentStep: { title: 'Cím', message: 'Üzenet', videoURL: '/video', buttonLabel: 'Indítás', onClick: clicked } })
    app.config.globalProperties.__ = globalThis.__
    app.mount(element)
    expect(element.textContent).toContain('A böngésző nem támogatja a videót.')
    expect(element.textContent).toContain('Cím')
    expect(element.textContent).toContain('Üzenet')
    expect(element.textContent).toContain('Indítás')
    element.querySelector('button').click()
    await nextTick()
    expect(clicked).toHaveBeenCalledOnce()
  })
})
