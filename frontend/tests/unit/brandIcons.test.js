import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

// One icon set: every place the CRM shows its own product mark uses the
// canonical artwork (magenta rounded square, white funnel).
const root = path.resolve(import.meta.dirname, '../../..')
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8')
const shapes = (svg) => ({
  color: svg.match(/<rect[^>]*fill="(#[0-9a-f]{6})"/i)[1].toLowerCase(),
  glyph: svg.match(/<path[^>]*\bd="([^"]+)"/)[1],
})

describe('brand icons', () => {
  const logo = read('crm/public/images/logo.svg')

  it('logo.svg is the canonical magenta rounded square with the white funnel', () => {
    const s = shapes(logo)
    expect(s.color).toBe('#c026d3')
    expect(s.glyph).toMatch(/^M17 16h30/)
    expect(logo).not.toMatch(/EF0BF5/i)
  })

  it('the sidebar CRMLogo component draws the same artwork as logo.svg', () => {
    const vue = read('frontend/src/components/Icons/CRMLogo.vue')
    expect(shapes(vue)).toEqual(shapes(logo))
    expect(vue).not.toMatch(/EF0BF5/i)
  })

  it('the .github logo is the same file as logo.svg', () => {
    expect(read('.github/logo.svg')).toBe(logo)
  })

  it('the app screen hook and the app icon point at the canonical file', () => {
    const hooks = read('crm/hooks.py')
    expect(hooks).toContain('app_icon_url = "/assets/crm/images/logo.svg"')
    expect(hooks).toContain('"logo": "/assets/crm/images/logo.svg"')
  })

  it('index.html declares the svg and the png favicon, not the apple touch icon', () => {
    const html = read('frontend/index.html')
    expect(html).toContain('href="/assets/crm/images/logo.svg"')
    expect(html).toContain('href="/assets/crm/frontend/favicon.png"')
    expect(html).not.toMatch(/rel="icon"[^>]*apple-icon-180/)
  })

  it('PNG icons are real PNGs of the documented size', () => {
    const size = (p) => {
      const b = fs.readFileSync(path.join(root, p))
      expect(b.subarray(1, 4).toString()).toBe('PNG')
      return [b.readUInt32BE(16), b.readUInt32BE(20)]
    }
    expect(size('crm/public/images/logo.png')).toEqual([1200, 1200])
    expect(size('frontend/public/favicon.png')).toEqual([144, 144])
    expect(size('crm/public/manifest/apple-icon-180.png')).toEqual([180, 180])
    expect(size('crm/public/manifest/manifest-icon-192.maskable.png')).toEqual([192, 192])
    expect(size('crm/public/manifest/manifest-icon-512.maskable.png')).toEqual([512, 512])
  })
})
