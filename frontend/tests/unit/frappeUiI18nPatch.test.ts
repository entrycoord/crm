import { afterEach, describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import dayjs from 'dayjs'
import 'dayjs/locale/hu'
import { parse, compileScript, compileTemplate } from '@vue/compiler-sfc'
import frappeUiI18nPatch, {
  MONTHS_EXPR,
  PATCHES,
  PATCH_MSGIDS,
  WEEKDAYS_EXPR,
  applyPatch,
  frappeUiSourcePath,
} from '../../vite-plugins/frappeUiI18nPatch.js'

const SRC = path.resolve(import.meta.dirname, '../../node_modules/frappe-ui/src')
const sfcFs = {
  fileExists: (f: string) => fs.existsSync(f),
  readFile: (f: string) => fs.readFileSync(f, 'utf8'),
  realpath: (f: string) => fs.realpathSync(f),
}
const read = (file: string) => fs.readFileSync(path.join(SRC, file), 'utf8')

afterEach(() => {
  dayjs.locale('en')
})

describe('patch table against the installed frappe-ui', () => {
  it.each(PATCHES.map((p) => [p.file]))('%s: every edit matches', (file) => {
    const result = applyPatch(file as string, read(file as string))!
    expect(result.missing).toEqual([])
    expect(result.code).not.toBe(read(file as string))
  })

  it.each(PATCHES.filter((p) => p.file.endsWith('.vue')).map((p) => [p.file]))(
    '%s: patched SFC still compiles',
    (file) => {
      const patched = applyPatch(file as string, read(file as string))!.code
      const { descriptor, errors } = parse(patched, { filename: path.join(SRC, file as string) })
      expect(errors).toEqual([])
      const script = compileScript(descriptor, {
        id: 'x',
        inlineTemplate: false,
        fs: sfcFs,
      })
      const template = compileTemplate({
        source: descriptor.template!.content,
        filename: path.join(SRC, file as string),
        id: 'x',
        compilerOptions: { bindingMetadata: script.bindings },
      })
      expect(template.errors).toEqual([])
    },
  )

  it('introduces exactly the msgids listed in PATCH_MSGIDS', () => {
    const found = new Set<string>()
    for (const { file, edits } of PATCHES) {
      const patched = applyPatch(file, read(file))!.code
      for (const m of patched.matchAll(/__\('([^']+)'\)/g)) {
        if (!read(file).includes(`__('${m[1]}')`)) found.add(m[1])
      }
      expect(edits.length).toBeGreaterThan(0)
    }
    expect([...found].sort()).toEqual(PATCH_MSGIDS)
  })

  it('prop defaults become per-instance factories (Vue calls them for String props)', () => {
    for (const file of [
      'components/Combobox/Combobox.vue',
      'components/MultiSelect/MultiSelect.vue',
      'components/Select/Select.vue',
    ]) {
      const patched = applyPatch(file, read(file))!.code
      const { descriptor } = parse(patched, { filename: path.join(SRC, file) })
      const out = compileScript(descriptor, { id: 'x', fs: sfcFs }).content
      const line = out.split('\n').find((l) => l.includes("__('Select option')"))
      expect(line, file).toBeTruthy()
      expect(line).toMatch(/default: \(\) => __\('Select option'\)/)
      expect(line).not.toMatch(/skipFactory/)
    }
  })

  it('CalendarPanel: header and months become computed bindings', () => {
    const file = 'components/DatePicker/CalendarPanel.vue'
    const patched = applyPatch(file, read(file))!.code
    const { descriptor } = parse(patched, { filename: path.join(SRC, file) })
    const script = compileScript(descriptor, { id: 'x', fs: sfcFs })
    expect(script.bindings).toMatchObject({
      WEEKDAYS: expect.stringMatching(/^setup-/),
      months: expect.stringMatching(/^setup-/),
    })
  })
})

describe('calendar header / month names', () => {
  const weekdays = () =>
    new Function('i18nDayjs', 'return ' + WEEKDAYS_EXPR)(dayjs) as string[]
  const months = () => {
    const monthsEn = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ]
    return new Function('i18nDayjs', 'monthsEn', 'return ' + MONTHS_EXPR)(
      dayjs,
      monthsEn,
    ) as string[]
  }

  it('keeps the original English output', () => {
    expect(weekdays()).toEqual(['S', 'M', 'T', 'W', 'T', 'F', 'S'])
    expect(months()[10]).toBe('Nov')
    expect(months()).toHaveLength(12)
  })

  it('follows the Hungarian locale: Monday first, Hungarian names', () => {
    dayjs.locale('hu')
    expect(weekdays().map((d) => d.toUpperCase())).toEqual([
      'H', 'K', 'SZ', 'CS', 'P', 'SZ', 'V',
    ])
    expect(months()).toEqual([
      'jan', 'feb', 'márc', 'ápr', 'máj', 'jún',
      'júl', 'aug', 'szept', 'okt', 'nov', 'dec',
    ])
  })

  it('header column 0 is the grid\'s first weekday (startOf week)', () => {
    dayjs.locale('hu')
    const firstColumn = weekdays()[0].toUpperCase()
    expect(dayjs('2026-11-01').startOf('week').format('dd').toUpperCase()).toBe(
      firstColumn,
    )
  })
})

describe('plugin plumbing', () => {
  it('maps module ids to frappe-ui/src paths and ignores everything else', () => {
    expect(
      frappeUiSourcePath('/a/node_modules/frappe-ui/src/components/Dialog/Dialog.vue'),
    ).toBe('components/Dialog/Dialog.vue')
    expect(
      frappeUiSourcePath('C:\\a\\node_modules\\frappe-ui\\src\\components\\Dialog\\Dialog.vue'),
    ).toBe('components/Dialog/Dialog.vue')
    expect(
      frappeUiSourcePath('/a/node_modules/frappe-ui/src/components/Dialog/Dialog.vue?vue&type=style'),
    ).toBeNull()
    expect(frappeUiSourcePath('/a/src/components/Foo.vue')).toBeNull()
  })

  it('transform patches known files, warns on drift, and can be disabled', () => {
    const id = '/n/frappe-ui/src/components/DatePicker/DateTimePicker.vue'
    const warns: string[] = []
    const ctx = { warn: (m: string) => warns.push(m) }
    const plugin: any = frappeUiI18nPatch({ enabled: true })
    expect(plugin.enforce).toBe('pre')

    const ok = plugin.transform.call(ctx, read('components/DatePicker/DateTimePicker.vue'), id)
    expect(ok.code).toContain(`:today-label="__('Now')"`)
    expect(warns).toEqual([])

    const drift = plugin.transform.call(ctx, '<template><div/></template>', id)
    expect(drift).toBeNull()
    expect(warns).toHaveLength(2)

    expect(plugin.transform.call(ctx, 'x', '/n/other/file.vue')).toBeNull()
    const off: any = frappeUiI18nPatch({ enabled: false })
    expect(off.transform.call(ctx, read('components/DatePicker/DateTimePicker.vue'), id)).toBeNull()
  })

  it('applyPatch enforces the expected occurrence count', () => {
    const table = [{ file: 'f', edits: [{ find: 'a', replace: 'b', count: 2 }] }]
    expect(applyPatch('f', 'a a', table)).toEqual({ code: 'b b', missing: [] })
    expect(applyPatch('f', 'a', table)!.missing).toHaveLength(1)
    expect(applyPatch('nope', 'a', table)).toBeNull()
  })
})
