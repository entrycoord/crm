import { computed } from 'vue'
import { getSettings } from '@/stores/settings'

/**
 * One switch for every documentation / help link of the CRM SPA.
 *
 * The URL comes from the `help_url` key of the FCRM Settings document the SPA
 * already loads (a deployment adds it through an `as_dict` override; a plain
 * install does not, and then there is simply no help).  Empty or missing means
 * "no help": the sidebar Help item, the Help centre, the "Documentation"
 * buttons of empty lists and the "?" links of the Settings pages are not
 * rendered.  When it is set, every one of them points at this single URL.
 */
export function normalizeHelpUrl(value) {
  if (typeof value !== 'string') return ''
  const url = value.trim()
  // only plain web or same-site links; never javascript:, data: and the like
  if (/^https?:\/\/\S+$/i.test(url) || /^\/(?!\/)\S*$/.test(url)) return url
  return ''
}

export function useHelpUrl() {
  const { settings } = getSettings()

  const helpUrl = computed(() => normalizeHelpUrl(settings.value?.help_url))
  const hasHelp = computed(() => helpUrl.value !== '')

  function openHelp(path = '') {
    if (!hasHelp.value) return
    const base = helpUrl.value.replace(/\/+$/, '')
    const target = path ? `${base}/${String(path).replace(/^\/+/, '')}` : base
    window.open(target, '_blank', 'noopener')
  }

  return { helpUrl, hasHelp, openHelp }
}
