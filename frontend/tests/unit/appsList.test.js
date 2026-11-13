import { describe, expect, it } from 'vitest'
import { buildApps, fallbackSystemApp } from '@/utils/appsList'

const SVG = '/assets/platform_customize/images/apps'
// what platform_customize's get_apps returns (original order, Rendszer appended)
const api = [
  {
    name: 'erpnext',
    title: 'ERP',
    logo: `${SVG}/erpnext.svg`,
    route: '/desk/erpnext',
  },
  {
    name: 'helpdesk',
    title: 'Ügyfélszolgálat',
    logo: `${SVG}/helpdesk.svg`,
    route: '/helpdesk',
  },
  { name: 'crm', title: 'CRM', logo: `${SVG}/crm.svg`, route: '/crm' },
  {
    name: 'frappe',
    title: 'Rendszer',
    logo: `${SVG}/frappe.svg`,
    route: '/desk',
  },
]

describe('apps switcher list', () => {
  it('uses the API entries: current app left out, Rendszer last with route /desk', () => {
    const apps = buildApps(api, 'System')
    expect(apps.map((a) => a.name)).toEqual(['erpnext', 'helpdesk', 'frappe'])
    expect(apps.map((a) => a.title)).toEqual([
      'ERP',
      'Ügyfélszolgálat',
      'Rendszer',
    ])
    expect(apps.at(-1)).toEqual({
      name: 'frappe',
      title: 'Rendszer',
      logo: `${SVG}/frappe.svg`,
      route: '/desk',
    })
    expect(apps[0].logo).toBe(`${SVG}/erpnext.svg`)
  })

  it('never uses the Brand logo or the Desk-less route for Rendszer', () => {
    const apps = buildApps(api, 'System')
    expect(apps.at(-1).logo).toBe(`${SVG}/frappe.svg`)
    expect(apps.every((a) => a.route !== '/desk/helpdesk')).toBe(true)
  })

  it('falls back to a /desk Rendszer entry when the API has none (no platform_customize)', () => {
    const apps = buildApps(
      [
        {
          name: 'helpdesk',
          title: 'Helpdesk',
          logo: '/assets/helpdesk/x.svg',
          route: '/helpdesk',
        },
        {
          name: 'erpnext',
          title: 'ERPNext',
          logo: '/assets/erpnext/e.svg',
          route: '/desk/erpnext',
        },
        {
          name: 'crm',
          title: 'Frappe CRM',
          logo: '/assets/crm/c.svg',
          route: '/crm',
        },
      ],
      'Rendszer'
    )
    expect(apps.map((a) => a.name)).toEqual(['erpnext', 'helpdesk', 'frappe'])
    expect(apps.map((a) => a.title)).toEqual([
      'ERP',
      'Ügyfélszolgálat',
      'Rendszer',
    ])
    expect(apps.at(-1)).toEqual(fallbackSystemApp('Rendszer'))
    expect(apps.at(-1)).toEqual({
      name: 'frappe',
      title: 'Rendszer',
      logo: `${SVG}/frappe.svg`,
      route: '/desk',
    })
  })

  it('sorts into canonical order and keeps one Rendszer entry, last', () => {
    const apps = buildApps([api[3], api[2], api[1], api[3], api[0]], 'System')
    expect(apps.map((a) => a.name)).toEqual(['erpnext', 'helpdesk', 'frappe'])
  })

  it('puts unknown apps before Rendszer, translating only their own title', () => {
    const apps = buildApps(
      [
        { name: 'builder', title: 'Builder', logo: '', route: '/builder' },
        api[0],
      ],
      'System',
      (s) => `T(${s})`
    )
    expect(apps.map((a) => a.name)).toEqual(['erpnext', 'builder', 'frappe'])
    expect(apps[1].title).toBe('T(Builder)')
    expect(apps[1].logo).toBe(`${SVG}/builder.svg`)
    expect(apps[0].title).toBe('ERP')
  })

  it('still gives Rendszer for empty or missing data', () => {
    expect(buildApps(null, 'System').map((a) => a.name)).toEqual(['frappe'])
    expect(buildApps([], 'System')[0].route).toBe('/desk')
  })

  it('fills empty fields of the API frappe entry from the fallback', () => {
    const apps = buildApps(
      [{ name: 'frappe', title: '', logo: '', route: '' }],
      'Rendszer'
    )
    expect(apps[0]).toEqual(fallbackSystemApp('Rendszer'))
  })
})
