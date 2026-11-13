import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, h } from 'vue'

const state = vi.hoisted(() => ({ open: null, closeMobileSidebar: vi.fn() }))

vi.mock('frappe-ui', () => ({
  // frappe-ui's SidebarItem renders the label (and a tooltip when collapsed)
  // itself; the stub keeps the label as aria-label so tests can read it
  SidebarItem: {
    props: ['label'],
    emits: ['click'],
    setup:
      (props, { slots, emit, attrs }) =>
      () =>
        h(
          'button',
          {
            id: attrs.id,
            'aria-label': props.label,
            onClick: (event) => emit('click', event),
          },
          [slots.prefix?.(), props.label]
        ),
  },
  toast: { error: vi.fn() },
}))
vi.mock('~icons/lucide/bug', () => ({ default: { render: () => null } }))
vi.mock('@/composables/settings', () => ({
  closeMobileSidebar: (then) => state.closeMobileSidebar(then),
}))

import ReportIssueSidebarItem from '@/components/Layouts/ReportIssueSidebarItem.vue'

const flushPromises = () => new Promise((resolve) => setTimeout(resolve))
let app
function mount(props = {}) {
  const root = document.createElement('div')
  app = createApp({ render: () => h(ReportIssueSidebarItem, props) })
  app.mount(root)
  return root
}

// the bundle is already "loaded": the composable then only calls open()
beforeEach(() => {
  state.open = vi.fn()
  window.platformReportIssue = { open: state.open }
  state.closeMobileSidebar.mockReset()
})
afterEach(() => {
  app?.unmount()
  app = null
  delete window.extensions
  delete window.platformReportIssue
})

const enable = (extra = {}) => {
  window.extensions = {
    report_issue: {
      enabled: true,
      label: '',
      bundle_url: '/assets/example_app/report_issue.bundle.js',
      ...extra,
    },
  }
}

describe('report an issue sidebar item', () => {
  it('is absent when the boot has no extensions', () => {
    delete window.extensions
    expect(mount().querySelector('#report-issue-btn')).toBeNull()
    app.unmount()
    window.extensions = {}
    expect(mount().querySelector('#report-issue-btn')).toBeNull()
  })

  it('is absent when the extension is disabled', () => {
    enable({ enabled: false })
    expect(mount().querySelector('#report-issue-btn')).toBeNull()
  })

  it('is absent when the extension is enabled without a usable bundle URL', () => {
    enable({ bundle_url: '' })
    expect(mount().querySelector('#report-issue-btn')).toBeNull()
  })

  it('is present with the translated default label when enabled', () => {
    enable()
    const button = mount().querySelector('#report-issue-btn')
    expect(button).not.toBeNull()
    expect(button.getAttribute('aria-label')).toBe('Report an issue')
  })

  it('uses the label of the extension when it has one', () => {
    enable({ label: 'Tell us about a problem' })
    const button = mount().querySelector('#report-issue-btn')
    expect(button.getAttribute('aria-label')).toBe('Tell us about a problem')
  })

  it('opens the report dialog on click', async () => {
    enable()
    mount().querySelector('#report-issue-btn').click()
    await flushPromises()
    expect(state.open).toHaveBeenCalledTimes(1)
    expect(state.open).toHaveBeenCalledWith({ surface: 'crm' })
    expect(state.closeMobileSidebar).not.toHaveBeenCalled()
  })

  it('on mobile closes the drawer first and opens once it is gone', async () => {
    enable()
    mount({ mobile: true }).querySelector('#report-issue-btn').click()
    await flushPromises()
    expect(state.open).not.toHaveBeenCalled()
    expect(state.closeMobileSidebar).toHaveBeenCalledTimes(1)
    state.closeMobileSidebar.mock.calls[0][0]()
    await flushPromises()
    expect(state.open).toHaveBeenCalledTimes(1)
  })
})
