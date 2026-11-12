import { afterEach, describe, expect, it } from 'vitest'
import {
  installFrappeUiI18n,
  localizeEditorPresets,
} from '@/utils/frappeUiI18n'

const hu: Record<string, string> = {
  Bold: 'Félkövér',
  Heading: 'Címsor',
  'Heading 2': 'Címsor 2',
  'Merge cells': 'Cellák egyesítése',
}
const tr = (m: string) => hu[m] ?? m

function makePresets() {
  const bold = { label: 'Bold', icon: 'x', action: () => true }
  const h2 = { label: 'Heading 2', action: () => true }
  const group = { type: 'group', label: 'Heading', items: [h2] }
  const merge = {
    label: 'Merge or split cells',
    action: () => true,
    getLabel: () => 'Merge cells',
  }
  const sep = { type: 'separator' }
  return { Bold: bold, H2: h2, HeadingGroup: group, Merge: merge, Separator: sep }
}

afterEach(() => {
  delete (globalThis as any).__disableFrappeUiI18n
})

describe('localizeEditorPresets', () => {
  it('translates item, group and nested labels at read time', () => {
    const p = makePresets()
    const handle = localizeEditorPresets(p, tr)
    expect(p.Bold.label).toBe('Félkövér')
    expect(p.HeadingGroup.label).toBe('Címsor')
    expect(p.HeadingGroup.items[0].label).toBe('Címsor 2')
    expect(p.H2.label).toBe('Címsor 2')
    // untranslated labels fall back to the English msgid
    expect(p.Merge.label).toBe('Merge or split cells')
    // 4 items: Bold, H2, group, Merge (separator has no label)
    expect(handle.count).toBe(4)
    expect(handle.msgids).toEqual([
      'Bold',
      'Heading',
      'Heading 2',
      'Merge or split cells',
    ])
  })

  it('looks the dictionary up lazily (late-loaded dictionary still applies)', () => {
    const p = makePresets()
    const dict: Record<string, string> = {}
    localizeEditorPresets(p, (m) => dict[m] ?? m)
    expect(p.Bold.label).toBe('Bold')
    dict.Bold = 'Félkövér'
    expect(p.Bold.label).toBe('Félkövér')
  })

  it('translates state-dependent getLabel results', () => {
    const p = makePresets()
    localizeEditorPresets(p, tr)
    expect((p.Merge as any).getLabel()).toBe('Cellák egyesítése')
  })

  it('keeps own properties intact when spread (as the toolbar does)', () => {
    const p = makePresets()
    localizeEditorPresets(p, tr)
    const copy = { ...p.Bold }
    expect(copy.label).toBe('Félkövér')
    expect(typeof copy.action).toBe('function')
    expect(copy.icon).toBe('x')
  })

  it('is idempotent and restore() brings the plain labels back', () => {
    const p = makePresets()
    const first = localizeEditorPresets(p, tr)
    const second = localizeEditorPresets(p, tr)
    expect(second.count).toBe(0)
    expect(p.Bold.label).toBe('Félkövér')
    first.restore()
    expect(p.Bold.label).toBe('Bold')
    expect(Object.getOwnPropertyDescriptor(p.Bold, 'label')).toMatchObject({
      value: 'Bold',
      writable: true,
    })
    expect((p.Merge as any).getLabel()).toBe('Merge cells')
    // can be installed again after a restore
    expect(localizeEditorPresets(p, tr).count).toBe(4)
  })

  it('skips frozen and non-preset values without throwing', () => {
    const frozen = Object.freeze({ label: 'Bold', action: () => true })
    const handle = localizeEditorPresets(
      { frozen, str: 'Bold', n: 3, nul: null, fn: () => 1 } as any,
      tr,
    )
    expect(handle.count).toBe(0)
    expect(frozen.label).toBe('Bold')
  })

  it('falls back to window.__ when no translate function is given', () => {
    const p = makePresets()
    ;(globalThis as any).__ = (m: string) => `T(${m})`
    try {
      localizeEditorPresets(p)
      expect(p.Bold.label).toBe('T(Bold)')
    } finally {
      ;(globalThis as any).__ = (m: string) => m
    }
  })
})

describe('installFrappeUiI18n', () => {
  it('can be switched off and installs only once', () => {
    ;(globalThis as any).__disableFrappeUiI18n = true
    const p = makePresets()
    expect(installFrappeUiI18n(p, tr)).toBeNull()
    expect(p.Bold.label).toBe('Bold')

    delete (globalThis as any).__disableFrappeUiI18n
    const handle = installFrappeUiI18n(p, tr)!
    expect(p.Bold.label).toBe('Félkövér')
    expect(installFrappeUiI18n(makePresets(), tr)).toBe(handle)
    handle.restore()
    expect(p.Bold.label).toBe('Bold')
  })
})

describe('real frappe-ui/editor presets', () => {
  it('localises every toolbar preset CRM shows', { timeout: 30000 }, async () => {
    const editor = (await import('frappe-ui/editor')) as Record<string, any>
    const handle = localizeEditorPresets(editor, (m) => `§${m}`)
    try {
      const labels = [
        'Bold',
        'Italic',
        'Strike',
        'Code',
        'Bullet List',
        'Ordered List',
        'Blockquote',
        'Paragraph',
        'Align Left',
        'Align Center',
        'Align Right',
        'Font Color',
        'Image / Gallery',
        'Video',
        'Link',
        'Table',
        'Horizontal Rule',
      ]
      const shown = [
        editor.Bold,
        editor.Italic,
        editor.Strike,
        editor.InlineCode,
        editor.BulletList,
        editor.OrderedList,
        editor.Blockquote,
        editor.Paragraph,
        editor.AlignLeft,
        editor.AlignCenter,
        editor.AlignRight,
        editor.FontColor,
        editor.InsertImage,
        editor.InsertVideo,
        editor.InsertLink,
        editor.InsertTable,
        editor.HorizontalRule,
      ].map((i) => i.label)
      expect(shown).toEqual(labels.map((l) => `§${l}`))
      expect(editor.HeadingGroup.label).toBe('§Heading')
      expect(editor.HeadingGroup.items.map((i: any) => i.label)).toEqual([
        '§Heading 2',
        '§Heading 3',
        '§Heading 4',
      ])
      expect(editor.TableMergeOrSplit.getLabel({
        can: () => ({ mergeCells: () => true, splitCell: () => false }),
      })).toBe('§Merge cells')
      expect(handle.msgids).toEqual(expect.arrayContaining(labels))
      console.log('FRAPPE_UI_EDITOR_MSGIDS=' + JSON.stringify(handle.msgids))
    } finally {
      handle.restore()
    }
    expect(editor.Bold.label).toBe('Bold')
  })
})
