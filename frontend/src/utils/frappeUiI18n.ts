// Localises the English labels that frappe-ui hard-codes on its editor toolbar
// presets (Bold, Italic, Heading 2, Align Left, ...). frappe-ui never calls a
// translation function, so the labels reach the toolbar buttons (visible text,
// tooltip and aria-label) as raw English.
//
// The presets are plain, shared objects exported from `frappe-ui/editor`, and
// every toolbar reads `item.label` when it renders. Replacing `label` with a
// getter that runs the current label through `__()` therefore localises every
// toolbar built from them (CRM's and frappe-ui's own, slash menu, table menu)
// without touching node_modules. The lookup runs at render time, so it does not
// matter whether the translation dictionary is loaded yet when this installs.
//
// Pure and reversible: `install` returns a handle whose `restore()` puts the
// original string labels back (used by the tests and as the off switch).

export type Translate = (message: string) => string

interface PresetLike {
  label?: unknown
  type?: unknown
  items?: unknown
  action?: unknown
  getLabel?: unknown
}

export interface FrappeUiI18nHandle {
  /** Number of preset items whose label is now translated. */
  count: number
  /** Labels (original English msgids) that were localised, sorted. */
  msgids: string[]
  /** Put the original labels back. */
  restore: () => void
}

const INSTALLED = Symbol.for('crm.frappeUiI18n.installed')

function isPreset(value: unknown): value is PresetLike {
  if (!value || typeof value !== 'object') return false
  const v = value as PresetLike
  if (typeof v.label !== 'string' || !v.label) return false
  // A command item has an action; a group has `type: 'group'` and items.
  return typeof v.action === 'function' || v.type === 'group'
}

function defaultTranslate(message: string): string {
  const fn = (globalThis as { __?: Translate }).__
  return typeof fn === 'function' ? fn(message) : message
}

/**
 * Localise the labels of the given toolbar presets in place.
 *
 * `presets` is the module namespace of `frappe-ui/editor` (or any object whose
 * values are menu items / groups). Items found directly or inside groups are
 * handled once each. Safe to call more than once: an already localised item is
 * skipped.
 */
export function localizeEditorPresets(
  presets: Record<string, unknown>,
  translate: Translate = defaultTranslate,
): FrappeUiI18nHandle {
  const seen = new Set<object>()
  const undo: Array<() => void> = []
  const msgids = new Set<string>()

  const visit = (candidate: unknown) => {
    if (!isPreset(candidate) || seen.has(candidate)) return
    seen.add(candidate)

    if (Array.isArray(candidate.items)) candidate.items.forEach(visit)

    const holder = candidate as Record<symbol, unknown>
    if (holder[INSTALLED]) return

    const descriptor = Object.getOwnPropertyDescriptor(candidate, 'label')
    if (!descriptor || !descriptor.configurable || !('value' in descriptor)) {
      return // a getter already, or frozen: leave it alone
    }

    let source = candidate.label as string
    msgids.add(source)
    Object.defineProperty(candidate, 'label', {
      configurable: true,
      enumerable: true,
      get: () => translate(source),
      set: (next: string) => {
        source = next
      },
    })

    const originalGetLabel = candidate.getLabel
    if (typeof originalGetLabel === 'function') {
      candidate.getLabel = (...args: unknown[]) => {
        const dynamic = originalGetLabel(...args)
        return typeof dynamic === 'string' ? translate(dynamic) : dynamic
      }
      // states reachable through getLabel are English msgids too; they are
      // discovered lazily, so the list in `msgids` only has the static label
    }

    holder[INSTALLED] = true
    undo.push(() => {
      Object.defineProperty(candidate, 'label', {
        configurable: true,
        enumerable: true,
        writable: true,
        value: source,
      })
      if (typeof originalGetLabel === 'function') {
        candidate.getLabel = originalGetLabel
      }
      delete holder[INSTALLED]
    })
  }

  Object.values(presets).forEach(visit)

  return {
    count: undo.length,
    msgids: [...msgids].sort(),
    restore: () => undo.splice(0).forEach((fn) => fn()),
  }
}

let active: FrappeUiI18nHandle | null = null

/**
 * App-boot hook (main.js). Does nothing if `window.__disableFrappeUiI18n` is
 * truthy, and installs only once. Returns the handle (or null when disabled).
 */
export function installFrappeUiI18n(
  presets: Record<string, unknown>,
  translate?: Translate,
): FrappeUiI18nHandle | null {
  if ((globalThis as { __disableFrappeUiI18n?: boolean }).__disableFrappeUiI18n) {
    return null
  }
  if (active) return active
  active = localizeEditorPresets(presets, translate)
  const restore = active.restore
  active.restore = () => {
    restore()
    active = null
  }
  return active
}
