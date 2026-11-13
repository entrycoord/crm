import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const toast = vi.hoisted(() => ({ error: vi.fn() }))
vi.mock('frappe-ui', () => ({ toast }))

import {
  getReportIssueExtension,
  loadReportIssueBundle,
  normalizeBundleUrl,
  openReportIssue,
  resetReportIssueState,
  useReportIssue,
} from '@/composables/useReportIssue'

const BUNDLE = '/assets/example_app/dist/js/report_issue.bundle.ABC123.js'
let scripts

beforeEach(() => {
  scripts = []
  // happy-dom would try to fetch the file: capture the tag instead and let
  // each test decide whether the load succeeds
  vi.spyOn(document.head, 'appendChild').mockImplementation((node) => {
    scripts.push(node)
    return node
  })
  vi.spyOn(console, 'error').mockImplementation(() => {})
  toast.error.mockReset()
  resetReportIssueState()
  delete window.platformReportIssue
  window.extensions = {
    report_issue: { enabled: true, label: '', bundle_url: BUNDLE },
  }
})

afterEach(() => {
  vi.restoreAllMocks()
  delete window.extensions
  delete window.platformReportIssue
})

function defineBundle() {
  window.platformReportIssue = { open: vi.fn() }
  return window.platformReportIssue.open
}

describe('normalizeBundleUrl', () => {
  it('keeps same-site paths and http(s) links only', () => {
    expect(normalizeBundleUrl(` ${BUNDLE} `)).toBe(BUNDLE)
    expect(normalizeBundleUrl('https://cdn.example.com/a.js')).toBe(
      'https://cdn.example.com/a.js'
    )
    for (const bad of [
      undefined,
      null,
      '',
      0,
      {},
      '//evil.example/a.js',
      'javascript:alert(1)',
      'data:text/javascript,1',
      'a.js',
    ])
      expect(normalizeBundleUrl(bad)).toBe('')
  })
})

describe('getReportIssueExtension / useReportIssue', () => {
  it('is null when the extension is missing, disabled or has no usable bundle', () => {
    delete window.extensions
    expect(getReportIssueExtension()).toBeNull()
    window.extensions = {}
    expect(getReportIssueExtension()).toBeNull()
    window.extensions = { report_issue: { enabled: false, bundle_url: BUNDLE } }
    expect(getReportIssueExtension()).toBeNull()
    window.extensions = { report_issue: { enabled: true, bundle_url: '' } }
    expect(getReportIssueExtension()).toBeNull()
    window.extensions = {
      report_issue: { enabled: true, bundle_url: 'javascript:alert(1)' },
    }
    expect(getReportIssueExtension()).toBeNull()
    expect(useReportIssue().enabled).toBe(false)
  })

  it('uses the server label, else the translated default', () => {
    expect(useReportIssue()).toMatchObject({
      enabled: true,
      label: 'Report an issue',
    })
    window.extensions.report_issue.label = '  Hibabejelentés '
    expect(useReportIssue().label).toBe('Hibabejelentés')
    window.extensions.report_issue.label = null
    expect(useReportIssue().label).toBe('Report an issue')
  })
})

describe('openReportIssue', () => {
  it('does nothing while the extension is off', async () => {
    window.extensions.report_issue.enabled = false
    expect(await openReportIssue()).toBe(false)
    expect(scripts).toHaveLength(0)
    expect(toast.error).not.toHaveBeenCalled()
  })

  it('loads the bundle with a <script> tag, then opens it for the crm surface', async () => {
    const pending = openReportIssue()
    expect(scripts).toHaveLength(1)
    expect(scripts[0].tagName).toBe('SCRIPT')
    expect(scripts[0].getAttribute('src')).toBe(BUNDLE)
    const open = defineBundle()
    expect(open).not.toHaveBeenCalled()
    scripts[0].onload()
    expect(await pending).toBe(true)
    expect(open).toHaveBeenCalledTimes(1)
    expect(open).toHaveBeenCalledWith({ surface: 'crm' })
    expect(toast.error).not.toHaveBeenCalled()
  })

  it('loads the bundle once and only opens on later clicks', async () => {
    const first = openReportIssue()
    const open = defineBundle()
    scripts[0].onload()
    await first
    await openReportIssue()
    await openReportIssue()
    expect(scripts).toHaveLength(1)
    expect(open).toHaveBeenCalledTimes(3)
  })

  it('shares one load between clicks made while it is still running', async () => {
    const a = openReportIssue()
    const b = openReportIssue()
    expect(scripts).toHaveLength(1)
    const open = defineBundle()
    scripts[0].onload()
    await Promise.all([a, b])
    expect(open).toHaveBeenCalledTimes(1)
  })

  it('does not load a bundle that something else already defined', async () => {
    const open = defineBundle()
    expect(await openReportIssue()).toBe(true)
    expect(scripts).toHaveLength(0)
    expect(open).toHaveBeenCalledWith({ surface: 'crm' })
  })

  it('toasts on a load error and tries again on the next click', async () => {
    const failed = openReportIssue()
    scripts[0].onerror()
    expect(await failed).toBe(false)
    expect(toast.error).toHaveBeenCalledTimes(1)
    expect(toast.error).toHaveBeenCalledWith(
      'Could not open the issue report form. Please try again.'
    )

    const retry = openReportIssue()
    expect(scripts).toHaveLength(2)
    const open = defineBundle()
    scripts[1].onload()
    expect(await retry).toBe(true)
    expect(open).toHaveBeenCalledTimes(1)
  })

  it('toasts when the bundle loads but does not define the open function', async () => {
    const pending = openReportIssue()
    scripts[0].onload()
    expect(await pending).toBe(false)
    expect(toast.error).toHaveBeenCalledTimes(1)
  })

  it('toasts when open() throws', async () => {
    const pending = openReportIssue()
    window.platformReportIssue = {
      open: vi.fn(() => {
        throw new Error('boom')
      }),
    }
    scripts[0].onload()
    expect(await pending).toBe(false)
    expect(toast.error).toHaveBeenCalledTimes(1)
  })
})

describe('loadReportIssueBundle', () => {
  it('returns the cached promise for the same URL', () => {
    const a = loadReportIssueBundle(BUNDLE)
    const b = loadReportIssueBundle(BUNDLE)
    expect(a).toBe(b)
    expect(scripts).toHaveLength(1)
  })
})
