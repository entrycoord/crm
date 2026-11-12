import { readFileSync } from 'node:fs'
import { computed } from 'vue'
import { describe, expect, it } from 'vitest'

// Execute the actual dropdown computation with controlled view-store data.
function dropdownFor(views) {
  const source = readFileSync('src/components/ViewControls.vue', 'utf8')
  const body = source.split('const viewsDropdownOptions = computed(() => {')[1].split('\nconst { getFields }')[0]
  const run = new Function('computed', 'standardViews', 'currentView', 'list', '__', 'getIcon', 'isDefaultView', 'isStandardDefault', 'viewUpdated', 'router', 'route', `return computed(() => {${body.replace(/\n}\)\s*$/, '\n})')}`)
  const pushes = []
  const dropdown = run(computed, [], { value: { name: 'std' } }, { value: { data: { views } } },
    (label) => ({ List: 'Lista', 'Group By': 'Csoportosítás', Kanban: 'Kanban fordítva' }[label] || label),
    (icon) => icon, () => false, () => false, { value: true }, { push: (route) => pushes.push(route) }, { name: 'Leads' })
  return { groups: dropdown.value, pushes }
}

describe('saved-view dropdown', () => {
  it('translates built-in views for display only and preserves custom names and navigation', () => {
    const views = [
      { name: 'std', label: 'List', is_standard: true, pinned: true, type: 'list', filters: '{}' },
      { name: 'custom', label: 'List', is_standard: false, public: true, type: 'list', filters: '{}' },
      { name: 'renamed', label: 'My List', is_standard: true, pinned: true, type: 'list', filters: '{}' },
    ]
    const before = structuredClone(views)
    const { groups, pushes } = dropdownFor(views)
    const options = groups.flatMap((group) => group.options)
    expect(options.find((item) => item.name === 'std').label).toBe('Lista')
    expect(options.find((item) => item.name === 'custom').label).toBe('List')
    expect(options.find((item) => item.name === 'renamed').label).toBe('My List')
    options.find((item) => item.name === 'std').onClick()
    options.find((item) => item.name === 'custom').onClick()
    expect(pushes.map((route) => route.query.view)).toEqual(['std', 'custom'])
    expect(views).toEqual(before)
  })
})
