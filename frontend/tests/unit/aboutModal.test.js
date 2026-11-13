import { beforeEach, expect, it, vi } from 'vitest'
import { createApp, h, nextTick, reactive, ref } from 'vue'

const api = vi.hoisted(() => ({ fetch: vi.fn(), options: null, resource: null }))
vi.mock('frappe-ui', async () => {
  const { h } = await import('vue')
  const Dialog = { props: ['open'], setup: (props, { slots }) => () => props.open ? h('div', slots.default?.()) : null }
  Dialog.Title = { setup: (_, { slots }) => () => h('div', slots.default?.()) }
  return { Dialog, createResource: (options) => { api.options = options; return api.resource } }
})
import AboutModal from '@/components/Modals/AboutModal.vue'

beforeEach(() => { api.fetch.mockReset(); api.options = null; api.resource = reactive({ fetch: api.fetch, data: null, loading: false, error: null }) })
function mount(open = false) {
  const visible = ref(open)
  const root = document.createElement('div')
  const app = createApp({ setup: () => () => h(AboutModal, { modelValue: visible.value, 'onUpdate:modelValue': v => visible.value = v }) })
  app.config.globalProperties.__ = text => text
  app.mount(root)
  return { root, app, visible }
}

it('fetches the shared about data when the dialog opens', async () => {
  const { app, visible } = mount()
  try {
    visible.value = true
    await nextTick()
    expect(api.options.url).toBe('platform_customize.branding.api.get_about')
    expect(api.fetch).toHaveBeenCalledTimes(1)
  } finally { app.unmount() }
})

const sample = {
  branding: { title: 'Example CRM', subtitle: 'Service', logo: '/logo.png', message: '<b>Welcome</b>', contact: 'Call us' },
  release: 'v1', apps: [{ app: 'crm', title: 'CRM', version: '16.0' }],
  legal_notice: 'Legal text from the server: free software, no warranty.', components: [{ app: 'crm', name: 'Frappe CRM', version: '16.0', license: 'AGPL-3.0', license_url: 'https://example.com/license', source: 'https://example.com/source' }],
}

it('renders shared branding, release, apps and legal source information', async () => {
  api.resource.data = sample
  const { root, app } = mount(true)
  try {
    await nextTick()
    expect(root.textContent).toContain('Example CRM')
    expect(root.textContent).toContain('<b>Welcome</b>')
    expect(root.querySelector('b')).toBeNull()
    expect(root.querySelector('img').getAttribute('src')).toBe('/logo.png')
    expect(root.textContent).toContain('Call us')
    expect(root.textContent).toContain('v1')
    root.querySelector('button').click()
    await nextTick()
    expect(root.textContent).toContain('Legal text from the server')
    expect(root.textContent.toLowerCase()).toContain('no warranty')
    expect(root.querySelector('a[href="https://example.com/license"]')).not.toBeNull()
    expect(root.querySelector('a[href="https://example.com/source"]')).not.toBeNull()
  } finally { app.unmount() }
})


it('fetches even when initially open and displays a loading state', async () => {
  api.resource.loading = true
  const { root, app } = mount(true)
  try {
    await nextTick()
    expect(api.fetch).toHaveBeenCalledTimes(1)
    expect(root.textContent).toContain('Loading')
  } finally { app.unmount() }
})

it('reports an unavailable API while retaining CRM legal notices', async () => {
  api.resource.error = new Error('unavailable')
  const { root, app } = mount(true)
  try {
    await nextTick()
    expect(root.textContent).toContain('unavailable')
    root.querySelector('button').click()
    await nextTick()
    expect(root.textContent).toContain('Frappe Technologies')
    expect(root.textContent.toLowerCase()).toContain('no warranty')
    expect(root.querySelector('a[href="https://github.com/entrycoord/crm/blob/HEAD/LICENSE"]')).not.toBeNull()
    const source = root.querySelector('a[href="https://github.com/entrycoord/crm"]')
    expect(source).not.toBeNull()
    const onClick = vi.fn(event => event.preventDefault())
    source.addEventListener('click', onClick)
    source.click()
    expect(onClick).toHaveBeenCalledOnce()
    expect(onClick.mock.calls[0][0].target).toBe(source)
    expect(source.href).toBe('https://github.com/entrycoord/crm')
  } finally { app.unmount() }
})

it('clears the legal disclosure on close and fetches on reopening', async () => {
  api.resource.data = sample
  const { root, app, visible } = mount(true)
  try {
    await nextTick()
    root.querySelector('button').click()
    await nextTick()
    expect(root.textContent).toContain('Legal text from the server')
    visible.value = false
    await nextTick()
    visible.value = true
    await nextTick()
    expect(root.textContent).not.toContain('Legal text from the server')
    expect(api.fetch).toHaveBeenCalledTimes(2)
  } finally { app.unmount() }
})


it('handles a rejected request without an unhandled promise rejection', async () => {
  api.fetch.mockRejectedValue(new Error('API missing'))
  const { app } = mount(true)
  try {
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(api.options.onError).toBeTypeOf('function')
  } finally { app.unmount() }
})

it('keeps a usable legal notice when the response omits optional fields', async () => {
  api.resource.data = {}
  const { root, app } = mount(true)
  try {
    await nextTick()
    root.querySelector('button').click()
    await nextTick()
    expect(root.textContent).toContain('AGPL-3.0')
    expect(root.querySelector('a[href="https://github.com/entrycoord/crm"]')).not.toBeNull()
  } finally { app.unmount() }
})

it('the legal fallback names no Frappe website and calls the product CRM', async () => {
  api.resource.error = new Error('unavailable')
  const { root, app } = mount(true)
  try {
    await nextTick()
    root.querySelector('button').click()
    await nextTick()
    const hrefs = [...root.querySelectorAll('a')].map((a) => a.getAttribute('href'))
    expect(hrefs.length).toBeGreaterThan(0)
    for (const href of hrefs) expect(href).toMatch(/^https:\/\/github\.com\/entrycoord\/crm/)
    expect(root.textContent).not.toContain('Frappe CRM')
    // the copyright holder stays (legal notice)
    expect(root.textContent).toContain('Frappe Technologies Pvt. Ltd. and contributors')
  } finally { app.unmount() }
})
