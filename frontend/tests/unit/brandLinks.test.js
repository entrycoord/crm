import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'

// Regression guard: no link to an upstream website, no external fonts or
// usage-data host, and no "Frappe CRM" product name in the code that users see.
// Legal notices (copyright lines, licence files, comments) are not scanned.
const root = join(import.meta.dirname, '..', '..')
const repo = join(root, '..')
const FORBIDDEN =
  /docs\.frappe\.io|frappe\.io|frappecloud|frappe\.cloud|frappe\.school|frappeframework|erpnext\.com|github\.com\/frappe|fonts\.googleapis|fonts\.gstatic|pulse\.m\.|Frappe CRM|Login to Frappe/

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) walk(path, out)
    else if (/\.(vue|js|ts|html|py)$/.test(name) && !/\.test\./.test(name)) out.push(path)
  }
  return out
}

// comment lines, and the package metadata that names the copyright holder
// (app_publisher / app_email in hooks.py) are legal/technical, not shown to users
const isComment = (line) =>
  /^\s*(\/\/|\/\*|\*|#|<!--)/.test(line) || /^app_(publisher|email)\s*=/.test(line)

function violations(files) {
  const found = []
  for (const file of files) {
    readFileSync(file, 'utf8')
      .split('\n')
      .forEach((line, i) => {
        if (!isComment(line) && FORBIDDEN.test(line))
          found.push(`${relative(repo, file)}:${i + 1}: ${line.trim().slice(0, 100)}`)
      })
  }
  return found
}

describe('no upstream links or product name in user-visible code', () => {
  it('SPA sources, entry html and build config are clean', () => {
    const files = [
      ...walk(join(root, 'src')),
      join(root, 'index.html'),
      join(root, 'vite.config.js'),
    ]
    expect(violations(files)).toEqual([])
  })

  it('server-rendered pages and hooks are clean', () => {
    const files = [
      ...walk(join(repo, 'crm', 'www')).filter((f) => !f.includes('test_')),
      join(repo, 'crm', 'hooks.py'),
      join(repo, 'crm', 'templates', 'emails', 'crm_invitation.html'),
    ]
    expect(violations(files)).toEqual([])
  })

  it('the AppSidebar Help item is gated on a configured help URL', () => {
    const sidebar = readFileSync(join(root, 'src/components/Layouts/AppSidebar.vue'), 'utf8')
    expect(sidebar).toMatch(/v-if="isOnboardingStepsCompleted && hasHelp"\s+:label="__\('Help'\)"/)
    expect(sidebar).not.toContain('docsLink')
    expect(sidebar).toContain("getHelpArticles()")
  })
})
