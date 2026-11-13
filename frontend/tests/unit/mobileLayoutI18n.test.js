import { describe, expect, it, vi } from 'vitest'
import { createApp } from 'vue'

vi.mock('@/components/Icon.vue', () => ({ default: { template: '<i />' } }))
// EmptyState reads the help URL from the settings store, which fetches on import
vi.mock('@/stores/settings', async () => {
  const { ref } = await import('vue')
  return { getSettings: () => ({ settings: ref({}) }) }
})
import EmptyState from '@/components/ListViews/EmptyState.vue'
import { referenceDoctypeLabel } from '@/utils/referenceDoctypeLabel'

import layoutHeader from '@/components/LayoutHeader.vue?raw'
import appHeader from '@/components/Layouts/AppHeader.vue?raw'
import mobileAppHeader from '@/components/Mobile/MobileAppHeader.vue?raw'
import breadcrumbs from '@/components/ViewBreadcrumbs.vue?raw'
import sidePanel from '@/components/SidePanelLayout.vue?raw'
import dashboard from '@/pages/Dashboard.vue?raw'
import emailEditor from '@/components/EmailEditor.vue?raw'
import commentBox from '@/components/CommentBox.vue?raw'
import mobileNotification from '@/pages/MobileNotification.vue?raw'

const mobilePages = import.meta.glob('/src/pages/Mobile*.vue', {
  query: '?raw',
  import: 'default',
  eager: true,
})

describe('referenceDoctypeLabel', () => {
  const t = (text) => ({ Lead: 'Érdeklődő', Deal: 'Ügylet' })[text] ?? text
  it('translates the shipped doctypes in any casing', () => {
    expect(referenceDoctypeLabel('lead', t)).toBe('Érdeklődő')
    expect(referenceDoctypeLabel('deal', t)).toBe('Ügylet')
    expect(referenceDoctypeLabel('CRM Deal', t)).toBe('Ügylet')
  })
  it('leaves anything else untouched', () => {
    expect(referenceDoctypeLabel('Custom Thing', t)).toBe('Custom Thing')
    expect(referenceDoctypeLabel(undefined, t)).toBeUndefined()
  })
  it('is used by the mobile notification list', () => {
    expect(mobileNotification).toContain('referenceDoctypeLabel(n.reference_doctype)')
    expect(mobileNotification).not.toContain("[n.reference_doctype]")
  })
})

describe('EmptyState layout', () => {
  function render(props) {
    const el = document.createElement('div')
    const app = createApp(EmptyState, props)
    app.component('Button', { template: '<button />' })
    app.mount(el)
    return { el }
  }
  it('centres the title and keeps a readable minimum width', () => {
    const { el } = render({ name: 'Emails', title: 'Nem található e-mail' })
    const title = [...el.querySelectorAll('span')].find((s) => s.textContent.includes('Nem található'))
    expect(title.className).toContain('text-center')
    expect(el.firstElementChild.firstElementChild.className).toContain('min-w-[16rem]')
    expect(el.firstElementChild.firstElementChild.className).toContain('max-w-full')
  })
  it('keeps the desktop width classes', () => {
    expect(render({ name: 'x' }).el.innerHTML).toContain('w-4/12')
    expect(render({ name: 'x', width: 'lg' }).el.innerHTML).toContain('w-8/12')
  })
})

describe('header layout survives long translated labels', () => {
  it('lets #app-header shrink so the actions stay on screen', () => {
    expect(appHeader).toContain('id="app-header" class="min-w-0 flex-1"')
    expect(mobileAppHeader).toContain('id="app-header" class="min-w-0 flex-1"')
  })
  it('shrinks the title block first and never the actions', () => {
    expect(layoutHeader).toContain('flex min-w-0 items-center gap-2')
    expect(layoutHeader).toContain('flex shrink-0 items-center gap-2')
  })
  it('truncates long breadcrumb / view names', () => {
    expect(breadcrumbs).toContain('flex min-w-0 items-center')
    expect(breadcrumbs).toContain('min-w-0 truncate')
    expect(breadcrumbs).toContain('!min-w-0 !shrink')
  })
  it('dashboard edit buttons collapse to icons on phones, labels stay on desktop', () => {
    expect(dashboard).toContain("headerButton(__('Chart'), 'lucide-plus')")
    expect(dashboard).toContain("headerButton(__('Reset to Default'), LucideUndo2)")
    expect(dashboard).toContain("{ icon, tooltip: label, 'aria-label': label }")
    expect(dashboard).toContain('{ label, iconLeft: icon }')
    // Cancel / Save keep their labels
    expect(dashboard).toContain(":label=\"__('Cancel')\"")
    expect(dashboard).toContain(":label=\"__('Save')\"")
  })
  it('dashboard filters wrap and use the full width on phones', () => {
    expect(dashboard).toContain('flex flex-wrap items-center gap-x-4 gap-y-2')
    expect(dashboard).toContain('form-control w-48 max-sm:w-full')
    expect(dashboard).toContain('max-sm:!w-full')
  })
})

describe('mobile-only responsive classes', () => {
  it('stacks side panel fields on phones only', () => {
    expect(sidePanel).toContain('max-sm:flex-col')
    expect(sidePanel).toContain('max-sm:w-full')
    // desktop widths stay
    expect(sidePanel).toContain('w-[35%] min-w-20')
    expect(sidePanel).toContain("'w-[65%] max-sm:w-full'")
  })
  it.each([
    ['EmailEditor', emailEditor],
    ['CommentBox', commentBox],
  ])('%s editor action row stacks below the toolbar on phones', (_, source) => {
    expect(source).toContain('max-sm:flex-col')
    expect(source).toContain('flex min-w-0 items-center gap-1 overflow-x-auto')
    expect(source).toContain('flex shrink-0 items-center justify-end space-x-2')
    expect(source).toContain('isMobileView')
    expect(source).not.toContain('sm:mt-0')
  })
  it('email recipients row wraps Cc/Bcc instead of overflowing', () => {
    expect(emailEditor).toContain('max-sm:flex-wrap')
    expect(emailEditor).toContain('min-w-0 flex-1 max-sm:min-w-[10rem]')
    expect(emailEditor).toContain('flex shrink-0 gap-1.5 max-sm:ml-auto')
  })
  it('mobile notifications use an icon-only mark-all-read button', () => {
    expect(mobileNotification).toContain(':icon="MarkAsDoneIcon"')
    expect(mobileNotification).toContain(":aria-label=\"__('Mark all as read')\"")
  })
})

describe('mobile tab panels', () => {
  it('compare the stable tab name, never the translated label', () => {
    for (const [path, source] of Object.entries(mobilePages)) {
      expect(source, path).not.toMatch(/tab\.label\s*===?\s*'/)
    }
  })
  it('Contact and Organization render their list for the Deals / Contacts tab', () => {
    expect(mobilePages['/src/pages/MobileContact.vue']).toContain("tab.name === 'Deals' && rows.length")
    expect(mobilePages['/src/pages/MobileContact.vue']).toContain("tab.name === 'Deals' && !rows.length")
    expect(mobilePages['/src/pages/MobileOrganization.vue']).toContain("tab.name === 'Deals' && rows.length")
    expect(mobilePages['/src/pages/MobileOrganization.vue']).toContain("tab.name === 'Contacts' && rows.length")
  })
})
