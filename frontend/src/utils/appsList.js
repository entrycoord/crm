// Pure helpers for the apps switcher in the user dropdown (no framework imports).
//
// Contract with platform_customize: `frappe.apps.get_apps` returns the canonical
// titles/logos and appends ONE `frappe` ("Rendszer") entry whose route is `/desk`.
// Without it (plain CRM) the same entry is built from the fallback below.

export const SYSTEM_APP_NAME = 'frappe'
export const CURRENT_APP_NAME = 'crm'

const APP_LOGO_BASE = '/assets/platform_customize/images/apps'

// Canonical order: ERP, Ügyfélszolgálat, CRM, ..., Rendszer (always last).
const APP_ORDER = ['erpnext', 'helpdesk', 'crm']

// Used only when the API still returns an upstream title (platform_customize absent).
const UPSTREAM_TITLES = {
  erpnext: { ERPNext: 'ERP' },
  helpdesk: {
    Helpdesk: 'Ügyfélszolgálat',
    'Frappe Helpdesk': 'Ügyfélszolgálat',
  },
}

export function appLogo(name) {
  return `${APP_LOGO_BASE}/${name}.svg`
}

// The "Rendszer" entry built locally; `systemTitle` is the translated "System".
export function fallbackSystemApp(systemTitle) {
  return {
    name: SYSTEM_APP_NAME,
    logo: appLogo(SYSTEM_APP_NAME),
    title: systemTitle,
    route: '/desk',
  }
}

function rank(name) {
  const i = APP_ORDER.indexOf(name)
  return i === -1 ? APP_ORDER.length : i
}

/**
 * Turns the `frappe.apps.get_apps` response into the list shown in the Apps
 * submenu: the current app (CRM) left out, canonical order, the `frappe`
 * ("Rendszer") entry last and pointing at `/desk` (the Desk apps screen).
 * `t` translates titles that are not canonical (identity by default).
 */
export function buildApps(data, systemTitle, t = (s) => s) {
  const fallback = fallbackSystemApp(systemTitle)
  let system = fallback
  const others = []

  ;(data || []).forEach((app) => {
    if (!app?.name || app.name === CURRENT_APP_NAME) return
    if (app.name === SYSTEM_APP_NAME) {
      system = {
        name: SYSTEM_APP_NAME,
        logo: app.logo || fallback.logo,
        title: app.title || fallback.title,
        route: app.route || fallback.route,
      }
      return
    }
    others.push({
      name: app.name,
      logo: app.logo || appLogo(app.name),
      // known apps: the API title (canonical, already final); others are translated
      title:
        UPSTREAM_TITLES[app.name]?.[app.title] ??
        (APP_ORDER.includes(app.name) ? app.title : t(app.title)),
      route: app.route,
    })
  })

  const sorted = others
    .map((app, index) => ({ app, index }))
    .sort((a, b) => rank(a.app.name) - rank(b.app.name) || a.index - b.index)
    .map(({ app }) => app)

  return [...sorted, system]
}
