import { toast } from 'frappe-ui'

/**
 * "Report an issue" sidebar entry.
 *
 * The dialog itself is not part of this SPA: an app installed on the site
 * contributes it through the `crm_boot_extensions` hook, which the boot
 * delivers as `window.extensions.report_issue`:
 *
 *   { enabled: boolean, label: string, bundle_url: string }
 *
 * The bundle is a self-contained script that defines
 * `window.platformReportIssue.open({ surface })`.  It is loaded lazily, once,
 * on the first click, and this file never imports anything from that app.
 */

const SURFACE = 'crm'

let bundlePromise = null
let bundleUrl = null
let opening = null

// the URL comes from the server boot, but still only plain web or same-site
// links may end up in a <script src>
export function normalizeBundleUrl(value) {
  if (typeof value !== 'string') return ''
  const url = value.trim()
  if (/^https?:\/\/\S+$/i.test(url) || /^\/(?!\/)\S*$/.test(url)) return url
  return ''
}

// null when the extension is missing, switched off or has no usable bundle
export function getReportIssueExtension() {
  const config = window.extensions?.report_issue
  if (!config?.enabled) return null
  const url = normalizeBundleUrl(config.bundle_url)
  if (!url) return null
  const label = typeof config.label === 'string' ? config.label.trim() : ''
  return { bundleUrl: url, label }
}

export function loadReportIssueBundle(url) {
  if (typeof window.platformReportIssue?.open === 'function') {
    return Promise.resolve()
  }
  if (bundlePromise && bundleUrl === url) return bundlePromise

  const promise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = url
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => {
      script.remove()
      reject(new Error(`Could not load ${url}`))
    }
    document.head.appendChild(script)
  })
  bundlePromise = promise
  bundleUrl = url
  // a failed load must not be cached, so the next click can try again
  promise.catch(() => {
    if (bundlePromise === promise) {
      bundlePromise = null
      bundleUrl = null
    }
  })
  return promise
}

// Loads the bundle (first call only) and opens the dialog. Resolves to true
// when the dialog was opened, false when it was not (the user gets a toast).
export function openReportIssue() {
  if (opening) return opening
  const extension = getReportIssueExtension()
  if (!extension) return Promise.resolve(false)

  opening = (async () => {
    try {
      await loadReportIssueBundle(extension.bundleUrl)
      if (typeof window.platformReportIssue?.open !== 'function') {
        throw new Error('window.platformReportIssue.open is not defined')
      }
      window.platformReportIssue.open({ surface: SURFACE })
      return true
    } catch (error) {
      console.error('Report an issue:', error)
      toast.error(__('Could not open the issue report form. Please try again.'))
      return false
    } finally {
      opening = null
    }
  })()
  return opening
}

export function resetReportIssueState() {
  bundlePromise = null
  bundleUrl = null
  opening = null
}

export function useReportIssue() {
  const extension = getReportIssueExtension()
  return {
    enabled: Boolean(extension),
    label: extension?.label || __('Report an issue'),
    open: openReportIssue,
  }
}
