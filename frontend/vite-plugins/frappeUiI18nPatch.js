// Build-time localisation of the few hard-coded English strings inside
// frappe-ui's SFCs that cannot be reached any other way (date picker "Now",
// "Select time", weekday initials, month names, dialog "Close", chart empty
// state, ...). frappe-ui itself stays untouched: this Vite plugin rewrites the
// source text of a handful of files while Vite loads them, using exact-string
// edits. Every edit is declared in PATCHES below; an edit whose text is no
// longer found (frappe-ui upgrade) is skipped with a build warning and fails
// tests/unit/frappeUiI18nPatch.test.js against the installed version.
//
// `__('...')` in a template resolves to the CRM translate function
// (app.config.globalProperties.__); in script it is the global window.__ and is
// evaluated at render time, after the dictionary has loaded.
//
// Off switch: set CRM_FRAPPE_UI_I18N_PATCH=0 when running vite.

// --- date picker: names follow the active dayjs locale ----------------------
// English output is identical to the original ("S M T W T F S", "Jan"..."Dec");
// any other loaded locale gets its own initials, month names and week start
// (the original header was hard-coded Sunday-first, which would not match the
// grid once a Monday-first locale such as hu is active).
export const WEEKDAYS_EXPR =
  "(() => { const first = i18nDayjs().startOf('week'); " +
  "const en = ['S', 'M', 'T', 'W', 'T', 'F', 'S']; " +
  "const isEn = i18nDayjs.locale() === 'en'; " +
  "return Array.from({ length: 7 }, (_, i) => { const d = first.add(i, 'day'); " +
  "return isEn ? en[d.day()] : d.format('dd').slice(0, 2) }) })()"

export const MONTHS_EXPR =
  "(i18nDayjs.locale() === 'en' ? monthsEn : " +
  "monthsEn.map((_, i) => i18nDayjs('2000-01-01').month(i).format('MMM')))"

export const PATCHES = [
  {
    file: 'components/DatePicker/CalendarPanel.vue',
    edits: [
      {
        find: "import { months } from './utils'",
        replace:
          "import { months as monthsEn } from './utils'\n" +
          "import { dayjs as i18nDayjs } from '../../utils/dayjs'",
      },
      {
        find: "const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']",
        replace:
          'const WEEKDAYS = computed(() => ' +
          WEEKDAYS_EXPR +
          ')\nconst months = computed(() => ' +
          MONTHS_EXPR +
          ')',
      },
      {
        find: "(cell.isToday ? ' (Today)' : '')",
        replace: "(cell.isToday ? ' (' + __('Today') + ')' : '')",
      },
    ],
  },
  {
    file: 'components/DatePicker/DateTimePicker.vue',
    edits: [
      { find: 'today-label="Now"', replace: ':today-label="__(\'Now\')"' },
      {
        find: 'placeholder="Select time"',
        replace: ':placeholder="__(\'Select time\')"',
      },
    ],
  },
  {
    file: 'components/DatePicker/DatePicker.vue',
    edits: [
      { find: 'today-label="Today"', replace: ':today-label="__(\'Today\')"' },
    ],
  },
  {
    file: 'components/DatePicker/DateRangePicker.vue',
    edits: [
      { find: 'today-label="Today"', replace: ':today-label="__(\'Today\')"' },
    ],
  },
  {
    file: 'components/Dialog/Dialog.vue',
    edits: [
      {
        find: 'label="Close"',
        replace: ':label="__(\'Close\')"',
        count: 2,
      },
    ],
  },
  {
    file: 'components/Combobox/Combobox.vue',
    edits: [
      {
        find: "placeholder: 'Select option',",
        replace: "placeholder: () => __('Select option'),",
      },
      {
        find: "emptyText: 'No results',",
        replace: "emptyText: () => __('No results'),",
      },
    ],
  },
  {
    file: 'components/MultiSelect/MultiSelect.vue',
    edits: [
      {
        find: "placeholder: 'Select option',",
        replace: "placeholder: () => __('Select option'),",
      },
      {
        find: "emptyText: 'No results',",
        replace: "emptyText: () => __('No results'),",
      },
    ],
  },
  {
    file: 'components/Select/Select.vue',
    edits: [
      {
        find: "placeholder: 'Select option',",
        replace: "placeholder: () => __('Select option'),",
      },
      {
        find: "emptyText: 'No options',",
        replace: "emptyText: () => __('No options'),",
      },
    ],
  },
  {
    file: 'charts/components/ChartContainer.vue',
    edits: [
      {
        find: '>No data to show</span>',
        replace: ">{{ __('No data to show') }}</span>",
      },
    ],
  },
  {
    file: 'molecules/editor/extensions/suggestion/SuggestionList.vue',
    edits: [
      {
        find: '>No results</div>',
        replace: ">{{ __('No results') }}</div>",
      },
    ],
  },
]

/** Source msgids the patches introduce (for the translation catalog). */
export const PATCH_MSGIDS = [
  'Close',
  'No data to show',
  'No options',
  'No results',
  'Now',
  'Select option',
  'Select time',
  'Today',
]

/**
 * Apply the declared edits for `file` (path relative to frappe-ui/src) to
 * `code`. Returns the patched code and the edits that did not match exactly
 * the expected number of times (those are not applied).
 */
export function applyPatch(file, code, patches = PATCHES) {
  const entry = patches.find((p) => p.file === file)
  if (!entry) return null
  let out = code
  const missing = []
  for (const edit of entry.edits) {
    const expected = edit.count ?? 1
    const found = out.split(edit.find).length - 1
    if (found !== expected) {
      missing.push({ find: edit.find, expected, found })
      continue
    }
    out = out.split(edit.find).join(edit.replace)
  }
  return { code: out, missing }
}

/** Path of `id` relative to frappe-ui/src, or null when it is not such a file. */
export function frappeUiSourcePath(id) {
  if (id.includes('?')) return null // SFC sub-requests re-use the patched main module
  const normalized = id.replace(/\\/g, '/')
  const marker = '/frappe-ui/src/'
  const at = normalized.lastIndexOf(marker)
  return at === -1 ? null : normalized.slice(at + marker.length)
}

export default function frappeUiI18nPatch(options = {}) {
  const enabled =
    options.enabled ?? process.env.CRM_FRAPPE_UI_I18N_PATCH !== '0'
  return {
    name: 'crm-frappe-ui-i18n-patch',
    enforce: 'pre',
    transform(code, id) {
      if (!enabled) return null
      const file = frappeUiSourcePath(id)
      if (!file) return null
      const result = applyPatch(file, code)
      if (!result) return null
      for (const miss of result.missing) {
        this.warn(
          `frappe-ui i18n patch: ${file}: expected ${miss.expected} x ` +
            `${JSON.stringify(miss.find)}, found ${miss.found} (frappe-ui upgraded?)`,
        )
      }
      return result.code === code ? null : { code: result.code, map: null }
    },
  }
}
